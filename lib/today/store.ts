import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parsePriority, type Priority } from "./model";
const file = path.join(process.env.TODAY_DATA_DIR || path.join(process.cwd(), ".data"), "today.json");
const state = globalThis as typeof globalThis & { todayQueue?: Promise<unknown> };
export function withToday<T>(operation: (items: Priority[]) => T, persist = false): Promise<T> {
  const result = (state.todayQueue ?? Promise.resolve()).then(async () => {
    let items: Priority[];
    try {
      const raw: unknown = JSON.parse(await readFile(file, "utf8"));
      if (!Array.isArray(raw)) throw new Error("Invalid today storage");
      items = raw.map(item => {
        const parsed = parsePriority(item);
        if (typeof item.id !== "string" || typeof item.done !== "boolean") throw new Error("Invalid today storage");
        return { ...parsed, id: item.id, done: item.done };
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      items = [];
    }
    const value = operation(items);
    if (persist) {
      await mkdir(path.dirname(file), { recursive: true });
      const temporary = `${file}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(items), "utf8");
      await rename(temporary, file);
    }
    return value;
  });
  state.todayQueue = result.catch(() => undefined);
  return result;
}
