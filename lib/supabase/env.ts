/** Shared validation only: server callers must pass explicit process.env values.
 * No credentials, SDK instances, production fallback or eager build-time access.
 */
export type BackendEnvironment = {
  APP_ENV?: string;
  APP_ORIGIN?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_PROJECT_REF?: string;
  VERCEL_ENV?: string;
};
export const productionProjectRef = "wcgdvsiiemurehkprvqw";
const placeholder = /replace|placeholder|your[-_]|example|<|>/i;
export function readBackendEnvironment(env: BackendEnvironment) {
  const mode = env.APP_ENV;
  if (!["local", "preview", "production"].includes(mode ?? "")) throw new Error("APP_ENV must be local, preview or production");
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "development" && env.VERCEL_ENV !== mode) throw new Error("APP_ENV does not match VERCEL_ENV");
  let url: URL, origin: URL;
  try {
    url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    origin = new URL(env.APP_ORIGIN ?? "");
  } catch { throw new Error("Supabase URL and APP_ORIGIN are required valid URLs"); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") throw new Error("Use plain origins without credentials, paths or query strings");
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key || placeholder.test(key) || !/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) throw new Error("A publishable key is required; secret/service-role/legacy keys are rejected");
  if (mode === "local") {
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "54321" || url.protocol !== "http:" || !["localhost", "127.0.0.1"].includes(origin.hostname) || origin.protocol !== "http:" || origin.port !== "3000" || env.SUPABASE_PROJECT_REF) throw new Error("Local mode requires local API :54321 and app :3000; cloud refs are forbidden");
  } else {
    const ref = env.SUPABASE_PROJECT_REF;
    if (!ref || !/^[a-z]{20}$/.test(ref) || url.hostname !== `${ref}.supabase.co` || url.protocol !== "https:" || url.port || origin.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(origin.hostname)) throw new Error("Cloud mode requires an explicit matching project ref, HTTPS Supabase URL and HTTPS app origin");
    if (mode === "preview" && ref === productionProjectRef) throw new Error("Preview cannot use the production project");
    if (mode === "production" && ref !== productionProjectRef) throw new Error("Production project does not match the reviewed target");
  }
  return { mode: mode as "local" | "preview" | "production", url: url.origin, publishableKey: key, origin: origin.origin };
}
