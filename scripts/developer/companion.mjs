#!/usr/bin/env node
import { unlinkSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, chmod, unlink, open } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { collect } from "./codex-protocol.mjs";
import {
  scopeKey,
  keychain,
  atomicJson,
  loadCredential,
} from "./credential-store.mjs";

const profile = process.env.DEVELOPER_PROFILE ?? "default";
if (!/^[\w-]{1,60}$/.test(profile)) throw new Error("Invalid profile name");
if (!process.env.DEVELOPER_ORIGIN) throw new Error("Set DEVELOPER_ORIGIN");
const destination = new URL(process.env.DEVELOPER_ORIGIN);
if (
  destination.username ||
  destination.password ||
  destination.pathname !== "/" ||
  destination.search ||
  destination.hash ||
  !(
    destination.protocol === "https:" ||
    (destination.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(destination.hostname))
  )
)
  throw new Error(
    "Use an HTTPS dashboard origin (HTTP allowed only on localhost)",
  );
const origin = destination.origin,
  scope = scopeKey(origin, profile),
  dir = join(homedir(), ".developer-companion");
await mkdir(dir, { recursive: true, mode: 0o700 });
await chmod(dir, 0o700);
const file = join(dir, scope + ".json"),
  queueFile = join(dir, scope + "-queue.json"),
  legacyFile = join(dir, profile + ".json");
const statusFile = join(dir, scope + "-status.json");
let diagnostics = {};
try {
  diagnostics = JSON.parse(await readFile(statusFile, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const record = async (values) => {
  diagnostics = { ...diagnostics, ...values };
  await atomicJson(statusFile, diagnostics);
};
const command = process.argv[2] ?? "run",
  once = command === "sync" || process.argv.includes("--once");
const controller = new AbortController();
let stopped = false;
for (const event of ["SIGINT", "SIGTERM"])
  process.on(event, () => {
    stopped = true;
    controller.abort();
  });
async function sleep(ms) {
  if (stopped) return;
  await new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", done);
      resolve();
    }
    controller.signal.addEventListener("abort", done, { once: true });
  });
}
async function send(body, token) {
  const response = await fetch(new URL("/api/developer/companion", origin), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Dashboard returned a non-JSON response");
  }
  if (!response.ok) {
    const error = new Error(result.code ?? `HTTP ${response.status}`);
    error.fatal = response.status === 401;
    throw error;
  }
  return result;
}
const label = `work.vodinhquan.developer.${profile}`,
  agentFile = join(homedir(), "Library", "LaunchAgents", label + ".plist");
async function install() {
  const escape = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const variables = {
    DEVELOPER_ORIGIN: origin,
    DEVELOPER_PROFILE: profile,
    PATH: process.env.PATH,
    ...(process.env.DEVELOPER_CODEX_HOME
      ? { DEVELOPER_CODEX_HOME: process.env.DEVELOPER_CODEX_HOME }
      : {}),
    ...(process.env.CODEX_BINARY
      ? { CODEX_BINARY: process.env.CODEX_BINARY }
      : {}),
  };
  await mkdir(join(homedir(), "Library", "LaunchAgents"), { recursive: true });
  // Reject an unrelated destination instead of replacing its existing agent.
  try {
    const previous = await readFile(agentFile, "utf8");
    if (!previous.includes(escape(origin)))
      throw new Error(
        "Profile already installed for another origin; choose another DEVELOPER_PROFILE",
      );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const xml = `<?xml version="1.0"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>Label</key><string>${label}</string><key>ProgramArguments</key><array><string>${escape(process.execPath)}</string><string>${escape(fileURLToPath(import.meta.url))}</string><string>run</string></array><key>EnvironmentVariables</key><dict>${Object.entries(
    variables,
  )
    .map(([k, v]) => `<key>${escape(k)}</key><string>${escape(v)}</string>`)
    .join(
      "",
    )}</dict><key>RunAtLoad</key><true/><key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict><key>ThrottleInterval</key><integer>60</integer></dict></plist>`;
  const { writeFile } = await import("node:fs/promises");
  await writeFile(agentFile, xml, { mode: 0o600 });
  await chmod(agentFile, 0o600);
  try {
    execFileSync("launchctl", ["bootout", `gui/${process.getuid()}/${label}`], {
      stdio: "ignore",
    });
  } catch {
    /* Not installed yet. */
  }
  for (let attempt = 0; ; attempt++) {
    try {
      execFileSync(
        "launchctl",
        ["bootstrap", `gui/${process.getuid()}`, agentFile],
        { stdio: "pipe" },
      );
      break;
    } catch {
      if (attempt === 4)
        throw new Error(
          "Cannot start LaunchAgent. Run install again after the previous process exits.",
        );
      await sleep(1000);
    }
  }
  console.log(
    "Đã cài companion chạy nền (heartbeat 60 giây, thu thập 5 phút).",
  );
}
async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}
try {
  if (command === "uninstall") {
    try {
      const xml = await readFile(agentFile, "utf8");
      if (!xml.includes(origin))
        throw new Error("LaunchAgent belongs to another origin");
      execFileSync(
        "launchctl",
        ["bootout", `gui/${process.getuid()}/${label}`],
        { stdio: "ignore" },
      );
      await unlink(agentFile);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    console.log(
      "Đã dừng companion. Credential và lịch sử vẫn được giữ; thu hồi Mac trên web nếu cần.",
    );
    process.exit(0);
  }
  if (command === "setup") {
    try {
      await readFile(file);
      throw new Error(
        "Profile đã ghép. Dùng profile khác để thêm tài khoản; thu hồi trên web nếu muốn thay thế.",
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    let preview = await collect("00000000-0000-4000-8000-000000000000", {
      signal: controller.signal,
    });
    if (preview.accountStatus !== "ok") {
      if (
        (
          await ask("Profile chưa đăng nhập ChatGPT. Mở codex login? [y/N] ")
        ).toLowerCase() !== "y"
      )
        throw new Error("Chưa đăng nhập Codex");
      await new Promise((resolve, reject) => {
        const login = spawn(process.env.CODEX_BINARY ?? "codex", ["login"], {
          stdio: "inherit",
          env: {
            ...process.env,
            ...(process.env.DEVELOPER_CODEX_HOME
              ? { CODEX_HOME: process.env.DEVELOPER_CODEX_HOME }
              : {}),
          },
        });
        login.on("error", reject);
        login.on("exit", (code) =>
          code === 0 ? resolve() : reject(new Error("Codex login failed")),
        );
      });
      preview = await collect("00000000-0000-4000-8000-000000000000", {
        signal: controller.signal,
      });
    }
    if (preview.accountStatus !== "ok")
      throw new Error("ChatGPT login required");
    console.log(
      `Danh tính phát hiện: ${preview.identityLabel}. Hãy kiểm tra workspace trên web khi xác nhận.`,
    );
    const code = await ask("Nhập mã ghép một lần từ trang Kết nối: ");
    const paired = await send({
      schemaVersion: 2,
      type: "pair",
      code,
      name: process.env.DEVELOPER_DEVICE_NAME ?? `Mac · ${profile}`,
      profile,
    });
    keychain(scope, paired.token);
    if (keychain(scope) !== paired.token)
      throw new Error("Keychain verification failed");
    await atomicJson(file, {
      id: paired.id,
      accountId: paired.accountId,
      origin,
    });
    console.log("Đã ghép Mac. Đang gửi yêu cầu xác nhận danh tính.");
  }
  // Legacy v1 did not store origin: migration is opt-in and destination-bound.
  if (process.env.DEVELOPER_MIGRATE_ORIGIN) {
    if (process.env.DEVELOPER_MIGRATE_ORIGIN !== origin)
      throw new Error("Migration origin mismatch");
    const old = JSON.parse(await readFile(legacyFile, "utf8"));
    if (old.token && !old.origin)
      await atomicJson(legacyFile, { ...old, origin });
  }
  const { state, token } = await loadCredential(file, scope, {
    legacyFile,
    origin,
  });
  if (command === "install" || command === "--install") {
    await install();
    process.exit(0);
  }
  if (command === "status") {
    let count = 0;
    try {
      count = JSON.parse(await readFile(queueFile, "utf8")).length;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    console.log(
      JSON.stringify({
        profile,
        origin,
        deviceId: state.id,
        credential: "macOS Keychain",
        pendingBatches: count,
        diagnostics,
        codexHome: process.env.DEVELOPER_CODEX_HOME ?? "default",
      }),
    );
    process.exit(0);
  }
  if (!["setup", "run", "sync", "--once"].includes(command))
    throw new Error("Commands: setup, status, sync --once, install, uninstall");
  const lockFile = join(dir, scope + ".lock");
  let lock;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      lock = await open(lockFile, "wx", 0o600);
      await lock.writeFile(String(process.pid));
      await lock.close();
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const pid = Number(await readFile(lockFile, "utf8"));
      let running = false;
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
          running = true;
        } catch {}
      }
      if (running)
        throw new Error(
          "Companion profile đang chạy. Dùng Đồng bộ ngay trên web hoặc uninstall trước khi chạy sync thủ công.",
        );
      await unlink(lockFile);
    }
  }
  if (!lock) throw new Error("Cannot acquire companion lock");
  process.on("exit", () => {
    try {
      unlinkSync(lockFile);
    } catch {}
  });
  let queue = [];
  try {
    queue = JSON.parse(await readFile(queueFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  queue = queue
    .filter(
      (batch) =>
        batch.schemaVersion === 2 &&
        Date.parse(batch.collectedAt) > Date.now() - 30 * 86400000,
    )
    .slice(-20);
  let lastCollection = 0,
    backoff = 60000;
  async function flush() {
    for (let index = 0; index < queue.length && !stopped;) {
      let result = await send(queue[index], token);
      if (result.retryAfter) {
        await sleep(result.retryAfter * 1000 + 50);
        if (stopped) return;
        result = await send(queue[index], token);
      }
      if (result.ok) {
        queue.splice(index, 1);
        await atomicJson(queueFile, queue);
        await record({
          lastUploadAt: new Date().toISOString(),
          lastError: null,
        });
        console.log(new Date().toISOString(), "Đã đồng bộ usage/quota.");
        continue;
      }
      if (result.confirmationRequired) {
        await record({ lastError: "identity_confirmation_required" });
        console.log("Cần xác nhận danh tính tại /developer/connections.");
        return;
      }
      if (result.paused || result.retryAfter) return;
      // No usable account: keep historical accepted batches, drop this failed capability observation.
      if (result.code === "login_required") {
        queue.splice(index, 1);
        await atomicJson(queueFile, queue);
        console.log("Cần đăng nhập ChatGPT trong profile Codex.");
        continue;
      }
      throw new Error("Unexpected dashboard response");
    }
  }
  while (!stopped) {
    try {
      const heartbeat = await send(
        {
          schemaVersion: 2,
          type: "heartbeat",
          deviceId: state.id,
          version: "companion/2.0.0",
        },
        token,
      );
      await record({
        lastHeartbeatAt: new Date().toISOString(),
        paused: heartbeat.paused ?? false,
      });
      if (
        !heartbeat.paused &&
        (heartbeat.collect || Date.now() - lastCollection >= 300000)
      ) {
        const batch = await collect(state.id, {
          signal: controller.signal,
          onStatus: record,
        });
        lastCollection = Date.now();
        await record({
          lastCollectionAt: batch.collectedAt,
          accountStatus: batch.accountStatus,
          usageStatus: batch.usageStatus,
          quotaStatus: batch.quotaStatus,
        });
        // A profile switch invalidates queued snapshots for the previous identity.
        queue = queue.filter((item) => item.identityKey === batch.identityKey);
        queue.push(batch);
        queue = queue.slice(-20);
        await atomicJson(queueFile, queue);
      }
      if (!heartbeat.paused) await flush();
      backoff = 60000;
    } catch (error) {
      if (!stopped)
        console.error(
          new Date().toISOString(),
          error.fatal
            ? "Credential bị thu hồi. Ghép lại Mac trên web."
            : error.message,
        );
      if (!stopped)
        await record({
          lastError: error.fatal ? "device_revoked" : error.message,
        });
      if (once) process.exitCode = 1;
      if (error.fatal) break;
      backoff = Math.min(backoff * 2, 300000);
    }
    if (once || command === "setup") break;
    await sleep(backoff);
  }
  if (command === "setup")
    console.log(
      "Quay lại web xác nhận danh tính, sau đó chạy install để tự đồng bộ.",
    );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
