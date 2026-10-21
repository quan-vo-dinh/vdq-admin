import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const temporary = mkdtempSync(join(tmpdir(), 'p12-contract-'));
let policy, body;
try {
 execFileSync('pnpm', ['exec','tsc','--ignoreConfig','--target','es2022','--module','commonjs','--skipLibCheck','--types','node','--outDir',temporary,'lib/auth/mobile-policy.ts','lib/auth/read-credentials.ts'], {stdio:'pipe'});
 const require = createRequire(import.meta.url); policy = require(join(temporary, 'mobile-policy.js')); body = require(join(temporary, 'read-credentials.js'));
} finally { rmSync(temporary, {recursive:true,force:true}); }
test('mobile origin/preflight is exact and does not enable cookie credentials', () => {
 for (const origin of ['null','http://localhost','https://localhost:123','https://evil.test']) {
  const request = new Request('https://api.test/api/notes',{method:'OPTIONS',headers:{origin,'access-control-request-method':'POST'}});
  assert.throws(() => policy.mobilePreflight(request),{status:403});
  assert.equal(policy.mobileCors(request,new Response()).headers.get('access-control-allow-origin'),null);
 }
 const request = new Request('https://api.test/api/notes',{method:'OPTIONS',headers:{origin:'https://localhost','access-control-request-method':'PATCH','access-control-request-headers':'Authorization, Content-Type'}});
 const response = policy.mobilePreflight(request); assert.equal(response.status,204); assert.equal(response.headers.get('access-control-allow-origin'),'https://localhost'); assert.equal(response.headers.get('access-control-allow-credentials'),null);
 for (const extra of [{'access-control-request-method':'TRACE'},{'access-control-request-headers':'x-admin-key'}]) {
  const headers = new Headers(request.headers); Object.entries(extra).forEach(([key,value]) => headers.set(key,value)); assert.throws(() => policy.mobilePreflight(new Request(request,{headers})),{status:403});
 }
});
test('invalid Authorization is never interpreted as absent/cookie fallback', () => {
 assert.equal(policy.bearerToken(new Request('https://api.test')),undefined);
 assert.equal(policy.bearerToken(new Request('https://api.test',{headers:{authorization:'Bearer a.b.c'}})),'a.b.c');
 for (const authorization of ['','Basic xyz','Bearer x y','bearer fake','Bearer '+ 'x'.repeat(8200)]) assert.throws(() => policy.bearerToken(new Request('https://api.test',{headers:{authorization}})),{status:401});
});
test('credentials stream is bounded without Content-Length and malformed input rejected', async () => {
 const request = value => new Request('https://api.test',{method:'POST',body:value});
 assert.deepEqual(await body.readCredentials(request('{"username":"owner"}')),{username:'owner'});
 for (const value of ['[]','null','bad']) await assert.rejects(body.readCredentials(request(value)),{status:400});
 await assert.rejects(body.readCredentials(request('x'.repeat(4097))),{status:413});
});
test('every user dashboard route is mapped without reviving Today or internal layout pages', () => {
 const routes=JSON.parse(readFileSync('mobile/routes.json','utf8'));
 const files=readdirSync('app/(dashboard-layout)',{recursive:true}).filter(f=>f.endsWith('page.tsx')&&!f.startsWith('layout/'));
 for(const file of files) {
  const path='/'+file.replace(/\/?page\.tsx$/,'').replace('[slug]',':slug');
  assert.ok(routes.some(route=>route.path===path),path);
 }
 assert.ok(!routes.some(route=>route.path.includes('today')||route.path.startsWith('/layout/')));
 assert.equal(routes.find(route=>route.path==='/developer/inbox').redirect,'/developer?view=inbox');
});

test('slow credential stream is cancelled at the deadline', async () => {
 let cancelled = false;
 const stream = new ReadableStream({ cancel() { cancelled = true; } });
 const request = new Request('https://api.test', { method: 'POST', body: stream, duplex: 'half' });
 await assert.rejects(body.readCredentials(request, 20), { status: 400, code: 'body_timeout' });
 assert.equal(cancelled, true);
});
