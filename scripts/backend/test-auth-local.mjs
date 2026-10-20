// Real local Auth + PostgREST + Next requests with synthetic identities, never OAuth acceptance.
// Start test server with APP_OWNER_USER_ID=10000000-0000-4000-8000-000000000001 GITHUB_OWNER_ID=10001.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
const app=process.env.AUTH_TEST_ORIGIN ?? 'http://localhost:3100';
assert.ok(['http://localhost:3100','http://127.0.0.1:3100'].includes(app));
const owner='10000000-0000-4000-8000-000000000001';
const other='10000000-0000-4000-8000-000000000002';
const sql=input=>execFileSync('docker',['exec','-i','supabase_db_dashboard-personal-local','psql','-XAt','-U','postgres','-v','ON_ERROR_STOP=1'],{input,stdio:['pipe','pipe','pipe']}).toString();
const status=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json'],{stdio:['ignore','pipe','pipe']}).toString());
assert.equal(status.API_URL,'http://127.0.0.1:54321');
// Refuse to replace any user's real registry or identities.
assert.equal(sql('select count(*) from private.app_owner;').trim(),'0','registry must be empty for fixture tests');
assert.equal(sql(`select count(*) from auth.users where id in ('${owner}','${other}');`).trim(),'0');
const admin=createClient(status.API_URL,status.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const apiHeaders={apikey:status.PUBLISHABLE_KEY};
let passed=0;
async function check(name,fn){await fn();passed++;console.log(`PASS ${name}`);}
async function session(userId,githubId){
  // The verified magic link is a local fixture transport, NOT enabled password/signup fallback.
  const email=`${githubId}-auth-fixture@example.invalid`;
  const created=await admin.auth.admin.createUser({id:userId,email,email_confirm:true,app_metadata:{provider:'github',providers:['github']}});
  assert.equal(created.error,null);
  sql(`insert into auth.identities (provider_id,user_id,identity_data,provider,created_at,updated_at) values('${githubId}','${userId}','{"sub":"${githubId}","provider_id":"${githubId}"}','github',now(),now());`);
  const link=await admin.auth.admin.generateLink({type:'magiclink',email});
  assert.equal(link.error,null);
  const client=createClient(status.API_URL,status.PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const verified=await client.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'magiclink'});
  assert.equal(verified.error,null);
  const tokens=verified.data.session;
  assert.ok(tokens);
  const jar=new Map();
  const ssr=createServerClient(status.API_URL,status.PUBLISHABLE_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(({name,value})=>jar.set(name,value))}});
  assert.equal((await ssr.auth.setSession(tokens)).error,null);
  return {tokens,cookie:[...jar].map(([name,value])=>`${name}=${value}`).join('; ')};
}
try {
  const own=await session(owner,'10001');
  const non=await session(other,'10002');
  await check('controlled local bootstrap verifies provider identity and is repeatable',async()=>{
    assert.throws(()=>execFileSync('node',['scripts/backend/bootstrap-owner.mjs','99999'],{stdio:'pipe'}));
    for(let retry=0;retry<2;retry++) {
      const output=execFileSync('node',['scripts/backend/bootstrap-owner.mjs','10001'],{stdio:'pipe'}).toString();
      assert.ok(output.includes(`APP_OWNER_USER_ID=${owner}`));
    }
    assert.throws(()=>execFileSync('node',['scripts/backend/bootstrap-owner.mjs','10002'],{stdio:'pipe'}));
  });
  await check('anonymous Next API returns JSON 401',async()=>{
    const r=await fetch(`${app}/api/auth/session`);assert.equal(r.status,401);assert.equal((await r.json()).code,'unauthenticated');
    assert.match(r.headers.get('cache-control'),/private.*no-store/);
  });
  await check('all legacy API boundaries deny anonymous access',async()=>{
    for(const path of ['notes','calendar','today','finance','blog','ticket','developer','developer/feed','userprofile','userprofile/get-gallery','userprofile/get-users','code?file=.env.local']) {
      const r=await fetch(`${app}/api/${path}`);assert.equal(r.status,401,path);
    }
  });
  await check('owner session verified via Auth + registry + GitHub identity',async()=>{
    const r=await fetch(`${app}/api/auth/session`,{headers:{cookie:own.cookie}});assert.equal(r.status,200);assert.equal((await r.json()).user.id,owner);
  });
  await check('non-owner cannot access Next API or dashboard',async()=>{
    const r=await fetch(`${app}/api/auth/session`,{headers:{cookie:non.cookie}});assert.equal(r.status,403);
    const page=await fetch(`${app}/apps/notes`,{headers:{cookie:non.cookie},redirect:'manual'});
    const html=await page.text(); assert.ok(page.status===307 || html.includes('owner_required')); assert.ok(!html.includes('dashboard-inset'));
  });
  await check('anonymous page redirects to login',async()=>{
    const r=await fetch(`${app}/apps/notes`,{redirect:'manual'});assert.equal(r.status,307);assert.match(r.headers.get('location'),/\/auth\/auth2\/login/);
  });
  await check('owner private page renders existing shell',async()=>{
    const r=await fetch(`${app}/apps/notes`,{headers:{cookie:own.cookie}});assert.equal(r.status,200);const body=await r.text();assert.ok(body.includes('dashboard-inset'));assert.match(r.headers.get('cache-control'),/no-store/);
  });
  await check('fake JWT cookie denied',async()=>{
    const r=await fetch(`${app}/api/auth/session`,{headers:{cookie:'sb-127-auth-token=base64-'+Buffer.from(JSON.stringify({access_token:'fake.jwt.value',refresh_token:'fake'})).toString('base64url')}});assert.equal(r.status,401);
  });
  await check('mutations require exact Origin even for owner; no arbitrary code read',async()=>{
    for(const origin of [undefined,'https://evil.test']) {
      const r=await fetch(`${app}/api/notes`,{method:'POST',headers:{cookie:own.cookie,...(origin?{origin}:{})}});assert.equal(r.status,403);assert.equal((await r.json()).code,'invalid_origin');
    }
    const r=await fetch(`${app}/api/code?file=.env.local`,{headers:{cookie:own.cookie}});assert.equal(r.status,403);assert.equal((await r.json()).code,'source_preview_disabled');
  });
  await check('direct Data API owner allowed/non-owner and anon denied; private schema hidden',async()=>{
    for(const [token,expected] of [[own.tokens.access_token,200],[non.tokens.access_token,403],[null,401]]) {
      const r=await fetch(`${status.API_URL}/rest/v1/rpc/assert_owner`,{method:'POST',headers:{...apiHeaders,...(token?{Authorization:`Bearer ${token}`}:{})}});assert.equal(r.status,expected);
    }
    const r=await fetch(`${status.API_URL}/rest/v1/app_owner`,{headers:{...apiHeaders,Authorization:`Bearer ${own.tokens.access_token}`,'Accept-Profile':'private'}});assert.equal(r.status,406);
  });
  await check('disabled registry immediately blocks Next and direct Data API',async()=>{
    sql('update private.app_owner set enabled=false;');
    assert.equal((await fetch(`${app}/api/auth/session`,{headers:{cookie:own.cookie}})).status,403);
    assert.equal((await fetch(`${status.API_URL}/rest/v1/rpc/assert_owner`,{method:'POST',headers:{...apiHeaders,Authorization:`Bearer ${own.tokens.access_token}`}})).status,403);
    sql('update private.app_owner set enabled=true;');
  });
  await check('registry/env mismatch fails closed',async()=>{
    sql("update private.app_owner set github_user_id='99999';");
    const r=await fetch(`${app}/api/auth/session`,{headers:{cookie:own.cookie}});assert.equal(r.status,403);assert.equal((await r.json()).code,'owner_mismatch');
    sql("update private.app_owner set github_user_id='10001';");
  });
  await check('proxy refreshes expired session and returns new cookies without shared cache',async()=>{
    const name=own.cookie.split('=')[0].replace(/\.0$/,'');
    const expired={...own.tokens,expires_at:Math.floor(Date.now()/1000)-30};
    const cookie=`${name}=base64-${Buffer.from(JSON.stringify(expired)).toString('base64url')}`;
    const r=await fetch(`${app}/api/auth/session`,{headers:{cookie}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie')??'',/sb-/);assert.match(r.headers.get('cache-control'),/private.*no-store/);
  });
  await check('callback error and bad next cannot redirect outside app',async()=>{
    const r=await fetch(`${app}/auth/callback?code=invalid&next=//evil.test`,{redirect:'manual'});assert.equal(r.status,307);assert.match(r.headers.get('location'),/^http:\/\/localhost:3100\/auth\/auth2\/login\?error=/);
  });
  await check('logout rejects cross-origin and clears session cookies',async()=>{
    assert.equal((await fetch(`${app}/api/auth/logout`,{method:'POST',headers:{cookie:own.cookie,origin:'https://evil.test'}})).status,403);
    const r=await fetch(`${app}/api/auth/logout`,{method:'POST',headers:{cookie:own.cookie,origin:'http://localhost:3000'}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie')??'',/Max-Age=0/);
  });
  console.log(`${passed} local auth integration checks PASS. Synthetic identities only; GitHub OAuth remains unverified.`);
} finally {
  sql(`delete from private.app_owner where user_id='${owner}';`);
  for(const id of [owner,other]) {
    const result=await admin.auth.admin.deleteUser(id);
    if(result.error) sql(`delete from auth.users where id='${id}';`);
  }
  console.log('Local synthetic auth identities/registry removed. No cloud writes.');
}
