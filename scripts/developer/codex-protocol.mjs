import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";

export function identity(account) {
  if (account?.type !== "chatgpt" || !account.email) return null;
  // App-server has no stable account ID. The owner confirms this candidate on web.
  const email = account.email.trim().toLowerCase();
  const workspace = account.workspaceName?.trim() || null;
  return {
    key:
      "codex-v2:" +
      createHash("sha256")
        .update(JSON.stringify([email, workspace]))
        .digest("hex"),
    label: [email, workspace].filter(Boolean).join(" · "),
  };
}
export function usageCapability(result, error) {
  if (error)
    return {
      status: error.code === -32601 ? "unsupported" : "error",
      daily: [],
      summary: null,
    };
  if (!Array.isArray(result?.dailyUsageBuckets))
    return { status: "unavailable", daily: [], summary: null };
  const daily = result.dailyUsageBuckets.map((row) => ({
    date: row.startDate,
    tokens: row.tokens,
  }));
  const summary = Object.fromEntries(
    [
      "lifetimeTokens",
      "peakDailyTokens",
      "longestRunningTurnSec",
      "currentStreakDays",
      "longestStreakDays",
    ].map((key) => [
      key,
      Number.isSafeInteger(result[key]) && result[key] >= 0
        ? result[key]
        : null,
    ]),
  );
  return { status: "ok", daily, summary };
}
export function quotaCapability(result, error) {
  if (error)
    return {
      status: error.code === -32601 ? "unsupported" : "error",
      windows: [],
    };
  const buckets = result?.rateLimitsByLimitId
    ? Object.entries(result.rateLimitsByLimitId)
    : result?.rateLimits
      ? [["default", result.rateLimits]]
      : [];
  const windows = [];
  for (const [bucket, snapshot] of buckets)
    for (const kind of ["primary", "secondary"]) {
      const value = snapshot?.[kind];
      if (!value) continue;
      if (
        !Number.isFinite(value.usedPercent) ||
        value.usedPercent < 0 ||
        value.usedPercent > 100 ||
        !Number.isFinite(value.windowDurationMins) ||
        value.windowDurationMins <= 0
      )
        return { status: "error", windows: [] };
      const reset =
        value.resetsAt == null ? null : new Date(value.resetsAt * 1000);
      if (reset && !Number.isFinite(reset.getTime()))
        return { status: "error", windows: [] };
      windows.push({
        bucket,
        kind,
        usedPercent: value.usedPercent,
        windowDurationMins: value.windowDurationMins,
        resetsAt: reset?.toISOString() ?? null,
      });
    }
  return { status: windows.length ? "ok" : "unavailable", windows };
}
export async function collect(
  deviceId,
  {
    binary = process.env.CODEX_BINARY ?? "codex",
    codexHome = process.env.DEVELOPER_CODEX_HOME,
    signal,
    onStatus,
  } = {},
) {
  const child = spawn(binary, ["app-server", "--listen", "stdio://"], {
    stdio: ["pipe", "pipe", "ignore"],
    env: { ...process.env, ...(codexHome ? { CODEX_HOME: codexHome } : {}) },
  });
  let seq = 0,
    buffer = "",
    closed = false;
  const pending = new Map();
  function fail() {
    closed = true;
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(new Error("Codex unavailable"));
    }
    pending.clear();
  }
  child.on("error", fail);
  child.on("exit", fail);
  child.stdin.on("error", fail);
  const abort = () => {
    fail();
    child.kill();
  };
  signal?.addEventListener("abort", abort, { once: true });
  function rpc(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (closed || signal?.aborted)
        return reject(new Error("Codex unavailable"));
      const id = ++seq,
        timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error("Codex request timed out"));
        }, 20000);
      pending.set(id, { resolve, reject, timer });
      child.stdin.write(JSON.stringify({ id, method, params }) + "\n");
    });
  }
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    if (buffer.length > 4000000) {
      abort();
      return;
    }
    let end;
    while ((end = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      const entry = pending.get(message.id);
      if (!entry) continue;
      clearTimeout(entry.timer);
      pending.delete(message.id);
      if (message.error) {
        const error = new Error("Codex request failed");
        error.code = message.error.code;
        entry.reject(error);
      } else entry.resolve(message.result);
    }
  });
  try {
    const init = await rpc("initialize", {
      clientInfo: { name: "developer_companion", version: "2.0.0" },
      capabilities: { experimentalApi: true },
    });
    child.stdin.write(
      JSON.stringify({ method: "initialized", params: {} }) + "\n",
    );
    const account = await rpc("account/read", {}),
      who = identity(account.account);
    const version = String(init?.userAgent ?? "companion/2").slice(0, 80);
    if (!who)
      return {
        schemaVersion: 2,
        type: "observation",
        deviceId,
        batchId: randomUUID(),
        collectedAt: new Date().toISOString(),
        identityKey: null,
        identityLabel: null,
        accountStatus: "login_required",
        usageStatus: "login_required",
        quotaStatus: "login_required",
        daily: [],
        quotaWindows: [],
        summary: null,
        plan: null,
        version,
      };
    const [u, q] = await Promise.allSettled([
      rpc("account/usage/read", {}),
      rpc("account/rateLimits/read", {}),
    ]);
    await onStatus?.({
      usageRpcCode:
        u.status === "rejected" && Number.isInteger(u.reason.code)
          ? u.reason.code
          : null,
      quotaRpcCode:
        q.status === "rejected" && Number.isInteger(q.reason.code)
          ? q.reason.code
          : null,
    });
    const usage = usageCapability(
      u.status === "fulfilled" ? u.value : null,
      u.status === "rejected" ? u.reason : null,
    );
    const quota = quotaCapability(
      q.status === "fulfilled" ? q.value : null,
      q.status === "rejected" ? q.reason : null,
    );
    return {
      schemaVersion: 2,
      type: "observation",
      deviceId,
      batchId: randomUUID(),
      collectedAt: new Date().toISOString(),
      identityKey: who.key,
      identityLabel: who.label,
      accountStatus: "ok",
      usageStatus: usage.status,
      quotaStatus: quota.status,
      daily: usage.daily,
      summary: usage.summary,
      quotaWindows: quota.windows,
      plan: account.account.planType ?? null,
      version,
    };
  } finally {
    signal?.removeEventListener("abort", abort);
    fail();
    child.kill();
  }
}
