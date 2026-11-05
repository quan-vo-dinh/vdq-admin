import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import {
  identity,
  usageCapability,
  quotaCapability,
  collect,
} from "./codex-protocol.mjs";
import { scopeKey, loadCredential } from "./credential-store.mjs";
const dir = mkdtempSync(join(tmpdir(), "codex-tests-"));
const require = createRequire(import.meta.url);
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
      dir,
      "lib/developer/codex/model.ts",
      "lib/developer/codex/analytics.ts",
    ],
    { stdio: "inherit" },
  );
  const { validateBatch, deviceState } = require(join(dir, "codex/model.js")),
    { usageRows, usageTotal, dailyTrend, dailyTimeline, quotaState } = require(
      join(dir, "codex/analytics.js"),
    );
  const now = Date.now(),
    stamp = new Date(now).toISOString(),
    id = "12345678-1234-4234-8234-123456789abc";
  const batch = () => ({
    schemaVersion: 2,
    type: "observation",
    deviceId: id,
    batchId: id,
    collectedAt: stamp,
    identityKey: "codex-v2:" + "a".repeat(64),
    identityLabel: "user@example.test",
    accountStatus: "ok",
    usageStatus: "ok",
    quotaStatus: "ok",
    daily: [{ date: stamp.slice(0, 10), tokens: 0 }],
    quotaWindows: [],
    summary: null,
    plan: "plus",
    version: "test",
  });
  test("Batch validation preserves zero and rejects malformed observations", () => {
    assert.equal(
      validateBatch({ ...batch(), prompt: "private" }, now).daily[0].tokens,
      0,
    );
    assert(
      !("prompt" in validateBatch({ ...batch(), prompt: "private" }, now)),
    );
    for (const mutate of [
      (b) => (b.daily[0].tokens = -1),
      (b) => (b.daily[0].tokens = Number.MAX_SAFE_INTEGER + 1),
      (b) => (b.daily[0].date = "2026-02-30"),
      (b) => b.daily.push({ ...b.daily[0] }),
      (b) => (b.usageStatus = "unsupported"),
      (b) => (b.identityKey = null),
      (b) => (b.collectedAt = new Date(now + 61000).toISOString()),
      (b) => (b.collectedAt = new Date(now - 32 * 86400000).toISOString()),
      (b) =>
        (b.quotaWindows = [
          {
            bucket: "x",
            kind: "primary",
            usedPercent: 101,
            windowDurationMins: 300,
            resetsAt: null,
          },
        ]),
    ]) {
      const b = batch();
      mutate(b);
      assert.throws(() => validateBatch(b, now));
    }
    assert.equal(
      validateBatch({ ...batch(), daily: [], usageStatus: "unavailable" }, now)
        .usageStatus,
      "unavailable",
    );
  });
  test("Daily totals distinguish missing days from measured zero", () => {
    const day = stamp.slice(0, 10),
      data = {
        snapshot: day,
        accountUsage: [
          { sourceId: "a", date: day, tokens: 0 },
          { sourceId: "b", date: day, tokens: 12 },
          { sourceId: "a", date: "2000-01-01", tokens: 999 },
        ],
      };
    assert.equal(usageTotal(usageRows(data, 7, "a")), 0);
    const timeline = dailyTimeline(usageRows(data, 7, "a"), 7, day);
    assert.equal(timeline.length, 7);
    assert.equal(timeline[0].tokens, null);
    assert.equal(timeline.at(-1).tokens, 0);
    assert.equal(usageTotal(usageRows(data, 7, "missing")), null);
    assert.equal(usageTotal(usageRows(data, 7)), 12);
    assert.deepEqual(dailyTrend(usageRows(data, 7)), [
      { date: day, tokens: 12 },
    ]);
  });
  test("Quota windows retain all buckets and mark stale or expired observations", () => {
    const w = { usedPercent: 25, windowDurationMins: 300, resetsAt: stamp };
    assert.deepEqual(quotaState(w, stamp, now), {
      stale: false,
      expired: true,
      remaining: 75,
    });
    assert.equal(
      quotaState(
        { ...w, resetsAt: null },
        new Date(now - 600001).toISOString(),
        now,
      ).stale,
      true,
    );
    const result = quotaCapability({
      rateLimitsByLimitId: {
        codex: {
          primary: { usedPercent: 0, windowDurationMins: 300, resetsAt: null },
          secondary: {
            usedPercent: 20,
            windowDurationMins: 10080,
            resetsAt: now / 1000 + 10,
          },
        },
        review: {
          primary: { usedPercent: 8, windowDurationMins: 60, resetsAt: null },
        },
      },
    });
    assert.equal(result.windows.length, 3);
    assert.equal(result.windows[1].windowDurationMins, 10080);
    assert.equal(quotaCapability(null).status, "unavailable");
    assert.equal(quotaCapability(null, { code: -32601 }).status, "unsupported");
  });
  test("Identity candidates separate workspaces and capability failures preserve absence", () => {
    assert.notEqual(
      identity({ type: "chatgpt", email: "a@b.test", workspaceName: "work" })
        .key,
      identity({ type: "chatgpt", email: "a@b.test" }).key,
    );
    assert.equal(identity({ type: "apiKey" }), null);
    assert.equal(
      usageCapability({ dailyUsageBuckets: null }).status,
      "unavailable",
    );
    assert.equal(usageCapability({ dailyUsageBuckets: [] }).status, "ok");
    assert.equal(usageCapability(null, { code: -32601 }).status, "unsupported");
    assert.equal(usageCapability(null, { code: 500 }).status, "error");
  });
  test("Device lifecycle prioritizes revocation pause and confirmation", () => {
    const d = {
      revoked_at: null,
      paused: false,
      pending_identity: null,
      last_error: null,
      heartbeat_at: stamp,
    };
    assert.equal(deviceState(d, false, now), "online");
    assert.equal(deviceState({ ...d, heartbeat_at: null }), "waiting");
    assert.equal(
      deviceState(
        { ...d, heartbeat_at: new Date(now - 600001).toISOString() },
        false,
        now,
      ),
      "offline",
    );
    assert.equal(
      deviceState({ ...d, pending_identity: "new" }),
      "confirmation_required",
    );
    assert.equal(
      deviceState({ ...d, paused: true, pending_identity: "new" }),
      "paused",
    );
    assert.equal(
      deviceState({ ...d, revoked_at: stamp, paused: true }),
      "revoked",
    );
  });
  test("Credential migration verifies Keychain before removing file token", async () => {
    const legacy = join(dir, "legacy.json"),
      file = join(dir, "scoped.json"),
      origin = "http://localhost:3000",
      scope = scopeKey(origin, "personal"),
      token = "x".repeat(43);
    writeFileSync(legacy, JSON.stringify({ id, origin, token }));
    let stored;
    await loadCredential(file, scope, {
      legacyFile: legacy,
      origin,
      store: (_, v) => (v === undefined ? stored : (stored = v)),
    });
    assert.equal(JSON.parse(readFileSync(file)).token, undefined);
    assert.equal(JSON.parse(readFileSync(legacy)).token, undefined);
    assert.equal(stored, token);
    assert.notEqual(scopeKey("https://vodinhquan.work", "personal"), scope);
    writeFileSync(legacy, JSON.stringify({ id, origin, token }));
    await assert.rejects(
      () =>
        loadCredential(join(dir, "failed.json"), scope, {
          legacyFile: legacy,
          origin,
          store: () => null,
        }),
      /verification/,
    );
    assert.equal(JSON.parse(readFileSync(legacy)).token, token);
    await assert.rejects(
      () =>
        loadCredential(file, scope, {
          origin: "https://vodinhquan.work",
          store: () => stored,
        }),
      /different dashboard/,
    );
  });
  test("Protocol collection rejects a crashed app server promptly", async () => {
    const before = Date.now();
    await assert.rejects(
      () => collect(id, { binary: "/usr/bin/false" }),
      /unavailable/,
    );
    assert(Date.now() - before < 2000);
  });
} finally {
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
}
