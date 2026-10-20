import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {createClient} from '@supabase/supabase-js';
import {localDomainSession} from './local-domain-session.mjs';
import {backup,restore,sql,status,decrypt,tables} from './backup.mjs';
const source=localDomainSession(),dest=status('/tmp/dashboard-p09-drill'),target='supabase_db_dashboard-p09-drill';
if(sql('select count(*) from private.app_owner',target)!=='0'||tables.some(t=>sql(`select count(*) from public.${t}`,target)!=='0'))throw new Error('Drill target must be fresh; refuses to overwrite existing target');
const db=createClient(dest.API_URL,dest.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const targetOwner=randomUUID(),nonOwner=randomUUID();
// Only disposable target: synthetic identity models recovery mapping, not real OAuth consent.
for(const id of [targetOwner,nonOwner]){const r=await db.auth.admin.createUser({id,email:`${id}@example.invalid`,email_confirm:true});if(r.error)throw r.error;}
const github=source.sql('select github_user_id from private.app_owner');
sql(`insert into auth.identities(id,user_id,provider_id,provider,identity_data,created_at,updated_at) values('${randomUUID()}','${targetOwner}','${github}','github','{"sub":"${github}","provider_id":"${github}"}',now(),now());
insert into private.app_owner(user_id,github_user_id) select user_id,provider_id from auth.identities where user_id='${targetOwner}' and provider='github' and identity_data->>'sub'='${github}';`,target);
const ids=Object.fromEntries(['note','event','account','transaction','habit','checkin','goal'].map(k=>[k,randomUUID()]));
const imagePath=`${source.owner}/goals/${randomUUID()}.webp`;
const bytes=await sharp({create:{width:64,height:40,channels:3,background:'#2a9d8f'}}).webp().toBuffer();
const src=createClient(source.status.API_URL,source.status.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const uploaded=await src.storage.from('personal-media').upload(imagePath,bytes,{contentType:'image/webp'});if(uploaded.error)throw uploaded.error;
try{
 source.sql(`begin;
 insert into notes(id,owner_id,title,content) values('${ids.note}','${source.owner}','P09 restore note','{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"P09 restored rich note","marks":[{"type":"bold"}]}]}]}');
 insert into calendar_events(id,owner_id,title,color,category,kind,status,priority,starts_on,ends_on) values('${ids.event}','${source.owner}','P09 all day','blue','personal','event','planned','medium','2026-10-21','2026-10-22');
 insert into finance_accounts(id,owner_id,name,opening) values('${ids.account}','${source.owner}','P09 wallet',1234567);
 insert into finance_transactions(id,owner_id,date,description,amount,kind,account_id,category_id,source) values('${ids.transaction}','${source.owner}',(now() at time zone 'Asia/Ho_Chi_Minh')::date,'P09 expense',12345,'expense','${ids.account}',(select id from finance_categories where code='food' and owner_id='${source.owner}'),'manual');
 insert into finance_goals(id,owner_id,name,target,allocated,monthly,deadline,priority,visual,image_path) values('${ids.goal}','${source.owner}','P09 image goal',100000,0,1000,'2027-01-01','normal','study','${imagePath}');
 insert into learning_habits(id,owner_id,title,target_minutes) values('${ids.habit}','${source.owner}','P09 learning',25);
 insert into learning_checkins(id,owner_id,habit_id,checked_on,minutes) values('${ids.checkin}','${source.owner}','${ids.habit}',(now() at time zone 'Asia/Ho_Chi_Minh')::date,25);
 commit;`);
 const key='/Users/vodinhquan/.config/dashboard-backup-recovery/private.pem';
 const summary=await backup('/Users/vodinhquan/Documents/dashboard-backups',key+'.pub');
 const p=await decrypt(summary.file,key);assert.equal(p.media.length,1);assert.ok(p.data.notes.some(n=>n.id===ids.note));
 const result=await restore(summary.file,key,'/tmp/dashboard-p09-drill');assert.equal(result.ownerRemapped,true);
 assert.equal(sql(`select opening::text from finance_accounts where id='${ids.account}'`,target),'1234567');
 assert.equal(sql(`select amount::text from finance_transactions where id='${ids.transaction}'`,target),'12345');
 assert.equal(sql(`select starts_on::text||'/'||ends_on::text from calendar_events where id='${ids.event}'`,target),'2026-10-21/2026-10-22');
 assert.equal(sql(`select minutes from learning_checkins where id='${ids.checkin}'`,target),'25');
 assert.equal(sql(`select count(*) from notes where id='${ids.note}' and owner_id='${targetOwner}'`,target),'1');
 for(const [id,want] of [[targetOwner,p.data.notes.length],[nonOwner,0]])assert.equal(Number(sql(`begin;set local role authenticated;select set_config('request.jwt.claim.sub','${id}',true);select count(*) from notes;rollback;`,target).split('\n').at(-1)),want);
 // Verified encrypted bundle summary only, no payload or credentials.
 await writeFile('/tmp/p09-drill-state.json',JSON.stringify({targetOwner,nonOwner,github,ids,file:summary.file}),{mode:0o600});
 console.log(JSON.stringify({backup:summary,restore:result,checks:'exact money, VN dates, rich note, check-in, media SHA256, remapped owner/RLS, non-owner denied'},null,2));
}catch(e){console.error(e.message);throw e;}
finally{
 source.sql(`begin;delete from learning_checkins where id='${ids.checkin}';delete from learning_habits where id='${ids.habit}';delete from finance_transactions where id='${ids.transaction}';delete from finance_goals where id='${ids.goal}';delete from finance_accounts where id='${ids.account}';delete from calendar_events where id='${ids.event}';delete from notes where id='${ids.note}';commit;`);
 await src.storage.from('personal-media').remove([imagePath]);
}
