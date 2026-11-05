import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import { backendEnvironment, serverSupabase } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/auth/owner";
import { AccessError } from "@/lib/auth/policy";
import { dbError, input } from "@/lib/backend/mutations";
import type { Database, Json } from "@/types/database";
import { validateBatch, isUuid, deviceState } from "./model";
export const digest = (v: string) =>
  createHash("sha256").update(v).digest("hex");
function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new AccessError(503, "companion_not_configured");
  return createClient<Database>(backendEnvironment().url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
function name(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > 80)
    throw new AccessError(400, "invalid_name");
  return value.trim();
}
function id(value: unknown) {
  if (!isUuid(value)) throw new AccessError(400, "invalid_id");
  return value;
}
// Bounded per-process throttle for invalid pairing/token attempts before admin queries.
const attempts = new Map<string, { until: number; count: number }>();
function throttle(request: Request) {
  const key = digest(
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local",
  );
  const now = Date.now();
  if (attempts.size > 2000) {
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    if (attempts.size > 2000) throw new AccessError(429, "rate_limited");
  }
  const entry = attempts.get(key);
  if (entry && entry.until > now) {
    if (++entry.count > 120) throw new AccessError(429, "rate_limited");
  } else attempts.set(key, { until: now + 60000, count: 1 });
}
export async function codexManagement(request: Request) {
  const { supabase: db, user } = await requireOwner();
  if (request.method === "GET") {
    const [a, d] = await Promise.all([
      db.from("codex_accounts").select("*").order("created_at"),
      db
        .from("codex_devices")
        .select(
          "id,account_id,name,profile,version,paused,revoked_at,heartbeat_at,observed_at,last_error,sync_requested_at,pending_identity,pending_label",
        ),
    ]);
    dbError(a.error);
    dbError(d.error);
    return Response.json({
      accounts: a.data ?? [],
      devices: (d.data ?? []).map((device) => ({
        ...device,
        state: deviceState(
          device,
          a.data?.find((account) => account.id === device.account_id)?.paused,
        ),
      })),
    });
  }
  const body = await input(request),
    service = admin();
  if (body.action === "create_account") {
    const { data, error } = await db
      .from("codex_accounts")
      .insert({
        name: name(body.name),
        account_group: body.group === "work" ? "work" : "personal",
      })
      .select("id")
      .single();
    dbError(error);
    return Response.json(data);
  }
  if (body.action === "update_account") {
    const values: { name?: string; account_group?: string; paused?: boolean } =
      {};
    if (body.name !== undefined) values.name = name(body.name);
    if (body.group !== undefined) {
      if (!["personal", "work"].includes(String(body.group)))
        throw new AccessError(400, "invalid_group");
      values.account_group = String(body.group);
    }
    if (typeof body.paused === "boolean") values.paused = body.paused;
    const { error } = await db
      .from("codex_accounts")
      .update(values)
      .eq("id", id(body.id));
    dbError(error);
    return Response.json({ ok: true });
  }
  if (body.action === "pair") {
    const accountId = id(body.accountId);
    const { data: a, error: e } = await db
      .from("codex_accounts")
      .select("id,paused")
      .eq("id", accountId)
      .single();
    dbError(e);
    if (!a || a.paused) throw new AccessError(409, "account_paused");
    await service
      .from("codex_pairings")
      .delete()
      .eq("owner_id", user.id)
      .lt("expires_at", new Date().toISOString());
    const { count, error } = await service
      .from("codex_pairings")
      .select("code_hash", { count: "exact", head: true })
      .eq("owner_id", user.id);
    dbError(error);
    if ((count ?? 0) >= 10) throw new AccessError(429, "too_many_pairings");
    const code = randomBytes(24).toString("base64url"),
      expiresAt = new Date(Date.now() + 600000).toISOString();
    const saved = await service
      .from("codex_pairings")
      .insert({
        owner_id: user.id,
        account_id: accountId,
        code_hash: digest(code),
        expires_at: expiresAt,
      });
    dbError(saved.error);
    return Response.json({ code, expiresAt });
  }
  if (body.action === "cancel_pairing") {
    if (typeof body.code !== "string" || body.code.length > 100)
      throw new AccessError(400, "invalid_code");
    const { error } = await service
      .from("codex_pairings")
      .delete()
      .eq("owner_id", user.id)
      .eq("code_hash", digest(body.code));
    dbError(error);
    return Response.json({ ok: true });
  }
  if (body.action === "delete_history") {
    if (body.confirm !== true)
      throw new AccessError(400, "confirmation_required");
    const { data, error } = await service.rpc("codex_delete_history", {
      p_owner: user.id,
      p_account: id(body.accountId),
    });
    if (error?.code === "P0001") throw new AccessError(409, error.message);
    dbError(error);
    return Response.json(data);
  }
  const deviceId = id(body.id);
  const { data: device, error: deviceError } = await db
    .from("codex_devices")
    .select("id,account_id,pending_identity,pending_label,revoked_at")
    .eq("id", deviceId)
    .single();
  dbError(deviceError);
  if (!device) throw new AccessError(404, "device_missing");
  if (body.action === "confirm_identity") {
    if (!device.pending_identity || body.identity !== device.pending_identity)
      throw new AccessError(409, "identity_changed");
    const { data, error } = await service.rpc("codex_confirm_identity", {
      p_owner: user.id,
      p_device: deviceId,
      p_identity: body.identity,
      p_target: body.targetAccountId ? id(body.targetAccountId) : undefined,
      p_new_name: body.newAccount === true ? name(body.name) : undefined,
      p_group: body.group === "work" ? "work" : "personal",
    });
    if (error?.code === "P0001") throw new AccessError(409, error.message);
    dbError(error);
    return Response.json(data);
  }
  const update: {
    name?: string;
    paused?: boolean;
    revoked_at?: string;
    sync_requested_at?: string;
  } = {};
  if (body.action === "rename_device") update.name = name(body.name);
  else if (body.action === "pause_device" && typeof body.paused === "boolean")
    update.paused = body.paused;
  else if (body.action === "revoke")
    update.revoked_at = new Date().toISOString();
  else if (body.action === "sync")
    update.sync_requested_at = new Date().toISOString();
  else throw new AccessError(400, "invalid_action");
  const { error } = await db
    .from("codex_devices")
    .update(update)
    .eq("id", deviceId);
  dbError(error);
  return Response.json({ ok: true });
}
export async function ingest(request: Request) {
  throttle(request);
  const body = await input(request);
  if (body.type === "pair") {
    if (
      body.schemaVersion !== 2 ||
      typeof body.code !== "string" ||
      !/^[\w-]{24,100}$/.test(body.code) ||
      typeof body.profile !== "string" ||
      !/^[\w-]{1,60}$/.test(body.profile)
    )
      throw new AccessError(400, "invalid_pairing");
    const token = randomBytes(32).toString("base64url");
    const { data, error } = await admin().rpc("codex_pair_device", {
      p_hash: digest(body.code),
      p_name: name(body.name),
      p_token_hash: digest(token),
      p_profile: body.profile,
    });
    if (error) {
      if (error.code === "P0001") throw new AccessError(401, "pairing_expired");
      dbError(error);
    }
    return Response.json({ ...(data as Record<string, Json>), token });
  }
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([A-Za-z0-9_-]{40,100})$/)?.[1];
  if (!token) throw new AccessError(401, "device_required");
  let batch: Record<string, unknown>;
  if (
    body.schemaVersion === 2 &&
    body.type === "heartbeat" &&
    isUuid(body.deviceId) &&
    typeof body.version === "string" &&
    body.version.length <= 80
  )
    batch = { type: "heartbeat", version: body.version };
  else {
    try {
      batch = validateBatch(body) as unknown as Record<string, unknown>;
    } catch (error) {
      throw new AccessError(
        400,
        error instanceof Error ? error.message : "invalid_batch",
      );
    }
  }
  const { data, error } = await admin().rpc("codex_ingest", {
    p_device: id(body.deviceId),
    p_token_hash: digest(token),
    p_batch: batch as Json,
  });
  if (error) {
    if (error.code === "P0001") throw new AccessError(401, "device_revoked");
    dbError(error);
  }
  return Response.json(data);
}
export async function readCodex() {
  const db = await serverSupabase();
  const [a, d] = await Promise.all([
    db.from("codex_accounts").select("*"),
    db
      .from("codex_devices")
      .select(
        "id,account_id,name,profile,version,paused,revoked_at,heartbeat_at,observed_at,last_error,sync_requested_at,pending_identity,pending_label",
      ),
  ]);
  dbError(a.error);
  dbError(d.error);
  const daily: Database["public"]["Tables"]["codex_daily_usage"]["Row"][] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db
      .from("codex_daily_usage")
      .select("*")
      .order("account_id")
      .order("usage_date")
      .range(offset, offset + 499);
    dbError(result.error);
    daily.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 500) break;
  }
  return { accounts: a.data ?? [], devices: d.data ?? [], daily };
}
