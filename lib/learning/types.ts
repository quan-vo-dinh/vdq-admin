export type CheckIn = { date: string; minutes: number; note: string };
export type LearningHabit = {
  id: string;
  title: string;
  intention: string;
  minutes: number;
  created: string;
  archived: boolean;
  entries: CheckIn[];
};
export type LearningData = { version: 1; habits: LearningHabit[] };

export type HabitValues = Pick<
  LearningHabit,
  "title" | "intention" | "minutes"
> & { note: string };
