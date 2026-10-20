export const eventColors = [
  "violet",
  "blue",
  "green",
  "orange",
  "rose",
  "slate",
] as const;
export type EventColor = (typeof eventColors)[number];
export type CalendarView = "agenda" | "year" | "month" | "week" | "day";
export type BadgeStyle = "dot" | "color" | "mixed";
export type EventStatus = "planned" | "confirmed" | "completed" | "cancelled";
export type EventCategory = "work" | "meeting" | "personal" | "learning";
export interface CalendarEvent {
  id: string;
  revision?: number;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  color: EventColor;
  category: EventCategory;
  kind: "event" | "task";
  status: EventStatus;
  priority: "low" | "medium" | "high";
  location: string;
  attendees: string;
}
export type EventInput = Omit<CalendarEvent, "id">;
export interface CalendarSettings {
  badgeStyle: BadgeStyle;
  workStart: number;
  workEnd: number;
  visibleStart: number;
  visibleEnd: number;
  showWeekends: boolean;
  workDays: number[];
}
export interface CalendarData {
  settingsRevision?: number;
  events: CalendarEvent[];
  settings: CalendarSettings;
}
export const defaultSettings: CalendarSettings = {
  badgeStyle: "mixed",
  workStart: 9,
  workEnd: 18,
  visibleStart: 7,
  visibleEnd: 21,
  showWeekends: true,
  workDays: [1, 2, 3, 4, 5],
};
