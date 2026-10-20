// Creates configuration only; does not start, reset or delete any stack.
import {readFile,mkdir,writeFile,copyFile,readdir} from 'node:fs/promises';
import {productionSql} from './prepare-production.mjs';
if(process.argv.slice(2).some(a=>a!=='--production'))throw new Error('Only --production is supported');
const production=process.argv.includes('--production');
const target='/tmp/dashboard-p09-drill';
await mkdir(target+'/supabase/migrations',{recursive:true,mode:0o700});
let config=await readFile('supabase/config.toml','utf8');
config=config.replace('dashboard-personal-local','dashboard-p09-drill').replaceAll('54321','55321').replaceAll('54322','55322').replaceAll('54323','55323').replaceAll('54320','55320').replaceAll('54329','55329').replaceAll('3000','3102');
config=config.replace(/\[auth.external.github\][\s\S]*?(?=\n\[|$)/,section=>section.replace('enabled = true','enabled = false').replaceAll('env(SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID)','').replaceAll('env(SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET)',''));
await writeFile(target+'/supabase/config.toml',config,{mode:0o600});
await writeFile(target+'/supabase/seed.sql','select 1;\n');
for(const name of await readdir('supabase/migrations'))if(name.endsWith('.sql')){
 if(production)await writeFile(target+'/supabase/migrations/'+name,productionSql(name,await readFile('supabase/migrations/'+name,'utf8')));
 else await copyFile('supabase/migrations/'+name,target+'/supabase/migrations/'+name);
}
console.log('Prepared disposable dashboard-p09-drill at /tmp/dashboard-p09-drill, API :55321. Source stack unchanged.');
