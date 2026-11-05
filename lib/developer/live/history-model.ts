export type HistoryTask =
  | { kind: "calendar"; from: string; to: string }
  | { kind: "prs"; cursor: string | null }
  | { kind: "repos"; page: number }
  | { kind: "branches"; repo: string; page: number }
  | { kind: "commits"; repo: string; branch: string; cursor: string | null };
export type HistoryJob = {
  viewerId: string;
  heads?: Record<string, string>;
  queue: HistoryTask[];
  startedAt: string;
  completedAt: string | null;
  previousCompletedAt: string | null;
  retryAt: number;
  error: string | null;
  skipped: string[];
  completed: { contributions: boolean; prs: boolean; lines: boolean };
};
export type HistoryFact = {
  source_id: string;
  event_key: string;
  day: string;
  kind: "contributions" | "prs" | "lines";
  count: number;
  additions: number;
  deletions: number;
};
export type GitHubTotals = {
  sourceId: string;
  period: "all" | "year" | "month";
  contributions: number;
  prs: number;
  additions: number;
  deletions: number;
  complete: HistoryJob["completed"];
  observedAt: string | null;
  error: string | null;
};
// Calendar-year windows never overlap, including leap years. GitHub accepts at
// most one year per contributionsCollection request; recent data arrives first.
export function calendarTasks(createdAt: string, now: string): HistoryTask[] {
  const oldest = Number(createdAt.slice(0, 4)),
    newest = Number(now.slice(0, 4));
  const tasks: HistoryTask[] = [];
  for (let year = newest; year >= oldest; year--)
    tasks.push({
      kind: "calendar",
      from: `${year}-01-01T00:00:00Z`,
      to: year === newest ? now : `${year}-12-31T23:59:59Z`,
    });
  return tasks;
}
export function commitFact(
  source: string,
  _repo: string,
  commit: {
    oid: string;
    committedDate: string;
    additions: number;
    deletions: number;
  },
): HistoryFact {
  return {
    source_id: source,
    event_key: `commit:${commit.oid}`,
    day: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(commit.committedDate)),
    kind: "lines",
    count: 0,
    additions: commit.additions,
    deletions: commit.deletions,
  };
}
export function aggregateTotals(
  rows: GitHubTotals[],
  period: GitHubTotals["period"],
  sourceIds: string[],
) {
  const selected = sourceIds.map((id) =>
    rows.find((row) => row.sourceId === id && row.period === period),
  );
  return {
    contributions: selected.reduce((n, r) => n + (r?.contributions ?? 0), 0),
    prs: selected.reduce((n, r) => n + (r?.prs ?? 0), 0),
    additions: selected.reduce((n, r) => n + (r?.additions ?? 0), 0),
    deletions: selected.reduce((n, r) => n + (r?.deletions ?? 0), 0),
    complete: {
      contributions:
        selected.length > 0 && selected.every((r) => r?.complete.contributions),
      prs: selected.length > 0 && selected.every((r) => r?.complete.prs),
      lines: selected.length > 0 && selected.every((r) => r?.complete.lines),
    },
  };
}
