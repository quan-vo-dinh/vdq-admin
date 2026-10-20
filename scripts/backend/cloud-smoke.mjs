import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
// Read-only metadata preflight for the explicitly reviewed production target.
// Run with .env.cloud-tooling.local; Next never auto-loads this custom filename.
try {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.equal(process.env.SUPABASE_PROJECT_REF, 'wcgdvsiiemurehkprvqw');
  assert.equal(base, 'https://wcgdvsiiemurehkprvqw.supabase.co');
  assert.match(key ?? '', /^sb_publishable_[A-Za-z0-9_-]{16,}$/);
  const samples = [];
  let settings;
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    const response = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
    assert.equal(response.status, 200);
    settings = await response.json();
    samples.push({ attempt: i + 1, status: response.status, totalMs: Math.round(performance.now() - start) });
  }
  const noKey = await fetch(`${base}/auth/v1/settings`, { signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
  assert.equal(noKey.status, 401);
  const openApi = await fetch(`${base}/rest/v1/`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
  assert.equal(openApi.status, 401); // Cloud OpenAPI metadata requires secret key; never escalate.
  console.log(JSON.stringify({ openApiWithPublishableStatus: openApi.status, checkedAt: new Date().toISOString(), result: 'PASS', target: base, publicKeyProvisioned: true, noKeyStatus: noKey.status, signupDisabled: settings.disable_signup, githubEnabled: settings.external?.github, anonymousEnabled: settings.external?.anonymous_users, samples, boundary: 'Metadata GET only, no business query, user session, migration, RLS acceptance, or direct/session-pooler DB tooling tested.' }, null, 2));
} catch { console.error('Cloud metadata preflight failed or env missing/mismatched. No writes, token fallback or local/prod fallback attempted.'); process.exitCode = 1; }
