import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
const directory=mkdtempSync(join(tmpdir(),'p12-session-'));
await build({configFile:false,logLevel:'silent',resolve:{alias:{'@/lib/api/timeout-fetch':resolve('lib/api/timeout-fetch.ts')}},plugins:[{name:'session-test-dependencies',enforce:'pre',resolveId(source,importer){if(importer?.includes('/mobile/src/session.ts')&&['@supabase/supabase-js','@capacitor/browser','./secure-storage','./config','@/lib/api/transport'].includes(source))return '\0mock:'+source;},load(id){if(!id.startsWith('\0mock:'))return;const name=id.slice(6);return ({'@supabase/supabase-js':'export const createClient = (...args) => globalThis.__p12.createClient(...args);','@capacitor/browser':'export const Browser = {open: async () => {}, close: async () => {}};','./secure-storage':'export const secureStorage = {get: async k => globalThis.__p12.vault.get(k) ?? null, set: async (k,v) => {globalThis.__p12.vault.set(k,v);},remove: async k => {globalThis.__p12.vault.delete(k);},clear: async () => {globalThis.__p12.vault.clear();}};','./config':"export const apiBase='https://api.test'; export const oauthRedirect='dev.vodinhquan.dashboard://auth/callback';",'@/lib/api/transport':'export const configureApiTransport = value => {globalThis.__p12.transport = value;};'})[name];}}],define:{'import.meta.env.DEV':'false'},build:{lib:{entry:resolve('mobile/src/session.ts'),formats:['es'],fileName:()=> 'session.mjs'},outDir:directory,emptyOutDir:true,minify:false}});
let counter=0;
async function setup() {
 const f={vault:new Map([['refresh','old-refresh']]),refreshes:0,exchanges:0,revoked:[],expired:0,options:null,mode:'ok',transport:null};
 globalThis.__p12=f; globalThis.window=new EventTarget(); window.addEventListener('session-expired',()=>f.expired++);
 const next=()=>({access_token:'new-access',refresh_token:'rotated-refresh',expires_at:Math.floor(Date.now()/1000)+3600});
 const auth={
  async refreshSession(){f.refreshes++;if(f.gate)await f.gate;if(f.mode==='network')return {data:{session:null},error:{status:0}};if(f.mode==='invalid')return {data:{session:null},error:{status:400}};const s=next();await f.options.auth.storage.setItem('dashboard-mobile',JSON.stringify(s));return {data:{session:s},error:null};},
  async signOut(){f.revoked.push(f.vault.get('refresh'));return {error:null};},
  async exchangeCodeForSession(){f.exchanges++;const s=next();await f.options.auth.storage.setItem('dashboard-mobile',JSON.stringify(s));return {data:{session:s},error:null};},
  async signInWithOAuth({options}){f.redirect=options.redirectTo;await f.options.auth.storage.setItem('dashboard-mobile-code-verifier','proof');return {data:{url:'https://github.com/login/oauth'},error:null};},
 };
 f.createClient=(_url,_key,options)=>{f.options=options;return {auth};};
 globalThis.fetch=async url=>new Response(JSON.stringify(String(url).endsWith('/config')?{url:'https://auth.test',publishableKey:'public',credentialsEnabled:true}:{user:{id:'owner'}}),{status:200,headers:{'content-type':'application/json'}});
 const sessionModule=await import(pathToFileURL(join(directory,'session.mjs')).href+'?case='+counter++);await sessionModule.initSession();return {f,sessionModule};
}
try {
 await test('cold restore is single-flight; only refresh/PKCE reach persistent storage',async()=>{
  const {f,sessionModule}=await setup();const values=await Promise.all(Array.from({length:8},()=>sessionModule.accessToken()));assert.equal(f.refreshes,1);assert.ok(values.every(value=>value==='new-access'));assert.equal(f.vault.get('refresh'),'rotated-refresh');assert.equal(await f.options.auth.storage.getItem('dashboard-mobile-code-verifier'),null);
  assert.ok(![...f.vault.values()].some(value=>value.includes('new-access')));await sessionModule.accessToken();assert.equal(f.refreshes,1);
 });
 await test('offline refresh retains secure token and never invents a saved session',async()=>{
  const {f,sessionModule}=await setup();f.mode='network';await assert.rejects(sessionModule.accessToken());assert.equal(f.vault.get('refresh'),'old-refresh');assert.equal(f.expired,0);
 });
 await test('invalid rotated refresh clears private tokens and expires UI',async()=>{
  const {f,sessionModule}=await setup();f.mode='invalid';await assert.rejects(sessionModule.accessToken());assert.equal(f.vault.size,0);assert.equal(f.expired,1);
 });
 await test('logout waits for refresh then revokes rotated session and clears vault',async()=>{
  const {f,sessionModule}=await setup();let release;f.gate=new Promise(resolve=>{release=resolve;});const token=sessionModule.accessToken();const logout=sessionModule.logoutSession();release();await token;await logout;assert.deepEqual(f.revoked,['rotated-refresh']);assert.equal(f.vault.size,0);assert.equal(f.expired,1);
 });
 await test('OAuth callback binds host/path/state, expires, and cannot replay',async()=>{
  const {f,sessionModule}=await setup();await sessionModule.loginGithub();const redirect=new URL(f.redirect);redirect.searchParams.set('code','one-use-code');
  await assert.rejects(sessionModule.handleCallback(redirect.href.replace('://auth/','://evil/')));const wrong=new URL(redirect);wrong.searchParams.set('state','wrong');await assert.rejects(sessionModule.handleCallback(wrong.href));assert.equal(f.exchanges,0);
  await sessionModule.handleCallback(redirect.href);assert.equal(f.exchanges,1);await assert.rejects(sessionModule.handleCallback(redirect.href));assert.equal(f.exchanges,1);
  await sessionModule.loginGithub();const pending=JSON.parse(f.vault.get('oauth'));pending.at=Date.now()-300001;f.vault.set('oauth',JSON.stringify(pending));const stale=new URL(f.redirect);stale.searchParams.set('code','expired');await assert.rejects(sessionModule.handleCallback(stale.href));
 });
} finally {rmSync(directory,{recursive:true,force:true});delete globalThis.__p12;}
