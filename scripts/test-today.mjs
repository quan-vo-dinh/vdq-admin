import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";
const temporary = mkdtempSync(join(tmpdir(), "today-unit-"));
try {
  execFileSync("pnpm", ["exec", "tsc", "--ignoreConfig", "--target", "es2022", "--module", "commonjs", "--skipLibCheck", "--outDir", temporary, "lib/today/model.ts", "lib/today/agenda.ts"], { stdio: "inherit" });
  const require = createRequire(import.meta.url);
  const { validDay, dayKey, nextDay, parsePriority, checkCapacity, updatePriority } = require(join(temporary, "today/model.js"));
  const { upcomingEvents } = require(join(temporary, "today/agenda.js"));
  test("Vietnam day rolls over at UTC+7 and handles leap/year boundaries", () => {
    assert.equal(dayKey(new Date("2026-10-20T17:00:00Z")), "2026-10-21");
    assert.equal(nextDay("2026-12-31"), "2027-01-01");
    assert.equal(nextDay("2028-02-28"), "2028-02-29");
    for (const value of [null, "", "2026-02-29", "2026-13-01", "2026-02-30", "2026-1-01"]) assert.equal(validDay(value), false);
    assert.equal(validDay("2028-02-29"), true);
  });
  test("priority input trims titles and rejects malformed data", () => {
    assert.equal(parsePriority({ title: "  Finish review  ", category: "work", date: "2026-10-20" }).title, "Finish review");
    for (const patch of [{ title: " " }, { title: "x".repeat(161) }, { category: "unknown" }, { date: "2026-02-30" }]) assert.throws(() => parsePriority({ title: "Read", category: "learning", date: "2026-10-20", ...patch }));
    for (const body of [null, [], 1]) assert.throws(() => parsePriority(body));
  });
  test("three-slot cap includes completed priorities and failed moves preserve source", () => {
    const items = Array.from({ length: 3 }, (_, i) => ({ id: String(i), title: "Task", category: "work", date: "2026-10-20", done: i === 0 }));
    items.push({ id: "next", title: "Tomorrow", category: "personal", date: "2026-10-21", done: false });
    assert.throws(() => checkCapacity(items, "2026-10-20"), /full/);
    assert.doesNotThrow(() => checkCapacity(items, "2026-10-20", "0"));
    assert.throws(() => updatePriority(items, { id: "next", action: "move", date: "2026-10-20" }), /full/);
    assert.equal(items[3].date, "2026-10-21");
    updatePriority(items, { id: "1", action: "toggle", done: true });
    assert.equal(items[1].done, true);
    updatePriority(items, { id: "1", action: "toggle", done: false });
    assert.equal(items[1].done, false);
    updatePriority(items, { id: "1", action: "move", date: "2026-10-21" });
    assert.equal(items[1].date, "2026-10-21");
    assert.throws(() => updatePriority(items, { id: "1", action: "toggle", done: "true" }), /invalid/);
    assert.throws(() => updatePriority(items, { id: "unknown", action: "toggle", done: true }), /missing/);
  });
  test("agenda includes ongoing multi-day events and excludes ended, cancelled, completed and eighth-day events", () => {
    const now = Date.parse("2026-10-20T09:00:00+07:00");
    const event = (id, start, end, status = "confirmed") => ({ id, start, end, status });
    const events = [event("later", "2026-10-26T09:00", "2026-10-26T10:00"), event("ongoing", "2026-10-19T00:00", "2026-10-21T00:00"), event("ended", "2026-10-20T08:00", "2026-10-20T09:00"), event("cancelled", "2026-10-21T08:00", "2026-10-21T09:00", "cancelled"), event("done", "2026-10-21T08:00", "2026-10-21T09:00", "completed"), event("outside", "2026-10-27T00:00", "2026-10-27T01:00")];
    assert.deepEqual(upcomingEvents(events, "2026-10-20", now).map(event => event.id), ["ongoing", "later"]);
    assert.deepEqual(upcomingEvents(events, "", now), []);
  });
} finally { rmSync(temporary, { recursive: true, force: true }); }
