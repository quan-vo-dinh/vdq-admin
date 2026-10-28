import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const doc = readFileSync(
  "lib/portfolio/initial-content.json",
  "utf8",
).replaceAll("'", "''");
const sql = readFileSync(
  "supabase/tests/portfolio_annotations.test.sql",
  "utf8",
).replace("__DOCUMENT__", doc);
try {
  const out = execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "supabase_db_dashboard-personal-local",
      "psql",
      "-XAtq",
      "-U",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: sql, stdio: ["pipe", "pipe", "pipe"] },
  ).toString();
  console.log(out);
  if (/not ok|Looks like/.test(out)) process.exitCode = 1;
} catch (e) {
  console.error(e.stderr?.toString() ?? "Annotation SQL tests failed");
  process.exitCode = 1;
}
