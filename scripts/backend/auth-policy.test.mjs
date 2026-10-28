import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const directory=mkdtempSync(join(tmpdir(),'dashboard-auth-policy-'));
let policy;
try {
  execFileSync('pnpm',['exec','tsc','--ignoreConfig','--target','es2022','--module','commonjs','--skipLibCheck','--outDir',directory,'lib/auth/policy.ts'],{stdio:'pipe'});
  policy=createRequire(import.meta.url)(join(directory,'policy.js'));
} finally { rmSync(directory,{recursive:true,force:true}); }
test('callback redirects remain internal including encoded and backslash attacks',()=>{
  for(const next of ['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/\nevil','/auth/callback','/api/notes',undefined]) assert.equal(policy.safeNext(next),'/developer');
  assert.equal(policy.safeNext('/'),'/');
  assert.equal(policy.safeNext('/apps/notes?filter=all'),'/apps/notes?filter=all');
});
test('cookie mutations require exact configured Origin and reject cross-site',()=>{
  for(const headers of [{},{origin:'https://evil.test'},{origin:'http://localhost:3000','sec-fetch-site':'cross-site'}]) {
    assert.throws(()=>policy.checkOrigin(new Request('http://localhost:3000/api/notes',{method:'POST',headers}),'http://localhost:3000'),{status:403,code:'invalid_origin'});
  }
  policy.checkOrigin(new Request('http://localhost:3000/api/notes',{method:'POST',headers:{origin:'http://localhost:3000'}}),'http://localhost:3000');
});
test('owner env absent or mismatched fails closed',()=>{
  assert.throws(()=>policy.checkOwnerConfiguration('uuid','123',{}),{status:500});
  assert.throws(()=>policy.checkOwnerConfiguration('uuid','123',{APP_OWNER_USER_ID:'other',GITHUB_OWNER_ID:'123'}),{status:403});
  policy.checkOwnerConfiguration('uuid','123',{APP_OWNER_USER_ID:'uuid',GITHUB_OWNER_ID:'123'});
});
test('hosted feature policy permits retained demo reads and real feed without opening legacy writes',()=>{
  for(const path of ['/api/developer','/api/developer/feed','/api/blog','/api/developer/feed/']) {
    policy.checkHostedFeature(path,'GET');
    policy.checkHostedFeature(path,'HEAD');
    for(const method of ['POST','PUT','PATCH','DELETE']) assert.throws(()=>policy.checkHostedFeature(path,method),{status:403,code:'feature_not_enabled'});
  }
  for(const path of ['/api/today','/api/ticket','/api/userprofile/get-gallery','/api/developer/unknown','/api/blog/unknown']) assert.throws(()=>policy.checkHostedFeature(path,'GET'),{status:403,code:'feature_not_enabled'});
  for(const path of ['/api/notes','/api/calendar','/api/profile','/api/preferences','/api/finance']) policy.checkHostedFeature(path,'POST');
});
