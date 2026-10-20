import { nextDay, type Priority } from "./model";
export interface ActivityPoint { date: string; planned: number; completed: number }
// Buckets reflect each priority's assigned day and its current completion state.
export function priorityActivity(items: Priority[], day: string, days: number): ActivityPoint[] {
  if (!day) return [];
  return Array.from({ length: days }, (_, i) => {
    const date = nextDay(day, i - days + 1);
    const assigned = items.filter(item => item.date === date);
    return { date, planned: assigned.length, completed: assigned.filter(item => item.done).length };
  });
}
