// Real local credentials sessions only; no imported browser cookies or signed fixture JWTs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';
const app = process.env.P12_TEST_API ?? 'http://localhost:3212';
assert.equal(new URL(app).hostname,'localhost');
const credentials = parseEnv(readFileSync('.env.owner-login.local','utf8'));
const loginBody = JSON.stringify({username:credentials.OWNER_LOGIN_USERNAME,password:credentials.OWNER_LOGIN_PASSWORD});
const origin='https://localhost';
let tokens, client, cookie, created, testUser, admin;
const request = (path,init={}) => fetch(app+path,{...init,headers:{origin,authorization:`Bearer ${tokens?.access_token}`,...init.headers}});
let passed=0;
async function check(name,operation) { await operation(); console.log('PASS '+name); passed++; }
try {
 await check('mobile grant is Origin bound and body bounded', async()=>{
  assert.equal((await fetch(app+'/api/mobile/v1/auth/credentials',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/json'},body:loginBody})).status,403);
  assert.equal((await fetch(app+'/api/mobile/v1/auth/credentials',{method:'POST',headers:{origin,'content-type':'application/json'},body:'x'.repeat(4097)})).status,413);
 });
 await check('real env credentials issue user session without cookies', async()=>{
  const r=await fetch(app+'/api/mobile/v1/auth/credentials',{method:'POST',headers:{origin,'content-type':'application/json'},body:loginBody});
  assert.equal(r.status,200,await r.clone().text().then(t=>r.ok?'':t)); assert.equal(r.headers.get('set-cookie'),null); tokens=await r.json(); assert.ok(tokens.refresh_token); assert.match(r.headers.get('cache-control'),/private.*no-store/);
  const config=await fetch(app+'/api/mobile/v1/auth/config',{headers:{origin}}).then(r=>r.json());
  assert.equal(config.url,'http://127.0.0.1:54321'); client=createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
  assert.equal((await client.auth.setSession(tokens)).error,null);
 });
 await check('web credentials still issue cookie session; same owner as bearer', async()=>{
  const r=await fetch(app+'/api/auth/credentials',{method:'POST',headers:{origin:'http://localhost:3000','content-type':'application/json'},body:loginBody}); assert.equal(r.status,200);
  cookie=r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; '); assert.ok(cookie);
  const web=await fetch(app+'/api/auth/session',{headers:{cookie}}).then(r=>r.json()); const mobile=await request('/api/auth/session').then(r=>r.json()); assert.ok(web.user?.id); assert.equal(web.user.id,mobile.user.id);
 });
 await check('bearer reaches every repository; all private reads use real RLS client', async()=>{
  for(const path of ['/api/notes','/api/calendar','/api/finance','/api/learning/habits','/api/profile','/api/preferences','/api/blog','/api/developer']) { const r=await request(path); assert.equal(r.status,200,path+': '+await r.clone().text().then(t=>r.ok?'':t)); assert.equal(r.headers.get('access-control-allow-origin'),origin); }
 });
 await check('forged bearer cannot fall back to valid web cookie; web CSRF remains enforced', async()=>{
  assert.equal((await request('/api/notes',{headers:{authorization:'Bearer fake.jwt.value',cookie}})).status,401);
  assert.equal((await request('/api/notes',{headers:{authorization:'Basic invalid',cookie}})).status,401);
  assert.equal((await fetch(app+'/api/notes',{method:'POST',headers:{cookie,origin,'content-type':'application/json'},body:'{}'})).status,403);
  assert.equal((await request('/api/notes',{headers:{origin:'https://evil.test'}})).status,403);
 });
 await check('preflight, including error responses, uses exact origin and headers', async()=>{
  const r=await fetch(app+'/api/notes',{method:'OPTIONS',headers:{origin,'access-control-request-method':'PATCH','access-control-request-headers':'authorization,content-type'}}); assert.equal(r.status,204); assert.equal(r.headers.get('access-control-allow-origin'),origin);
  const denied=await fetch(app+'/api/notes',{method:'OPTIONS',headers:{origin:'null','access-control-request-method':'POST'}}); assert.equal(denied.status,403); assert.equal(denied.headers.get('access-control-allow-origin'),null);
 });
 await check('real non-owner Auth user denied by API owner gate and direct RLS', async()=>{
  const env = { ...parseEnv(readFileSync('.env','utf8')), ...parseEnv(readFileSync('.env.local','utf8')) };
  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL,'http://127.0.0.1:54321');
  admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.OWNER_SESSION_SECRET_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
  const email = 'p12-non-owner-' + crypto.randomUUID() + '@example.invalid';
  const createdUser = await admin.auth.admin.createUser({email,email_confirm:true}); assert.equal(createdUser.error,null); testUser=createdUser.data.user.id;
  const link=await admin.auth.admin.generateLink({type:'magiclink',email}); assert.equal(link.error,null);
  const non = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
  try {
   const issued=await non.auth.verifyOtp({type:'email',token_hash:link.data.properties.hashed_token}); assert.equal(issued.error,null);
   const denied=await request('/api/notes',{headers:{authorization:'Bearer '+issued.data.session.access_token}}); assert.equal(denied.status,403);
   const insert=await non.from('notes').insert({id:crypto.randomUUID(),title:'P12 non-owner must fail'}); assert.ok(insert.error); assert.equal(insert.error.code,'42501');
  } finally { await non.auth.signOut({scope:'local'}); }
 });
 await check('owner writes and revision conflicts share cookie/bearer contract',async()=>{
  const title='P12 smoke '+crypto.randomUUID();
  const r=await request('/api/notes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),title,content:{type:'doc',content:[{type:'paragraph'}]},color:'primary',datef:new Date().toISOString()})}); assert.equal(r.status,201,await r.clone().text());
  const result=await r.json(); created=result.item; assert.ok(created?.id,JSON.stringify(result));
  const updated=await fetch(app+'/api/notes',{method:'PUT',headers:{cookie,origin:'http://localhost:3000','content-type':'application/json'},body:JSON.stringify({id:created.id,title:title+' edited',expectedRevision:created.revision})}); assert.equal(updated.status,200,await updated.clone().text());
  const conflict=await request('/api/notes',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({id:created.id,title:'stale',expectedRevision:created.revision})}); assert.equal(conflict.status,409);
 });
 await check('Supabase rotates refresh; refreshed user retains owner access',async()=>{
  const {data,error}=await client.auth.refreshSession({refresh_token:tokens.refresh_token}); assert.equal(error,null); assert.ok(data.session); tokens=data.session; assert.equal((await request('/api/auth/session')).status,200);
 });
} finally {
 if(testUser && admin) assert.equal((await admin.auth.admin.deleteUser(testUser)).error,null);
 if(created?.id) {
  const current=await request('/api/notes').then(r=>r.json()); const note=current.data.find(n=>n.id===created.id);
  if(note) { const r=await request('/api/notes',{method:'DELETE',headers:{'content-type':'application/json'},body:JSON.stringify({id:note.id,expectedRevision:note.revision})}); assert.equal(r.status,200); }
 }
 if(client) { const refresh=tokens?.refresh_token; assert.equal((await client.auth.signOut({scope:'local'})).error,null); const revoked=await client.auth.refreshSession({refresh_token:refresh}); assert.ok(revoked.error); console.log('PASS logout revokes refresh (access JWT may remain valid until expiry)'); }
 if(cookie) assert.equal((await fetch(app+'/api/auth/logout',{method:'POST',headers:{cookie,origin:'http://localhost:3000'}})).status,200);
}
console.log(`${passed} local API groups passed; exact smoke record removed; sessions signed out.`);
