export type FeedPost = {
  id: string;
  title: string;
  summary: [string, string];
  takeaway: [string, string];
  source: string;
  url: string;
  tags: string[];
  image: string | null;
  readTime: number | null;
  numUpvotes: number | null;
  numComments: number | null;
  createdAt: string | null;
};
export type FeedOrder = "curated" | "discussed" | "newest";
export function selectPosts(
  posts: FeedPost[],
  query: string,
  topic: string,
  order: FeedOrder,
  savedOnly: boolean,
  saved: readonly string[],
) {
  const search = query.trim().toLocaleLowerCase();
  const filtered = posts.filter(
    (post) =>
      (!savedOnly || saved.includes(post.id)) &&
      (topic === "all" || post.tags.includes(topic)) &&
      (!search ||
        [post.title, ...post.summary, post.source, ...post.tags]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search)),
  );
  if (order === "discussed")
    filtered.sort((a, b) => (b.numComments ?? -1) - (a.numComments ?? -1));
  if (order === "newest")
    filtered.sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
  return filtered;
}

export type FeedSource = "foryou" | "popular" | "discussed";
export type FeedPage = {
  posts: FeedPost[];
  fetchedAt: string;
  source: FeedSource;
  nextCursor: string | null;
};
export const FEED_ERRORS = [
  "not_configured",
  "deployment_disabled",
  "unauthorized",
  "rate_limited",
  "unavailable",
  "invalid_response",
  "invalid_request",
] as const;
export type FeedErrorCode = (typeof FEED_ERRORS)[number];
