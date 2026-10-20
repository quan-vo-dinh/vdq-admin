import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { localDomainSession } from './local-domain-session.mjs';
const {cookie,sql,owner,status,token}=localDomainSession();
const base=process.env.DOMAIN_TEST_URL??'http://localhost:3000';
assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base));
const ids=[];let count=0;
async function req(path,method='GET',body,auth=true){const r=await fetch(base+'/api/'+path,{method,headers:{cookie:auth?cookie:'',origin:'http://localhost:3000','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
async function check(name,fn){await fn();count++;console.log('PASS '+name);}
const db=createClient(status.API_URL,status.PUBLISHABLE_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
const date='2097-10-20',source='2097-10-19';
assert.equal(sql(`select count(*) from public.today_items where owner_id='${owner}' and item_date in ('${date}','${source}');`),'0','Fixture dates must be empty');
const event={title:'P05 overnight fixture',description:'VN midnight',start:'2097-10-31T23:30',end:'2097-11-01T01:00',allDay:false,color:'blue',category:'work',kind:'event',status:'planned',priority:'medium',location:'',attendees:''};
const beforeSettings=(await req('calendar')).body;
try {
 await check('four concurrent Today creates: three commits, completed still occupies slot',async()=>{
 const results=await Promise.all(Array.from({length:4},()=>{const id=randomUUID();ids.push(id);return req('today','POST',{id,title:'P05 priority fixture',category:'work',date});}));
 assert.deepEqual(results.map(r=>r.status).sort(),[201,201,201,409]);
 const items=results.find(r=>r.status===201).body.filter(i=>ids.includes(i.id));assert.equal(items.length,3);
 const item=items[0];assert.equal((await req('today','PATCH',{id:item.id,action:'toggle',done:true,expectedRevision:item.revision})).status,200);
 const id=randomUUID();ids.push(id);assert.equal((await req('today','POST',{id,title:'full',category:'work',date})).status,409);
 });
 await check('move into full day rolls back source; stale moves/toggles/deletes conflict; retry create same UUID',async()=>{
 const id=randomUUID();ids.push(id);const body={id,title:'source',category:'personal',date:source};
 assert.equal((await req('today','POST',body)).status,201);assert.equal((await req('today','POST',body)).body.filter(i=>i.id===id).length,1);
 assert.equal((await req('today','PATCH',{id,action:'move',date,expectedRevision:1})).status,409);
 let items=(await req('today')).body;assert.equal(items.find(i=>i.id===id).date,source);
 assert.equal((await req('today','PATCH',{id,action:'toggle',done:true,expectedRevision:1})).status,200);
 for(const [method,patch] of [['PATCH',{action:'toggle',done:false}],['PATCH',{action:'move',date}],['DELETE',{}]])assert.equal((await req('today',method,{id,expectedRevision:1,...patch})).status,409);
 });
 await check('direct Today insert/move columns and revision tampering denied',async()=>{
 assert.equal((await db.from('today_items').insert({id:randomUUID(),owner_id:owner,item_date:date,slot:1,title:'bad',category:'work'})).error.code,'42501');
 assert.equal((await db.from('today_items').update({item_date:source}).eq('id',ids[0])).error.code,'42501');
 assert.equal((await db.from('notes').update({revision:99}).eq('id',randomUUID())).error.code,'42501');
 });
 await check('Calendar timed UTC+7 roundtrip, overlap from preceding month, CAS and resize/move payload',async()=>{
 const id=randomUUID();ids.push(id);const body={id,...event};
 const added=await req('calendar','POST',body);assert.equal(added.status,201);assert.equal((await req('calendar','POST',body)).body.events.filter(e=>e.id===id).length,1);
 let saved=(await req('calendar?from=2097-11-01&to=2097-11-02')).body.events.find(e=>e.id===id);assert.equal(saved.start,event.start);assert.equal(saved.end,event.end);
 assert.equal(sql(`select starts_at at time zone 'UTC' from public.calendar_events where id='${id}';`),'2097-10-31 16:30:00');
 assert.equal((await req('calendar','PUT',{...saved,end:'2097-11-01T02:00',expectedRevision:1})).status,200);
 assert.equal((await req('calendar','PUT',{...saved,end:'2097-11-01T03:00',expectedRevision:1})).status,409);
 assert.equal((await req('calendar','DELETE',{id,expectedRevision:1})).status,409);
 saved=(await req('calendar')).body.events.find(e=>e.id===id);assert.equal(saved.revision,2);assert.equal(saved.end,'2097-11-01T02:00');
 });
 await check('all-day dates end exclusive and window excludes touching boundary',async()=>{
 const id=randomUUID();ids.push(id);assert.equal((await req('calendar','POST',{id,...event,allDay:true,start:'2097-10-31T00:00',end:'2097-11-02T00:00'})).status,201);
 assert.ok((await req('calendar?from=2097-11-01&to=2097-11-02')).body.events.some(e=>e.id===id));
 assert.ok(!(await req('calendar?from=2097-11-02&to=2097-11-03')).body.events.some(e=>e.id===id));
 assert.equal(sql(`select starts_on::text||'/'||ends_on::text||'/'||(starts_at is null)::text from public.calendar_events where id='${id}';`),'2097-10-31/2097-11-02/true');
 });
 await check('settings persist and stale settings cannot overwrite',async()=>{
 const body={...beforeSettings.settings,badgeStyle:beforeSettings.settings.badgeStyle==='dot'?'mixed':'dot',expectedRevision:beforeSettings.settingsRevision};
 assert.equal((await req('calendar','PATCH',body)).status,200);assert.equal((await req('calendar','PATCH',body)).status,409);
 assert.equal((await req('calendar')).body.settings.badgeStyle,body.badgeStyle);
 });
 await check('Notes renderer normalizes unsafe direct Data API content',async()=>{
 const id=randomUUID();ids.push(id);
 const result=await db.from('notes').insert({id,title:'P04 unsafe fixture',content:{type:'doc',content:[{type:'image',attrs:{src:'javascript:bad'}}]}});assert.equal(result.error,null);
 const note=(await req('notes')).body.data.find(n=>n.id===id);assert.equal(note.content.content[0].type,'paragraph');assert.ok(!JSON.stringify(note.content).includes('javascript:'));
 });
 await check('anonymous Notes/Today/Calendar requests denied',async()=>{for(const path of ['notes','today','calendar'])for(const method of ['GET','POST','DELETE'])assert.equal((await req(path,method,method==='GET'?null:{},false)).status,401);});
 console.log(`${count}/${count} local domain integration groups PASS`);
} finally {
 // Only IDs created by this run; never delete rows by date/title or reset registry.
 for(const table of ['notes','today_items','calendar_events']) {const r=await db.from(table).delete().in('id',ids);assert.equal(r.error,null);}
 const current=(await req('calendar')).body;
 if(JSON.stringify(current.settings)!==JSON.stringify(beforeSettings.settings))assert.equal((await req('calendar','PATCH',{...beforeSettings.settings,expectedRevision:current.settingsRevision})).status,200);
}
