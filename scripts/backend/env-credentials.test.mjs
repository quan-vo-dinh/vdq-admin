import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const directory = mkdtempSync(join(tmpdir(), 'dashboard-env-auth-'));
let auth;
let flow;
try {
  execFileSync('pnpm', ['exec', 'tsc', '--ignoreConfig', '--target', 'es2022', '--module', 'commonjs', '--skipLibCheck', '--types', 'node', '--outDir', directory, 'lib/auth/env-credentials.ts', 'lib/auth/owner-session-flow.ts'], { stdio: 'pipe' });
  auth = createRequire(import.meta.url)(join(directory, 'env-credentials.js'));
  flow = createRequire(import.meta.url)(join(directory, 'owner-session-flow.js'));
} finally { rmSync(directory, { recursive: true, force: true }); }
const salt = Buffer.alloc(16, 7);
const env = {
  OWNER_LOGIN_USERNAME: 'owner',
  OWNER_PASSWORD_HASH: `scrypt:${salt.toString('hex')}:${scryptSync('test-only-password', salt, 64).toString('hex')}`,
  OWNER_SESSION_SECRET_KEY: 'test-only-key', APP_OWNER_USER_ID: 'test-id', GITHUB_OWNER_ID: '123',
};
test('accepts only the configured account and password; no implicit defaults', async () => {
  await auth.verifyEnvCredentials('owner', 'test-only-password', env);
  for (const [username, password] of [['other', 'test-only-password'], ['owner', 'wrong'], ['owner', ''], [null, {}], ['owner', 'x'.repeat(1025)]]) {
    await assert.rejects(auth.verifyEnvCredentials(username, password, env), { status: 401, code: 'invalid_credentials' });
  }
  for (const name of Object.keys(env)) {
    const missing = { ...env, [name]: '' };
    assert.equal(auth.credentialsConfigured(missing), false);
    await assert.rejects(auth.verifyEnvCredentials('owner', 'test-only-password', missing), { status: 503 });
  }
  await assert.rejects(auth.verifyEnvCredentials('owner', 'password', { ...env, OWNER_PASSWORD_HASH: 'plaintext-password' }), { status: 503 });
});
test('attempt budget is shared across account names and resets after a minute', async () => {
  let now = 0;
  const limited = auth.loginLimiter(() => now);
  for (let i = 0; i < 10; i++) await assert.rejects(limited(async () => { throw new Error('invalid'); }), /invalid/);
  await assert.rejects(limited(async () => true), { status: 429 });
  now = 60_000;
  assert.equal(await limited(async () => true), true);
});
test('bounds concurrent password work and releases capacity after failure', async () => {
  const limited = auth.loginLimiter();
  let release;
  const first = limited(() => new Promise(resolve => { release = resolve; }));
  await assert.rejects(limited(async () => true), { status: 429 });
  release(true);
  assert.equal(await first, true);
  await assert.rejects(limited(async () => { throw new Error('failure'); }), /failure/);
  assert.equal(await limited(async () => true), true);
});

function operations(overrides = {}) {
  const calls = [];
  return { calls, api: {
    owner: async () => { calls.push('owner'); return { id: 'owner-id', email: 'owner@example.invalid', confirmed: true, githubId: '123' }; },
    token: async email => { calls.push('token'); assert.equal(email, 'owner@example.invalid'); return { ownerId: 'owner-id', hash: 'test-token' }; },
    verify: async hash => { calls.push('verify'); assert.equal(hash, 'test-token'); return { userId: 'owner-id', issued: true }; },
    authorize: async () => { calls.push('authorize'); },
    revoke: async () => { calls.push('revoke'); },
    ...overrides,
  } };
}
test('session issuance keeps the existing owner and checks authorization after token verification', async () => {
  const { api, calls } = operations();
  await flow.completeOwnerSession('owner-id', '123', api);
  assert.deepEqual(calls, ['owner', 'token', 'verify', 'authorize']);
});
test('missing owner, mismatched identity and unconfirmed email never generate a token', async () => {
  for (const owner of [null, { id: 'other', email: 'x', confirmed: true, githubId: '123' },
    { id: 'owner-id', email: 'x', confirmed: true, githubId: 'other' },
    { id: 'owner-id', email: 'x', confirmed: false, githubId: '123' }]) {
    const { api, calls } = operations({ owner: async () => owner });
    await assert.rejects(flow.completeOwnerSession('owner-id', '123', api), { status: 503 });
    assert.deepEqual(calls, []);
  }
});
test('a generated token for another user is never consumed', async () => {
  const { api, calls } = operations({ token: async () => ({ ownerId: 'other', hash: 'wrong' }) });
  await assert.rejects(flow.completeOwnerSession('owner-id', '123', api), { status: 503 });
  assert.deepEqual(calls, ['owner']);
});
test('new sessions are revoked on wrong verified user or failed RLS authorization', async () => {
  for (const overrides of [
    { verify: async () => ({ userId: 'other', issued: true }) },
    { authorize: async () => { throw new Error('RLS denied'); } },
  ]) {
    const { api, calls } = operations(overrides);
    await assert.rejects(flow.completeOwnerSession('owner-id', '123', api), { status: 503, code: 'owner_session_unavailable' });
    assert.equal(calls.at(-1), 'revoke');
  }
});
