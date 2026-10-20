// Prepare a separate CLI workdir. Never rewrite migrations already applied locally.
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
export function productionSql(name,source){
 let sql=source;
 if(name.startsWith('20261020000400')){
  sql=sql.replace(/create table public\.today_items \([\s\S]*?\n\);\n/,'').replace("'notes','today_items','calendar_events'","'notes','calendar_events'").replace(/^grant update\(done,title,category\) on public\.today_items to authenticated;\n/m,'');
  const boundary=sql.indexOf('-- A single per-owner transaction lock');
  if(boundary<0)throw new Error('Historical migration changed; review extraction');
  sql=sql.slice(0,boundary);
 }
 if(name.startsWith('20261020000500'))sql='-- Local historical Today revision guard intentionally excluded from production.\n';
 if(/today_items|create_today|move_today/i.test(sql))throw new Error('Today dependency remains in '+name);
 return sql;
}
export async function prepareProduction(directory='/tmp/dashboard-production-release'){
 const target=resolve(directory);
 if(target!=='/tmp/dashboard-production-release')throw new Error('Only the dedicated release workdir is allowed');
 await mkdir(join(target,'supabase'),{recursive:true});
 await mkdir(join(target,'supabase/migrations'),{recursive:false});
 await writeFile(join(target,'supabase/config.toml'),'project_id = "dashboard-production-release"\n');
 for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort()){
  const sql=productionSql(name,await readFile(join('supabase/migrations',name),'utf8'));
  await writeFile(join(target,'supabase/migrations',name),sql,{flag:'wx'});
 }
 console.log('Prepared production-only migrations at '+target+'; no link/push performed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await prepareProduction(process.argv[2]);
