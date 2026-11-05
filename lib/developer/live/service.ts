import "server-only";
import { readCodex } from "../codex/server";
import { codexSource, type CodexAccountView } from "../codex/analytics";
import type { QuotaWindow } from "../codex/model";
import { progressSnapshot } from "./progress";
import { serverSupabase } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";
import { AccessError } from "@/lib/auth/policy";
import { input, dbError } from "@/lib/backend/mutations";
import { encrypt, decrypt } from "./crypto";
import { documents, putDocument, deleteDocument } from "./store";
import { github, verifyToken, GitHubError, type Repository } from "./github";
import {
  emptyDeveloperData,
  vietnamDate,
  type LiveConnection,
  type LiveSnapshot,
  type Activity,
} from "./types";
import type { Notification } from "../model";

type Task = {
  kind:
    | "calendar"
    | "branches"
    | "commits"
    | "commit"
    | "pulls"
    | "merge"
    | "reviews"
    | "notifications";
  repo: string;
  page: number;
  branch?: string;
  sha?: string;
  pr?: number;
};
type Job = {
  id: string;
  queue: Task[];
  activities: Activity[];
  calendar?: NonNullable<
    ReturnType<typeof emptyDeveloperData>["githubCalendar"]
  >;
  notifications: Notification[];
  seen: string[];
  coverage: string[];
  since: string;
  startedAt: string;
  retryAt: number;
  done: boolean;
};
async function connections() {
  return (await documents<LiveConnection>("connection")).map(
    (row) => row.value,
  );
}
function publicConnection(c: LiveConnection) {
  const { credential, inboxCredential, ...safe } = c;
  return {
    ...safe,
    hasCredential: !!credential,
    hasInboxCredential: !!inboxCredential,
  };
}
function string(value: unknown, max = 160) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new AccessError(400, "invalid_request");
  return value.trim();
}
export async function connectionRequest(request: Request) {
  const url = new URL(request.url),
    list = await connections();
  if (request.method === "GET") {
    const id = url.searchParams.get("id"),
      c = list.find((c) => c.id === id);
    if (url.searchParams.has("repositories")) {
      if (!c) throw new AccessError(404, "connection_missing");
      const page = Math.max(
        1,
        Math.min(10000, Number(url.searchParams.get("page") ?? 1) || 1),
      );
      const repos = await github<Repository[]>(
        decrypt(c.credential),
        `/user/repos?per_page=100&page=${page}&sort=full_name&affiliation=owner,collaborator,organization_member`,
      );
      return Response.json({
        repositories: repos.map((r) => ({ id: r.id, name: r.full_name })),
        nextPage: repos.length === 100 ? page + 1 : null,
      });
    }
    return Response.json(list.map(publicConnection));
  }
  const body = await input(request),
    id = body.id ? string(body.id) : randomUUID(),
    old = list.find((c) => c.id === id);
  if (request.method === "DELETE") {
    if (!old) throw new AccessError(404, "connection_missing");
    await deleteDocument("connection", id);
    await deleteDocument("sync", id);
    await deleteDocument("snapshot", id);
    return Response.json({ ok: true });
  }
  if (request.method === "PATCH" && old && typeof body.paused === "boolean") {
    await putDocument("connection", id, {
      ...old,
      paused: body.paused,
      updatedAt: new Date().toISOString(),
    });
    return Response.json({ ok: true });
  }
  if (request.method === "PATCH" && !old)
    throw new AccessError(404, "connection_missing");
  const token = body.token
    ? string(body.token, 500)
    : old
      ? decrypt(old.credential)
      : string(body.token, 500);
  const identity = await verifyToken(token);
  if (old && old.githubId !== identity.id)
    throw new AccessError(409, "account_mismatch");
  if (list.some((c) => c.id !== id && c.githubId === identity.id))
    throw new AccessError(409, "account_already_connected");
  const inboxToken = body.inboxToken
    ? string(body.inboxToken, 500)
    : old?.inboxCredential
      ? decrypt(old.inboxCredential)
      : null;
  if (inboxToken) {
    const inboxIdentity = await verifyToken(inboxToken);
    if (inboxIdentity.id !== identity.id)
      throw new AccessError(400, "inbox_account_mismatch");
    await github(inboxToken, "/notifications?per_page=1");
  }
  const repos = body.repositories ?? old?.repositories ?? [];
  if (
    !Array.isArray(repos) ||
    repos.length > 50 ||
    repos.some((r) => typeof r !== "string" || !/^[-\w.]+\/[-\w.]+$/.test(r))
  )
    throw new AccessError(400, "invalid_repositories");
  for (const repo of repos) {
    if (!old?.repositories.includes(repo))
      await github(token, `/repos/${repo}`);
  }
  const changed =
    !!old &&
    (JSON.stringify([...old.repositories].sort()) !==
      JSON.stringify([...repos].sort()) ||
      !!body.token ||
      !!body.inboxToken);
  if (changed) {
    await deleteDocument("sync", id);
    if (JSON.stringify(old.repositories) !== JSON.stringify(repos))
      await deleteDocument("snapshot", id);
  }
  const now = new Date().toISOString();
  const c: LiveConnection = {
    id,
    name: string(body.name ?? old?.name ?? identity.login, 80),
    group: body.group === "work" ? "work" : "personal",
    login: identity.login,
    githubId: identity.id,
    repositories: repos,
    paused: old?.paused ?? false,
    checkedAt: now,
    updatedAt: now,
    observedAt: changed ? null : (old?.observedAt ?? null),
    error: null,
    credential: encrypt(token),
    inboxCredential: inboxToken ? encrypt(inboxToken) : null,
  };
  await putDocument("connection", id, c);
  return Response.json(publicConnection(c));
}
export async function liveData(): Promise<LiveSnapshot> {
  const list = await connections(),
    snapshots = await documents<LiveSnapshot>("snapshot"),
    jobs = await documents<Job>("sync"),
    data = emptyDeveloperData();
  const activities: Activity[] = [],
    coverage: string[] = [];
  for (const c of list) {
    data.sources.push({
      id: c.id,
      name: c.name,
      provider: "GitHub",
      scope: c.group,
      status: c.error
        ? "partial"
        : !c.observedAt
          ? "unavailable"
          : Date.now() - Date.parse(c.observedAt) > 600000
            ? "stale"
            : "fresh",
      observedAt: c.observedAt,
      detail: c.error ?? c.repositories.join(", "),
      quota: null,
      window: null,
      resetsAt: null,
    });
    const completed = snapshots.find((s) => s.id === c.id)?.value;
    const pending = jobs.find((j) => j.id === c.id)?.value;
    const partial =
      pending && !pending.done ? progressSnapshot(c, pending) : null;
    const visible = completed ?? partial;
    // Calendar is collected before repository scanning and can be newer than the
    // last completed activity snapshot. Do not hold it behind the repo backlog.
    data.githubCalendar = [
      ...(data.githubCalendar ?? []),
      ...((pending?.calendar?.length ? pending.calendar : completed?.data.githubCalendar) ?? []),
    ];
    if (partial) {
      data.sources[data.sources.length - 1].status = "partial";
    }

    if (visible) {
      data.notifications.push(...visible.data.notifications);
      data.contributions.push(...visible.data.contributions);
      activities.push(...visible.activities);
      coverage.push(...visible.coverage);
    }
  }
  const codex = await readCodex();
  data.codexAccounts = codex.accounts.map((account) => ({
    id: account.id,
    name: account.name,
    group: account.account_group as "personal" | "work",
    identityLabel: account.identity_label,
    deviceCount: codex.devices.filter(
      (device) => device.account_id === account.id && !device.revoked_at,
    ).length,
    onlineDeviceCount: codex.devices.filter(
      (device) =>
        device.account_id === account.id &&
        !device.revoked_at &&
        !device.paused &&
        device.heartbeat_at &&
        Date.now() - Date.parse(device.heartbeat_at) <= 600000,
    ).length,
    lastHeartbeatAt:
      codex.devices
        .filter(
          (device) =>
            device.account_id === account.id &&
            !device.revoked_at &&
            device.heartbeat_at,
        )
        .map((device) => device.heartbeat_at!)
        .sort()
        .at(-1) ?? null,
    plan: account.plan,
    paused: account.paused,
    observedAt: account.observed_at,
    usageObservedAt: account.usage_observed_at,
    quotaObservedAt: account.quota_observed_at,
    usageStatus: account.usage_status,
    quotaStatus: account.quota_status,
    quotaWindows: account.quota_windows as unknown as QuotaWindow[],
    summary: account.summary as CodexAccountView["summary"],
  }));
  data.sources.push(
    ...data.codexAccounts.map((account) => codexSource(account)),
  );
  data.accountUsage = codex.daily.map((row) => ({
    sourceId: row.account_id,
    date: row.usage_date,
    tokens: row.tokens,
    collectedAt: row.collected_at,
  }));
  return {
    data,
    activities: activities.sort((a, b) =>
      (b.date + b.time).localeCompare(a.date + a.time),
    ),
    coverage,
    sync: jobs
      .filter((j) => !j.value.done)
      .map((j) => ({
        sourceId: j.id,
        remaining: j.value.queue.length,
        activities: j.value.activities.length,
        notifications: j.value.notifications.length,
        retryAt: j.value.retryAt,
      })),
  };
}
function activityDate(value: string) {
  const date = new Date(value);
  return {
    date: vietnamDate(date),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}
export async function syncRequest(request: Request) {
  const body = await input(request.clone());
  if (typeof body.id !== "string") throw new AccessError(400, "invalid_id");
  const db = await serverSupabase(),
    now = new Date().toISOString();
  const { data, error } = await db
    .from("developer_documents")
    .update({ lease_until: new Date(Date.now() + 120000).toISOString() })
    .eq("collection", "connection")
    .eq("id", body.id)
    .lte("lease_until", now)
    .select("id");
  dbError(error);
  if (!data?.length) return Response.json({ done: false, retryAfter: 5 });
  try {
    return await syncStep(request);
  } finally {
    await db
      .from("developer_documents")
      .update({ lease_until: new Date(0).toISOString() })
      .eq("collection", "connection")
      .eq("id", body.id);
  }
}
async function syncStep(request: Request) {
  const body = await input(request),
    id = string(body.id),
    c = (await connections()).find((c) => c.id === id);
  if (!c) throw new AccessError(404, "connection_missing");
  if (c.paused) throw new AccessError(409, "connection_paused");
  const stored = (await documents<Job>("sync")).find((j) => j.id === id)?.value;
  if (stored?.retryAt && stored.retryAt > Date.now())
    return Response.json({
      done: false,
      retryAfter: Math.ceil((stored.retryAt - Date.now()) / 1000),
    });
  if (
    (!stored || stored.done) &&
    c.observedAt &&
    Date.now() - Date.parse(c.observedAt) < 300000
  )
    return Response.json({ done: true });
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const job: Job =
    stored && !stored.done
      ? stored
      : {
          id: randomUUID(),
          queue: [
            { kind: "calendar", repo: "", page: 1 },
            ...c.repositories.flatMap((repo) => [
              { kind: "branches" as const, repo, page: 1 },
              { kind: "pulls" as const, repo, page: 1 },
            ]),
            ...(c.inboxCredential
              ? [{ kind: "notifications" as const, repo: "", page: 1 }]
              : []),
          ],
          activities: [],
          notifications: [],
          seen: [],
          coverage: [
            "Selected repositories; accessible branches; last 30 days. Deleted branches and inaccessible history are not included.",
          ],
          since,
          startedAt: new Date().toISOString(),
          retryAt: 0,
          done: false,
        };
  const task = job.queue.shift();
  const token = decrypt(c.credential);
  const add = (event: Activity) => {
    if (!job.activities.some((e) => e.id === event.id))
      job.activities.push(event);
  };
  try {
    if (task) {
      const base = `/repos/${task.repo}`,
        page = `per_page=100&page=${task.page}`;
      if (task.kind === "calendar") {
        try {
          const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query:
                "query { viewer { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }",
            }),
            signal: AbortSignal.timeout(8000),
            cache: "no-store",
            redirect: "error",
          });
          const result = await response.json();
          if (
            response.ok &&
            result.data?.viewer?.contributionsCollection?.contributionCalendar
          ) {
            const weeks = result.data.viewer.contributionsCollection
              .contributionCalendar.weeks as {
              contributionDays: { date: string; contributionCount: number }[];
            }[];
            job.calendar = weeks.flatMap((week) =>
              week.contributionDays.map((day) => ({
                sourceId: c.id,
                date: day.date,
                count: day.contributionCount,
              })),
            );
          } else
            job.coverage.push(
              "GitHub contribution calendar unavailable for this credential.",
            );
        } catch {
          job.coverage.push(
            "GitHub contribution calendar request failed; repository activity synchronization continued.",
          );
        }
      }
      if (task.kind === "branches") {
        const rows = await github<{ name: string }[]>(
          token,
          `${base}/branches?${page}`,
        );
        for (const row of rows)
          job.queue.push({
            kind: "commits",
            repo: task.repo,
            page: 1,
            branch: row.name,
          });
        if (rows.length === 100)
          job.queue.unshift({ ...task, page: task.page + 1 });
      }
      if (task.kind === "commits") {
        const rows = await github<
          {
            sha: string;
            author: { id: number } | null;
            commit: {
              message: string;
              author: { date: string };
              committer: { date: string };
            };
            html_url: string;
          }[]
        >(
          token,
          `${base}/commits?${page}&sha=${encodeURIComponent(task.branch ?? "")}&since=${job.since}&author=${encodeURIComponent(c.login)}`,
        );
        for (const row of rows) {
          if (row.author?.id === c.githubId) {
            const key = `${task.repo}:${row.sha}`;
            if (!job.seen.includes(key)) {
              job.seen.push(key);
              job.queue.push({
                kind: "commit",
                repo: task.repo,
                page: 1,
                sha: row.sha,
              });
            }
            add({
              id: `${c.id}:${task.repo}:commit:${row.sha}`,
              sourceId: c.id,
              actor: c.login,
              repo: task.repo,
              ...activityDate(row.commit.author.date),
              title: row.commit.message.split("\n")[0],
              url: row.html_url,
              kind: "commit",
              sha: row.sha.slice(0, 7),
              branch: task.branch ?? "",
            });
          }
        }
        if (rows.length === 100)
          job.queue.unshift({ ...task, page: task.page + 1 });
      }
      if (task.kind === "commit") {
        const detail = await github<{
          stats: { additions: number; deletions: number };
        }>(token, `${base}/commits/${task.sha}`);
        job.activities = job.activities.map((event) =>
          event.id === `${c.id}:${task.repo}:commit:${task.sha}`
            ? {
                ...event,
                additions: detail.stats.additions,
                deletions: detail.stats.deletions,
              }
            : event,
        );
      }
      if (task.kind === "pulls") {
        type Pull = {
          number: number;
          user: { id: number };
          title: string;
          html_url: string;
          created_at: string;
          updated_at: string;
          merged_at: string | null;
          head: { ref: string };
          base: { ref: string };
        };
        const rows = await github<Pull[]>(
          token,
          `${base}/pulls?state=all&sort=updated&direction=desc&${page}`,
        );
        for (const row of rows) {
          if (row.updated_at < job.since) continue;
          if (row.user.id === c.githubId && row.created_at >= job.since)
            add({
              id: `${c.id}:${task.repo}:opened:${row.number}`,
              sourceId: c.id,
              actor: c.login,
              repo: task.repo,
              ...activityDate(row.created_at),
              title: row.title,
              url: row.html_url,
              kind: "opened",
              pr: row.number,
              branch: row.head.ref,
              target: row.base.ref,
            });
          job.queue.push({
            kind: "reviews",
            repo: task.repo,
            pr: row.number,
            page: 1,
          });
          if (row.merged_at && row.merged_at >= job.since)
            job.queue.push({
              kind: "merge",
              repo: task.repo,
              pr: row.number,
              page: 1,
            });
        }
        if (
          rows.length === 100 &&
          rows[rows.length - 1].updated_at >= job.since
        )
          job.queue.unshift({ ...task, page: task.page + 1 });
      }
      if (task.kind === "merge") {
        const row = await github<{
          merged_by: { id: number } | null;
          merged_at: string;
          title: string;
          html_url: string;
          base: { ref: string };
        }>(token, `${base}/pulls/${task.pr}`);
        if (row.merged_by?.id === c.githubId)
          add({
            id: `${c.id}:${task.repo}:merged:${task.pr}`,
            sourceId: c.id,
            actor: c.login,
            repo: task.repo,
            ...activityDate(row.merged_at),
            title: row.title,
            url: row.html_url,
            kind: "merged",
            pr: task.pr!,
            target: row.base.ref,
          });
      }
      if (task.kind === "reviews") {
        const rows = await github<
          {
            id: number;
            user: { id: number };
            state: string;
            submitted_at: string | null;
            html_url: string;
            body: string;
          }[]
        >(token, `${base}/pulls/${task.pr}/reviews?${page}`);
        for (const row of rows) {
          if (
            row.user.id === c.githubId &&
            row.submitted_at &&
            row.submitted_at >= job.since &&
            ["APPROVED", "CHANGES_REQUESTED", "COMMENTED"].includes(row.state)
          )
            add({
              id: `${c.id}:${task.repo}:review:${row.id}`,
              sourceId: c.id,
              actor: c.login,
              repo: task.repo,
              ...activityDate(row.submitted_at),
              title: row.body.slice(0, 160) || `PR #${task.pr}`,
              url: row.html_url,
              kind: "review",
              pr: task.pr!,
              result: row.state.toLowerCase() as
                "approved" | "changes_requested" | "commented",
            });
        }
        if (rows.length === 100)
          job.queue.unshift({ ...task, page: task.page + 1 });
      }
      if (task.kind === "notifications") {
        const rows = await github<
          {
            id: string;
            unread: boolean;
            updated_at: string;
            reason: string;
            repository: { full_name: string; html_url: string };
            subject: { title: string; url: string | null };
          }[]
        >(decrypt(c.inboxCredential!), `/notifications?all=true&${page}`);
        for (const row of rows)
          job.notifications.push({
            id: `${c.id}:${row.id}`,
            date: vietnamDate(new Date(row.updated_at)),
            sourceId: c.id,
            repo: row.repository.full_name,
            title: row.subject.title,
            kind: row.reason,
            read: !row.unread,
            url: row.repository.html_url,
            body: row.reason,
          });
        if (rows.length === 100)
          job.queue.unshift({ ...task, page: task.page + 1 });
      }
    }
    job.done = job.queue.length === 0;
    await putDocument("sync", id, job);
    if (job.done) {
      await putDocument("snapshot", id, progressSnapshot(c, job));
      await putDocument("connection", id, {
        ...c,
        observedAt: new Date().toISOString(),
        error: null,
      });
    }
    return Response.json({ done: job.done, remaining: job.queue.length });
  } catch (error) {
    if (task) job.queue.unshift(task);
    const code =
      error instanceof GitHubError ? error.code : "upstream_unavailable";
    job.retryAt =
      Date.now() +
      (error instanceof GitHubError ? error.retryAfter : 60) * 1000;
    await putDocument("sync", id, job);
    await putDocument("connection", id, { ...c, error: code });
    return Response.json(
      {
        code,
        done: false,
        retryAfter: Math.ceil((job.retryAt - Date.now()) / 1000),
      },
      { status: 502 },
    );
  }
}
export async function inboxRequest(request: Request) {
  const body = await input(request),
    id = string(body.id),
    [connectionId, thread] = id.split(":");
  if (!/^\d+$/.test(thread ?? "")) throw new AccessError(400, "invalid_thread");
  const c = (await connections()).find((c) => c.id === connectionId);
  if (!c?.inboxCredential) throw new AccessError(409, "inbox_not_connected");
  await github(
    decrypt(c.inboxCredential),
    `/notifications/threads/${thread}`,
    "PATCH",
  );
  const pending = (await documents<Job>("sync")).find(
    (j) => j.id === c.id,
  )?.value;
  if (pending) {
    pending.notifications = pending.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    await putDocument("sync", c.id, pending);
  }
  const current = (await documents<LiveSnapshot>("snapshot")).find(
    (s) => s.id === c.id,
  )?.value;
  if (current) {
    current.data.notifications = current.data.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    await putDocument("snapshot", c.id, current);
  }
  return Response.json({ ok: true });
}
