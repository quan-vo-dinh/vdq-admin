import type { JSONContent } from "@tiptap/react";
import type { NoteUpdate } from "@/app/(dashboard-layout)/types/apps/notes";

export const noteColors = ["primary", "chart-4", "destructive", "chart-2", "chart-3"] as const;
export const plainDocument = (text = ""): JSONContent => ({
  type: "doc", content: text.split("\n").map(line => ({ type: "paragraph", ...(line ? { content: [{ type: "text", text: line }] } : {}) })),
});
export function noteText(content?: JSONContent): string {
  if (!content) return "";
  if (content.type === "text") return content.text ?? "";
  return (content.content ?? []).map(noteText).join(["doc", "bulletList", "orderedList"].includes(content.type ?? "") ? "\n" : " ");
}
// Notes use Vietnam time consistently for editing, grouping, and date filters.
export function noteDateTime(iso?: string): string {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "";
  return new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 16);
}
export const noteDay = (iso?: string) => noteDateTime(iso).slice(0, 10);
export function noteTimestamp(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error("Ngày giờ không hợp lệ / Invalid date and time");
  const value = new Date(`${local}:00+07:00`);
  if (!Number.isFinite(value.getTime()) || noteDateTime(value.toISOString()) !== local) throw new Error("Ngày giờ không hợp lệ / Invalid date and time");
  return value.toISOString();
}
export function safeNoteLink(value: string) {
  try { return ["https:", "http:", "mailto:"].includes(new URL(value).protocol); } catch { return false; }
}
const nodes = new Set(["doc", "paragraph", "text", "heading", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "hardBreak", "horizontalRule"]);
function cleanDocument(value: unknown, depth = 0): JSONContent {
  if (depth > 30 || !value || typeof value !== "object") throw new Error("Invalid note content");
  const node = value as Record<string, unknown>;
  if (typeof node.type !== "string" || !nodes.has(node.type)) throw new Error("Unsupported note format");
  const result: JSONContent = { type: node.type };
  if (node.type === "text") {
    if (typeof node.text !== "string" || !node.text.length) throw new Error("Invalid note text");
    result.text = node.text;
  }
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) throw new Error("Invalid note content");
    result.content = node.content.map(child => cleanDocument(child, depth + 1));
  }
  const blockNodes = ["paragraph", "heading", "bulletList", "orderedList", "blockquote", "codeBlock", "horizontalRule"];
  const allowedChildren = node.type === "doc" || node.type === "blockquote" || node.type === "listItem" ? blockNodes
    : node.type === "bulletList" || node.type === "orderedList" ? ["listItem"]
    : node.type === "paragraph" || node.type === "heading" ? ["text", "hardBreak"]
    : node.type === "codeBlock" ? ["text"] : [];
  if (result.content?.some(child => !allowedChildren.includes(child.type ?? ""))) throw new Error("Invalid document structure");
  if (node.type === "doc" && !result.content?.length) result.content = [{ type: "paragraph" }];
  if (["bulletList", "orderedList", "listItem", "blockquote"].includes(node.type) && !result.content?.length) throw new Error("Empty document block");
  if (node.type === "listItem" && result.content?.[0]?.type !== "paragraph") throw new Error("List items must begin with a paragraph");
  const attrs = node.attrs && typeof node.attrs === "object" ? node.attrs as Record<string, unknown> : {};
  if (node.type === "heading") result.attrs = { level: [1, 2, 3].includes(Number(attrs.level)) ? Number(attrs.level) : 2 };
  if (node.type === "orderedList") result.attrs = { start: Number.isInteger(attrs.start) && Number(attrs.start) > 0 ? attrs.start : 1 };
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) throw new Error("Invalid note formatting");
    result.marks = node.marks.map((mark: unknown) => {
      if (!mark || typeof mark !== "object") throw new Error("Invalid note formatting");
      const m = mark as { type?: string; attrs?: { href?: string } };
      if (m.type === "link" && typeof m.attrs?.href === "string" && safeNoteLink(m.attrs.href)) return { type: "link", attrs: { href: m.attrs.href, target: "_blank", rel: "noopener noreferrer" } };
      if (m.type && ["bold", "italic", "underline", "strike", "code"].includes(m.type)) return { type: m.type };
      throw new Error("Unsupported note formatting or link");
    });
  }
  return result;
}
export function parseNoteUpdate(body: unknown): NoteUpdate {
  if (!body || typeof body !== "object") throw new Error("Invalid note");
  const input = body as Record<string, unknown>;
  const update: NoteUpdate = {};
  if (input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 200) throw new Error("Title must contain 1–200 characters");
    update.title = input.title.trim();
  }
  if (input.color !== undefined) {
    if (!noteColors.includes(input.color as typeof noteColors[number])) throw new Error("Invalid note color");
    update.color = input.color as string;
  }
  if (input.datef !== undefined) {
    if (typeof input.datef !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(input.datef) || !Number.isFinite(Date.parse(input.datef))) throw new Error("Invalid note date");
    noteTimestamp(input.datef.slice(0, 16));
    update.datef = new Date(input.datef).toISOString();
  }
  if (input.content !== undefined) {
    if (JSON.stringify(input.content).length > 200_000) throw new Error("Note is too long");
    update.content = cleanDocument(input.content);
    if (update.content.type !== "doc") throw new Error("Invalid document");
  }
  return update;
}
