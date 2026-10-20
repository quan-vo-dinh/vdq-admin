import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const run = args => execFileSync('pnpm', ['exec', 'supabase', ...args], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 }).toString();
try {
  const status = JSON.parse(run(['status', '-o', 'json']));
  assert.equal(status.API_URL, 'http://127.0.0.1:54321');
  assert.match(status.PUBLISHABLE_KEY, /^sb_publishable_/);
  const base = status.API_URL;
  const headers = { apikey: status.PUBLISHABLE_KEY };
  const unauthenticated = await fetch(`${base}/rest/v1/`);
  // Local OpenAPI discovery can be public; this does not prove business access.
  assert.equal(unauthenticated.status, 200);
  const rest = await fetch(`${base}/rest/v1/`, { headers });
  assert.equal(rest.status, 200);
  const schema = await rest.json();
  const settingsResponse = await fetch(`${base}/auth/v1/settings`, { headers });
  assert.equal(settingsResponse.status, 200);
  const settings = await settingsResponse.json();
  assert.equal(settings.disable_signup, true);
  assert.equal(settings.external.github, false);
  assert.equal(settings.external.anonymous_users, false);
  const userResponse = await fetch(`${base}/auth/v1/user`, { headers });
  assert.equal(userResponse.status, 403); // Local Auth returns bad_jwt for missing sub.
  const fakeToken = await fetch(`${base}/auth/v1/user`, { headers: { ...headers, Authorization: 'Bearer invalid.synthetic.token' } });
  assert.equal(fakeToken.status, 403);
  const catalog = JSON.parse(execFileSync('docker', ['exec', '-i', 'supabase_db_dashboard-personal-local', 'psql', '-XAt', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: readFileSync('scripts/backend/catalog-preflight.sql'), stdio: ['pipe', 'pipe', 'pipe'] }));
  assert.match(catalog.server_version, /^17\./);
  assert.deepEqual(catalog.tables, []);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), result: 'PASS', localApi: base, openApiWithoutKeyStatus: unauthenticated.status, userWithoutSessionStatus: userResponse.status, fakeTokenStatus: fakeToken.status, publishableKeyStatus: rest.status, signupDisabled: settings.disable_signup, githubEnabled: settings.external.github, publicPaths: Object.keys(schema.paths ?? {}), catalog }, null, 2));
} catch { console.error('Local smoke failed. No remote writes or fallback attempted.'); process.exitCode = 1; }
