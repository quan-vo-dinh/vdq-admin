-- Run only against local Postgres; fixtures and all assertions roll back.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
select set_config('request.jwt.claim.sub',(select user_id::text from private.app_owner where enabled),true);
set local role authenticated;
set constraints all immediate;
insert into public.finance_accounts(id,name,opening,opening_on,opening_excluded) values
 ('82000000-0000-4000-8000-000000000001','QA reconciliation bank',1000,'2026-09-21',100),
 ('82000000-0000-4000-8000-000000000002','QA reconciliation cash',0,'2026-09-21',0);
insert into public.finance_categories(id,code,name,kind) values('82000000-0000-4000-8000-000000000003','qa_reconcile','QA reconciliation','expense');
create temp table import_row as select jsonb_build_array(jsonb_build_object('id','82000000-0000-4000-8000-000000000004','date','2026-10-01','description','QA reference','amount','100','kind','expense','account_id','82000000-0000-4000-8000-000000000001','category_code','qa_reconcile','reference','QA-REF-1','occurred_at','2026-10-01T08:00:00+07:00')) as rows;
select is(public.finance_import('82000000-0000-4000-8000-000000000010',(select rows from import_row)),1,'first batch imports');
select is(public.finance_import('82000000-0000-4000-8000-000000000010',(select rows from import_row)),1,'retry is idempotent');
select throws_ok($$select public.finance_import('82000000-0000-4000-8000-000000000011',(select rows from import_row))$$,'23505',null,'same source under a new batch is rejected');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(rows->0,'{description}','"Edited description"')) from import_row))$$,'23505',null,'bank reference detects description changes');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array((rows->0)-'reference') from import_row))$$,'23505',null,'legacy row matches imported reference by fallback key');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(rows->0,'{reference}','"QA-NEW"'),jsonb_set(rows->0,'{reference}','"QA-NEW"')) from import_row))$$,'23505',null,'duplicate inside one file rejected');
select is((select count(*)::integer from public.finance_import_batches where id='82000000-0000-4000-8000-000000000011'),0,'failed duplicate batch leaves no receipt');
select lives_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(jsonb_set(rows->0,'{reference}','"QA-DISTINCT"'),'{id}',to_jsonb(gen_random_uuid()::text))) from import_row))$$,'separate reference permits a legitimate same amount and date');
insert into public.finance_transactions(id,date,description,amount,kind,account_id,category_id,source,reporting_role,cash_account_id,cash_received) values
 ('82000000-0000-4000-8000-000000000005','2026-10-02','QA ATM',103,'expense','82000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000003','manual','cash_withdrawal','82000000-0000-4000-8000-000000000002',100);
insert into public.finance_transactions(id,date,description,amount,kind,account_id,category_id,source,reporting_role,funding_transaction_id) values
 ('82000000-0000-4000-8000-000000000006','2026-10-03','QA prepaid cash',15,'expense','82000000-0000-4000-8000-000000000002','82000000-0000-4000-8000-000000000003','manual','prepaid_cash','82000000-0000-4000-8000-000000000005');
select throws_ok($$update public.finance_transactions set amount=101 where id='82000000-0000-4000-8000-000000000006'$$,'23514',null,'cash use cannot exceed actual cash received');
select throws_ok($$update public.finance_transactions set account_id='82000000-0000-4000-8000-000000000001' where id='82000000-0000-4000-8000-000000000006'$$,'23514',null,'cash source must match ATM destination');
select throws_ok($$update public.finance_transactions set reporting_role='standard',cash_account_id=null,cash_received=0 where id='82000000-0000-4000-8000-000000000005'$$,'23514',null,'linked ATM cannot lose its cash funding');
select throws_ok($$update public.finance_transactions set occurred_at='2026-10-02T08:00:00+07:00' where id='82000000-0000-4000-8000-000000000004'$$,'23514',null,'timestamp agrees with Vietnam transaction day');
insert into public.finance_scope_events(id,account_id,occurred_at,amount,kind,evidence) values
 ('82000000-0000-4000-8000-000000000020','82000000-0000-4000-8000-000000000001','2026-10-04T09:00:00+07:00',100,'external_outflow','QA verified reserved funds');
select throws_ok($$insert into public.finance_scope_events(id,account_id,occurred_at,amount,kind,evidence) values(gen_random_uuid(),'82000000-0000-4000-8000-000000000001','2026-10-04T10:00:00+07:00',1,'release','QA invalid release')$$,'23514',null,'cannot release money already paid out');
insert into public.finance_checkpoints(id,account_id,observed_at,amount,evidence) values('82000000-0000-4000-8000-000000000021','82000000-0000-4000-8000-000000000001','2026-10-05T12:00:00+07:00',818,'QA observation');
select is((select amount from public.finance_checkpoints_dto where id='82000000-0000-4000-8000-000000000021'),'818','checkpoint DTO preserves exact decimal text');
select is((select opening from public.finance_accounts_dto where id='82000000-0000-4000-8000-000000000001'),'1000','checkpoint never alters baseline');
select is((select count(*)::integer from jsonb_array_elements(public.finance_snapshot()->'checkpoints') c where c->>'id'='82000000-0000-4000-8000-000000000021'),1,'single snapshot includes owner checkpoints');
delete from public.finance_transactions where id='82000000-0000-4000-8000-000000000004';
select throws_ok($$select public.finance_import('82000000-0000-4000-8000-000000000010',(select rows from import_row))$$,'P0001','conflict','receipt after deletion cannot falsely report restored rows');
select set_config('request.jwt.claim.sub','82000000-0000-4000-8000-000000000099',true);
select is((select count(*)::integer from public.finance_checkpoints_dto),0,'non-owner sees no bank observations');
select is((select count(*)::integer from public.finance_scope_events_dto),0,'non-owner sees no scope events');
select is(jsonb_array_length(public.finance_snapshot()->'accounts'),0,'single snapshot preserves account RLS');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select rows from import_row))$$,'42501',null,'non-owner cannot import');
reset role;
select * from finish();
rollback;
