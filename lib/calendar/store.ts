import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  defaultSettings,
  type CalendarData,
  type CalendarEvent,
} from "./types";
import {
  addDays,
  blankEvent,
  dateKey,
  fromKey,
  nowInSaigon,
  startOfWeek,
} from "./utils";
import { parseEvent, parseSettings } from "./validation";

const file = path.join(
  process.env.CALENDAR_DATA_DIR || path.join(process.cwd(), ".data"),
  "calendar.json",
);
const processState = globalThis as typeof globalThis & {
  calendarQueue?: Promise<unknown>;
};
function seed(): CalendarData {
  const monday = startOfWeek(fromKey(nowInSaigon()));
  const definitions: [
    string,
    number,
    number,
    number,
    CalendarEvent["color"],
    CalendarEvent["category"],
    CalendarEvent["kind"],
  ][] = [
    ["Lên kế hoạch tuần", 0, 9, 10, "violet", "work", "event"],
    ["Thiết kế trải nghiệm Calendar", 0, 10, 12, "blue", "work", "task"],
    ["Đồng bộ cùng đội ngũ", 1, 9, 10, "orange", "meeting", "event"],
    ["Tập trung phát triển sản phẩm", 1, 13, 16, "violet", "work", "task"],
    ["Học & ghi chú kiến thức mới", 2, 10, 12, "green", "learning", "event"],
    ["Review giao diện", 2, 14, 15, "orange", "meeting", "event"],
    ["Hoàn thiện tài liệu dự án", 3, 9, 11, "blue", "work", "task"],
    ["Cà phê & kết nối", 3, 15, 16, "rose", "personal", "event"],
    ["Tổng kết và demo tuần", 4, 14, 16, "orange", "meeting", "event"],
    ["Thời gian cho bản thân", 5, 9, 11, "green", "personal", "event"],
  ];
  const events = definitions.map(
    ([title, day, start, end, color, category, kind], i): CalendarEvent => ({
      ...blankEvent(addDays(monday, day), start),
      id: randomUUID(),
      title,
      end: `${dateKey(addDays(monday, day))}T${String(end).padStart(2, "0")}:00`,
      color,
      category,
      kind,
      description:
        "Nội dung mẫu — chỉnh sửa hoặc xóa để bắt đầu kế hoạch của bạn.",
      status: i === 0 ? "completed" : i % 3 === 0 ? "planned" : "confirmed",
      priority: i === 3 ? "high" : "medium",
      location: category === "meeting" ? "Google Meet" : "",
    }),
  );
  events.push({
    ...blankEvent(monday),
    id: randomUUID(),
    title: "Tuần phát triển sản phẩm",
    start: `${dateKey(monday)}T00:00`,
    end: `${dateKey(addDays(monday, 5))}T00:00`,
    allDay: true,
    color: "violet",
    description: "Sự kiện mẫu kéo dài nhiều ngày.",
  });
  return { events, settings: { ...defaultSettings } };
}
async function write(data: CalendarData) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2), "utf8");
  await rename(temporary, file);
}
async function read(): Promise<CalendarData> {
  try {
    const data = JSON.parse(await readFile(file, "utf8")) as CalendarData;
    if (
      !parseSettings(data.settings) ||
      !Array.isArray(data.events) ||
      !data.events.every((e) => typeof e.id === "string" && parseEvent(e))
    )
      throw new Error("Invalid calendar storage");
    return data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const data = seed();
    await write(data);
    return data;
  }
}
// Serialize reads and atomic writes within this Node process, including dev hot reloads.
export function withCalendar<T>(
  operation: (data: CalendarData) => T | Promise<T>,
  persist = false,
): Promise<T> {
  const result = (processState.calendarQueue ?? Promise.resolve()).then(
    async () => {
      const data = await read();
      const result = await operation(data);
      if (persist) await write(data);
      return result;
    },
  );
  processState.calendarQueue = result.catch(() => undefined);
  return result;
}
