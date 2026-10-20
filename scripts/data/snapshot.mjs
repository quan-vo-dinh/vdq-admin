import { createHash, randomBytes, randomUUID, createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'node:crypto';
import { readFile, realpath, mkdir } from 'node:fs/promises';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { atomicOutput } from '../backend/atomic-output.mjs';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function unique(rows, label) {
  if (!Array.isArray(rows) || rows.some(r => !r || typeof r !== 'object' || !['string', 'number'].includes(typeof r.id)) || new Set(rows.map(r => String(r.id))).size !== rows.length) throw new Error(`Invalid/duplicate IDs: ${label}`);
  return rows;
}
export function describe(domain, data) {
  let rows;
  if (domain === 'calendar') {
    rows = unique(data.events, domain);
    if (!data.settings || rows.some(r => !uuid.test(r.id) || typeof r.allDay !== 'boolean' || typeof r.start !== 'string' || typeof r.end !== 'string' || r.end <= r.start)) throw new Error('Invalid calendar snapshot');
  } else if (domain === 'today') {
    rows = unique(data, domain);
    const counts = new Map();
    for (const r of rows) {
      counts.set(r.date, (counts.get(r.date) ?? 0) + 1);
      if (!uuid.test(r.id) || typeof r.done !== 'boolean' || !/^\d{4}-\d{2}-\d{2}$/.test(r.date) || counts.get(r.date) > 3) throw new Error('Invalid Today snapshot/capacity');
    }
  } else if (domain === 'notes') {
    rows = unique(data.data ?? data, domain);
    if (rows.some(r => !Number.isSafeInteger(r.id) || !r.content || r.content.type !== 'doc' || typeof r.title !== 'string')) throw new Error('Invalid Notes snapshot');
  } else if (domain === 'finance') {
    unique(data.accounts, 'accounts'); unique(data.budgets, 'budgets'); unique(data.goals, 'goals'); unique(data.bills, 'bills');
    rows = unique(data.transactions, domain);
    if (rows.some(r => !Number.isSafeInteger(r.amount) || r.amount <= 0 || !data.accounts.some(a => a.id === r.account) || (r.kind === 'transfer' && (r.account === r.destination || !data.accounts.some(a => a.id === r.destination))))) throw new Error('Invalid finance snapshot');
  } else if (domain === 'learning') { rows = unique(data.habits, domain); }
  else if (domain === 'profile') { if (!data.personal || !data.address) throw new Error('Expected personal + address objects'); rows = []; }
  else throw new Error('Unsupported domain');
  const counts = domain === 'finance' ? Object.fromEntries(['accounts', 'budgets', 'goals', 'bills', 'transactions'].map(k => [k, data[k].length])) : { records: rows.length };
  return { counts, sourceIds: rows.map(r => r.id), proposedIdMap: rows.map(r => ({ source: r.id, destination: ['today', 'calendar'].includes(domain) ? r.id : randomUUID() })), samples: { richText: domain === 'notes' && rows.some(r => JSON.stringify(r.content).includes('marks')), allDay: domain === 'calendar' && rows.some(r => r.allDay), transfer: domain === 'finance' && rows.some(r => r.kind === 'transfer') } };
}
export async function stableRead(file) {
  // Atomic rename stores can change during export: two identical reads or fail without writing.
  const first = await readFile(file); const second = await readFile(file);
  if (!first.equals(second)) throw new Error('Source changed during snapshot; retry after writes settle');
  return first;
}
export function seal(bundle, publicKey) {
  const key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(bundle)), cipher.final()]);
  return { format: 'dashboard-snapshot-v1', algorithm: 'RSA-OAEP-SHA256+AES-256-GCM', key: publicEncrypt({ key: publicKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, key).toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), encrypted: encrypted.toString('base64') };
}
export function open(envelope, privateKey) {
  if (envelope.format !== 'dashboard-snapshot-v1' || envelope.algorithm !== 'RSA-OAEP-SHA256+AES-256-GCM') throw new Error('Unknown snapshot format');
  const key = privateDecrypt({ key: privateKey, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(envelope.key, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const bundle = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.encrypted, 'base64')), decipher.final()]));
  if (bundle.schemaVersion !== 1 || !Array.isArray(bundle.datasets)) throw new Error('Invalid bundle');
  for (const source of bundle.datasets) {
    const bytes = Buffer.from(source.bytes, 'base64');
    if (sha256(bytes) !== source.sha256) throw new Error('Checksum mismatch');
    const checked = describe(source.domain, JSON.parse(bytes));
    if (JSON.stringify(checked.counts) !== JSON.stringify(source.counts) || JSON.stringify(checked.sourceIds) !== JSON.stringify(source.sourceIds)) throw new Error('Manifest count/ID mismatch');
  }
  return bundle;
}
async function outsideRepo(file) {
  const full = resolve(file);
  await mkdir(dirname(full), { recursive: true, mode: 0o700 });
  const parent = await realpath(dirname(full));
  const rel = relative(await realpath(process.cwd()), parent);
  if (!rel || (!rel.startsWith('..') && !isAbsolute(rel))) throw new Error('Snapshot/key output must be outside this Git workspace');
  return full;
}
async function main() {
  const { values: v } = parseArgs({ options: { mode: { type: 'string' }, key: { type: 'string' }, output: { type: 'string' }, input: { type: 'string' }, classification: { type: 'string' }, calendar: { type: 'string' }, today: { type: 'string' }, notes: { type: 'string' }, finance: { type: 'string' }, learning: { type: 'string' }, profile: { type: 'string' }, 'notes-url': { type: 'string' } } });
  if (!v.key) throw new Error('Specify a public key for export or private key for verify');
  const key = await readFile(v.key);
  if (v.mode === 'verify') {
    const bundle = open(JSON.parse(await readFile(v.input, 'utf8')), key);
    console.log(JSON.stringify({ verified: true, classification: bundle.classification, datasets: bundle.datasets.map(s => ({ domain: s.domain, counts: s.counts, sha256: s.sha256 })) }, null, 2));
    return;
  }
  if (v.mode !== 'export' || !['demo', 'personal', 'unclassified'].includes(v.classification) || !v.output) throw new Error('Use --mode export --classification demo|personal|unclassified --output OUTSIDE_REPO --key PUBLIC.pem');
  const datasets = [];
  for (const domain of ['calendar', 'today', 'notes', 'finance', 'learning', 'profile']) {
    let bytes, source;
    if (domain === 'notes' && v['notes-url']) {
      const url = new URL(v['notes-url']);
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.pathname !== '/api/notes' || url.protocol !== 'http:' || url.username || url.password || url.search || url.hash) throw new Error('Notes export accepts only existing loopback /api/notes');
      const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error', cache: 'no-store' });
      if (!response.ok) throw new Error('Live Notes export failed; do not restart the source server');
      bytes = Buffer.from(await response.arrayBuffer()); source = url.href;
    } else if (v[domain]) { bytes = await stableRead(v[domain]); source = resolve(v[domain]); }
    else continue;
    datasets.push({ domain, source, capturedAt: new Date().toISOString(), sha256: sha256(bytes), ...describe(domain, JSON.parse(bytes)), bytes: bytes.toString('base64') });
  }
  if (!datasets.length) throw new Error('No source selected; nothing exported');
  const bundle = { schemaVersion: 1, timezone: 'Asia/Ho_Chi_Minh', exportedAt: new Date().toISOString(), classification: v.classification, importDecision: 'DENY_UNTIL_DOMAIN_PHASE_REVIEW', datasets };
  const output = await outsideRepo(v.output);
  atomicOutput(output, JSON.stringify(seal(bundle, key)), { replace: false });
  console.log(JSON.stringify({ exported: true, datasets: datasets.map(s => ({ domain: s.domain, counts: s.counts, sha256: s.sha256 })) }, null, 2));
}
if (process.argv[1] === new URL(import.meta.url).pathname) main().catch(() => { console.error('Snapshot failed: invalid source/options, changed source, key/output conflict, or failed decryption/preflight. No source was changed.'); process.exitCode = 1; });
