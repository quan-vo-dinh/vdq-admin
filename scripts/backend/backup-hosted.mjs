// Explicit hosted tooling only. Management/API credentials remain in child-process memory.
import {execFileSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tables,digest,validate,publishBackup} from './backup.mjs';
import {productionSql} from './prepare-production.mjs';
export const projectRef='wcgdvsiiemurehkprvqw';
const migrationRoot='supabase/migrations';
function cli(args){return execFileSync('pnpm',['exec','supabase',...args],{stdio:['ignore','pipe','pipe'],maxBuffer:128*1024*1024}).toString();}
function query(sql){const result=JSON.parse(cli(['db','query','--linked','--project-ref',projectRef,sql]));if(!Array.isArray(result.rows))throw new Error('Unexpected hosted query response');return result.rows;}
function literal(s){return "'"+s.replaceAll("'","''")+"'";}
export async function captureHosted(){
 const owner=query('select user_id,github_user_id,enabled from private.app_owner where enabled');
 if(owner.length!==1||owner[0].github_user_id!=='129001260'||!/^[-a-f0-9]{36}$/.test(owner[0].user_id))throw new Error('Verified hosted owner must be bootstrapped before backup');
 const numeric=query("select table_name,column_name from information_schema.columns where table_schema='public' and data_type='numeric'");
 const dataSql=tables.map(table=>{
  const numbers=numeric.filter(c=>c.table_name===table).map(c=>{if(!/^[a-z_]+$/.test(c.column_name))throw new Error('Unexpected column');return ` || jsonb_build_object('${c.column_name}',t.${c.column_name}::text)`;}).join('');
  return `${literal(table)},(select coalesce(jsonb_agg(to_jsonb(t)${numbers} order by id),'[]') from public.${table} t where owner_id=${literal(owner[0].user_id)}::uuid)`;
 }).join(',');
 // One statement gives a consistent PostgreSQL snapshot across all business tables.
 const snapshotSql=`select jsonb_build_object('owner',(select to_jsonb(o) from private.app_owner o where enabled),'versions',(select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),'data',jsonb_build_object(${dataSql})) as snapshot`;
 const snapshot=()=>query(snapshotSql)[0].snapshot;
 const before=snapshot();
 if(before.owner?.user_id!==owner[0].user_id||before.owner?.github_user_id!=='129001260'||!before.owner?.enabled)throw new Error('Hosted owner changed during capture');
 const migrations=[];
 for(const name of (await readdir(migrationRoot)).filter(n=>n.endsWith('.sql')).sort())if(before.versions.includes(name.split('_')[0])){
  const sql=productionSql(name,await readFile(migrationRoot+'/'+name,'utf8'));migrations.push({name,sql});
 }
 if(migrations.length!==before.versions.length)throw new Error('Production migration sources incomplete');
 const referenced=[...new Set(before.data.finance_goals.map(g=>g.image_path).filter(Boolean))];
 const media=[];
 if(referenced.length){
  // Administrative key is only used for offline backup Storage reads, never app CRUD/env.
  const response=JSON.parse(cli(['projects','api-keys','--project-ref',projectRef,'-o','json']));
  const keys=Array.isArray(response)?response:response.api_keys;
  const key=keys?.find(k=>k.name==='service_role')?.api_key;
  if(!key||!key.startsWith('eyJ'))throw new Error('Hosted Storage backup credential unavailable; no bundle published');
  for(const path of referenced){
   if(!new RegExp('^'+owner[0].user_id+'/goals/[a-f0-9-]{36}\\.(png|jpg|webp)$').test(path))throw new Error('Unexpected referenced image path');
   const r=await fetch(`https://${projectRef}.supabase.co/storage/v1/object/authenticated/personal-media/${path}`,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw new Error('Hosted referenced image unavailable; retry during quiet writes');
   const bytes=Buffer.from(await r.arrayBuffer());media.push({path,mime:r.headers.get('content-type')?.split(';')[0],sha256:digest(bytes),bytes:bytes.toString('base64')});
  }
 }
 // Abort if rows/owner/schema changed while fetching immutable referenced media.
 if(digest(Buffer.from(JSON.stringify(before)))!==digest(Buffer.from(JSON.stringify(snapshot()))))throw new Error('Source changed during backup; retry during quiet writes');
 return validate({format:'dashboard-business-v1',capturedAt:new Date().toISOString(),source:'hosted:'+projectRef,appVersion:JSON.parse(await readFile('package.json','utf8')).version,...before,migrations,media});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const {values}=parseArgs({options:{directory:{type:'string'},key:{type:'string'}}});
 if(!values.directory||!values.key)throw new Error('Explicit --directory outside repo and --key public recovery key required');
 try{console.log(JSON.stringify(await publishBackup(await captureHosted(),values.directory,values.key),null,2));}
 catch{console.error('Hosted backup refused/failed. Verify owner, CLI login, production migration sources and Storage access; no successful bundle reported.');process.exitCode=1;}
}
