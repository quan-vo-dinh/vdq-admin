export type CapabilityStatus =
  "ok" | "unavailable" | "unsupported" | "error" | "login_required";
export type QuotaWindow = {
  bucket: string;
  kind: "primary" | "secondary";
  usedPercent: number;
  windowDurationMins: number;
  resetsAt: string | null;
};
export type CodexBatch = {
  schemaVersion: 2;
  type: "observation";
  deviceId: string;
  batchId: string;
  collectedAt: string;
  identityKey: string | null;
  identityLabel: string | null;
  accountStatus: CapabilityStatus;
  usageStatus: CapabilityStatus;
  quotaStatus: CapabilityStatus;
  daily: { date: string; tokens: number }[];
  quotaWindows: QuotaWindow[];
  summary: Record<string, number | null> | null;
  plan: string | null;
  version: string;
};
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
    value,
  );
const statuses: CapabilityStatus[] = [
  "ok",
  "unavailable",
  "unsupported",
  "error",
  "login_required",
];
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const date = (v: unknown): v is string =>
  typeof v === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  !Number.isNaN(Date.parse(v + "T00:00:00Z")) &&
  new Date(v + "T00:00:00Z").toISOString().slice(0, 10) === v;
export function validateBatch(raw: unknown, now = Date.now()): CodexBatch {
  if (
    !object(raw) ||
    raw.schemaVersion !== 2 ||
    raw.type !== "observation" ||
    !isUuid(raw.deviceId) ||
    !isUuid(raw.batchId)
  )
    throw new Error("invalid_batch");
  const stamp =
    typeof raw.collectedAt === "string" ? Date.parse(raw.collectedAt) : NaN;
  if (
    !Number.isFinite(stamp) ||
    stamp > now + 60000 ||
    stamp < now - 31 * 86400000
  )
    throw new Error("invalid_collection_time");
  if (
    raw.identityKey !== null &&
    (typeof raw.identityKey !== "string" ||
      !/^codex-v2:[a-f0-9]{64}$/.test(raw.identityKey))
  )
    throw new Error("invalid_identity");
  for (const k of ["accountStatus", "usageStatus", "quotaStatus"])
    if (!statuses.includes(raw[k] as CapabilityStatus))
      throw new Error("invalid_capability");
  if ((raw.accountStatus === "ok") !== (raw.identityKey !== null))
    throw new Error("invalid_identity");
  if (
    !Array.isArray(raw.daily) ||
    raw.daily.length > 400 ||
    raw.daily.some(
      (r) =>
        !object(r) ||
        !date(r.date) ||
        !Number.isSafeInteger(r.tokens) ||
        Number(r.tokens) < 0,
    )
  )
    throw new Error("invalid_usage");
  if (new Set(raw.daily.map((r) => r.date)).size !== raw.daily.length)
    throw new Error("duplicate_usage_date");
  if (raw.usageStatus !== "ok" && raw.daily.length)
    throw new Error("invalid_usage");
  if (
    !Array.isArray(raw.quotaWindows) ||
    raw.quotaWindows.length > 50 ||
    raw.quotaWindows.some(
      (r) =>
        !object(r) ||
        typeof r.bucket !== "string" ||
        r.bucket.length > 100 ||
        !["primary", "secondary"].includes(String(r.kind)) ||
        typeof r.usedPercent !== "number" ||
        !Number.isFinite(r.usedPercent) ||
        r.usedPercent < 0 ||
        r.usedPercent > 100 ||
        typeof r.windowDurationMins !== "number" ||
        !Number.isFinite(r.windowDurationMins) ||
        r.windowDurationMins <= 0 ||
        (r.resetsAt !== null &&
          (typeof r.resetsAt !== "string" ||
            Number.isNaN(Date.parse(r.resetsAt)))),
    )
  )
    throw new Error("invalid_quota");
  if (raw.quotaStatus !== "ok" && raw.quotaWindows.length)
    throw new Error("invalid_quota");
  if (
    new Set(raw.quotaWindows.map((r) => `${r.bucket}:${r.kind}`)).size !==
    raw.quotaWindows.length
  )
    throw new Error("duplicate_quota");
  if (
    raw.summary !== null &&
    (!object(raw.summary) ||
      Object.entries(raw.summary).some(
        ([k, v]) =>
          ![
            "lifetimeTokens",
            "peakDailyTokens",
            "longestRunningTurnSec",
            "currentStreakDays",
            "longestStreakDays",
          ].includes(k) ||
          (v !== null && (!Number.isSafeInteger(v) || Number(v) < 0)),
      ))
  )
    throw new Error("invalid_summary");
  if (
    raw.plan !== null &&
    (typeof raw.plan !== "string" || raw.plan.length > 80)
  )
    throw new Error("invalid_plan");
  if (
    raw.identityLabel !== null &&
    (typeof raw.identityLabel !== "string" || raw.identityLabel.length > 200)
  )
    throw new Error("invalid_identity");
  if (typeof raw.version !== "string" || raw.version.length > 80)
    throw new Error("invalid_version");
  // Construct, do not spread: unrelated fields such as prompts never reach persistence.
  return {
    schemaVersion: 2,
    type: "observation",
    deviceId: raw.deviceId,
    batchId: raw.batchId,
    collectedAt: new Date(stamp).toISOString(),
    identityKey: raw.identityKey as string | null,
    identityLabel: raw.identityLabel as string | null,
    accountStatus: raw.accountStatus as CapabilityStatus,
    usageStatus: raw.usageStatus as CapabilityStatus,
    quotaStatus: raw.quotaStatus as CapabilityStatus,
    daily: raw.daily.map((r) => ({ date: r.date, tokens: r.tokens })),
    quotaWindows: raw.quotaWindows.map((r) => ({
      bucket: r.bucket,
      kind: r.kind,
      usedPercent: r.usedPercent,
      windowDurationMins: r.windowDurationMins,
      resetsAt: r.resetsAt,
    })),
    summary: raw.summary as CodexBatch["summary"],
    plan: raw.plan as string | null,
    version: raw.version,
  };
}
export function deviceState(
  device: {
    revoked_at: string | null;
    paused: boolean;
    pending_identity: string | null;
    last_error: string | null;
    heartbeat_at: string | null;
  },
  accountPaused = false,
  now = Date.now(),
) {
  if (device.revoked_at) return "revoked";
  if (device.paused || accountPaused) return "paused";
  if (device.pending_identity) return "confirmation_required";
  if (device.last_error) return device.last_error;
  if (!device.heartbeat_at) return "waiting";
  return now - Date.parse(device.heartbeat_at) > 600000 ? "offline" : "online";
}
