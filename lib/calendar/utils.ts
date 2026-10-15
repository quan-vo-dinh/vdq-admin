import type { CalendarEvent, CalendarView, EventInput } from "./types";

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function fromKey(key: string): Date {
  return new Date(`${key.slice(0, 10)}T12:00:00`);
}
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}
export function monthDays(date: Date): Date[] {
  const start = startOfWeek(
    new Date(date.getFullYear(), date.getMonth(), 1, 12),
  );
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export function nowInSaigon(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export function eventOnDay(event: CalendarEvent, date: Date): boolean {
  const day = dateKey(date);
  return (
    event.start < `${dateKey(addDays(date, 1))}T00:00` &&
    event.end > `${day}T00:00`
  );
}
export function overlaps(
  a: Pick<CalendarEvent, "start" | "end">,
  b: Pick<CalendarEvent, "start" | "end">,
): boolean {
  return a.start < b.end && a.end > b.start;
}
export function isActive(event: CalendarEvent): boolean {
  return event.status !== "cancelled" && event.status !== "completed";
}
export function rangeForView(date: Date, view: CalendarView): [Date, Date] {
  if (view === "year")
    return [
      new Date(date.getFullYear(), 0, 1, 12),
      new Date(date.getFullYear() + 1, 0, 1, 12),
    ];
  if (view === "month" || view === "agenda")
    return [
      new Date(date.getFullYear(), date.getMonth(), 1, 12),
      new Date(date.getFullYear(), date.getMonth() + 1, 1, 12),
    ];
  const start = view === "week" ? startOfWeek(date) : date;
  return [start, addDays(start, view === "week" ? 7 : 1)];
}
export function moveDate(
  date: Date,
  view: CalendarView,
  direction: number,
): Date {
  if (view === "day") return addDays(date, direction);
  if (view === "week") return addDays(date, 7 * direction);
  // Start at day one to avoid Jan 31 -> March rollover.
  if (view === "year")
    return new Date(date.getFullYear() + direction, date.getMonth(), 1, 12);
  return new Date(date.getFullYear(), date.getMonth() + direction, 1, 12);
}
export function blankEvent(date: Date, hour = 9): EventInput {
  const day = dateKey(date);
  return {
    title: "",
    description: "",
    start: `${day}T${String(hour).padStart(2, "0")}:00`,
    end: `${dateKey(hour === 23 ? addDays(date, 1) : date)}T${String((hour + 1) % 24).padStart(2, "0")}:00`,
    allDay: false,
    color: "violet",
    category: "work",
    kind: "event",
    status: "planned",
    priority: "medium",
    location: "",
    attendees: "",
  };
}
export function timeLabel(event: CalendarEvent, vi: boolean): string {
  if (event.allDay) return vi ? "Cả ngày" : "All day";
  return `${event.start.slice(11)} – ${event.end.slice(11)}`;
}
export function displayEndDay(
  event: Pick<CalendarEvent, "end" | "allDay">,
): string {
  return event.allDay
    ? dateKey(addDays(fromKey(event.end), -1))
    : event.end.slice(0, 10);
}
// Assign columns across an entire overlap cluster, so chained overlaps never cover one another.
export function layoutTimedEvents(
  events: CalendarEvent[],
  date: Date,
  firstHour: number,
  lastHour: number,
) {
  const day = dateKey(date);
  const minute = (value: string) =>
    Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16));
  const items = events
    .filter((e) => !e.allDay && eventOnDay(e, date))
    .map((event) => ({
      event,
      start: Math.max(
        firstHour * 60,
        event.start.slice(0, 10) < day ? 0 : minute(event.start),
      ),
      end: Math.min(
        lastHour * 60,
        event.end.slice(0, 10) > day ? 1440 : minute(event.end),
      ),
      column: 0,
      columns: 1,
    }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start || b.end - a.end);
  let cluster: typeof items = [];
  let clusterEnd = -1;
  const finish = () => {
    const ends: number[] = [];
    for (const item of cluster) {
      let col = ends.findIndex((end) => end <= item.start);
      if (col === -1) col = ends.length;
      ends[col] = item.end;
      item.column = col;
    }
    cluster.forEach((item) => {
      item.columns = ends.length;
    });
  };
  for (const item of items) {
    if (item.start >= clusterEnd) {
      finish();
      cluster = [];
      clusterEnd = -1;
    }
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  finish();
  return items;
}
