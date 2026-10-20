import type { CalendarEvent } from "../calendar/types";
import { nextDay } from "./model";
export const calendarTimestamp = (local: string) => Date.parse(`${local}:00+07:00`);
export function upcomingEvents(events: CalendarEvent[], day: string, now: number) {
  if (!day || !now) return [];
  const end = nextDay(day, 7);
  return events.filter(event => event.status !== "cancelled" && event.status !== "completed" && event.start.slice(0, 10) < end && calendarTimestamp(event.end) > now).sort((a, b) => a.start.localeCompare(b.start));
}
