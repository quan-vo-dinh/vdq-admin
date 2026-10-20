import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {localDomainSession} from './local-domain-session.mjs';
const {sql,cookie,status,token,owner}=localDomainSession();
const base=process.env.DOMAIN_TEST_URL??'http://localhost:3000';
const headers={Cookie:cookie,Origin:'http://localhost:3000','Content-Type':'application/json'};
async function api(path,method='GET',body,expected=200){const r=await fetch(base+'/api/'+path,{method,headers,...(body&&{body:JSON.stringify(body)})});const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));assert.match(r.headers.get('cache-control'),/no-store/);return d;}
const goal=randomUUID();let profile,prefs;
try{
 profile=await api('profile');prefs=await api('preferences');
 const p=await api('profile','PATCH',{expectedRevision:profile.revision,personal:{...profile.personal,firstName:'QA P08',email:'qa@example.com'}});
 await api('profile','PATCH',{expectedRevision:profile.revision,address:{location:'stale'}},409);
 await api('profile','PATCH',{expectedRevision:p.revision,personal:{github:'javascript:alert(1)'}},400);
 await api('profile','PATCH',{expectedRevision:p.revision,personal:{authIdentity:'bad'}},400);
 assert.equal((await api('profile')).personal.firstName,'QA P08');
 await api('preferences','PATCH',{expectedRevision:prefs.revision,locale:'en',theme:'dark'});
 await api('preferences','PATCH',{expectedRevision:prefs.revision,theme:'light'},409);
 assert.equal((await api('preferences')).theme,'dark');
 assert.equal(sql('select user_id from private.app_owner'),owner);
 console.log('PASS Profile/preferences persistence, CAS conflict, whitelist/URL validation, unchanged owner identity');
 await api('finance/goals','POST',{id:goal,name:'QA P08 image',target:'100000',allocated:'0',monthly:'1',deadline:'2027-01-01',priority:'normal',visual:'study'},201);
 const image=await sharp({create:{width:48,height:32,channels:3,background:'#123456'}}).png().toBuffer();
 async function upload(bytes,rev=1,mime='image/png',expected=200){const r=await fetch(`${base}/api/finance/goals/image?id=${goal}&revision=${rev}`,{method:'POST',headers:{...headers,'Content-Type':mime},body:bytes});const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));return d;}
 await upload(Buffer.from('fake'),1,'image/png',400);await upload(image,1,'image/jpeg',400);await upload(Buffer.alloc(2097153),1,'image/png',413);
 const attached=await upload(image);assert.equal(attached.revision,2);
 const path=sql(`select image_path from finance_goals where id='${goal}'`);assert.match(path,new RegExp('^'+owner+'/goals/'));
 const signed=await api(`finance/goals/image?id=${goal}`);assert.equal(signed.expiresIn,120);assert.equal((await fetch(signed.url)).status,200);
 if(process.env.TEST_SIGNED_EXPIRY==='1'){console.log('Waiting for actual 120-second signed URL expiry');await new Promise(r=>setTimeout(r,122000));assert.ok((await fetch(signed.url)).status>=400);assert.equal((await fetch((await api(`finance/goals/image?id=${goal}`)).url)).status,200);console.log('PASS actual signed expiry and refreshed URL');}
 await upload(image,1,'image/png',409);assert.equal(sql(`select image_path from finance_goals where id='${goal}'`),path);
 const attempts=await Promise.all([fetch(`${base}/api/finance/goals/image?id=${goal}&revision=2`,{method:'POST',headers:{...headers,'Content-Type':'image/png'},body:image}),fetch(`${base}/api/finance/goals/image?id=${goal}&revision=2`,{method:'POST',headers:{...headers,'Content-Type':'image/png'},body:image})]);assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);console.log('PASS concurrent attach CAS loser cleans new object');assert.equal(sql(`select count(*) from storage.objects where bucket_id='personal-media' and name='${path}'`),'0');
 const wrong=await fetch(status.API_URL+'/storage/v1/object/personal-media/'+randomUUID()+'/goals/'+randomUUID()+'.png',{method:'POST',headers:{apikey:status.ANON_KEY,Authorization:'Bearer '+token,'Content-Type':'image/png'},body:image});assert.ok(wrong.status>=400);
 const anon=await fetch(status.API_URL+'/storage/v1/object/authenticated/personal-media/'+path,{headers:{apikey:status.ANON_KEY}});assert.ok(anon.status>=400);
 for(const endpoint of ['profile','preferences',`finance/goals/image?id=${goal}`])assert.equal((await fetch(base+'/api/'+endpoint)).status,401);
 await api(`finance/goals/image?id=${goal}&revision=3`,'DELETE');assert.equal(sql(`select image_path is null from finance_goals where id='${goal}'`),'t');
 console.log('PASS private goal upload/decode/size/MIME/prefix, signed read TTL, stale attach preserves old, replacement cleanup, remove, anonymous denial');
}finally{
 if(profile){const r=await api('profile');await api('profile','PATCH',{expectedRevision:r.revision,personal:profile.personal,address:profile.address});}
 if(prefs){const r=await api('preferences');await api('preferences','PATCH',{expectedRevision:r.revision,locale:prefs.locale,theme:prefs.theme});}
 sql(`delete from finance_goals where id='${goal}'`);
}
