import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {localDomainSession} from './local-domain-session.mjs';
const {cookie}=localDomainSession();const base='http://localhost:3000';
async function request(path,method='GET',body,auth=true){const headers={...(auth?{Cookie:cookie,Origin:base}:{}),...(body&&!(body instanceof Buffer)?{'Content-Type':'application/json'}:{})};return fetch(base+path,{method,headers,body:body instanceof Buffer?body:body?JSON.stringify(body):undefined,redirect:'manual'});}
const initial=JSON.parse(readFileSync('lib/portfolio/initial-content.json','utf8'));
let r=await request('/api/portfolio/draft');assert.equal(r.status,200);let site=(await r.json()).site;
if(!site){r=await request('/api/portfolio/draft','PATCH',{document:initial,expectedRevision:0});assert.equal(r.status,200);site=(await r.json()).site;r=await request('/api/portfolio/publish','POST',{expectedRevision:site.revision});assert.equal(r.status,200);site=(await r.json()).site;}
const baseline=structuredClone(site.draft);let revision=site.revision;let uploaded;
try{
 r=await request('/api/portfolio/draft','GET',undefined,false);assert.equal(r.status,401);
 r=await fetch(base+'/api/portfolio/publish',{method:'POST',headers:{Cookie:cookie,Origin:'https://evil.invalid','Content-Type':'application/json'},body:JSON.stringify({expectedRevision:revision})});assert.equal(r.status,403);
 const bytes=await sharp({create:{width:64,height:40,channels:3,background:'#507c8a'}}).png().toBuffer();r=await request('/api/portfolio/media','POST',bytes);assert.equal(r.status,201);uploaded=(await r.json()).media;
 r=await request(`/api/portfolio/public/media/${uploaded.id}`,'GET',undefined,false);assert.equal(r.status,404);
 r=await request(`/api/portfolio/media/${uploaded.id}`);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal((await sharp(Buffer.from(await r.arrayBuffer())).metadata()).format,'webp');
 const document=structuredClone(baseline);document.locales.vi.avatarUrl='media:'+uploaded.id;
 r=await request('/api/portfolio/draft','PATCH',{document,expectedRevision:revision});assert.equal(r.status,200);revision=(await r.json()).site.revision;
 r=await request('/api/portfolio/draft','PATCH',{document,expectedRevision:revision-1});assert.equal(r.status,409);
 r=await request(`/api/portfolio/public/media/${uploaded.id}`,'GET',undefined,false);assert.equal(r.status,404);
 r=await request('/apps/portfolio/preview');assert.equal(r.status,200);assert.ok((await r.text()).includes('Private draft'));
 r=await request('/api/portfolio/publish','POST',{expectedRevision:revision});assert.equal(r.status,200);const published=await r.json();revision=published.site.revision;
 r=await request(`/api/portfolio/public/media/${uploaded.id}`,'GET',undefined,false);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');assert.equal((await sharp(Buffer.from(await r.arrayBuffer())).metadata()).format,'webp');
 r=await request('/','GET',undefined,false);assert.equal(r.status,200);assert.ok((await r.text()).includes('Hi, tui là'));
 console.log(JSON.stringify({checks:11,result:'PASS',scope:'local owner API, CSRF, CAS, draft preview, upload reencode, current-only public media, public route'}));
}finally{
 // Restore original draft and publication through normal API; retained test version/media remains recoverable for backup drill.
 r=await request('/api/portfolio/draft','PATCH',{document:baseline,expectedRevision:revision});assert.equal(r.status,200);revision=(await r.json()).site.revision;
 r=await request('/api/portfolio/publish','POST',{expectedRevision:revision});assert.equal(r.status,200);
}
