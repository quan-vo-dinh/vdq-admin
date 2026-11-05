import {emptyDeveloperData, type Activity, type LiveConnection, type LiveSnapshot} from "./types";
import type {Notification, DeveloperData} from "../model";
export type SnapshotProgress={activities:Activity[];notifications:Notification[];calendar?:NonNullable<DeveloperData["githubCalendar"]>;coverage:string[]};
export function progressSnapshot(c: Pick<LiveConnection,"id">, job: SnapshotProgress): LiveSnapshot {
  const data = emptyDeveloperData();
  data.notifications = job.notifications;
  data.githubCalendar = job.calendar ?? [];
  const groups = new Map<string, (typeof data.contributions)[number]>();
  for (const event of job.activities) {
    const row = groups.get(event.date) ?? {
      date: event.date,
      sourceId: c.id,
      commits: 0,
      additions: 0,
      deletions: 0,
      prs: 0,
      issues: 0,
      reviews: 0,
      count: 0,
    };
    if (event.kind === "commit") {
      row.commits++;
      row.additions += event.additions ?? 0;
      row.deletions += event.deletions ?? 0;
    }
    if (event.kind === "opened") row.prs++;
    if (event.kind === "review") row.reviews++;
    if (event.kind !== "merged") row.count++;
    groups.set(event.date, row);
  }
  data.contributions = [...groups.values()];
  return { data, activities: job.activities, coverage: job.coverage };
}
