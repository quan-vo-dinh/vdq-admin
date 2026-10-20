import { execFileSync } from 'node:child_process';
import { atomicOutput } from './atomic-output.mjs';
import { loadValidator } from './env.mjs';
try {
  const status = JSON.parse(execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json'], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1024 * 1024 }));
  const env = { APP_ENV: 'local', APP_ORIGIN: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY };
  loadValidator()(env);
  atomicOutput('.env.development.local', Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { replace: false });
  console.log('Created ignored .env.development.local (mode 0600) with local URL + publishable key only.');
} catch { console.error('Local env not written: start local Supabase first; .env.development.local must not already exist. No existing file was changed.'); process.exitCode = 1; }
