// Explicit local tooling. No runtime admin key; never touches the linked cloud project.
import {execFileSync,spawn} from 'node:child_process';
import {readFile,mkdir,realpath,readdir,unlink,chmod} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname,join} from 'node:path';
import {generateKeyPairSync,createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {seal,open} from '../data/snapshot.mjs';
import {atomicOutput} from './atomic-output.mjs';
export const tables=['notes','calendar_events','calendar_settings','finance_settings','finance_accounts','finance_categories','finance_import_batches','finance_transactions','finance_budgets','finance_budget_months','finance_goals','finance_bills','finance_checkpoints','finance_scope_events','finance_projection_plans','learning_habits','learning_checkins','profiles','user_preferences','portfolio_versions','portfolio_sites','portfolio_media'];
const container='supabase_db_dashboard-personal-local';
export const digest=b=>createHash('sha256').update(b).digest('hex');
export function sql(query,target=container){return execFileSync('docker',['exec','-i',target,'psql','-XAtq','-U','postgres','-v','ON_ERROR_STOP=1'],{input:query,stdio:['pipe','pipe','pipe'],maxBuffer:128*1024*1024}).toString().trim();}
export function status(workdir){const s=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json',...(workdir?['--workdir',workdir]:[])],{stdio:['ignore','pipe','pipe']}).toString());const expected=workdir==='/tmp/dashboard-portfolio-drill'?'http://127.0.0.1:56321':workdir?'http://127.0.0.1:55321':'http://127.0.0.1:54321';if(s.API_URL!==expected)throw new Error('Unexpected local target');return s;}
async function outside(path){const full=resolve(path);await mkdir(dirname(full),{recursive:true,mode:0o700});const rel=relative(await realpath(process.cwd()),await realpath(dirname(full)));if(!rel||(!rel.startsWith('..')&&!isAbsolute(rel)))throw new Error('Output/key must be outside repository');return full;}
function literal(s){return "'"+s.replaceAll("'","''")+"'";}
async function freeze(){
 const child=spawn('docker',['exec','-i',container,'psql','-XAtq','-U','postgres','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
 // SHARE blocks app DML; storage metadata lock prevents object delete during capture.
 child.stdin.write(`begin; set local lock_timeout='5s'; set local idle_in_transaction_session_timeout='90s'; lock table ${tables.map(t=>'public.'+t).join(',')},storage.objects,private.app_owner,supabase_migrations.schema_migrations in share mode;\n\\echo BACKUP_READY\n`);
 await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>{child.kill();reject(new Error('Backup lock timeout'));},10000);child.stdout.on('data',b=>{out+=b;if(out.includes('BACKUP_READY')){clearTimeout(timer);resolve();}});child.on('exit',()=>{clearTimeout(timer);reject(new Error('Backup lock unavailable'));});child.on('error',reject);});
 return ()=>{child.stdin.end('rollback;\n\\q\n');};
}
export async function capture(){
 const s=status();const started=Date.now();const release=await freeze();
 try{
  const owner=JSON.parse(sql("select row_to_json(o) from private.app_owner o where enabled"));
  const data={};
  for(const table of tables){
   const numeric=JSON.parse(sql(`select coalesce(json_agg(column_name),'[]') from information_schema.columns where table_schema='public' and table_name='${table}' and data_type='numeric'`));
   const row='to_jsonb(t)'+numeric.map(c=>` || jsonb_build_object('${c}',t.${c}::text)`).join('');
   data[table]=JSON.parse(sql(`select coalesce(jsonb_agg(${row} order by id),'[]') from public.${table} t where owner_id='${owner.user_id}'`));
  }
  const media=[];
  for(const {path,bucket} of [...new Set(data.finance_goals.map(g=>g.image_path).filter(Boolean))].map(path=>({path,bucket:'personal-media'})).concat(data.portfolio_media.map(m=>({path:m.path,bucket:'portfolio-media'})))){
   if(!new RegExp('^'+owner.user_id+'/(goals|portfolio)/[a-f0-9-]{36}\\.(png|jpg|webp)$').test(path))throw new Error('Invalid referenced path');
   const r=await fetch(s.API_URL+'/storage/v1/object/authenticated/'+bucket+'/'+path,{headers:{apikey:s.SERVICE_ROLE_KEY,Authorization:'Bearer '+s.SERVICE_ROLE_KEY},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Missing referenced media');
   const bytes=Buffer.from(await r.arrayBuffer());media.push({path,bucket,mime:r.headers.get('content-type')?.split(';')[0],sha256:digest(bytes),bytes:bytes.toString('base64')});
  }
  const versions=JSON.parse(sql("select coalesce(json_agg(version order by version),'[]') from supabase_migrations.schema_migrations"));
  const migrations=[];for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort())if(versions.includes(name.split('_')[0]))migrations.push({name,sql:await readFile('supabase/migrations/'+name,'utf8')});
  if(migrations.length!==versions.length)throw new Error('Applied migration sources incomplete');
  if(Date.now()-started>60000)throw new Error('Capture exceeded lock safety window; retry during quiet writes');
  return {format:'dashboard-business-v1',capturedAt:new Date().toISOString(),source:'local:dashboard-personal-local',appVersion:JSON.parse(await readFile('package.json','utf8')).version,versions,migrations,owner,data,media};
 }finally{release();}
}
export function validate(p){
 if(p.format!=='dashboard-business-v1'||!p.owner?.enabled||!/^\d+$/.test(p.owner.github_user_id)||!Array.isArray(p.media)||!Array.isArray(p.versions)||!Array.isArray(p.migrations))throw new Error('Invalid business bundle');
 for(const t of ['portfolio_versions','portfolio_sites','portfolio_media'])if(!(t in p.data)&&!p.versions.includes('20261028000100'))p.data[t]=[];
 if(!('finance_projection_plans' in p.data)&&!p.versions.includes('20261025000100'))p.data.finance_projection_plans=[];
 for(const table of ['finance_checkpoints','finance_scope_events'])if(!(table in p.data)&&!p.versions.includes('20261022000100'))p.data[table]=[];
 if(Object.keys(p.data).sort().join()!==[...tables].sort().join())throw new Error('Unexpected tables');
 for(const t of tables)if(!Array.isArray(p.data[t])||p.data[t].some(r=>r.owner_id!==p.owner.user_id)||new Set(p.data[t].map(r=>r.id)).size!==p.data[t].length)throw new Error('Invalid rows');
 const referenced=new Set([...p.data.finance_goals.map(g=>g.image_path).filter(Boolean),...p.data.portfolio_media.map(m=>m.path)]);
 if(referenced.size!==p.media.length)throw new Error('Media count mismatch');
 for(const m of p.media)if(!referenced.has(m.path)||!(m.path.startsWith(p.owner.user_id+'/goals/')&&(!m.bucket||m.bucket==='personal-media')||m.path.startsWith(p.owner.user_id+'/portfolio/')&&m.bucket==='portfolio-media')||digest(Buffer.from(m.bytes,'base64'))!==m.sha256)throw new Error('Media checksum mismatch');
 return p;
}
export async function decrypt(file,key){return validate(open(JSON.parse(await readFile(file,'utf8')),await readFile(key)).business);}
export async function backup(directory,key){return publishBackup(await capture(),directory,key);}
export async function publishBackup(payload,directory,key){
 const p=validate(payload);const file=await outside(join(directory,new Date().toISOString().replaceAll(':','-')+'.enc.json'));
 const envelope=seal({schemaVersion:1,datasets:[],business:p},await readFile(key));atomicOutput(file,JSON.stringify(envelope),{replace:false});
 // Only prune after a new bundle is fully published. Failed export leaves all good copies.
 const old=(await readdir(directory)).filter(n=>/^\d{4}-.*\.enc\.json$/.test(n)).sort().reverse();for(const n of old.slice(3))await unlink(join(directory,n));
 return {file,capturedAt:p.capturedAt,source:p.source,versions:p.versions,counts:Object.fromEntries(tables.map(t=>[t,p.data[t].length])),images:p.media.length};
}
export async function restore(file,key,workdir){
 // Deliberately only disposable target. Hosted recovery is an explicit P11 operation.
 if(!['/tmp/dashboard-p09-drill','/tmp/dashboard-portfolio-drill'].includes(resolve(workdir??'')))throw new Error('Only explicitly named disposable drill targets are permitted');
 const drill=resolve(workdir).split('/').at(-1);
 const config=await readFile(join(workdir,'supabase/config.toml'),'utf8');if(!config.includes('project_id = "'+drill+'"'))throw new Error('Wrong project');
 const target='supabase_db_'+drill,s=status(workdir),p=await decrypt(file,key);
 const owner=JSON.parse(sql('select row_to_json(o) from private.app_owner o where enabled',target));
 if(owner.github_user_id!==p.owner.github_user_id)throw new Error('Verified GitHub owner mismatch');
 const versions=JSON.parse(sql("select coalesce(json_agg(version order by version),'[]') from supabase_migrations.schema_migrations",target));if(JSON.stringify(versions)!==JSON.stringify(p.versions))throw new Error('Migrations differ');
 for(const migration of p.migrations)if(await readFile(join(workdir,'supabase/migrations',migration.name),'utf8')!==migration.sql)throw new Error('Migration source differs');
 const restoreTables=tables.filter(t=>sql(`select to_regclass('public.${t}') is not null`,target)==='t');
 if(tables.some(t=>!restoreTables.includes(t)&&p.data[t].length))throw new Error('Backup tables missing from target');
 if(restoreTables.some(t=>sql(`select count(*) from public.${t}`,target)!=='0'))throw new Error('Target must have empty business tables');
 const remap=path=>path?.replace(p.owner.user_id+'/',owner.user_id+'/')??null;
 const uploaded=[];
 try{
  for(const m of p.media){const path=remap(m.path),bucket=m.bucket??'personal-media';const r=await fetch(s.API_URL+'/storage/v1/object/'+bucket+'/'+path,{method:'POST',headers:{apikey:s.SERVICE_ROLE_KEY,Authorization:'Bearer '+s.SERVICE_ROLE_KEY,'Content-Type':m.mime,'x-upsert':'false'},body:Buffer.from(m.bytes,'base64')});if(!r.ok)throw new Error('Target image restore failed');uploaded.push({path,bucket});}
  let query='begin; set constraints all deferred;\n';
  for(const t of restoreTables){const rows=p.data[t].map(row=>({...row,owner_id:owner.user_id,...(['profiles','user_preferences','calendar_settings','finance_settings','portfolio_sites'].includes(t)?{id:owner.user_id}:{}),...(t==='finance_goals'?{image_path:remap(row.image_path)}:{}),...(t==='portfolio_media'?{path:remap(row.path)}:{})}));
   query+=`insert into public.${t} select * from jsonb_populate_recordset(null::public.${t},${literal(JSON.stringify(rows))}::jsonb);\n`;
  }
  query+='commit;';sql(query,target);
 }catch(e){for(const bucket of ['personal-media','portfolio-media'])if(uploaded.some(m=>m.bucket===bucket))await fetch(s.API_URL+'/storage/v1/object/'+bucket,{method:'DELETE',headers:{apikey:s.SERVICE_ROLE_KEY,Authorization:'Bearer '+s.SERVICE_ROLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({prefixes:uploaded.filter(m=>m.bucket===bucket).map(m=>m.path)})});throw e;}
 for(const t of restoreTables)if(Number(sql(`select count(*) from public.${t}`,target))!==p.data[t].length)throw new Error('Restored row count mismatch');
 for(const m of p.media){const r=await fetch(s.API_URL+'/storage/v1/object/authenticated/'+(m.bucket??'personal-media')+'/'+remap(m.path),{headers:{apikey:s.SERVICE_ROLE_KEY,Authorization:'Bearer '+s.SERVICE_ROLE_KEY}});if(!r.ok||digest(Buffer.from(await r.arrayBuffer()))!==m.sha256)throw new Error('Restored image mismatch');}
 return {restored:true,target:'local:'+drill,ownerRemapped:owner.user_id!==p.owner.user_id,counts:Object.fromEntries(tables.map(t=>[t,p.data[t].length])),images:p.media.length};
}
async function main(){
 const {values:v}=parseArgs({options:{mode:{type:'string'},directory:{type:'string'},key:{type:'string'},input:{type:'string'},workdir:{type:'string'}}});
 if(v.mode==='keygen'){
  const privateFile=await outside(v.key),publicFile=privateFile+'.pub';
  const keys=generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  atomicOutput(privateFile,keys.privateKey,{replace:false});atomicOutput(publicFile,keys.publicKey,{replace:false});await chmod(dirname(privateFile),0o700);console.log('Created recovery key privately; import into password manager. Public key: '+publicFile);return;
 }
 if(v.mode==='backup'){console.log(JSON.stringify(await backup(v.directory,v.key),null,2));return;}
 if(v.mode==='verify'){const p=await decrypt(v.input,v.key);console.log(JSON.stringify({verified:true,capturedAt:p.capturedAt,counts:Object.fromEntries(tables.map(t=>[t,p.data[t].length])),images:p.media.length}));return;}
 if(v.mode==='restore'){console.log(JSON.stringify(await restore(v.input,v.key,v.workdir),null,2));return;}
 throw new Error('Use mode keygen|backup|verify|restore with explicit paths');
}
if(process.argv[1]===new URL(import.meta.url).pathname)main().catch(()=>{console.error('Backup/restore failed. Check local target, migrations, empty business tables, owner, key, paths and referenced objects. No cloud operation attempted.');process.exitCode=1;});
