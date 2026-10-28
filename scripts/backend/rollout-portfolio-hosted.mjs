// Explicit additive rollout only. CLI credentials stay in its process environment.
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { captureHosted, projectRef } from "./backup-hosted.mjs";
import { publishBackup, decrypt, digest } from "./backup.mjs";
import { parseDocument } from "../../lib/portfolio/model.ts";
const version = "20261028000100",
  name = "portfolio";
const key = "/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem";
function query(sql) {
  const r = JSON.parse(
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
      { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 },
    ).toString(),
  );
  if (!Array.isArray(r.rows)) throw new Error("Unexpected hosted query");
  return r.rows;
}
const before = await captureHosted();
if (before.source !== "hosted:" + projectRef) throw new Error("Wrong target");
const backup = await publishBackup(
  before,
  "/Users/vodinhquan/Documents/dashboard-backups/hosted",
  key + ".pub",
);
await decrypt(backup.file, key);
const latest = await captureHosted();
if (
  digest(Buffer.from(JSON.stringify(before.data))) !==
  digest(Buffer.from(JSON.stringify(latest.data)))
)
  throw new Error("Data changed after backup; repeat during quiet writes");
const applied = before.versions.includes(version);
if (!applied) {
  const expected = await readFile(
    "supabase/migrations/20261028000100_portfolio.sql",
    "utf8",
  );
  query(
    `begin;select pg_advisory_xact_lock(28000100);${expected}\ninsert into supabase_migrations.schema_migrations(version,name,statements) values('${version}','${name}',array[]::text[]);commit;select '${version}' as applied;`,
  );
}
const doc = parseDocument(
  JSON.parse(await readFile("lib/portfolio/initial-content.json", "utf8")),
);
const literal = JSON.stringify(doc).replaceAll("'", "''");
// Idempotent initial import/publication. Existing owner edits/publication are never replaced.
const seeded = query(
  `begin; select pg_advisory_xact_lock(28000100);select set_config('request.jwt.claim.sub',(select user_id::text from private.app_owner where enabled),true);set local role authenticated;do $$ begin if not exists(select 1 from public.portfolio_sites) then perform public.save_portfolio('${literal}'::jsonb,0);perform public.publish_portfolio(1);end if;end $$;commit;select count(*)::int as current_publications from public.read_published_portfolio();`,
);
const after = await captureHosted();
for (const [table, rows] of Object.entries(before.data))
  if (
    !table.startsWith("portfolio_") &&
    digest(Buffer.from(JSON.stringify(rows))) !==
      digest(Buffer.from(JSON.stringify(after.data[table])))
  )
    throw new Error(
      "Unexpected existing-domain changes; inspect concurrent writes",
    );
const checks = query(
  `select (select count(*) from supabase_migrations.schema_migrations where version='${version}')::int as migration_recorded,(select count(*) from public.portfolio_sites)::int as sites,(select count(*) from public.portfolio_versions)::int as versions,not has_table_privilege('anon','public.portfolio_sites','select') as anon_draft_denied,not has_table_privilege('anon','public.portfolio_versions','select') as anon_history_denied,not has_function_privilege('anon','public.publish_portfolio(integer,uuid)','execute') as anon_publish_denied,(select bool_and(relrowsecurity) from pg_class where oid in ('public.portfolio_sites'::regclass,'public.portfolio_versions'::regclass,'public.portfolio_media'::regclass)) as rls_enabled;`,
);
console.log(
  JSON.stringify({
    projectRef,
    migration: version,
    alreadyApplied: applied,
    encryptedBackup: backup.file,
    backupDecrypted: true,
    existingDomainFingerprintUnchanged: true,
    publication: seeded,
    checks,
  }),
);
