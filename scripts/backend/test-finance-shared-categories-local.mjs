// Rollback-only database contract test. No JWT/session minting or cloud access.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const migration = readFileSync('supabase/migrations/20261021000400_finance_shared_categories.sql', 'utf8');
const query = `begin;
${migration}
select set_config('request.jwt.claim.sub',(select user_id::text from private.app_owner where enabled),true);
set local role authenticated;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); bad uuid:=gen_random_uuid(); c uuid;
 d text:=(now() at time zone 'Asia/Ho_Chi_Minh')::date::text;
 code_value text:='qa_shared_'||substr(replace(b::text,'-',''),1,24); rows jsonb;
begin
 insert into public.finance_accounts(id,name,opening,note) values(a,'QA rollback-only',0,'');
 rows:=jsonb_build_array(
 jsonb_build_object('id',gen_random_uuid(),'date',d,'description','shared income','amount','100','kind','income','account_id',a,'category_code',code_value),
 jsonb_build_object('id',gen_random_uuid(),'date',d,'description','shared expense','amount','30','kind','expense','account_id',a,'category_code',code_value),
 jsonb_build_object('id',gen_random_uuid(),'date',d,'description','shared refund','amount','5','kind','refund','account_id',a,'category_code',code_value));
 if public.finance_import(b,rows)<>3 or public.finance_import(b,rows)<>3 then raise exception 'import/retry failed'; end if;
 select id into strict c from public.finance_categories where code=code_value;
 if (select count(*) from public.finance_transactions where batch_id=b)<>3 then raise exception 'retry duplicated rows'; end if;
 if (select count(distinct category_id) from public.finance_transactions where batch_id=b)<>1 then raise exception 'category duplicated'; end if;
 -- The income-labelled category is also available to manual expense/refund and budgets.
 insert into public.finance_transactions(id,date,description,amount,kind,account_id,category_id,source)
 values(gen_random_uuid(),d::date,'manual shared expense',10,'expense',a,c,'manual');
 insert into public.finance_budgets(id,category_id,name,default_limit,fixed) values(gen_random_uuid(),c,'QA shared budget',100,false);
 -- Conversely, an expense-labelled category accepts income without changing its label.
 insert into public.finance_categories(id,code,name,kind) values(gen_random_uuid(),'qa_exp_'||substr(b::text,1,8),'QA expense','expense') returning id into c;
 insert into public.finance_transactions(id,date,description,amount,kind,account_id,category_id,source)
 values(gen_random_uuid(),d::date,'manual shared income',10,'income',a,c,'manual');
 begin
  perform public.finance_import(b,jsonb_set(rows,'{0,description}','"changed"'));
  raise exception 'changed payload accepted';
 exception when raise_exception then if sqlerrm<>'conflict' then raise; end if; end;
 -- Trigger failure inside RPC must roll back the batch and newly-created category.
 select jsonb_agg(value||jsonb_build_object('id',gen_random_uuid())) into rows from jsonb_array_elements(rows);
 rows:=jsonb_set(rows,'{0,category_code}',to_jsonb(code_value||'_bad'));
 rows:=jsonb_set(rows,'{1,amount}','"-1"');
 begin perform public.finance_import(bad,rows); raise exception 'invalid amount accepted';
 exception when check_violation then null; end;
 if exists(select 1 from public.finance_import_batches where id=bad) or exists(select 1 from public.finance_categories where code=code_value||'_bad') then raise exception 'partial import persisted'; end if;
 update public.finance_categories set archived_at=now() where id=c;
 begin
  insert into public.finance_transactions(id,date,description,amount,kind,account_id,category_id,source)
  values(gen_random_uuid(),d::date,'archived category',10,'income',a,c,'manual');
  raise exception 'archived category accepted';
 exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ begin
 if exists(select 1 from public.finance_transactions) then raise exception 'owner RLS leaked'; end if;
 begin perform public.finance_import(gen_random_uuid(),'[]'); raise exception 'non-owner import accepted';
 exception when insufficient_privilege then null; end;
end $$;
rollback;`;
execFileSync('docker', ['exec', '-i', 'supabase_db_dashboard-personal-local', 'psql', '-Xq', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: query, stdio: ['pipe', 'pipe', 'pipe'] });
console.log('PASS shared-category import/manual/budget, retry/conflict, atomic rollback, archive guard, owner/RLS; all fixtures and function changes rolled back.');
