import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadValidator } from './env.mjs';
import { generateTypes } from './generate-types.mjs';
import { atomicOutput } from './atomic-output.mjs';
const validate = loadValidator();
const local = { APP_ENV: 'local', APP_ORIGIN: 'http://localhost:3000', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_syntheticTestValue12345' };
test('missing, placeholder, secret and mismatched environment fail closed', () => {
  assert.equal(validate(local).mode, 'local');
  assert.throws(() => validate({}));
  for (const patch of [{ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' }, { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_test' }, { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'replace-with-key' }, { NEXT_PUBLIC_SUPABASE_URL: 'https://wcgdvsiiemurehkprvqw.supabase.co' }, { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321/path' }, { APP_ORIGIN: 'https://example.test' }, { VERCEL_ENV: 'preview' }]) assert.throws(() => validate({ ...local, ...patch }));
  const cloud = { ...local, APP_ENV: 'production', APP_ORIGIN: 'https://dashboard.test', SUPABASE_PROJECT_REF: 'wcgdvsiiemurehkprvqw', NEXT_PUBLIC_SUPABASE_URL: 'https://wcgdvsiiemurehkprvqw.supabase.co', VERCEL_ENV: 'production' };
  assert.equal(validate(cloud).mode, 'production');
  assert.throws(() => validate({ ...cloud, APP_ENV: 'preview', VERCEL_ENV: 'preview' }));
  assert.throws(() => validate({ ...cloud, SUPABASE_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa' }));
  assert.equal(validate({ ...cloud, APP_ENV: 'preview', VERCEL_ENV: 'preview', SUPABASE_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa', NEXT_PUBLIC_SUPABASE_URL: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co' }).mode, 'preview');
});
test('failed/empty type generation and exclusive env publication preserve existing files', () => {
  const directory = mkdtempSync(join(tmpdir(), 'backend-atomic-'));
  const output = join(directory, 'database.ts');
  try {
    writeFileSync(output, 'previous');
    assert.throws(() => generateTypes(() => { throw new Error('offline'); }, output));
    assert.throws(() => generateTypes(() => '', output));
    assert.equal(readFileSync(output, 'utf8'), 'previous');
    assert.throws(() => atomicOutput(output, 'overwrite', { replace: false }));
    assert.equal(readFileSync(output, 'utf8'), 'previous');
    generateTypes(() => 'export type Database = { public: {} }', output);
    assert.match(readFileSync(output, 'utf8'), /public:/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
