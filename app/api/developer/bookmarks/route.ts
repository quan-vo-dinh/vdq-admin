import { withOwner } from "@/lib/auth/api";
import { documents, putDocument } from "@/lib/developer/live/store";
import { readBookmarks } from "@/lib/developer/feed/bookmarks";
import { input } from "@/lib/backend/mutations";
import { AccessError } from "@/lib/auth/policy";
export const GET = withOwner(async () =>
  Response.json(
    (await documents<{ posts: unknown[] }>("bookmarks")).find(
      (d) => d.id === "feed",
    )?.value.posts ?? [],
  ),
);
export const PUT = withOwner(async (request) => {
  const body = await input(request);
  if (!Array.isArray(body.posts) || body.posts.length > 200)
    throw new AccessError(400, "invalid_bookmarks");
  const posts = readBookmarks(JSON.stringify(body.posts), []);
  if (posts.length !== body.posts.length)
    throw new AccessError(400, "invalid_bookmarks");
  await putDocument("bookmarks", "feed", { posts });
  return Response.json(posts);
});
