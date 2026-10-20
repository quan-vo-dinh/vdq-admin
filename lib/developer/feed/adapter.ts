import type { FeedPage, FeedPost, FeedSource } from "./model";
export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
const text = (v: unknown, limit = 2000) =>
  typeof v === "string" ? v.trim().slice(0, limit) : "";
const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const date = (v: unknown) =>
  typeof v === "string" && Number.isFinite(Date.parse(v))
    ? new Date(v).toISOString()
    : null;
export function normalizePost(value: unknown): FeedPost | null {
  const item = record(value);
  const id = text(item.id, 200),
    title = text(item.title, 500),
    url = safeUrl(item.url);
  if (!id || !title || !url) return null;
  const summary = text(item.summary);
  return {
    id,
    title,
    url,
    image: safeUrl(item.image),
    summary: [summary, summary],
    takeaway: ["", ""],
    source:
      text(record(item.source).name, 200) ||
      text(record(item.author).name, 200) ||
      "daily.dev",
    tags: Array.isArray(item.tags)
      ? item.tags
          .filter((v): v is string => typeof v === "string")
          .slice(0, 20)
          .map((s) => s.slice(0, 80))
      : [],
    createdAt: date(item.publishedAt) ?? date(item.createdAt),
    readTime: count(item.readTime),
    numUpvotes: count(item.numUpvotes),
    numComments: count(item.numComments),
  };
}
export function normalizePage(
  value: unknown,
  source: FeedSource,
  fetchedAt: string,
): FeedPage {
  const payload = record(value);
  if (!Array.isArray(payload.data)) throw new Error("invalid_response");
  const posts = payload.data
    .map(normalizePost)
    .filter((p): p is FeedPost => p !== null);
  if (payload.data.length && !posts.length) throw new Error("invalid_response");
  const pagination = record(payload.pagination);
  return {
    posts: Array.from(new Map(posts.map((p) => [p.id, p])).values()),
    source,
    fetchedAt,
    nextCursor:
      pagination.hasNextPage === true &&
      typeof pagination.cursor === "string" &&
      pagination.cursor.length <= 1024
        ? pagination.cursor || null
        : null,
  };
}
