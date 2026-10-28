import type { PortfolioAnnotation, Resume } from "./model.ts";
import { decodeString } from "micromark-util-decode-string";

export type AnnotationRange = {
  start: number;
  end: number;
  annotation: PortfolioAnnotation;
};
export function occurrenceRange(
  text: string,
  quote: string,
  occurrence: number,
): { start: number; end: number } | null {
  if (!quote || occurrence < 1 || !Number.isInteger(occurrence)) return null;
  let start = -1,
    cursor = 0;
  for (let i = 0; i < occurrence; i++) {
    start = text.indexOf(quote, cursor);
    if (start < 0) return null;
    cursor = start + quote.length;
  }
  return { start, end: cursor };
}
export function occurrenceAt(
  text: string,
  quote: string,
  offset: number,
): number {
  let count = 0,
    cursor = 0;
  while (quote && cursor <= offset) {
    const start = text.indexOf(quote, cursor);
    if (start < 0 || start > offset) break;
    count++;
    if (start === offset) return count;
    cursor = start + quote.length;
  }
  return 0;
}
export function annotationRanges(
  text: string,
  annotations: readonly PortfolioAnnotation[],
): AnnotationRange[] {
  const ranges = annotations
    .filter((a) => a.enabled)
    .flatMap((annotation) => {
      const range = occurrenceRange(
        text,
        annotation.quote,
        annotation.occurrence,
      );
      return range ? [{ ...range, annotation }] : [];
    })
    .sort(
      (a, b) =>
        a.start - b.start ||
        b.end - a.end ||
        a.annotation.id.localeCompare(b.annotation.id),
    );
  const selected: AnnotationRange[] = [];
  for (const range of ranges)
    if (!selected.length || range.start >= selected[selected.length - 1].end)
      selected.push(range);
  return selected;
}
export function annotationText(
  resume: Resume,
  field: PortfolioAnnotation["field"],
  itemId = "",
): string {
  if (field === "work.description")
    return resume.work.find((x) => x.id === itemId)?.description ?? "";
  if (field === "projects.description")
    return resume.projects.find((x) => x.id === itemId)?.description ?? "";
  if (field === "description" || field === "summary") return resume[field];
  return resume.copy.home[field.slice("copy.home.".length)] ?? "";
}
// Use source offsets so repeated phrases and split About previews keep their identity.
// Preserve emphasis by marking its text leaves: never nest triggers in links/code.
type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  position?: { start: { offset?: number }; end: { offset?: number } };
  data?: Record<string, unknown>;
};
const excluded = new Set([
  "link",
  "linkReference",
  "image",
  "imageReference",
  "code",
  "inlineCode",
  "html",
]);
function decodedOffsets(raw: string) {
  const offsets = new Map<number, number>([[0, 0]]);
  const token =
    /\\[!-/:-@[-`{-~]|&(?:#\d{1,7}|#[xX][\da-fA-F]{1,6}|[\da-zA-Z]{1,31});|\r\n?/y;
  let cursor = 0,
    value = "";
  while (cursor < raw.length) {
    token.lastIndex = cursor;
    const chunk = token.exec(raw)?.[0] ?? raw[cursor];
    const decoded = decodeString(chunk);
    if (decoded === chunk)
      for (let i = 1; i < chunk.length; i++)
        offsets.set(cursor + i, value.length + i);
    cursor += chunk.length;
    value += decoded;
    offsets.set(cursor, value.length);
  }
  return { offsets, value };
}
export function annotationRemark(
  source: string,
  annotations: readonly PortfolioAnnotation[],
  sourceOffset = 0,
) {
  const ranges = annotationRanges(source, annotations);
  return () => (tree: unknown) => {
    if (!ranges.length) return;
    function visit(parent: MarkdownNode) {
      if (!parent.children || excluded.has(parent.type)) return;
      parent.children = parent.children.flatMap((node) => {
        if (node.type !== "text" || typeof node.value !== "string") {
          visit(node);
          return [node];
        }
        const start = node.position?.start.offset,
          end = node.position?.end.offset;
        if (start === undefined || end === undefined) return [node];
        const matches = ranges.filter(
          (r) => r.start < end + sourceOffset && r.end > start + sourceOffset,
        );
        if (!matches.length) return [node];
        const raw = source.slice(start + sourceOffset, end + sourceOffset);
        const decoded =
          raw === node.value
            ? { value: raw, offsets: { get: (offset: number) => offset } }
            : decodedOffsets(raw);
        if (decoded.value !== node.value) return [node];
        const output: MarkdownNode[] = [];
        let cursor = 0;
        for (const match of matches) {
          const localStart = decoded.offsets.get(
              Math.max(0, match.start - start - sourceOffset),
            ),
            localEnd = decoded.offsets.get(
              Math.min(end - start, match.end - start - sourceOffset),
            );
          if (
            localStart === undefined ||
            localEnd === undefined ||
            localEnd <= localStart
          )
            continue;
          if (localStart > cursor)
            output.push({
              type: "text",
              value: node.value.slice(cursor, localStart),
            });
          output.push({
            type: "portfolioAnnotation",
            data: {
              hName: "mark",
              hProperties: { "data-portfolio-annotation": match.annotation.id },
            },
            children: [
              { type: "text", value: node.value.slice(localStart, localEnd) },
            ],
          });
          cursor = localEnd;
        }
        if (cursor < node.value.length)
          output.push({ type: "text", value: node.value.slice(cursor) });
        return output;
      });
    }
    visit(tree as MarkdownNode);
  };
}
export function formatSelection(
  text: string,
  start: number,
  end: number,
  marker: "**" | "*",
) {
  const selected = text.slice(start, end);
  // Toggle formatting without accumulating Markdown markers.
  const before = text.slice(0, start).match(/\*+$/)?.[0].length ?? 0;
  const after = text.slice(end).match(/^\*+/)?.[0].length ?? 0;
  const surrounding = Math.min(before, after);
  const active = marker === "**" ? surrounding >= 2 : surrounding % 2 === 1;
  if (active)
    return {
      text:
        text.slice(0, start - marker.length) +
        selected +
        text.slice(end + marker.length),
      start: start - marker.length,
      end: end - marker.length,
    };
  return {
    text: text.slice(0, start) + marker + selected + marker + text.slice(end),
    start: start + marker.length,
    end: end + marker.length,
  };
}
