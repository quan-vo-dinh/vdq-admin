import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  annotationSchema,
  parseDocument,
  mediaIds,
} from "../../lib/portfolio/model.ts";
import { fingerprint, mirrorResume } from "../../lib/portfolio/editor-state.ts";
const fixture = () =>
  JSON.parse(readFileSync("lib/portfolio/initial-content.json", "utf8"));
const annotation = () => ({
  id: "note-1",
  field: "summary",
  itemId: "",
  quote: "Frontend",
  occurrence: 1,
  title: "Context",
  body: "Plain text description",
  image: "",
  href: "https://example.com",
  appearance: "highlight",
  enabled: true,
});
test("old snapshots parse without annotations injection or changed fingerprints", () => {
  const doc = fixture(),
    before = fingerprint(doc);
  const parsed = parseDocument(doc);
  assert.equal("annotations" in parsed.locales.vi, false);
  assert.equal(fingerprint(parsed), before);
});
test("localized annotations are independent and never mirrored with resume changes", () => {
  const doc = fixture();
  doc.locales.vi.annotations = [annotation()];
  doc.locales.en.annotations = [
    { ...annotation(), id: "english-only", quote: "engineering" },
  ];
  const parsed = parseDocument(doc);
  const resume = structuredClone(parsed.locales.vi);
  resume.annotations[0].title = "Vietnamese title";
  const next = mirrorResume(parsed, "vi", resume);
  assert.equal(next.locales.vi.annotations[0].title, "Vietnamese title");
  assert.deepEqual(next.locales.en.annotations, doc.locales.en.annotations);
});
test("stale quote and deleted item references remain saveable", () => {
  const doc = fixture();
  doc.locales.vi.annotations = [
    {
      ...annotation(),
      field: "work.description",
      itemId: "deleted-item",
      quote: "This quote is no longer present",
    },
  ];
  assert.doesNotThrow(() => parseDocument(doc));
});
test("strict bounds, field/item shape, icon/HTML config and unsafe assets/URLs rejected", () => {
  for (const change of [
    (a) => (a.quote = ""),
    (a) => (a.quote = "a".repeat(501)),
    (a) => (a.title = "a".repeat(161)),
    (a) => (a.title = "😀".repeat(81)),
    (a) => (a.body = "a".repeat(2001)),
    (a) => (a.occurrence = 0),
    (a) => (a.occurrence = 1001),
    (a) => (a.occurrence = 1.5),
    (a) => (a.field = "name"),
    (a) => (a.itemId = "unexpected-item"),
    (a) => {
      a.field = "projects.description";
      a.itemId = "";
    },
    (a) => (a.image = "https://evil.test/avatar.png"),
    (a) => (a.image = "<svg/>"),
    (a) => (a.href = "javascript:alert(1)"),
    (a) => (a.href = "https://user:pass@evil.test"),
    (a) => (a.appearance = "custom"),
    (a) => (a.enabled = "true"),
    (a) => (a.html = "<b>injected</b>"),
    (a) => (a.body = "bad\u0001text"),
  ]) {
    const a = annotation();
    change(a);
    assert.equal(
      annotationSchema.safeParse(a).success,
      false,
      JSON.stringify(a),
    );
  }
});
test("annotation IDs unique per locale, max100, media references discoverable without other image use", () => {
  const doc = fixture();
  doc.locales.vi.annotations = [
    { ...annotation(), image: "media:80000000-0000-4000-8000-000000000001" },
  ];
  assert.deepEqual(mediaIds(parseDocument(doc)), [
    "80000000-0000-4000-8000-000000000001",
  ]);
  doc.locales.vi.annotations.push(annotation());
  assert.throws(() => parseDocument(doc));
  doc.locales.vi.annotations = Array.from({ length: 101 }, (_, i) => ({
    ...annotation(),
    id: "annotation-" + i,
  }));
  assert.throws(() => parseDocument(doc));
});
test("additive SQL JSON schema matches the current runtime model exactly", async () => {
  const { z } = await import("zod");
  const { documentSchema } = await import("../../lib/portfolio/model.ts");
  const migration = readFileSync(
    "supabase/migrations/20261030000200_portfolio_more_icons.sql",
    "utf8",
  );
  const schema = migration.match(/ schema='(.*)'::json;/)?.[1];
  assert.ok(schema);
  assert.deepEqual(
    JSON.parse(schema.replaceAll("''", "'")),
    z.toJSONSchema(documentSchema, { unrepresentable: "any" }),
  );
  assert.match(
    migration,
    /create or replace function private\.validate_portfolio/,
  );
  assert.doesNotMatch(
    migration,
    /\b(insert into|update public|delete from|grant )/i,
    "migration does not mutate content or add privileges",
  );
});
