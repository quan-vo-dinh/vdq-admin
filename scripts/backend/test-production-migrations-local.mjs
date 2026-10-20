// Local isolated schema verification only. Refuses an existing QA database. Never uses linked cloud.
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
const container='supabase_db_dashboard-personal-local',database='p11_release_migrations';
function run(command,args,input){return execFileSync(command,args,{input,maxBuffer:64*1024*1024,stdio:['pipe','pipe','pipe']}).toString();}
function sql(input,db=database,user='postgres'){return run('docker',['exec','-i',container,'psql','-XAt','-v','ON_ERROR_STOP=1','-U',user,'-d',db],input);}
if(sql(`select count(*) from pg_database where datname='${database}'`,'postgres').trim()!=='0')throw new Error('QA database already exists; do not overwrite');
sql(`create database ${database};`,'postgres');
const scaffold=run('docker',['exec',container,'pg_dump','-U','postgres','--schema-only','--no-publications','--no-subscriptions','--exclude-schema=public','--exclude-schema=private','--exclude-schema=supabase_migrations','postgres']);
sql(scaffold.replace(/^CREATE POLICY personal_media_owner .*;$/m,''),database,'supabase_admin');
for(const name of readdirSync('/tmp/dashboard-production-release/supabase/migrations').sort()){
 sql(readFileSync('/tmp/dashboard-production-release/supabase/migrations/'+name)); console.log('APPLIED '+name);
}
const today=sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like '%today%'; select count(*) from pg_proc where proname in ('create_today','move_today');").trim();
if(today!=='0\n0')throw new Error('Today remains');
console.log('PASS no Today tables/RPC');
sql('create extension if not exists pgtap with schema extensions;');
for(const name of ['owner.test.sql','domains.test.sql','finance_learning.test.sql','personal.test.sql']){
 let testSql=readFileSync('supabase/tests/'+name,'utf8');
 if(name==='domains.test.sql')testSql=testSql.split('\n').filter(line=>!/today/i.test(line)).join('\n');
 const out=sql('set search_path=public,extensions;\n'+testSql); console.log(out); if(/not ok/.test(out))throw new Error('SQL assertion failed');
}
console.log('PASS production migrations on isolated empty QA database. Source database untouched. QA DB retained for investigation.');
