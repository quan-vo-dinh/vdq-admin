import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";
const temporary = mkdtempSync(join(tmpdir(), "notes-unit-"));
try {
  const config = join(temporary, "tsconfig.json");
  writeFileSync(config, JSON.stringify({ compilerOptions: { target: "es2022", module: "commonjs", skipLibCheck: true, rootDir: process.cwd(), outDir: temporary, paths: { "@/*": [join(process.cwd(), "*")] } }, files: [join(process.cwd(), "lib/notes/model.ts")] }));
  execFileSync("pnpm", ["exec", "tsc", "--project", config], { stdio: "inherit" });
  const require = createRequire(import.meta.url);
  const { noteDateTime, noteDay, noteTimestamp, plainDocument, noteText, parseNoteUpdate } = require(join(temporary, "lib/notes/model.js"));
  test("Vietnam date/time conversion preserves midnight boundaries and leap dates", () => {
    assert.equal(noteDay("2026-10-19T18:30:00Z"), "2026-10-20");
    assert.equal(noteTimestamp("2026-10-20T01:30"), "2026-10-19T18:30:00.000Z");
    assert.equal(noteDateTime(noteTimestamp("2028-02-29T23:59")), "2028-02-29T23:59");
    assert.throws(() => noteTimestamp("2026-02-30T10:00"));
    assert.throws(() => noteTimestamp(""));
  });
  test("structured formatting and note search text survive normalization", () => {
    const content = { type: "doc", content: [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Meeting", marks: [{ type: "bold" }] }] }, { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Action item" }] }] }] }] };
    const result = parseNoteUpdate({ title: "  Daily note  ", content, color: "chart-2", datef: "2026-10-20T08:30:00+07:00" });
    assert.equal(result.title, "Daily note");
    assert.equal(result.content.content[0].attrs.level, 2);
    assert.deepEqual(result.content.content[0].content[0].marks, [{ type: "bold" }]);
    assert.match(noteText(result.content), /Action item/);
    assert.equal(noteText(plainDocument("First\nSecond")), "First\nSecond");
  });
  test("rejects unsupported content, unsafe links, invalid metadata and oversized notes", () => {
    assert.throws(() => parseNoteUpdate({ title: "  " }));
    assert.throws(() => parseNoteUpdate({ color: "arbitrary-css" }));
    assert.throws(() => parseNoteUpdate({ datef: "2026-02-30T10:00:00Z" }));
    assert.throws(() => parseNoteUpdate({ content: { type: "doc", content: [{ type: "text", text: "Outside paragraph" }] } }));
    assert.throws(() => parseNoteUpdate({ datef: "bad date" }));
    assert.throws(() => parseNoteUpdate({ content: { type: "image", attrs: { src: "x" } } }));
    assert.throws(() => parseNoteUpdate({ content: { type: "doc", content: [{ type: "text", text: "link", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] } }));
    assert.throws(() => parseNoteUpdate({ content: plainDocument("x".repeat(200_001)) }));
  });
  test("normalizes safe links and strips arbitrary markup attributes", () => {
    const result = parseNoteUpdate({ content: { type: "doc", content: [{ type: "paragraph", attrs: { onclick: "bad" }, content: [{ type: "text", text: "Docs", marks: [{ type: "link", attrs: { href: "https://nextjs.org", onclick: "bad" } }] }] }] } });
    assert.equal(result.content.content[0].attrs, undefined);
    assert.equal(result.content.content[0].content[0].marks[0].attrs.rel, "noopener noreferrer");
  });
} finally { rmSync(temporary, { recursive: true, force: true }); }
