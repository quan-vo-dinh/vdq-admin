import type { LearningHabit } from "@/lib/learning/types";
export type LearningEditor =
  | { kind: "create"; habit?: never }
  | { kind: "edit" | "check"; habit: LearningHabit };
export type Celebration = { title: string; days: number; milestone: boolean };
