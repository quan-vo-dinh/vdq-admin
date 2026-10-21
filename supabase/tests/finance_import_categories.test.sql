begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email) values('71000000-0000-4000-8000-000000000001','category-test@example.invalid');
delete from private.app_owner;
insert into private.app_owner(user_id,github_user_id) values('71000000-0000-4000-8000-000000000001','71001');
set local role authenticated;
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000001',true);
insert into public.finance_settings(id) values(auth.uid());
insert into public.finance_accounts(id,name) values('71000000-0000-4000-8000-000000000002','Test account');
insert into public.finance_categories(id,code,name,kind) values('71000000-0000-4000-8000-000000000003','manual_income','Manual income','income');
create temp table test_rows as select jsonb_build_array(
 jsonb_build_object('id','71000000-0000-4000-8000-000000000004','date',(now() at time zone 'Asia/Ho_Chi_Minh')::date,'description','Test expense','amount','100','kind','expense','account_id','71000000-0000-4000-8000-000000000002','category_code','health'),
 jsonb_build_object('id','71000000-0000-4000-8000-000000000005','date',(now() at time zone 'Asia/Ho_Chi_Minh')::date,'description','Test refund','amount','50','kind','refund','account_id','71000000-0000-4000-8000-000000000002','category_code','health'),
 jsonb_build_object('id','71000000-0000-4000-8000-000000000006','date',(now() at time zone 'Asia/Ho_Chi_Minh')::date,'description','Test income','amount','500','kind','income','account_id','71000000-0000-4000-8000-000000000002','category_code','bonus'),
 jsonb_build_object('id','71000000-0000-4000-8000-000000000007','date',(now() at time zone 'Asia/Ho_Chi_Minh')::date,'description','Existing income','amount','50','kind','income','account_id','71000000-0000-4000-8000-000000000002','category_code','manual_income')
) as rows;
select is(public.finance_import('71000000-0000-4000-8000-000000000010',(select rows from test_rows)),4,'import creates new categories and uses manual category');
select is((select count(*)::int from public.finance_categories),3,'one expense category shared by refund; one new income category');
select is((select name from public.finance_categories where code='health'),'health','new category name equals code');
select is((select kind from public.finance_categories where code='bonus'),'income','new income kind');
select is((select count(*)::int from public.finance_transactions),4,'transactions persisted');
select is(public.finance_import('71000000-0000-4000-8000-000000000010',(select rows from test_rows)),4,'same batch retry returns count');
select is((select count(*)::int from public.finance_transactions),4,'retry does not duplicate');
select throws_ok($$select public.finance_import('71000000-0000-4000-8000-000000000010',(select jsonb_set(rows,'{0,amount}','"101"') from test_rows))$$,'P0001','conflict','changed retry rejected');
-- All categories, rows and batch must roll back when any row is invalid.
select throws_ok($$select public.finance_import('71000000-0000-4000-8000-000000000011',(select jsonb_build_array(jsonb_set(jsonb_set(rows->0,'{id}',to_jsonb(gen_random_uuid()::text)),'{category_code}','"rollback_code"'),jsonb_set(jsonb_set(rows->1,'{id}',to_jsonb(gen_random_uuid()::text)),'{amount}','"-1"')) from test_rows))$$,'23514',null,'invalid row rolls back batch');
select is((select count(*)::int from public.finance_categories where code='rollback_code'),0,'new category rolled back');
select is((select count(*)::int from public.finance_import_batches where id='71000000-0000-4000-8000-000000000011'),0,'failed batch absent');
select is((select count(*)::int from public.finance_transactions),4,'failed batch added no transactions');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(rows->0,'{category_code}','"manual_income"')) from test_rows))$$,'23514',null,'existing category kind mismatch denied');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(rows->0,'{category_code}','"transfer"')) from test_rows))$$,'23514',null,'reserved code rejected');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(rows->0,'{category_code}','"Bad code"')) from test_rows))$$,'23514',null,'invalid code rejected');
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(jsonb_set(rows->0,'{category_code}','"mixed"'),jsonb_set(rows->2,'{category_code}','"mixed"')) from test_rows))$$,'23514',null,'mixed new category kinds rejected');
select is((select count(*)::int from public.finance_categories where code='mixed'),0,'mixed category not left behind');
update public.finance_categories set archived_at=now() where code='health';
select throws_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(rows->0) from test_rows))$$,'23514',null,'archived category rejected');
select lives_ok($$select public.finance_import(gen_random_uuid(),(select jsonb_build_array(((rows->3) - 'category_code') || jsonb_build_object('id',gen_random_uuid(),'category_id','71000000-0000-4000-8000-000000000003')) from test_rows))$$,'legacy category_id import still supported');
select set_config('request.jwt.claim.sub','71000000-0000-4000-8000-000000000099',true);
select throws_ok($$select public.finance_import(gen_random_uuid(),(select rows from test_rows))$$,'42501',null,'non-owner import denied');
reset role;
select * from finish();
rollback;
