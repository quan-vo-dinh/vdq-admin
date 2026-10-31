-- Clearing an unverified baseline retains historical scope evidence. New scope writes still require a baseline.
create or replace function private.finance_reconcile_guard() returns trigger language plpgsql set search_path='' as $$
declare a public.finance_accounts; begin
 perform pg_advisory_xact_lock(hashtextextended(coalesce(new.owner_id,old.owner_id)::text||':finance_ledger',0));
 if exists(select 1 from public.finance_transactions t where t.owner_id=coalesce(new.owner_id,old.owner_id) and t.reporting_role='prepaid_cash'
  and not exists(select 1 from public.finance_transactions f where f.owner_id=t.owner_id and f.id=t.funding_transaction_id and f.reporting_role='cash_withdrawal' and f.cash_account_id=t.account_id and f.date<=t.date)) then
  raise check_violation using message='invalid cash funding';
 end if;
 if exists(select 1 from public.finance_transactions f where f.owner_id=coalesce(new.owner_id,old.owner_id) and f.reporting_role='cash_withdrawal'
  and f.cash_received<(select coalesce(sum(t.amount),0) from public.finance_transactions t where t.owner_id=f.owner_id and t.funding_transaction_id=f.id)) then
  raise check_violation using message='cash allocation exceeds withdrawal';
 end if;
 for a in select * from public.finance_accounts where owner_id=coalesce(new.owner_id,old.owner_id) loop
  if exists(select 1 from (
   select a.opening_excluded+sum(case when e.kind='exclude' then e.amount else -e.amount end) over(order by e.occurred_at,e.id) as n
   from public.finance_scope_events e where e.owner_id=a.owner_id and e.account_id=a.id
    and a.opening_on is not null and (e.occurred_at at time zone 'Asia/Ho_Chi_Minh')::date>=a.opening_on
  ) x where n<0) then raise check_violation using message='excluded funds below zero'; end if;
  if exists(select 1 from public.finance_scope_events e where e.owner_id=a.owner_id and e.account_id=a.id and
    e.occurred_at>now()) then
    raise check_violation using message='scope event needs dated baseline and past time';
  end if;
 end loop;
 return null;
end $$;

-- Validate new/edited events at write time; retained history may outlive a baseline.
create function private.finance_scope_baseline_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.occurred_at > now() or not exists (
  select 1 from public.finance_accounts a
  where a.id=new.account_id and a.owner_id=new.owner_id and a.opening_on is not null
 ) then
  raise check_violation using message='scope event needs dated baseline and past time';
 end if;
 return new;
end $$;
revoke all on function private.finance_scope_baseline_guard() from public,anon,authenticated;
create trigger scope_baseline_guard before insert or update on public.finance_scope_events
 for each row execute function private.finance_scope_baseline_guard();
