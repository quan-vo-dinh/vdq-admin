export const categories = ["work", "personal", "learning"] as const;
export type Priority = { id: string; revision?: number; title: string; category: typeof categories[number]; date: string; done: boolean };
export class TodayError extends Error {
  constructor(public code: "invalid" | "full" | "missing") { super(code); }
}
export function validDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
export function dayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function nextDay(day: string, offset = 1) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}
export function parsePriority(body: unknown): Omit<Priority, "id" | "done"> {
  if (!body || typeof body !== "object") throw new TodayError("invalid");
  const value = body as Record<string, unknown>;
  if (typeof value.title !== "string" || !value.title.trim() || value.title.trim().length > 160 ||
      !categories.includes(value.category as Priority["category"]) || !validDay(value.date)) throw new TodayError("invalid");
  return { title: value.title.trim(), category: value.category as Priority["category"], date: value.date };
}
export function checkCapacity(items: Priority[], date: string, exceptId?: string) {
  if (items.filter(item => item.date === date && item.id !== exceptId).length >= 3) throw new TodayError("full");
}
export function updatePriority(items: Priority[], body: unknown) {
  if (!body || typeof body !== "object") throw new TodayError("invalid");
  const value = body as Record<string, unknown>;
  const item = items.find(item => item.id === value.id);
  if (!item) throw new TodayError("missing");
  if (value.action === "toggle") {
    if (typeof value.done !== "boolean") throw new TodayError("invalid");
    item.done = value.done;
  } else if (value.action === "move" && validDay(value.date)) {
    checkCapacity(items, value.date, item.id);
    item.date = value.date;
  } else throw new TodayError("invalid");
  return item;
}
