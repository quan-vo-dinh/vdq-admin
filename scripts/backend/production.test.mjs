import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {productionSql} from './prepare-production.mjs';
test('production migration variant preserves Notes/Calendar and excludes Today',async()=>{
 for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql'))){
  const sql=productionSql(name,await readFile('supabase/migrations/'+name,'utf8'));
  assert.doesNotMatch(sql,/today_items|create_today|move_today/i);
  if(process.env.PRODUCTION_MIGRATIONS_REVIEW_DIR)assert.equal(sql,await readFile(process.env.PRODUCTION_MIGRATIONS_REVIEW_DIR+'/'+name,'utf8'));
  if(name.startsWith('20261020000400'))assert.equal((sql.match(/create table public\./g)??[]).length,3);
  if(name.startsWith('20261020000400'))for(const object of ['public.notes','public.calendar_events','public.calendar_settings','enable row level security'])assert.ok(sql.includes(object));
 }
});
