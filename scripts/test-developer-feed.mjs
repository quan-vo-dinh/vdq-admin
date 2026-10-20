import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const temporary = mkdtempSync(join(tmpdir(), "developer-feed-"));
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
      "lib/developer/feed/model.ts",
      "lib/developer/feed/demo.ts",
      "lib/developer/feed/adapter.ts",
      "lib/developer/feed/service.ts",
      "lib/developer/feed/bookmarks.ts",
    ],
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url);
  const { feedPosts } = require(join(temporary, "demo.js"));
  const { selectPosts } = require(join(temporary, "model.js"));
  const ids = feedPosts.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(
    selectPosts(feedPosts, "   rEaCt   ", "all", "curated", false, []).map(
      (p) => p.id,
    ),
    ["react", "next"],
  );
  assert.deepEqual(
    selectPosts(feedPosts, "", "Architecture", "discussed", true, [
      "nx",
      "agents",
      "redis",
    ]).map((p) => p.id),
    ["agents", "nx"],
  );
  assert.equal(
    selectPosts(feedPosts, "nonexistent phrase", "all", "curated", false, [])
      .length,
    0,
  );
  assert.equal(
    selectPosts(feedPosts, "", "all", "curated", true, []).length,
    0,
  );
  const ranked = selectPosts(feedPosts, "", "all", "discussed", false, []);
  assert(
    ranked.every(
      (p, i) => i === 0 || ranked[i - 1].numComments >= p.numComments,
    ),
  );
  const recent = selectPosts(
    [...feedPosts].reverse(),
    "",
    "all",
    "newest",
    false,
    [],
  );
  assert(
    recent.every((p, i) => i === 0 || recent[i - 1].createdAt >= p.createdAt),
  );
  assert.deepEqual(
    feedPosts.map((p) => p.id),
    ids,
    "Sorting must not mutate source data",
  );
  assert(
    feedPosts.some((p) => p.image === null),
    "Missing-cover fixture required",
  );
  for (const post of feedPosts) {
    assert.equal(new URL(post.url).protocol, "https:");
    if (post.image) assert(existsSync(`public${post.image}`));
  }

  const { normalizePost, normalizePage } = require(
    join(temporary, "adapter.js"),
  );
  const { createFeedService, FEED_CACHE_MS } = require(
    join(temporary, "service.js"),
  );
  const { readBookmarks } = require(join(temporary, "bookmarks.js"));
  const wire = {
    id: "real-post",
    title: "Real API title",
    url: "https://example.org/article",
    image: "https://media.daily.dev/test.webp",
    summary: null,
    source: { name: "Publisher" },
    tags: ["react"],
    createdAt: "2026-10-20T00:00:00Z",
    numUpvotes: 0,
    numComments: 2,
    readTime: null,
  };
  const payload = {
    data: [wire],
    pagination: { hasNextPage: true, cursor: "page+2/=" },
  };
  assert.equal(normalizePost(wire).numUpvotes, 0);
  assert.equal(
    normalizePost({ ...wire, numUpvotes: undefined }).numUpvotes,
    null,
  );
  assert.equal(normalizePost(wire).readTime, null);
  assert.equal(normalizePost({ ...wire, url: "javascript:alert(1)" }), null);
  assert.equal(
    normalizePost({ ...wire, image: "javascript:alert(1)" }).image,
    null,
  );
  assert.equal(
    normalizePost({ ...wire, url: "https://user:secret@example.org" }),
    null,
  );
  assert.equal(
    normalizePost({ ...wire, createdAt: "invalid" }).createdAt,
    null,
  );
  assert.throws(() => normalizePage({}, "foryou", "today"), /invalid_response/);
  assert.equal(
    normalizePage(payload, "foryou", "today").nextCursor,
    "page+2/=",
  );
  const realPost = normalizePost(wire);
  assert.equal(
    readBookmarks(JSON.stringify([realPost]), []).length,
    1,
    "Saved posts survive disappearing from feed",
  );
  assert.equal(
    readBookmarks(JSON.stringify(["react"]), feedPosts)[0].id,
    "react",
    "v1 bookmark migration",
  );
  assert.deepEqual(readBookmarks("{bad", []), []);
  assert.deepEqual(
    readBookmarks(JSON.stringify([{ ...realPost, url: "javascript:bad" }]), []),
    [],
  );
  let calls = 0,
    clock = 0;
  const service = createFeedService({
    token: () => "test-only-token",
    now: () => clock,
    fetcher: async (url, options) => {
      calls++;
      assert.equal(new URL(url).origin, "https://api.daily.dev");
      assert.equal(options.headers.Authorization, "Bearer test-only-token");
      assert.equal(options.redirect, "error");
      if (new URL(url).pathname.endsWith("discussed"))
        assert.equal(new URL(url).searchParams.get("period"), "7");
      return Response.json(payload);
    },
  });
  await Promise.all([service("foryou"), service("foryou")]);
  assert.equal(calls, 1, "Coalesce concurrent upstream requests");
  await service("foryou");
  assert.equal(calls, 1, "Serve cached pages");
  await service("discussed");
  assert.equal(calls, 2);
  await service("foryou", "page+2/=");
  assert.equal(calls, 3, "Cursor pages isolated");
  clock += FEED_CACHE_MS + 1;
  await service("foryou");
  assert.equal(calls, 4, "Refresh expired cache");
  await assert.rejects(
    createFeedService({ token: () => undefined })("foryou"),
    (e) => e.code === "not_configured",
  );
  for (const [status, code] of [
    [401, "unauthorized"],
    [403, "unauthorized"],
    [429, "rate_limited"],
    [500, "unavailable"],
  ]) {
    let failedCalls = 0;
    const failing = createFeedService({
      token: () => "test",
      fetcher: async () => {
        failedCalls++;
        return new Response("private error: never forward me", {
          status,
          headers: { "Retry-After": "120" },
        });
      },
    });
    await assert.rejects(
      failing("foryou"),
      (e) => e.code === code && !e.message.includes("private error"),
    );
    await assert.rejects(failing("popular"));
    assert.equal(
      failedCalls,
      1,
      "Back off across sources after an upstream error",
    );
  }
  await assert.rejects(
    createFeedService({
      token: () => "test",
      fetcher: async () => Response.json({ wrong: [] }),
    })("foryou"),
    (e) => e.code === "invalid_response",
  );
  console.log(
    "daily.dev integration: normalization, nullable fields, URL safety, cursor contract, cache expiry, request deduplication, credential handling, backoff/error states and bookmark migration passed.",
  );
  console.log(
    "Developer Feed: search, combined filters, bookmarks filtering, empty results, sorting, source immutability, fixture links/covers passed.",
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
