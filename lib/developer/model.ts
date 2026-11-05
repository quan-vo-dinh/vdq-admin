import { usageRows, usageTotal } from "./codex/analytics";
import type { CodexAccountView } from "./codex/analytics";
export type Provider = "Codex" | "Claude Code" | "GitHub";
export type Source = {
  id: string;
  name: string;
  provider: Provider;
  scope: "personal" | "work" | "unconfirmed";
  status: "fresh" | "stale" | "partial" | "unavailable";
  observedAt: string | null;
  detail: string;
  quota: number | null;
  window: string | null;
  resetsAt: string | null;
  subscription?: {
    plan: string;
    fiveHourRemaining: number;
    weeklyRemaining: number;
  };
};
export type Session = {
  id: string;
  date: string;
  sourceId: string;
  model: string;
  input: number;
  output: number;
  cache: number;
  generationSeconds: number | null;
};
export type Contribution = {
  date: string;
  sourceId: string;
  commits: number;
  additions: number;
  deletions: number;
  prs: number;
  issues: number;
  reviews: number;
  count: number;
};
export type Notification = {
  id: string;
  date: string;
  sourceId: string;
  repo: string;
  title: string;
  kind: string;
  read: boolean;
  url: string;
  body: string;
};
export type DeveloperData = {
  githubTotals?: import("./live/history-model").GitHubTotals[];
  snapshot: string;
  sources: Source[];
  sessions: Session[];
  contributions: Contribution[];
  notifications: Notification[];
  githubCalendar?: { sourceId: string; date: string; count: number }[];
  codexAccounts?: CodexAccountView[];
  accountUsage?: {
    sourceId: string;
    date: string;
    tokens: number;
    collectedAt?: string;
  }[];
};
export const SNAPSHOT = "2026-10-16";
export function startDate(days: number, snapshot = SNAPSHOT) {
  return new Date(
    Date.parse(`${snapshot.slice(0, 10)}T00:00:00Z`) - (days - 1) * 86400000,
  )
    .toISOString()
    .slice(0, 10);
}
export function selectSessions(
  data: DeveloperData,
  days: number,
  source = "all",
  provider = "all",
  model = "all",
) {
  return data.sessions.filter(
    (s) =>
      s.date >= startDate(days, data.snapshot) &&
      s.date <= data.snapshot.slice(0, 10) &&
      (source === "all" || s.sourceId === source) &&
      (provider === "all" ||
        data.sources.find((a) => a.id === s.sourceId)?.provider === provider) &&
      (model === "all" || s.model === model),
  );
}
export function selectContributions(
  data: DeveloperData,
  days: number,
  source = "all",
) {
  return data.contributions.filter(
    (d) =>
      d.date >= startDate(days, data.snapshot) &&
      d.date <= data.snapshot.slice(0, 10) &&
      (source === "all" || d.sourceId === source),
  );
}
export function codeChanges(data: DeveloperData, days = 30) {
  const rows = selectContributions(data, days);
  const additions = rows.reduce((total, row) => total + row.additions, 0);
  const deletions = rows.reduce((total, row) => total + row.deletions, 0);
  return { additions, deletions, total: additions + deletions };
}
export const tokens = (rows: Session[]) =>
  rows.reduce((n, s) => n + s.input + s.output + s.cache, 0);
export function trend(rows: Session[]) {
  const grouped = new Map<
    string,
    { date: string; Codex: number; Claude: number }
  >();
  for (const row of rows) {
    const day = grouped.get(row.date) ?? {
      date: row.date,
      Codex: 0,
      Claude: 0,
    };
    day[row.sourceId.startsWith("codex") ? "Codex" : "Claude"] +=
      row.input + row.output + row.cache;
    grouped.set(row.date, day);
  }
  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date));
}
export function reportText(
  data: DeveloperData,
  days: number,
  locale: "vi" | "en",
) {
  const aiRows = usageRows(data, days);
  const observedTokens = usageTotal(aiRows);
  const aiDays = new Set(aiRows.map((row) => row.date)).size;
  const contributions = selectContributions(data, days);
  const count = contributions.reduce((n, d) => n + d.count, 0);
  const unread = data.notifications.filter((n) => !n.read).length;
  const accounts = data.sources.filter((s) => s.provider === "GitHub").length;
  const coverage = data.sources
    .map((s) => `${s.name}: ${s.observedAt ?? "—"} (${s.status})`)
    .join("\n");
  return locale === "vi"
    ? `BÁO CÁO HOẠT ĐỘNG · ${startDate(days, data.snapshot)} → ${data.snapshot}\n\n${count} hoạt động · ${accounts} tài khoản GitHub.\n${aiDays} ngày có dữ liệu Codex · ${observedTokens === null ? "—" : observedTokens.toLocaleString("vi-VN")} token đã ghi nhận.\nInbox: ${unread} chưa đọc.\n\n${coverage}`
    : `ACTIVITY REPORT · ${startDate(days, data.snapshot)} → ${data.snapshot}\n\n${count} activities · ${accounts} GitHub accounts.\n${aiDays} days with Codex data · ${observedTokens === null ? "—" : observedTokens.toLocaleString("en-GB")} recorded tokens.\nInbox: ${unread} unread.\n\n${coverage}`;
}

export function modelUsage(rows: Session[]) {
  const groups = new Map<
    string,
    {
      model: string;
      input: number;
      output: number;
      cache: number;
      sessions: number;
      sourceIds: string[];
      timedOutput: number;
      seconds: number;
      timedSessions: number;
    }
  >();
  for (const session of rows) {
    const group = groups.get(session.model) ?? {
      model: session.model,
      input: 0,
      output: 0,
      cache: 0,
      sessions: 0,
      sourceIds: [],
      timedOutput: 0,
      seconds: 0,
      timedSessions: 0,
    };
    group.input += session.input;
    group.output += session.output;
    group.cache += session.cache;
    group.sessions++;
    if (!group.sourceIds.includes(session.sourceId))
      group.sourceIds.push(session.sourceId);
    if (session.generationSeconds !== null && session.generationSeconds > 0) {
      group.timedOutput += session.output;
      group.seconds += session.generationSeconds;
      group.timedSessions++;
    }
    groups.set(session.model, group);
  }
  return [...groups.values()]
    .map((g) => ({
      ...g,
      total: g.input + g.output + g.cache,
      throughput: g.seconds > 0 ? g.timedOutput / g.seconds : null,
    }))
    .sort((a, b) => b.total - a.total);
}

export function accountTokens(
  data: DeveloperData,
  days: number,
  source = "all",
) {
  const daily = (data.accountUsage ?? []).filter(
    (row) =>
      row.date >= startDate(days, data.snapshot) &&
      row.date <= data.snapshot &&
      (source === "all" || row.sourceId === source),
  );
  const observedSources = new Set(daily.map((row) => row.sourceId));
  return (
    daily.reduce((sum, row) => sum + row.tokens, 0) +
    tokens(
      selectSessions(data, days, source).filter(
        (row) => !observedSources.has(row.sourceId),
      ),
    )
  );
}
