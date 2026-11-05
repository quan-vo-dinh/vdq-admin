import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
const dir = mkdtempSync(join(tmpdir(), "developer-live-"));
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
      "--types",
      "node",
      "--outDir",
      dir,
      "lib/developer/live/crypto.ts",
      "lib/developer/live/progress.ts",
      "lib/developer/live/github.ts",
      "lib/developer/model.ts",
    ],
    { stdio: "inherit" },
  );
  const require = createRequire(import.meta.url),
    { encrypt, decrypt } = require(join(dir, "live/crypto.js")),
    { github } = require(join(dir, "live/github.js")),
    model = require(join(dir, "model.js"));
  const { progressSnapshot } = require(join(dir, "live/progress.js"));
  test("incomplete first synchronization exposes collected activity and inbox without inventing pending commit stats", () => {
    const event = {
      id: "commit-one",
      sourceId: "work",
      actor: "user",
      repo: "org/repo",
      date: "2026-11-05",
      time: "09:00",
      title: "fix",
      url: "https://github.com/org/repo/commit/abc",
      kind: "commit",
      sha: "abc",
      branch: "main",
    };
    const result = progressSnapshot(
      { id: "work" },
      {
        activities: [event],
        notifications: [{ id: "work:1", read: false }],
        coverage: [],
      },
    );
    assert.equal(result.activities.length, 1);
    assert.equal(result.data.notifications.length, 1);
    assert.equal(result.data.contributions[0].commits, 1);
    assert.equal(result.data.contributions[0].additions, 0);
    const empty = progressSnapshot(
      { id: "work" },
      { activities: [], notifications: [], coverage: [] },
    );
    assert.deepEqual(empty.data.contributions, []);
  });
  test("credential encryption authenticates ciphertext and requires a server key", () => {
    process.env.DEVELOPER_ENCRYPTION_KEY = "17".repeat(32);
    const encrypted = encrypt("secret-token");
    assert.equal(decrypt(encrypted), "secret-token");
    assert.ok(!encrypted.includes("secret-token"));
    assert.notEqual(encrypt("secret-token"), encrypted);
    const parts = encrypted.split(".");
    const tag = Buffer.from(parts[2], "base64");
    tag[0] ^= 1;
    parts[2] = tag.toString("base64");
    assert.throws(() => decrypt(parts.join(".")));
    delete process.env.DEVELOPER_ENCRYPTION_KEY;
    assert.throws(() => encrypt("secret-token"), /encryption_not_configured/);
  });
  test("GitHub adapter rejects external paths and hides upstream credential errors", async () => {
    await assert.rejects(
      () => github("secret", "//evil.example"),
      /invalid_upstream_path/,
    );
    const previous = global.fetch;
    global.fetch = async () =>
      new Response("secret-provider-body", { status: 401 });
    try {
      await assert.rejects(
        () => github("secret", "/user"),
        (error) =>
          error.code === "credential_expired" &&
          !error.message.includes("secret"),
      );
    } finally {
      global.fetch = previous;
    }
  });
  test("GitHub adapter classifies exhausted rate limits", async () => {
    const previous = global.fetch;
    global.fetch = async () =>
      new Response("", {
        status: 403,
        headers: { "x-ratelimit-remaining": "0", "retry-after": "120" },
      });
    try {
      await assert.rejects(
        () => github("secret", "/user"),
        (error) => error.code === "rate_limited" && error.retryAfter === 120,
      );
    } finally {
      global.fetch = previous;
    }
  });
  test("runtime reports use actual dates and account counts", () => {
    const data = {
      snapshot: "2026-11-05",
      sources: [],
      sessions: [],
      contributions: [],
      notifications: [],
    };
    assert.match(model.reportText(data, 7, "en"), /2026-10-30 → 2026-11-05/);
    assert.match(model.reportText(data, 7, "en"), /0 GitHub accounts/);
    const row = {
      id: "s",
      date: "2026-11-05",
      sourceId: "codex-one",
      model: "m",
      input: 5,
      output: 3,
      cache: 2,
      generationSeconds: null,
    };
    data.sessions = [row];
    assert.equal(model.selectSessions(data, 1).length, 1);
    data.accountUsage = [
      { sourceId: "codex-one", date: "2026-11-05", tokens: 50 },
    ];
    assert.equal(model.accountTokens(data, 1), 50);
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
