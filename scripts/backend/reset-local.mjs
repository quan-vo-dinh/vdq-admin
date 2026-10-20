import { execFileSync } from 'node:child_process';
// This wrapper accepts no remote flags and requires a conscious local-data decision.
if (process.argv.length !== 3 || process.argv[2] !== '--confirm-local-disposable') {
  console.error('Snapshot local data first. For disposable local data only: pnpm backend:local:reset --confirm-local-disposable');
  process.exitCode = 1;
} else {
  try { execFileSync('pnpm', ['exec', 'supabase', 'db', 'reset', '--local', '--yes'], { stdio: ['ignore', 'pipe', 'pipe'] }); console.log('Local database reset completed.'); }
  catch { console.error('Local reset failed. Remote reset is never attempted.'); process.exitCode = 1; }
}
