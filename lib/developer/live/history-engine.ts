import { github, githubGraphQL } from "./github";
import {
  calendarTasks,
  commitFact,
  type HistoryJob,
  type HistoryFact,
} from "./history-model";
type Page<T> = {
  nodes: T[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};
export async function advanceHistory(
  token: string,
  sourceId: string,
  stored?: HistoryJob,
): Promise<{ job: HistoryJob; facts: HistoryFact[] }> {
  const now = new Date().toISOString();
  let job = stored ? structuredClone(stored) : undefined;
  if (
    !job ||
    (job.completedAt && Date.now() - Date.parse(job.completedAt) >= 600000)
  ) {
    const { viewer } = await githubGraphQL<{
      viewer: { id: string; createdAt: string };
    }>(token, "query { viewer { id createdAt } }");
    const previous = job?.completedAt ?? null;
    job = {
      viewerId: viewer.id,
      heads: job?.heads ?? {},
      queue: [
        ...calendarTasks(viewer.createdAt, now),
        { kind: "prs", cursor: null },
        { kind: "repos", page: 1 },
      ],
      startedAt: now,
      completedAt: null,
      previousCompletedAt: previous,
      retryAt: 0,
      error: null,
      skipped: [],
      completed: job?.completed ?? { contributions: false, prs: false, lines: false },
    };
  }
  if (job.completedAt) return { job, facts: [] };
  const task = job.queue.shift();
  const facts: HistoryFact[] = [];
  const base = { source_id: sourceId, count: 0, additions: 0, deletions: 0 };
  if (task?.kind === "calendar") {
    const { viewer } = await githubGraphQL<{
      viewer: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: {
              contributionDays: { date: string; contributionCount: number }[];
            }[];
          };
        };
      };
    }>(
      token,
      "query($from:DateTime!,$to:DateTime!){viewer{contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}",
      { from: task.from, to: task.to },
    );
    for (const week of viewer.contributionsCollection.contributionCalendar
      .weeks)
      for (const day of week.contributionDays)
        if (
          day.date >= task.from.slice(0, 10) &&
          day.date <= task.to.slice(0, 10)
        )
          facts.push({
            ...base,
            event_key: `calendar:${day.date}`,
            day: day.date,
            kind: "contributions",
            count: day.contributionCount,
          });
  }
  if (task?.kind === "prs") {
    const { viewer } = await githubGraphQL<{
      viewer: { pullRequests: Page<{ id: string; createdAt: string }> };
    }>(
      token,
      "query($cursor:String){viewer{pullRequests(first:100,after:$cursor,orderBy:{field:CREATED_AT,direction:DESC}){nodes{id createdAt} pageInfo{hasNextPage endCursor}}}}",
      { cursor: task.cursor },
    );
    const page = viewer.pullRequests;
    for (const pr of page.nodes)
      facts.push({
        ...base,
        event_key: `pr:${pr.id}`,
        day: commitFact(sourceId, "", {
          oid: "",
          committedDate: pr.createdAt,
          additions: 0,
          deletions: 0,
        }).day,
        kind: "prs",
        count: 1,
      });
    if (
      page.pageInfo.hasNextPage &&
      (!job.previousCompletedAt ||
        page.nodes.every((pr) => pr.createdAt >= job.previousCompletedAt!))
    )
      job.queue.unshift({ ...task, cursor: page.pageInfo.endCursor });
  }
  if (task?.kind === "repos") {
    const repos = await github<{ full_name: string; fork: boolean }[]>(
      token,
      `/user/repos?per_page=100&page=${task.page}&affiliation=owner,collaborator,organization_member&sort=full_name`,
    );
    // Include all accessible repositories, including authored changes in forks.
    for (const repo of repos)
      job.queue.push({ kind: "branches", repo: repo.full_name, page: 1 });
    if (repos.length === 100)
      job.queue.unshift({ ...task, page: task.page + 1 });
  }
  if (task?.kind === "branches") {
    const branches = await github<{ name: string; commit: { sha: string } }[]>(
      token,
      `/repos/${task.repo}/branches?per_page=100&page=${task.page}`,
    );
    job.heads ??= {};
    for (const branch of branches) {
      const key = `${task.repo}:${branch.name}`;
      if (job.heads[key] !== branch.commit.sha) {
        job.queue.push({
          kind: "commits",
          repo: task.repo,
          branch: branch.name,
          cursor: null,
        });
        job.heads[key] = branch.commit.sha;
      }
    }
    if (branches.length === 100)
      job.queue.unshift({ ...task, page: task.page + 1 });
  }
  if (task?.kind === "commits") {
    // Batch eight independent branch histories into one request. This avoids
    // thousands of HTTP round trips for organization accounts with many refs.
    const batch = [task];
    for (let i = 0; i < job.queue.length && batch.length < 8; ) {
      const next = job.queue[i];
      if (next.kind === "commits") {
        batch.push(next);
        job.queue.splice(i, 1);
      } else i++;
    }
    // A recently pushed commit may have an old commit date. Scan changed refs
    // without a date cutoff; immutable SHA keys keep repeated pages idempotent.
    const since = null;
    const fields = batch
      .map((t, i) => {
        const [owner, name] = t.repo.split("/");
        return `b${i}:repository(owner:${JSON.stringify(owner)},name:${JSON.stringify(name)}){object(expression:${JSON.stringify(`refs/heads/${t.branch}`)}){... on Commit{history(first:100,after:${JSON.stringify(t.cursor)},author:{id:$author},since:$since){nodes{oid committedDate additions deletions} pageInfo{hasNextPage endCursor}}}}}`;
      })
      .join(" ");
    const result = await githubGraphQL<
      Record<
        string,
        {
          object: {
            history: Page<{
              oid: string;
              committedDate: string;
              additions: number;
              deletions: number;
            }>;
          } | null;
        } | null
      >
    >(token, `query($author:ID!,$since:GitTimestamp){${fields}}`, {
      author: job.viewerId,
      since,
    });
    batch.forEach((t, i) => {
      const page = result[`b${i}`]?.object?.history;
      if (page) {
        for (const commit of page.nodes)
          facts.push(commitFact(sourceId, t.repo, commit));
        if (page.pageInfo.hasNextPage)
          job.queue.unshift({ ...t, cursor: page.pageInfo.endCursor });
      } else job.skipped.push(`${t.repo}:${t.branch}`);
    });
  }
  job.error = null;
  job.retryAt = 0;
  job.completed.contributions ||= !job.queue.some((t) => t.kind === "calendar");
  job.completed.prs ||= !job.queue.some((t) => t.kind === "prs");
  job.completed.lines ||=
    !job.queue.some((t) => ["repos", "branches", "commits"].includes(t.kind)) &&
    job.skipped.length === 0;
  if (!job.queue.length) job.completedAt = now;
  return { job, facts };
}
