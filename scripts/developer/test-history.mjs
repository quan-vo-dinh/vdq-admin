import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const dir=mkdtempSync(join(tmpdir(),'github-history-test-'));
execFileSync('pnpm',['exec','tsc','--ignoreConfig','--target','es2022','--module','commonjs','--skipLibCheck','--types','node','--outDir',dir,'lib/developer/live/history-model.ts','lib/portfolio/media-policy.ts']);
const require=createRequire(import.meta.url),model=require(join(dir,'developer/live/history-model.js')),media=require(join(dir,'portfolio/media-policy.js'));
process.on('exit',()=>rmSync(dir,{recursive:true,force:true}));
test('calendar windows cover every year without overlapping leap-year boundaries',()=>{
 const tasks=model.calendarTasks('2023-03-27T12:00:00Z','2026-11-05T12:00:00Z');
 assert.deepEqual(tasks.map(t=>t.from.slice(0,4)),['2026','2025','2024','2023']);
 assert.equal(tasks[0].to,'2026-11-05T12:00:00Z');
 for(let i=1;i<tasks.length;i++)assert.equal(Date.parse(tasks[i-1].from)-Date.parse(tasks[i].to),1000);
 assert.ok(Date.parse(tasks[2].from)<Date.parse('2024-02-29'));
});
test('all connected accounts aggregate independently of selected Inbox repositories',()=>{
 const row=(sourceId,n)=>({sourceId,period:'all',contributions:n,prs:n+1,additions:n*10,deletions:n*2,complete:{contributions:true,prs:true,lines:true}});
 const total=model.aggregateTotals([row('work',3),row('personal',5),row('removed',99)],'all',['work','personal']);
 assert.deepEqual(total,{contributions:8,prs:10,additions:80,deletions:16,complete:{contributions:true,prs:true,lines:true}});
 assert.equal(model.aggregateTotals([row('work',3)],'all',['work','personal']).complete.contributions,false);
 assert.equal(model.aggregateTotals([], 'month',[]).complete.lines,false);
});
test('commit facts deduplicate branches and forks and use the Vietnam calendar day',()=>{
 const commit={oid:'abc',committedDate:'2026-11-04T18:00:00Z',additions:120,deletions:45};
 const first=model.commitFact('work','org/repo',commit),second=model.commitFact('work','me/fork',commit);
 assert.equal(first.event_key,second.event_key);assert.equal(first.day,'2026-11-05');assert.equal(first.additions,120);assert.equal(first.deletions,45);
});
test('image selection accepts 5 MB and rejects one extra byte before decoding',async()=>{
 assert.equal(media.PORTFOLIO_IMAGE_MAX_BYTES,5242880);
 const original=new File([new Uint8Array(3*1024*1024)],'photo.png',{type:'image/png'});
 assert.equal(await media.preparePortfolioImage(original),original);
 await assert.rejects(media.preparePortfolioImage(new File([new Uint8Array(5242881)],'large.png',{type:'image/png'})),/image_too_large/);
 await assert.rejects(media.preparePortfolioImage(new File(['svg'],'bad.svg',{type:'image/svg+xml'})),/invalid_image/);
 let closed=false;
 globalThis.createImageBitmap=async()=>({width:4000,height:3000,close(){closed=true;}});
 globalThis.document={createElement(){return {getContext(){return {drawImage(){}};},toBlob(callback,type){assert.equal(this.width,2048);assert.equal(this.height,1536);callback(new Blob(['optimized'],{type}));}};}};
 const optimized=await media.preparePortfolioImage(new File([new Uint8Array(5242880)],'limit.png',{type:'image/png'}));
 assert.equal(optimized.type,'image/webp');assert.ok(optimized.size<4*1024*1024);assert.equal(closed,true);
 delete globalThis.document;delete globalThis.createImageBitmap;
});
test('database totals enforce period boundaries, idempotent facts, owner isolation and 5 MB storage',()=>{
 const sql=`begin;
 insert into public.github_history_events(owner_id,source_id,event_key,day,kind,count,additions,deletions)
 select user_id,'test-history','event-'||i,day,kind,n,a,d from private.app_owner cross join (values
 (1,'2025-11-05'::date,'contributions',10,0,0),(2,'2025-11-06'::date,'contributions',20,0,0),
 (3,'2026-10-06'::date,'prs',1,0,0),(4,'2026-10-07'::date,'prs',2,0,0),
 (5,'2026-11-05'::date,'lines',0,100,30),(6,'2026-11-06'::date,'lines',0,999,999)
 ) f(i,day,kind,n,a,d) where enabled;
 insert into public.github_history_events(owner_id,source_id,event_key,day,kind,additions,deletions)
 select user_id,'test-history','event-5','2026-11-05','lines',100,30 from private.app_owner where enabled
 on conflict(owner_id,source_id,event_key) do update set additions=excluded.additions,deletions=excluded.deletions;
 select jsonb_build_object('totals',(select jsonb_agg(to_jsonb(t) order by period) from github_history_totals('2026-11-05') t where source_id='test-history'),
 'bucket',(select file_size_limit from storage.buckets where id='portfolio-media'),
 'rls',(select relrowsecurity from pg_class where oid='public.github_history_events'::regclass));
 set local role authenticated;
 select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
 select jsonb_build_object('foreign_visible',(select count(*) from public.github_history_events),'foreign_totals',(select count(*) from public.github_history_totals('2026-11-05')));
 rollback;`;
 const output=execFileSync('docker',['exec','-i','supabase_db_dashboard-personal-local','psql','-XAtq','-U','postgres','-v','ON_ERROR_STOP=1'],{input:sql}).toString().trim().split('\n').filter(l=>l.startsWith('{')).map(JSON.parse);
 const [data,foreign]=output;
 assert.equal(data.bucket,5242880);assert.equal(data.rls,true);
 const periods=Object.fromEntries(data.totals.map(r=>[r.period,r]));
 assert.equal(periods.all.contributions,30);assert.equal(periods.year.contributions,20);assert.equal(periods.month.contributions,0);
 assert.equal(periods.all.prs,3);assert.equal(periods.year.prs,3);assert.equal(periods.month.prs,2);
 for(const row of Object.values(periods)){assert.equal(row.additions,100);assert.equal(row.deletions,30);}
 assert.deepEqual(foreign,{foreign_visible:0,foreign_totals:0});
});
