import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";

const temporary = mkdtempSync(join(tmpdir(), "calendar-unit-"));
try {
  execFileSync(
    "pnpm",
    [
      "exec",
      "tsc",
      "--ignoreConfig",
      "--target",
      "es2022",
      "--module",
      "commonjs",
      "--skipLibCheck",
      "--outDir",
      temporary,
      ...["types", "utils", "validation", "export"].map(
        (name) => `lib/calendar/${name}.ts`,
      ),
    ],
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url);
  const utils = require(join(temporary, "utils.js"));
  const { parseEvent, parseSettings, validDateTime } = require(
    join(temporary, "validation.js"),
  );
  const { defaultSettings } = require(join(temporary, "types.js"));
  const { calendarICS, movedEvent } = require(join(temporary, "export.js"));
  const day = utils.fromKey("2026-10-15");
  const event = {
    ...utils.blankEvent(day),
    id: "test-id",
    title: "Kiểm thử lịch",
  };
  test("valid event is trimmed; invalid enums and empty titles are rejected", () => {
    assert.equal(parseEvent({ ...event, title: "  Plan  " }).title, "Plan");
    for (const bad of [
      { title: " " },
      { color: "pink" },
      { category: "other" },
      { status: "done" },
      { priority: "urgent" },
      { allDay: "true" },
    ])
      assert.equal(parseEvent({ ...event, ...bad }), null);
  });
  test("calendar datetime validation rejects impossible dates and invalid ranges", () => {
    for (const value of [
      "2026-02-29T10:00",
      "2026-10-15T24:00",
      "2026-13-01T09:00",
      "2101-01-01T00:00",
      "bad",
    ])
      assert.equal(validDateTime(value), false);
    assert.equal(validDateTime("2028-02-29T23:59"), true);
    assert.equal(parseEvent({ ...event, end: event.start }), null);
    assert.equal(parseEvent({ ...event, end: "2026-10-14T10:00" }), null);
  });
  test("all-day end is exclusive and must use midnight", () => {
    const allDay = {
      ...event,
      allDay: true,
      start: "2026-10-15T00:00",
      end: "2026-10-17T00:00",
    };
    assert.ok(parseEvent(allDay));
    assert.equal(utils.eventOnDay(allDay, day), true);
    assert.equal(utils.eventOnDay(allDay, utils.addDays(day, 1)), true);
    assert.equal(utils.eventOnDay(allDay, utils.addDays(day, 2)), false);
    assert.equal(utils.displayEndDay(allDay), "2026-10-16");
    assert.equal(parseEvent({ ...allDay, start: event.start }), null);
  });
  test("overnight events appear on both dates and stop at midnight", () => {
    const overnight = {
      ...event,
      start: "2026-10-15T23:00",
      end: "2026-10-16T01:00",
    };
    assert.equal(utils.eventOnDay(overnight, day), true);
    assert.equal(utils.eventOnDay(overnight, utils.addDays(day, 1)), true);
    assert.equal(
      utils.eventOnDay(
        { ...overnight, end: "2026-10-16T00:00" },
        utils.addDays(day, 1),
      ),
      false,
    );
  });
  test("adjacent events do not conflict", () => {
    assert.equal(
      utils.overlaps(event, { start: event.end, end: "2026-10-15T11:00" }),
      false,
    );
    assert.equal(
      utils.overlaps(event, {
        start: "2026-10-15T09:30",
        end: "2026-10-15T11:00",
      }),
      true,
    );
  });
  test("chained overlaps share a cluster and receive distinct columns where needed", () => {
    const events = [
      ["09:00", "10:00"],
      ["09:30", "11:00"],
      ["10:30", "12:00"],
      ["14:00", "15:00"],
    ].map(([start, end], i) => ({
      ...event,
      id: String(i),
      start: `2026-10-15T${start}`,
      end: `2026-10-15T${end}`,
    }));
    const layout = utils.layoutTimedEvents(events, day, 7, 21);
    assert.deepEqual(
      layout.map((e) => e.columns),
      [2, 2, 2, 1],
    );
    assert.notEqual(layout[0].column, layout[1].column);
    assert.notEqual(layout[1].column, layout[2].column);
  });
  test("time grid clips events to displayed hours and omits out-of-range events", () => {
    const layout = utils.layoutTimedEvents(
      [
        { ...event, start: "2026-10-15T06:00", end: "2026-10-15T09:00" },
        {
          ...event,
          id: "late",
          start: "2026-10-15T22:00",
          end: "2026-10-15T23:00",
        },
      ],
      day,
      8,
      20,
    );
    assert.equal(layout.length, 1);
    assert.equal(layout[0].start, 480);
    assert.equal(layout[0].end, 540);
  });
  test("month navigation handles month ends and leap years without skipping", () => {
    assert.equal(
      utils.dateKey(utils.moveDate(utils.fromKey("2026-01-31"), "month", 1)),
      "2026-02-01",
    );
    assert.equal(
      utils.dateKey(utils.moveDate(utils.fromKey("2028-02-29"), "year", 1)),
      "2029-02-01",
    );
    assert.equal(
      utils.dateKey(utils.startOfWeek(utils.fromKey("2026-10-18"))),
      "2026-10-12",
    );
    assert.equal(utils.monthDays(day).length, 42);
  });
  test("new event at 23:00 ends at midnight the following day", () => {
    assert.equal(utils.blankEvent(day, 23).end, "2026-10-16T00:00");
  });
  test("moving an overnight event preserves duration across month boundaries", () => {
    const moved = movedEvent(
      { ...event, start: "2026-10-15T23:00", end: "2026-10-16T02:00" },
      utils.fromKey("2026-11-30"),
      22,
    );
    assert.equal(moved.start, "2026-11-30T22:00");
    assert.equal(moved.end, "2026-12-01T01:00");
  });
  test("moving an all-day event preserves exclusive end and ignores target hour", () => {
    const moved = movedEvent(
      {
        ...event,
        allDay: true,
        start: "2026-10-15T00:00",
        end: "2026-10-17T00:00",
      },
      utils.fromKey("2026-10-20"),
      14,
    );
    assert.equal(moved.start, "2026-10-20T00:00");
    assert.equal(moved.end, "2026-10-22T00:00");
  });
  test("settings reject reversed hours, no work days and invalid badge styles", () => {
    assert.ok(parseSettings(defaultSettings));
    for (const bad of [
      { workStart: 18, workEnd: 9 },
      { visibleStart: 21, visibleEnd: 7 },
      { workDays: [] },
      { workDays: [8] },
      { badgeStyle: "unknown" },
    ])
      assert.equal(parseSettings({ ...defaultSettings, ...bad }), null);
  });
  test("ICS converts GMT+7 to UTC and escapes text", () => {
    const ics = calendarICS([
      { ...event, title: "Review, plan; done", description: "First\nSecond" },
    ]);
    assert.ok(ics.includes("DTSTART:20261015T020000Z"));
    assert.ok(ics.includes("SUMMARY:Review\\, plan\\; done"));
    assert.ok(ics.includes("DESCRIPTION:First\\nSecond"));
  });
  test("ICS preserves all-day dates and folds Unicode at 75 bytes", () => {
    const ics = calendarICS([
      {
        ...event,
        allDay: true,
        start: "2026-10-15T00:00",
        end: "2026-10-17T00:00",
        title: "Lập kế hoạch công việc ".repeat(20),
      },
    ]);
    assert.ok(ics.includes("DTEND;VALUE=DATE:20261017"));
    for (const line of ics.split("\r\n"))
      assert.ok(Buffer.byteLength(line) <= 75);
    assert.ok(!ics.includes("\uFFFD"));
  });
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
