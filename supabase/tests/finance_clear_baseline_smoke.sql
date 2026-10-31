-- Run against a local database with an enabled owner after migrations. All writes roll back.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from private.app_owner where enabled),true);
set local role authenticated;
do $check$ declare a uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); begin
 insert into public.finance_accounts(id,name,opening,opening_on) values(a,'Rollback baseline check',1000,current_date-2);
 insert into public.finance_scope_events(id,account_id,occurred_at,amount,kind,evidence) values(e,a,now()-interval '1 day',100,'exclude','Rollback baseline check');
 update public.finance_accounts set opening=0,opening_on=null where id=a;
 set constraints all immediate;
 if not exists(select 1 from public.finance_scope_events where id=e) then raise exception 'Evidence lost'; end if;
 begin
  insert into public.finance_scope_events(id,account_id,occurred_at,amount,kind,evidence) values(gen_random_uuid(),a,now()-interval '1 hour',100,'exclude','Must reject without baseline');
  raise exception 'Missing baseline was accepted';
 exception when check_violation then null;end;
 update public.finance_accounts set opening=1000,opening_on=current_date-2 where id=a;
 begin
  insert into public.finance_scope_events(id,account_id,occurred_at,amount,kind,evidence) values(gen_random_uuid(),a,now()+interval '1 hour',100,'exclude','Must reject future event');
  raise exception 'Future event was accepted';
 exception when check_violation then null;end;
end $check$;
rollback;
