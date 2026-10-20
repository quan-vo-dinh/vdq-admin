import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync } from 'node:crypto';
import { describe, seal, open, sha256 } from './snapshot.mjs';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
function dataset(domain, data) { const bytes = Buffer.from(JSON.stringify(data)); return { domain, sha256: sha256(bytes), ...describe(domain, data), bytes: bytes.toString('base64') }; }
test('encrypted export retains rich text, IDs, counts, all-day and transfers; tamper/wrong key fail', () => {
  const notes = { data: [{ id: 7, title: 'Synthetic', content: { type: 'doc', content: [{ type: 'text', text: 'fixture', marks: [{ type: 'bold' }] }] } }] };
  const calendar = { events: [{ id: '00000000-0000-4000-8000-000000000001', start: '2026-10-20T00:00', end: '2026-10-21T00:00', allDay: true }], settings: {} };
  const finance = { accounts: [{ id: 'a' }, { id: 'b' }], budgets: [], goals: [], bills: [], transactions: [{ id: 't', account: 'a', destination: 'b', kind: 'transfer', amount: 123 }] };
  const bundle = { schemaVersion: 1, classification: 'demo', datasets: [dataset('notes', notes), dataset('calendar', calendar), dataset('finance', finance), dataset('today', [])] };
  const encrypted = seal(bundle, publicKey);
  assert.ok(!JSON.stringify(encrypted).includes('fixture'));
  assert.deepEqual(open(encrypted, privateKey), bundle);
  assert.equal(bundle.datasets[0].samples.richText, true);
  assert.equal(bundle.datasets[1].samples.allDay, true);
  assert.equal(bundle.datasets[2].samples.transfer, true);
  const broken = { ...encrypted, tag: Buffer.alloc(16).toString('base64') };
  assert.throws(() => open(broken, privateKey));
  assert.throws(() => open(encrypted, generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey));
  bundle.datasets[0].sha256 = 'bad';
  assert.throws(() => open(seal(bundle, publicKey), privateKey));
});
test('preflight refuses duplicate IDs, invalid transfer and full Today datasets', () => {
  assert.throws(() => describe('notes', [{ id: 1 }, { id: 1 }]));
  assert.throws(() => describe('finance', { accounts: [{ id: 'a' }], budgets: [], goals: [], bills: [], transactions: [{ id: 't', account: 'a', destination: 'a', kind: 'transfer', amount: 3 }] }));
  assert.throws(() => describe('today', Array.from({ length: 4 }, (_, i) => ({ id: `00000000-0000-4000-8000-00000000000${i}`, date: '2026-10-20', done: false }))));
});
