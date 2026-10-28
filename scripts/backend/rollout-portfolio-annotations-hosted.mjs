// Explicit additive validator rollout. No content initialization, publication or row mutation.
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { captureHosted, projectRef } from "./backup-hosted.mjs";
import { publishBackup, decrypt, digest } from "./backup.mjs";
const version = "20261028000200";
const filename =
  "supabase/migrations/" + version + "_portfolio_annotations.sql";
const recovery =
  "/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem";
function query(sql) {
  const result = JSON.parse(
    execFileSync(
      "pnpm",
      [
        "exec",
        "supabase",
        "db",
        "query",
        "--linked",
        "--project-ref",
        projectRef,
        sql,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 32 * 1024 * 1024,
        timeout: 90000,
      },
    ).toString(),
  );
  if (!Array.isArray(result.rows))
    throw new Error("Unexpected hosted response");
  return result.rows;
}
const before = await captureHosted();
if (before.source !== "hosted:" + projectRef)
  throw new Error("Wrong production target");
const backup = await publishBackup(
  before,
  "/Users/vodinhquan/Documents/dashboard-backups/hosted",
  recovery + ".pub",
);
await decrypt(backup.file, recovery);
const latest = await captureHosted();
if (
  digest(Buffer.from(JSON.stringify(before.data))) !==
  digest(Buffer.from(JSON.stringify(latest.data)))
)
  throw new Error("Content changed after backup; repeat during quiet writes");
const migration = await readFile(filename, "utf8");
if (
  !/^-- Backwards-compatible optional inline annotations\./.test(migration) ||
  /\b(insert into|update public|delete from|grant )/i.test(migration)
)
  throw new Error("Unexpected migration scope");
const alreadyApplied = before.versions.includes(version);
if (!alreadyApplied)
  query(
    `begin;select pg_advisory_xact_lock(28000200);${migration}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','portfolio_annotations',array[]::text[]);commit;select '${version}' as applied;`,
  );
const after = await captureHosted();
if (
  digest(Buffer.from(JSON.stringify(before.data))) !==
  digest(Buffer.from(JSON.stringify(after.data)))
)
  throw new Error(
    "Business content changed during rollout; inspect concurrent writes",
  );
const checks = query(
  `select (select count(*)::int from supabase_migrations.schema_migrations where version='${version}') as migration_recorded,not has_function_privilege('anon','private.validate_portfolio(jsonb,uuid)','execute') as validator_private,not has_table_privilege('anon','public.portfolio_sites','select') as drafts_private,not has_table_privilege('anon','public.portfolio_versions','select') as history_private,(select bool_and(private.validate_portfolio(draft,owner_id)) from public.portfolio_sites) as existing_drafts_valid,(select bool_and(private.validate_portfolio(document,owner_id)) from public.portfolio_versions) as old_snapshots_valid;`,
);
console.log(
  JSON.stringify({
    projectRef,
    migration: version,
    alreadyApplied,
    encryptedBackup: backup.file,
    backupDecrypted: true,
    allBusinessContentUnchanged: true,
    checks,
  }),
);
