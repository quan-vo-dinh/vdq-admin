import { normalizePost, record, safeUrl } from "./adapter";
import type { FeedPost } from "./model";
export function readBookmarks(
  raw: string,
  legacyPosts: FeedPost[],
): FeedPost[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.slice(0, 200).flatMap((item): FeedPost[] => {
      if (typeof item === "string") {
        const legacy = legacyPosts.find((p) => p.id === item);
        return legacy ? [legacy] : [];
      }
      const entry = record(item);
      const summaries = Array.isArray(entry.summary) ? entry.summary : [];
      const post = normalizePost({
        ...entry,
        summary: summaries[0],
        source: { name: entry.source },
      });
      if (!post) return [];
      post.summary = [
        String(summaries[0] ?? "").slice(0, 2000),
        String(summaries[1] ?? summaries[0] ?? "").slice(0, 2000),
      ];
      const takeaways = Array.isArray(entry.takeaway) ? entry.takeaway : [];
      post.takeaway = [
        String(takeaways[0] ?? "").slice(0, 2000),
        String(takeaways[1] ?? "").slice(0, 2000),
      ];
      post.image =
        typeof entry.image === "string" &&
        /^\/images\/developer-feed\/[a-z]+\.svg$/.test(entry.image)
          ? entry.image
          : safeUrl(entry.image);
      return [post];
    });
  } catch {
    return [];
  }
}
