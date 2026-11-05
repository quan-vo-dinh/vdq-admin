import type { DeveloperData } from "../model";
export type LiveConnection = {
  id: string;
  name: string;
  group: "personal" | "work";
  login: string;
  githubId: number;
  repositories: string[];
  paused: boolean;
  checkedAt: string;
  updatedAt: string;
  observedAt: string | null;
  error: string | null;
  credential: string;
  inboxCredential: string | null;
};
export type Activity = {
  id: string;
  sourceId: string;
  actor: string;
  repo: string;
  date: string;
  time: string;
  title: string;
  url: string;
  additions?: number;
  deletions?: number;
} & (
  | { kind: "commit"; sha: string; branch: string }
  | { kind: "opened"; pr: number; branch: string; target: string }
  | { kind: "merged"; pr: number; target: string }
  | {
      kind: "review";
      pr: number;
      result: "approved" | "changes_requested" | "commented";
    }
);
export type LiveSnapshot = {
  data: DeveloperData;
  activities: Activity[];
  coverage: string[];
  sync?: {sourceId:string;remaining:number;activities:number;notifications:number;retryAt:number}[];
};
export function vietnamDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function emptyDeveloperData(): DeveloperData {
  return {
    snapshot: vietnamDate(),
    sources: [],
    sessions: [],
    contributions: [],
    notifications: [],
  };
}
