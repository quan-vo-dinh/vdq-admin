import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import {
  annotationRemark,
  annotationRanges,
  occurrenceRange,
  occurrenceAt,
  formatSelection,
} from "../../lib/portfolio/annotations.ts";
const note = (extra = {}) => ({
  id: "a",
  field: "summary",
  itemId: "",
  quote: "C#",
  occurrence: 1,
  title: "C#",
  body: "Language",
  image: "",
  href: "https://learn.microsoft.com/",
  appearance: "highlight",
  enabled: true,
  ...extra,
});
function render(source, notes, text = source, offset = 0) {
  return renderToStaticMarkup(
    React.createElement(
      Markdown,
      {
        skipHtml: true,
        remarkPlugins: [annotationRemark(source, notes, offset)],
      },
      text,
    ),
  );
}
test("exact case and repeated phrases bind the selected occurrence, including Unicode", () => {
  assert.deepEqual(occurrenceRange("🙂 C# và C#", "C#", 2), {
    start: 9,
    end: 11,
  });
  assert.equal(occurrenceAt("C# và C#", "C#", 6), 2);
  assert.equal(occurrenceRange("c#", "C#", 1), null);
  assert.equal(occurrenceRange("abc", "", 1), null);
  assert.equal(occurrenceRange("abc", "a", 0), null);
  const html = render("C# và C#", [note({ occurrence: 2 })]);
  assert.match(html, /C# và <mark data-portfolio-annotation="a">C#<\/mark>/);
});
test("formatting preserves independent bold and italic toggles", () => {
  assert.equal(formatSelection("C#", 0, 2, "**").text, "**C#**");
  assert.equal(formatSelection("**C#**", 2, 4, "**").text, "C#");
  assert.equal(formatSelection("**C#**", 2, 4, "*").text, "***C#***");
  assert.equal(formatSelection("***C#***", 3, 5, "**").text, "*C#*");
  assert.equal(formatSelection("***C#***", 3, 5, "*").text, "**C#**");
});
test("real Markdown renderer retains strong/emphasis and annotations through formatting", () => {
  const html = render("I use **C#** and *React*.", [
    note(),
    note({ id: "b", quote: "React" }),
  ]);
  assert.match(
    html,
    /<strong><mark data-portfolio-annotation="a">C#<\/mark><\/strong>/,
  );
  assert.match(
    html,
    /<em><mark data-portfolio-annotation="b">React<\/mark><\/em>/,
  );
  const mixed = render("I use **C#** daily.", [
    note({ quote: "use **C#** daily" }),
  ]);
  assert.match(
    mixed,
    /<strong><mark data-portfolio-annotation="a">C#<\/mark><\/strong>/,
  );
  assert.equal((mixed.match(/data-portfolio-annotation/g) ?? []).length, 3);
});
test("expanded About keeps source offsets and occurrence identity", () => {
  const source = "C# overview.\n\nMore C# details.";
  const html = render(source, [note({ occurrence: 2 })], source.slice(14), 14);
  assert.match(html, /<mark data-portfolio-annotation="a">C#<\/mark>/);
  assert.doesNotMatch(
    render(source, [note({ occurrence: 2 })], source.slice(0, 12)),
    /<mark/,
  );
});
test("code and links remain interactive without nested triggers; stale/disabled notes disappear", () => {
  assert.doesNotMatch(
    render("`C#` and [C#](https://example.com)", [
      note(),
      note({ id: "b", occurrence: 2 }),
    ]),
    /<mark/,
  );
  assert.doesNotMatch(
    render("C#", [note({ enabled: false }), note({ quote: "React" })]),
    /<mark/,
  );
  const html = render("C# and <script>alert(1)</script>", [note()]);
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /<mark/);
});
test("overlapping highlights resolve deterministically instead of nesting buttons", () => {
  const ranges = annotationRanges("ASP.NET Core", [
    note({ quote: "ASP.NET Core" }),
    note({ id: "b", quote: "ASP.NET" }),
    note({ id: "c", quote: "NET Core" }),
  ]);
  assert.equal(ranges.length, 1);
  assert.equal(ranges[0].annotation.id, "a");
});

test("entities and escaped punctuation preserve source-to-visible-text offsets", () => {
  for (const source of [
    "Frontend &amp; Backend",
    "Frontend \\* Backend",
    "&#x1F600; Backend",
    "Frontend\r\nBackend",
  ]) {
    assert.match(
      render(source, [note({ quote: "Backend" })]),
      /<mark data-portfolio-annotation="a">Backend<\/mark>/,
      source,
    );
  }
  assert.match(
    render("A &amp; B", [note({ quote: "&amp;" })]),
    /<mark data-portfolio-annotation="a">&amp;<\/mark>/,
  );
  assert.doesNotMatch(
    render("A &amp; B", [note({ quote: "amp" })]),
    /<mark/,
    "cannot annotate the middle of a character reference",
  );
});
