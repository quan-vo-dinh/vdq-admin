// UI-only fixtures. These events never represent synchronized GitHub activity.
export type GitHubActivityKind = "commit" | "opened" | "merged" | "review";
export type GitHubActivity = {
  id: string;
  sourceId: string;
  actor: string;
  repo: string;
  date: string;
  time: string;
  title: string;
} & (
  | { kind: "commit"; sha: string; branch: string }
  | { kind: "opened"; pr: number; branch: string; target: string }
  | { kind: "merged"; pr: number; target: string }
  | { kind: "review"; pr: number; result: "approved" | "changes_requested" | "commented" }
);

// Keep the union intact when omitting the shared fields.
type ActivitySample = GitHubActivity extends infer Event
  ? Event extends GitHubActivity
    ? Omit<Event, "date" | "id"> & { daysAgo: number }
    : never
  : never;

export function githubActivityDemo(now: Date) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00+07:00`);
    date.setUTCDate(date.getUTCDate() - index);
    return date.toISOString().slice(0, 10);
  });
  const work = { sourceId: "github-work", actor: "demo-work" };
  const personal = { sourceId: "github-personal", actor: "demo-personal" };
  const samples: ActivitySample[] = [
    { ...work, daysAgo: 0, time: "08:45", repo: "demo-factory/scada-web", kind: "commit", sha: "a81f2c9", branch: "feat/utility", title: "fix: preserve unknown equipment states" },
    { ...work, daysAgo: 0, time: "08:20", repo: "demo-factory/scada-web", kind: "merged", pr: 128, target: "main", title: "Improve utility overview labels" },
    { ...work, daysAgo: 0, time: "07:50", repo: "demo-logistics/warehouse-web", kind: "review", pr: 64, result: "changes_requested", title: "Add stock movement filters" },
    { ...personal, daysAgo: 0, time: "07:15", repo: "demo-personal/dashboard", kind: "opened", pr: 32, branch: "feat/activity", target: "main", title: "Add weekly GitHub activity timeline" },
    { ...work, daysAgo: 1, time: "16:40", repo: "demo-logistics/warehouse-api", kind: "commit", sha: "b47e1d2", branch: "fix/pagination", title: "fix: keep pagination stable when sorting inventory" },
    { ...work, daysAgo: 1, time: "14:10", repo: "demo-factory/scada-web", kind: "opened", pr: 129, branch: "feat/utility", target: "develop", title: "Handle unavailable utility signals" },
    { ...work, daysAgo: 2, time: "15:30", repo: "demo-logistics/warehouse-web", kind: "merged", pr: 61, target: "develop", title: "Update receiving form validation" },
    { ...personal, daysAgo: 2, time: "09:20", repo: "demo-personal/dashboard", kind: "commit", sha: "c91a8f0", branch: "main", title: "style: refine dashboard card spacing" },
    { ...work, daysAgo: 3, time: "16:00", repo: "demo-factory/weight-api", kind: "review", pr: 87, result: "approved", title: "Simplify production order response" },
    { ...work, daysAgo: 3, time: "10:10", repo: "demo-factory/weight-api", kind: "commit", sha: "d26b3e1", branch: "fix/materials", title: "fix: validate material references" },
    { ...personal, daysAgo: 5, time: "20:30", repo: "demo-personal/dashboard", kind: "review", pr: 29, result: "commented", title: "Improve empty states on the notes page" },
    { ...work, daysAgo: 6, time: "11:45", repo: "demo-logistics/warehouse-api", kind: "merged", pr: 52, target: "main", title: "Add inventory export columns" },
  ];
  const events: GitHubActivity[] = samples.map(({ daysAgo, ...sample }, index) => ({
    ...sample, id: `demo-activity-${index}`, date: days[daysAgo],
  }));
  events.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  return { days, events };
}
