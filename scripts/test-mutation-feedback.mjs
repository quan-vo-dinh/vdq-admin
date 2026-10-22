import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'dashboard-feedback-'));
try {
  execFileSync('pnpm', ['exec', 'tsc', '--ignoreConfig', '--target', 'es2022', '--module', 'commonjs', '--skipLibCheck', '--outDir', directory, 'lib/api/transport.ts', 'lib/api/mutation-feedback.ts']);
  const require = createRequire(import.meta.url);
  const { apiFetch, configureApiTransport } = require(join(directory, 'transport.js'));
  const { MUTATION_FEEDBACK_EVENT, isCrudRequest, mutationMessage } = require(join(directory, 'mutation-feedback.js'));
  const events = [];
  globalThis.window = new EventTarget();
  window.addEventListener(MUTATION_FEEDBACK_EVENT, e => events.push(e.detail));
  let calls = 0;
  configureApiTransport(async () => { calls++; return Response.json({ saved: true }); });
  await apiFetch('/api/notes');
  await apiFetch('/api/auth/session', { method: 'POST' });
  assert.equal(events.length, 0, 'Reads and auth must not generate CRUD notices');
  await apiFetch('/api/finance/transactions', { method: 'POST' });
  assert.equal(events.length, 1);
  assert.equal(events[0].ok, true);
  assert.equal(calls, 3, 'Each action sends only one request');
  await apiFetch('/api/finance/goals/image?id=example', { method: 'DELETE', feedback: false });
  assert.equal(events.length, 1, 'Composite operations can suppress intermediate notices');
  configureApiTransport(async () => Response.json({ code: 'category_has_transactions' }, { status: 409 }));
  const failed = await apiFetch('/api/finance/categories', { method: 'DELETE' });
  assert.deepEqual(await failed.json(), { code: 'category_has_transactions' }, 'Feedback must not consume the caller response');
  assert.equal(events.length, 2);
  assert.match(mutationMessage(events[1], 'vi'), /không thể xóa/);
  configureApiTransport(async () => { throw new Error('connection_lost'); });
  await assert.rejects(apiFetch('/api/calendar', { method: 'PATCH' }), /connection_lost/);
  assert.equal(events.length, 3);
  assert.match(mutationMessage(events[2], 'vi'), /Chưa xác nhận/);
  assert.match(mutationMessage({path:'/api/notes',method:'DELETE',ok:true}, 'en'), /Deleted note/);
  assert.equal(isCrudRequest('/api/finance/import?preview=true', 'GET'), false);
  assert.equal(isCrudRequest('/api/learning/checkins', 'POST'), true);
  console.log('PASS: CRUD success/failure, read/auth exclusion, response integrity, no retries, composite notices, localization.');
} finally {
  delete globalThis.window;
  rmSync(directory, { recursive: true, force: true });
}
