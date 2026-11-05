import { execFileSync } from "node:child_process";
import { readFile, writeFile, rename, chmod } from "node:fs/promises";
import { createHash } from "node:crypto";
export const scopeKey = (origin, profile) =>
  `${profile}-${createHash("sha256").update(origin).digest("hex").slice(0, 12)}`;
const service = "work.vodinhquan.developer.companion";
const quote = (value) =>
  '"' + String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"') + '"';
export function keychain(scope, token) {
  if (process.platform !== "darwin")
    throw new Error("Companion requires macOS Keychain");
  if (token !== undefined) {
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token))
      throw new Error("Invalid device credential");
    // stdin avoids exposing the credential in process arguments or shell history.
    try {
      execFileSync("/usr/bin/security", ["-i"], {
        input: `add-generic-password -U -a ${quote(scope)} -s ${quote(service)} -w ${quote(token)}\n`,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      throw new Error("Cannot save device credential in macOS Keychain");
    }
  }
  try {
    return execFileSync(
      "/usr/bin/security",
      ["find-generic-password", "-a", scope, "-s", service, "-w"],
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
    ).trim();
  } catch {
    throw new Error("Cannot read device credential from macOS Keychain");
  }
}
export async function atomicJson(file, value) {
  const temp = file + ".tmp";
  await writeFile(temp, JSON.stringify(value), { mode: 0o600 });
  await chmod(temp, 0o600);
  await rename(temp, file);
  await chmod(file, 0o600);
}
export async function loadCredential(
  file,
  scope,
  { legacyFile, origin, store = keychain } = {},
) {
  let state;
  try {
    state = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT" || !legacyFile) throw error;
    state = JSON.parse(await readFile(legacyFile, "utf8"));
    if (!state.origin)
      throw new Error(
        "Legacy credential needs explicit DEVELOPER_MIGRATE_ORIGIN to verify its destination",
      );
  }
  if (state.origin !== origin)
    throw new Error("Credential belongs to a different dashboard origin");
  if (state.token) {
    const token = state.token;
    store(scope, token);
    if (store(scope) !== token)
      throw new Error("Keychain verification failed; legacy file preserved");
    delete state.token;
    await atomicJson(file, state);
    if (legacyFile && legacyFile !== file)
      await atomicJson(legacyFile, { migratedTo: file, origin });
  }
  return { state, token: store(scope) };
}
