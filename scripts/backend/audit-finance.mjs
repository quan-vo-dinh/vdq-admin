// Read-only inventory. Raw financial data is saved privately outside the repository.
import {execFileSync} from 'node:child_process';
import {mkdir,realpath,writeFile} from 'node:fs/promises';
import {isAbsolute,relative,resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
const {values}=parseArgs({options:{target:{type:'string'},directory:{type:'string'}}});
const project='wcgdvsiiemurehkprvqw';
const names=['finance_settings','finance_accounts','finance_categories','finance_import_batches','finance_transactions','finance_budgets','finance_budget_months','finance_goals','finance_bills','finance_checkpoints','finance_scope_events','finance_projection_plans'];
function query(select){
 if(!select.startsWith('select '))throw Error('Only reviewed SELECT queries are permitted');
 if(values.target==='local')return JSON.parse(execFileSync('docker',['exec','-i','supabase_db_dashboard-personal-local','psql','-XAtq','-U','postgres','-v','ON_ERROR_STOP=1'],{input:select,stdio:['pipe','pipe','pipe'],maxBuffer:32*1024*1024}).toString());
 const output=JSON.parse(execFileSync('pnpm',['exec','supabase','db','query','--linked','--project-ref',project,select],{stdio:['ignore','pipe','pipe'],maxBuffer:32*1024*1024}));
 if(!Array.isArray(output.rows))throw Error('Unexpected query result');return output.rows[0].result;
}
const scalar=expression=>values.target==='local'?`select ${expression}`:`select ${expression} as result`;
try{
 if(!['local','production'].includes(values.target)||!values.directory||!isAbsolute(values.directory))throw Error('Use --target local|production --directory /absolute/private/path');
 const directory=resolve(values.directory);await mkdir(directory,{recursive:true,mode:0o700});
 const outside=relative(await realpath(process.cwd()),await realpath(directory));
 if(!outside||(!outside.startsWith('..')&&!isAbsolute(outside)))throw Error('Output must be outside repository');
 const owners=query(scalar("(select jsonb_agg(jsonb_build_object('id',user_id,'github',github_user_id)) from private.app_owner where enabled)"));
 if(owners?.length!==1||owners[0].github!=='129001260'||!/^[a-f0-9-]{36}$/.test(owners[0].id))throw Error('Enabled owner does not match reviewed identity');
 const columns=query(scalar("(select jsonb_agg(jsonb_build_object('table',table_name,'column',column_name,'type',data_type)) from information_schema.columns where table_schema='public' and table_name like 'finance_%')"));
 const tables=names.filter(t=>columns.some(c=>c.table===t));
 const data=tables.map(t=>{
  const numeric=columns.filter(c=>c.table===t&&c.type==='numeric');
  if(numeric.some(c=>! /^[a-z_]+$/.test(c.column)))throw Error('Unexpected numeric column');
  const text=numeric.map(c=>`||jsonb_build_object('${c.column}',t.${c.column}::text)`).join('');
  return `'${t}',(select coalesce(jsonb_agg(to_jsonb(t)${text} order by id),'[]') from public.${t} t where owner_id='${owners[0].id}'::uuid)`;
 }).join(',');
 const snapshot=query(scalar(`jsonb_build_object('capturedAt',now(),'source','${values.target}','owner','${owners[0].id}','data',jsonb_build_object(${data}))`));
 const counts=Object.fromEntries(tables.map(t=>[t,snapshot.data[t].length]));
 const file=directory+'/finance-'+new Date().toISOString().replaceAll(':','-')+'.json';
 const bytes=JSON.stringify(snapshot,null,2);await writeFile(file,bytes,{mode:0o600,flag:'wx'});
 const digest=createHash('sha256').update(bytes).digest('hex');
 console.log(JSON.stringify({readOnly:true,target:values.target,capturedAt:snapshot.capturedAt,counts,file,sha256:digest},null,2));
}catch{
 console.error('Read-only Finance audit failed. Check target, CLI login/local database, verified owner and private output directory. Database was not modified.');process.exitCode=1;
}
