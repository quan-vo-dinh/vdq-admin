import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
// Compile the exact TS validator used by future repositories; do not duplicate its rules.
export function loadValidator() {
  const directory = mkdtempSync(join(tmpdir(), 'dashboard-env-'));
  try {
    execFileSync('pnpm', ['exec', 'tsc', '--ignoreConfig', '--target', 'es2022', '--module', 'commonjs', '--skipLibCheck', '--outDir', directory, 'lib/supabase/env.ts'], { stdio: 'pipe' });
    return createRequire(import.meta.url)(join(directory, 'env.js')).readBackendEnvironment;
  } finally { rmSync(directory, { recursive: true, force: true }); }
}
