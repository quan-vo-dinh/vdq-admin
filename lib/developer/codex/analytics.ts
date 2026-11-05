import type { DeveloperData, Source } from "../model";
import type { QuotaWindow } from "./model";
export type CodexAccountView = {
  id: string;
  name: string;
  group: "personal" | "work";
  identityLabel: string | null;
  plan: string | null;
  paused: boolean;
  observedAt: string | null;
  usageObservedAt: string | null;
  quotaObservedAt: string | null;
  usageStatus: string;
  quotaStatus: string;
  quotaWindows: QuotaWindow[];
  summary: Record<string, number | null> | null;
  deviceCount?: number;
  onlineDeviceCount?: number;
  lastHeartbeatAt?: string | null;
};
export type DailyUsage = {
  sourceId: string;
  date: string;
  tokens: number;
  collectedAt?: string;
};
export function usageRows(data: DeveloperData, days: number, source = "all") {
  const end = data.snapshot.slice(0, 10),
    start = new Date(Date.parse(`${end}T12:00:00Z`) - (days - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
  return (data.accountUsage ?? []).filter(
    (row) =>
      row.date >= start &&
      row.date <= end &&
      (source === "all" || row.sourceId === source),
  );
}
export function usageTotal(rows: DailyUsage[]): number | null {
  return rows.length ? rows.reduce((sum, row) => sum + row.tokens, 0) : null;
}
export function dailyTrend(rows: DailyUsage[]) {
  const days = new Map<string, number>();
  for (const row of rows)
    days.set(row.date, (days.get(row.date) ?? 0) + row.tokens);
  return [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({ date, tokens }));
}
export function quotaState(
  window: QuotaWindow,
  observedAt: string | null,
  now = Date.now(),
) {
  const stale = !observedAt || now - Date.parse(observedAt) > 600000;
  const expired =
    window.resetsAt !== null && Date.parse(window.resetsAt) <= now;
  return { stale, expired, remaining: 100 - window.usedPercent };
}
export function codexSource(
  account: CodexAccountView,
  now = Date.now(),
): Source {
  const stale =
    !account.observedAt || now - Date.parse(account.observedAt) > 600000;
  return {
    id: account.id,
    name: account.name,
    provider: "Codex",
    scope: account.group,
    status: account.paused
      ? "stale"
      : !account.observedAt
        ? "unavailable"
        : stale
          ? "stale"
          : account.usageStatus !== "ok" || account.quotaStatus !== "ok"
            ? "partial"
            : "fresh",
    observedAt: account.observedAt,
    detail: account.plan ?? "",
    quota: null,
    window: null,
    resetsAt: null,
  };
}

export function dailyTimeline(rows: DailyUsage[], days: number, end: string) {
  const observed = new Map(
    dailyTrend(rows).map((row) => [row.date, row.tokens]),
  );
  const endTime = Date.parse(`${end.slice(0, 10)}T12:00:00Z`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(endTime - (days - index - 1) * 86400000)
      .toISOString()
      .slice(0, 10);
    return { date, tokens: observed.get(date) ?? null };
  });
}
