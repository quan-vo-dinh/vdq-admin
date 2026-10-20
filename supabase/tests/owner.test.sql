begin;
create extension if not exists pgtap with schema extensions;
select plan(28);
insert into auth.users (id, email) values
 ('10000000-0000-4000-8000-000000000001', 'owner-fixture@example.invalid'),
 ('10000000-0000-4000-8000-000000000002', 'other-fixture@example.invalid');
-- Isolate fixture registry inside this transaction only. ROLLBACK restores real owner.
-- Other sessions continue to see the committed owner through MVCC.
delete from private.app_owner;
insert into private.app_owner(user_id, github_user_id) values ('10000000-0000-4000-8000-000000000001','10001');
create table public.owner_probe(id uuid primary key, owner_id uuid not null references auth.users, value text);
alter table public.owner_probe enable row level security;
grant select, insert, update, delete on public.owner_probe to authenticated;
create policy owner_probe_policy on public.owner_probe to authenticated
 using ((select private.is_owner()) and owner_id = (select auth.uid()))
 with check ((select private.is_owner()) and owner_id = (select auth.uid()));
create table public.future_probe(id uuid);
select ok(not has_table_privilege('authenticated','private.app_owner','SELECT'), 'registry not readable');
select ok(not has_table_privilege('authenticated','private.app_owner','UPDATE'), 'registry not writable');
select ok(not has_schema_privilege('anon','private','USAGE'), 'anon has no private usage');
select ok(not has_function_privilege('anon','public.assert_owner()','EXECUTE'), 'anon cannot execute RPC');
select ok(not has_function_privilege('anon','private.is_owner()','EXECUTE'), 'anon cannot execute helper');
select ok(has_function_privilege('authenticated','public.assert_owner()','EXECUTE'), 'authenticated can assert');
select ok(not has_table_privilege('authenticated','public.future_probe','SELECT'), 'future app tables default closed');
select ok(not has_table_privilege('anon','public.future_probe','SELECT'), 'future app tables closed to anon');
select is((select proconfig::text from pg_proc where oid='private.is_owner()'::regprocedure), '{"search_path=\"\""}', 'helper fixed search path');
select throws_ok($$insert into private.app_owner values(false,'10000000-0000-4000-8000-000000000002','10002',true)$$,'23514',null,'singleton cannot be false');
select throws_ok($$delete from auth.users where id='10000000-0000-4000-8000-000000000001'$$,'23503',null,'owner FK restricts deletion');
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select ok(private.is_owner(), 'enabled owner recognized');
select is((select user_id::text from public.assert_owner()),'10000000-0000-4000-8000-000000000001','RPC returns own identity');
select lives_ok($$insert into public.owner_probe values('20000000-0000-4000-8000-000000000001',auth.uid(),'original')$$,'owner insert');
select is((select count(*)::int from public.owner_probe),1,'owner read');
select lives_ok($$update public.owner_probe set value='updated'$$,'owner update');
select throws_ok($$insert into public.owner_probe values('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','forged')$$,'42501',null,'WITH CHECK blocks forged owner');
select throws_ok($$update public.owner_probe set owner_id='10000000-0000-4000-8000-000000000002'$$,'42501',null,'WITH CHECK blocks owner reassignment');
select throws_ok($$update private.app_owner set enabled=false$$,'42501',null,'client cannot edit registry');
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select ok(not private.is_owner(),'non-owner rejected');
select is((select count(*)::int from public.owner_probe),0,'non-owner read empty');
select throws_ok($$select * from public.assert_owner()$$,'42501','Owner access required','non-owner RPC denied');
select throws_ok($$insert into public.owner_probe values('20000000-0000-4000-8000-000000000002',auth.uid(),'bad')$$,'42501',null,'non-owner insert denied');
reset role;
update private.app_owner set enabled=false;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select ok(not private.is_owner(),'disabled owner rejected');
select is((select count(*)::int from public.owner_probe),0,'disabled owner sees no rows');
reset role;
delete from private.app_owner;
set local role authenticated;
select throws_ok($$select * from public.assert_owner()$$,'42501','Owner access required','missing owner rejected');
set local role anon;
select throws_ok($$select * from public.owner_probe$$,'42501',null,'anon table access denied');
select throws_ok($$select * from public.assert_owner()$$,'42501',null,'anon RPC denied');
reset role;
select * from finish();
rollback;
