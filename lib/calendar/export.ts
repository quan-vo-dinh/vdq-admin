import { addDays, dateKey, fromKey } from "./utils";
import type { CalendarEvent } from "./types";
const escape = (value: string) =>
  value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r", "")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
const stamp = (value: string) =>
  new Date(`${value}:00+07:00`)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(".000", "");
export function calendarICS(events: CalendarEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dashboard//Big Calendar//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@dashboard.local`,
      `DTSTAMP:${new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "")}`,
      event.allDay
        ? `DTSTART;VALUE=DATE:${event.start.slice(0, 10).replaceAll("-", "")}`
        : `DTSTART:${stamp(event.start)}`,
      event.allDay
        ? `DTEND;VALUE=DATE:${event.end.slice(0, 10).replaceAll("-", "")}`
        : `DTEND:${stamp(event.end)}`,
      `SUMMARY:${escape(event.title)}`,
      `DESCRIPTION:${escape(event.description)}`,
      `LOCATION:${escape(event.location)}`,
      `STATUS:${event.status === "cancelled" ? "CANCELLED" : event.status === "planned" ? "TENTATIVE" : "CONFIRMED"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  // RFC 5545: fold content lines at 75 UTF-8 octets without splitting Unicode characters.
  return (
    lines
      .map((line) => {
        let result = "";
        let length = 0;
        for (const char of line) {
          const bytes = new TextEncoder().encode(char).length;
          if (length + bytes > 75) {
            result += "\r\n ";
            length = 1;
          }
          result += char;
          length += bytes;
        }
        return result;
      })
      .join("\r\n") + "\r\n"
  );
}
export function movedEvent(
  event: CalendarEvent,
  date: Date,
  hour?: number,
): CalendarEvent {
  const offset = Math.round(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(
        fromKey(event.start).getFullYear(),
        fromKey(event.start).getMonth(),
        fromKey(event.start).getDate(),
      )) /
      86400000,
  );
  const hourOffset =
    hour === undefined || event.allDay
      ? 0
      : hour - Number(event.start.slice(11, 13));
  const shift = (value: string) => {
    const shifted = new Date(`${value}:00Z`);
    shifted.setUTCDate(shifted.getUTCDate() + offset);
    shifted.setUTCHours(shifted.getUTCHours() + hourOffset);
    return shifted.toISOString().slice(0, 16);
  };
  return { ...event, start: shift(event.start), end: shift(event.end) };
}
export function weekTaskEnd(day: Date) {
  return `${dateKey(addDays(day, 7))}T00:00`;
}
