import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { test } from "node:test";
// This suite is deliberately local-only and owns every fixture it removes.
for (const file of [".env.local", ".env.development.local"]) {
  try {
    process.loadEnvFile(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert(
  ["localhost", "127.0.0.1"].includes(new URL(url).hostname),
  "Local database required",
);
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }),
  owner = process.env.APP_OWNER_USER_ID;
const origin = "http://localhost:3000",
  accountId = randomUUID(),
  code = randomUUID().replaceAll("-", ""),
  hash = (v) => createHash("sha256").update(v).digest("hex");
let deviceId, token;
async function post(path, body, bearer) {
  const response = await fetch(origin + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: "Bearer " + bearer } : {}),
    },
    body: JSON.stringify(body),
  });
  return { response, body: await response.json() };
}
const { error } = await db
  .from("codex_accounts")
  .insert({
    id: accountId,
    owner_id: owner,
    name: "Disposable Codex API fixture",
  });
assert.ifError(error);
try {
  await test("Codex HTTP pairing auth validation and revocation", async () => {
    const denied = await fetch(origin + "/api/developer/codex");
    assert.equal(denied.status, 401);
    assert.match(denied.headers.get("cache-control"), /no-store/);
    const forbidden = await post("/api/developer/codex", {
      action: "create_account",
      name: "Denied",
    });
    assert([401, 403].includes(forbidden.response.status));
    const pairing = await db
      .from("codex_pairings")
      .insert({
        code_hash: hash(code),
        owner_id: owner,
        account_id: accountId,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      });
    assert.ifError(pairing.error);
    const paired = await post("/api/developer/companion", {
      schemaVersion: 2,
      type: "pair",
      code,
      profile: "test",
      name: "Disposable Mac",
    });
    assert.equal(paired.response.status, 200);
    deviceId = paired.body.id;
    token = paired.body.token;
    assert.equal(paired.body.accountId, accountId);
    assert.match(token, /^[\w-]{43}$/);
    assert(!JSON.stringify(paired.body).includes("token_hash"));
    const reused = await post("/api/developer/companion", {
      schemaVersion: 2,
      type: "pair",
      code,
      profile: "test",
      name: "Disposable Mac",
    });
    assert.equal(reused.response.status, 401);
    const invalid = await post(
      "/api/developer/companion",
      {
        schemaVersion: 2,
        type: "observation",
        deviceId,
        batchId: randomUUID(),
      },
      token,
    );
    assert.equal(invalid.response.status, 400);
    const heartbeat = {
      schemaVersion: 2,
      type: "heartbeat",
      deviceId,
      version: "test",
    };
    assert.equal(
      (await post("/api/developer/companion", heartbeat)).response.status,
      401,
    );
    assert.equal(
      (await post("/api/developer/companion", heartbeat, "z".repeat(43)))
        .response.status,
      401,
    );
    const live = await post("/api/developer/companion", heartbeat, token);
    assert.equal(live.response.status, 200);
    assert.equal(live.body.accountId, accountId);
    const throttled = await post("/api/developer/companion", heartbeat, token);
    assert.equal(throttled.body.retryAfter, 5);
    const revoked = await db
      .from("codex_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", deviceId);
    assert.ifError(revoked.error);
    assert.equal(
      (await post("/api/developer/companion", heartbeat, token)).response
        .status,
      401,
    );
  });
} finally {
  if (deviceId)
    assert.ifError(
      (await db.from("codex_devices").delete().eq("id", deviceId)).error,
    );
  assert.ifError(
    (await db.from("codex_pairings").delete().eq("account_id", accountId))
      .error,
  );
  assert.ifError(
    (await db.from("codex_accounts").delete().eq("id", accountId)).error,
  );
}
