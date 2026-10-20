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
  kind: "review" | "mention" | "assigned";
  read: boolean;
  url: string;
  body: string;
};
export type DeveloperData = {
  snapshot: string;
  sources: Source[];
  sessions: Session[];
  contributions: Contribution[];
  notifications: Notification[];
};
export const SNAPSHOT = "2026-10-16";
export function startDate(days: number) {
  return new Date(Date.parse(`${SNAPSHOT}T00:00:00Z`) - (days - 1) * 86400000)
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
      s.date >= startDate(days) &&
      s.date <= SNAPSHOT &&
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
      d.date >= startDate(days) &&
      d.date <= SNAPSHOT &&
      (source === "all" || d.sourceId === source),
  );
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
  const sessions = selectSessions(data, days);
  const contributions = selectContributions(data, days);
  const count = contributions.reduce((n, d) => n + d.count, 0);
  const unread = data.notifications.filter((n) => !n.read).length;
  return locale === "vi"
    ? `BÁO CÁO MINH HỌA · ${startDate(days)} → ${SNAPSHOT}\n\nĐã ghi nhận ${count} contributions từ 2 tài khoản GitHub mẫu.\n${sessions.length} phiên AI, ${tokens(sessions).toLocaleString("vi-VN")} token quan sát (input + output + cache, không chồng lặp trong bộ mẫu).\nInbox hiện tại: ${unread} thông báo chưa đọc.\n\nPhạm vi: Codex cá nhân/công việc; một nguồn Claude Code giả lập, chưa xác nhận tài khoản thực. Claude chat chưa có dữ liệu. Dữ liệu AI chỉ gồm phiên quan sát trên một máy mẫu.\n\nKhông cộng quota giữa các nguồn, không quy token thành chi phí hay năng suất. Contributions được cộng theo ngày và tài khoản; có thể trùng hoạt động giữa hai danh tính. Không suy ra công việc đã hoàn thành.\n\nTổng hợp bằng quy tắc từ dữ liệu giả lập, không gọi AI. Mốc dữ liệu: 16/10/2026 09:00 GMT+7.`
    : `DEMO REPORT · ${startDate(days)} → ${SNAPSHOT}\n\n${count} contributions across 2 sample GitHub accounts.\n${sessions.length} AI sessions, ${tokens(sessions).toLocaleString("en-GB")} observed tokens (input + output + cache, mutually exclusive in this fixture).\nCurrent inbox: ${unread} unread notifications.\n\nCoverage: personal/work Codex; one fictional Claude Code source, actual accounts unconfirmed. Claude chat unavailable. AI observations cover one sample device only.\n\nQuotas are independent. Tokens do not measure cost or productivity. Contributions are summed by date and account; activity across identities may overlap. No completion of work is inferred.\n\nRule-based summary of fictional data; no AI call. Snapshot: 16 October 2026, 09:00 GMT+7.`;
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
