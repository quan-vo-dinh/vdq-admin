import { eventColors, type CalendarSettings, type EventInput } from "./types";
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function validDateTime(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
  )
    return false;
  const date = new Date(`${value}:00Z`);
  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 16) === value &&
    value >= "2000" &&
    value < "2101"
  );
}
export function parseEvent(value: unknown): EventInput | null {
  if (!isRecord(value)) return null;
  const {
    title,
    description,
    start,
    end,
    allDay,
    color,
    category,
    kind,
    status,
    priority,
    location,
    attendees,
  } = value;
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 160 ||
    typeof description !== "string" ||
    description.length > 5000 ||
    typeof location !== "string" ||
    location.length > 300 ||
    typeof attendees !== "string" ||
    attendees.length > 1000 ||
    !validDateTime(start) ||
    !validDateTime(end) ||
    end <= start ||
    typeof allDay !== "boolean" ||
    !eventColors.includes(color as EventInput["color"]) ||
    !["work", "meeting", "personal", "learning"].includes(String(category)) ||
    !["event", "task"].includes(String(kind)) ||
    !["planned", "confirmed", "completed", "cancelled"].includes(
      String(status),
    ) ||
    !["low", "medium", "high"].includes(String(priority)) ||
    (allDay && (!start.endsWith("T00:00") || !end.endsWith("T00:00")))
  )
    return null;
  return {
    title: title.trim(),
    description,
    start,
    end,
    allDay,
    color,
    category,
    kind,
    status,
    priority,
    location,
    attendees,
  } as EventInput;
}
export function parseSettings(value: unknown): CalendarSettings | null {
  if (!isRecord(value)) return null;
  const {
    badgeStyle,
    workStart,
    workEnd,
    visibleStart,
    visibleEnd,
    showWeekends,
    workDays,
  } = value;
  const hour = (v: unknown): v is number =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 24;
  if (
    !["dot", "color", "mixed"].includes(String(badgeStyle)) ||
    !hour(workStart) ||
    !hour(workEnd) ||
    workStart >= workEnd ||
    !hour(visibleStart) ||
    !hour(visibleEnd) ||
    visibleStart >= visibleEnd ||
    typeof showWeekends !== "boolean" ||
    !Array.isArray(workDays) ||
    !workDays.length ||
    !workDays.every((v) => Number.isInteger(v) && v >= 0 && v <= 6)
  )
    return null;
  return {
    badgeStyle,
    workStart,
    workEnd,
    visibleStart,
    visibleEnd,
    showWeekends,
    workDays: [...new Set(workDays)],
  } as CalendarSettings;
}
