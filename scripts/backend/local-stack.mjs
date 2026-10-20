import { execFileSync } from 'node:child_process';
try {
  execFileSync('pnpm', ['exec', 'supabase', 'start'], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  console.log('Local Supabase started. Credential output withheld; use backend:local:env.');
} catch { console.error('Local stack start failed. Check Docker and port availability. No remote operation attempted.'); process.exitCode = 1; }
