import type { CheckIn, LearningHabit } from "./types";
export const milestones = [3, 7, 14, 30, 60, 100, 180, 365];
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDay(date: string, amount: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
}
export function streaks(entries: CheckIn[], today: string) {
  const days = [...new Set(entries.map((e) => e.date))].sort();
  const dates = new Set(days);
  let current = 0,
    best = 0,
    run = 0;
  let cursor = dates.has(today) ? today : shiftDay(today, -1);
  while (dates.has(cursor)) {
    current++;
    cursor = shiftDay(cursor, -1);
  }
  days.forEach((date, i) => {
    run = i && shiftDay(days[i - 1], 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return { current, best };
}

export function learningSummary(habits: LearningHabit[], today: string) {
  const active = habits.filter((h) => !h.archived);
  const completed = active.filter((h) =>
    h.entries.some((e) => e.date === today),
  ).length;
  const entries = habits.flatMap((h) =>
    h.entries.map((e) => ({ ...e, title: h.title, id: h.id })),
  );
  const best = Math.max(
    0,
    ...habits.map((h) => streaks(h.entries, today).best),
  );
  const leading = [...active].sort(
    (a, b) =>
      streaks(b.entries, today).current - streaks(a.entries, today).current,
  )[0];
  const leadingRun = leading ? streaks(leading.entries, today).current : 0;
  return {
    active,
    completed,
    allDone: active.length > 0 && completed === active.length,
    entries,
    uniqueDays: new Set(entries.map((e) => e.date)).size,
    totalMinutes: entries.reduce((s, e) => s + e.minutes, 0),
    best,
    leading,
    leadingRun,
    nextMilestone:
      milestones.find((n) => n > leadingRun) ??
      (Math.floor(leadingRun / 365) + 1) * 365,
  };
}
export function withCheckIn(
  habit: LearningHabit,
  today: string,
  minutes: number,
  note: string,
): LearningHabit {
  if (
    habit.archived ||
    !Number.isInteger(minutes) ||
    minutes < 1 ||
    minutes > 1440
  )
    throw new Error("Invalid learning session");
  return {
    ...habit,
    entries: [
      ...habit.entries.filter((e) => e.date !== today),
      { date: today, minutes, note: note.trim() },
    ],
  };
}
