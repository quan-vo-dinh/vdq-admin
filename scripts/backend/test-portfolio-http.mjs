// Read-only route checks; works against a running local or deployed app.
import assert from 'node:assert/strict';
const origin=new URL(process.argv[2]??'http://localhost:3000').origin;
const request=(path,options={})=>fetch(origin+path,{...options,redirect:'manual',signal:AbortSignal.timeout(20000)});
for(const locale of ['vi','en']){
 const r=await request('/',{headers:{Cookie:`portfolio-locale=${locale}`}});assert.equal(r.status,200);
 const html=await r.text(),rendered=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
 assert.ok(html.includes(`rel="canonical" href="${origin}/"`));
 assert.ok(html.includes(`content="${locale==='vi'?'vi_VN':'en_US'}"`));
 assert.ok(rendered.includes('Portfolio appearance and language'));
 assert.ok(rendered.includes(locale==='vi'?'Chuyển sang tiếng Anh':'Switch to Vietnamese'));
 assert.ok(!rendered.includes('pointer-events-none fixed inset-x-0 bottom-4'));
 assert.ok(rendered.indexOf('Portfolio appearance and language')<rendered.indexOf('id="hero"'));
}
const alias=await request('/portfolio?from=old');assert.equal(alias.status,308);assert.equal(new URL(alias.headers.get('location'),origin).href,origin+'/?from=old');
await Promise.all(['/developer','/apps/portfolio','/apps/portfolio/preview'].map(async path=>{const r=await request(path);assert.equal(r.status,307,path);assert.ok(r.headers.get('location').includes('/auth/auth2/login'),path);}));
const api=await request('/api/portfolio/draft');assert.equal(api.status,401);
console.log(JSON.stringify({result:'PASS',origin,checks:'anonymous root VI/EN 200, canonical/OG locale, adjacent top controls before hero, no bottom dock markup, old URL 308 with query preserved, private dashboard/editor/preview gates, API 401'}));
