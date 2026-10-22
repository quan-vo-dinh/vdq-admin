-- Additive only. Existing values stay unverified until an explicit dated baseline is supplied.
alter table public.finance_accounts
 add column opening_on date check(opening_on<=(now() at time zone 'Asia/Ho_Chi_Minh')::date),
 add column opening_excluded numeric(18,0) not null default 0 check(opening_excluded>=0);
grant insert(opening_on,opening_excluded), update(opening_on,opening_excluded) on public.finance_accounts to authenticated;
create or replace view public.finance_accounts_dto with (security_invoker=true) as
 select id,owner_id,created_at,updated_at,revision,name,note,archived_at,opening::text as opening,opening_on,opening_excluded::text as opening_excluded from public.finance_accounts;

alter table public.finance_transactions
 add column reference text check(reference is null or (reference=btrim(reference) and length(reference) between 1 and 120)),
 add column occurred_at timestamptz,
 add column reporting_role text not null default 'standard' check(reporting_role in ('standard','support_return','cash_withdrawal','prepaid_cash')),
 add column report_group text check(report_group is null or length(btrim(report_group)) between 1 and 80),
 add column cash_account_id uuid,
 add column cash_received numeric(18,0) not null default 0 check(cash_received>=0),
 add column funding_transaction_id uuid,
 add foreign key(owner_id,cash_account_id) references public.finance_accounts(owner_id,id),
 add foreign key(owner_id,funding_transaction_id) references public.finance_transactions(owner_id,id),
 add check(occurred_at is null or (occurred_at at time zone 'Asia/Ho_Chi_Minh')::date=date),
 add check((reporting_role='cash_withdrawal' and kind='expense' and cash_account_id is not null and cash_account_id<>account_id and cash_received>0 and cash_received<=amount and funding_transaction_id is null)
   or (reporting_role<>'cash_withdrawal' and cash_account_id is null and cash_received=0)),
 add check(reporting_role<>'support_return' or (kind='expense' and report_group is not null)),
 add check((reporting_role='prepaid_cash' and kind='expense' and funding_transaction_id is not null and funding_transaction_id<>id)
   or (reporting_role<>'prepaid_cash' and funding_transaction_id is null));
create unique index finance_transaction_reference on public.finance_transactions(owner_id,account_id,reference) where reference is not null;
grant insert(reference,occurred_at,reporting_role,report_group,cash_account_id,cash_received,funding_transaction_id), update(reference,occurred_at,reporting_role,report_group,cash_account_id,cash_received,funding_transaction_id) on public.finance_transactions to authenticated;
create or replace view public.finance_transactions_dto with (security_invoker=true) as
 select id,owner_id,created_at,updated_at,revision,date,description,kind,account_id,destination_account_id,category_id,source,batch_id,row_index,amount::text as amount,
 reference,occurred_at,reporting_role,report_group,cash_account_id,cash_received::text as cash_received,funding_transaction_id from public.finance_transactions;

-- A bank observation is evidence, never an automatic balance correction.
create table public.finance_checkpoints (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0),
 account_id uuid not null, observed_at timestamptz not null check(observed_at<=now()), amount numeric(18,0) not null,
 evidence text not null check(length(btrim(evidence)) between 1 and 500),
 unique(owner_id,id), unique(owner_id,account_id,observed_at), foreign key(owner_id,account_id) references public.finance_accounts(owner_id,id)
);
create table public.finance_scope_events (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0),
 account_id uuid not null, occurred_at timestamptz not null,
 amount numeric(18,0) not null check(amount>0), kind text not null check(kind in ('exclude','release','external_outflow')),
 evidence text not null check(length(btrim(evidence)) between 1 and 500),
 unique(owner_id,id), foreign key(owner_id,account_id) references public.finance_accounts(owner_id,id)
);
alter table public.finance_checkpoints enable row level security;
alter table public.finance_scope_events enable row level security;
revoke all on public.finance_checkpoints,public.finance_scope_events from public,anon,authenticated;
grant select,delete on public.finance_checkpoints,public.finance_scope_events to authenticated;
grant insert(id,account_id,observed_at,amount,evidence),update(account_id,observed_at,amount,evidence) on public.finance_checkpoints to authenticated;
grant insert(id,account_id,occurred_at,amount,kind,evidence),update(account_id,occurred_at,amount,kind,evidence) on public.finance_scope_events to authenticated;
create policy owner_only on public.finance_checkpoints to authenticated using(owner_id=(select auth.uid()) and (select private.is_owner())) with check(owner_id=(select auth.uid()) and (select private.is_owner()));
create policy owner_only on public.finance_scope_events to authenticated using(owner_id=(select auth.uid()) and (select private.is_owner())) with check(owner_id=(select auth.uid()) and (select private.is_owner()));
create trigger revision before update on public.finance_checkpoints for each row execute function private.bump_revision();
create trigger revision before update on public.finance_scope_events for each row execute function private.bump_revision();
create view public.finance_checkpoints_dto with (security_invoker=true) as select id,owner_id,revision,account_id,observed_at,amount::text as amount,evidence from public.finance_checkpoints;
create view public.finance_scope_events_dto with (security_invoker=true) as select id,owner_id,revision,account_id,occurred_at,amount::text as amount,kind,evidence from public.finance_scope_events;
grant select on public.finance_checkpoints_dto,public.finance_scope_events_dto to authenticated;

-- Lock before DML so direct writes and concurrent imports observe the same ledger.
create function private.finance_ledger_lock() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(coalesce(new.owner_id,old.owner_id)::text||':finance_ledger',0));
 if tg_table_name='finance_transactions' and tg_op<>'DELETE' then
  if new.occurred_at>now() then raise check_violation using message='future actual transaction'; end if;
  if new.cash_account_id is not null and exists(select 1 from public.finance_accounts where owner_id=new.owner_id and id=new.cash_account_id and archived_at is not null) then raise check_violation using message='archived cash account'; end if;
 end if;
 return coalesce(new,old);
end $$;

-- One statement snapshot prevents reports mixing rows from separate read moments.
-- SECURITY INVOKER preserves the existing owner RLS on every source relation.
create function public.finance_snapshot() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object(
  'accounts',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_accounts_dto t where owner_id=auth.uid()),
  'categories',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_categories t where owner_id=auth.uid()),
  'transactions',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_transactions_dto t where owner_id=auth.uid()),
  'budgets',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_budgets_dto t where owner_id=auth.uid()),
  'months',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_budget_months_dto t where owner_id=auth.uid()),
  'goals',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_goals_dto t where owner_id=auth.uid()),
  'bills',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_bills_dto t where owner_id=auth.uid()),
  'checkpoints',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_checkpoints_dto t where owner_id=auth.uid()),
  'scopeEvents',(select coalesce(jsonb_agg(to_jsonb(t) order by id),'[]') from public.finance_scope_events_dto t where owner_id=auth.uid()),
  'settings',(select to_jsonb(t) from public.finance_settings t where owner_id=auth.uid())
 );
$$;
revoke all on function public.finance_snapshot() from public,anon,authenticated;
grant execute on function public.finance_snapshot() to authenticated;
create trigger ledger_lock before insert or update or delete on public.finance_transactions for each row execute function private.finance_ledger_lock();
create trigger ledger_lock before insert or update or delete on public.finance_scope_events for each row execute function private.finance_ledger_lock();
create trigger ledger_lock before insert or update or delete on public.finance_accounts for each row execute function private.finance_ledger_lock();

-- Deferred validation sees the complete import, including an ATM and its linked cash spend.
create function private.finance_reconcile_guard() returns trigger language plpgsql set search_path='' as $$
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
  ) x where n<0) then raise check_violation using message='excluded funds below zero'; end if;
  if exists(select 1 from public.finance_scope_events e where e.owner_id=a.owner_id and e.account_id=a.id and
    (a.opening_on is null or (e.occurred_at at time zone 'Asia/Ho_Chi_Minh')::date<a.opening_on or e.occurred_at>now())) then
    raise check_violation using message='scope event needs dated baseline and past time';
  end if;
 end loop;
 return null;
end $$;
create constraint trigger reconcile_cash after insert or update or delete on public.finance_transactions deferrable initially deferred for each row execute function private.finance_reconcile_guard();
create constraint trigger reconcile_scope after insert or update or delete on public.finance_scope_events deferrable initially deferred for each row execute function private.finance_reconcile_guard();
create constraint trigger reconcile_baseline after update on public.finance_accounts deferrable initially deferred for each row execute function private.finance_reconcile_guard();

-- Replace the import atomically; owner lock covers batches and direct transaction edits.
create or replace function public.finance_import(p_id uuid,p_rows jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare r public.finance_import_batches; h text; n integer; item jsonb; c public.finance_categories; resolved jsonb:='[]'::jsonb; begin
 if not private.is_owner() then raise insufficient_privilege; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 1000 or octet_length(p_rows::text)>1000000 then raise check_violation; end if;
 h:=encode(extensions.digest(p_rows::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':finance_ledger',0));
 select * into r from public.finance_import_batches where owner_id=auth.uid() and id=p_id;
 if found then
  if r.payload_hash<>h then raise exception 'conflict'; end if;
  if r.result<>(select count(*) from public.finance_transactions where owner_id=auth.uid() and batch_id=p_id) then raise exception 'conflict'; end if;
  return r.result;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':finance_categories',0));
 for item in select value from jsonb_array_elements(p_rows) loop
  if exists(select 1 from public.finance_transactions t where t.owner_id=auth.uid() and t.account_id=(item->>'account_id')::uuid and (
   (item->>'reference' is not null and t.reference=item->>'reference') or
   ((t.reference is null or item->>'reference' is null) and t.date=(item->>'date')::date and lower(btrim(t.description))=lower(btrim(item->>'description')) and t.amount=(item->>'amount')::numeric and t.kind=item->>'kind' and t.destination_account_id is not distinct from (item->>'destination_account_id')::uuid))) then
   raise unique_violation using message='duplicate import transaction';
  end if;
  if exists(select 1 from jsonb_array_elements(resolved) x where x->>'account_id'=item->>'account_id' and (
   (item->>'reference' is not null and x->>'reference'=item->>'reference') or
   ((x->>'reference' is null or item->>'reference' is null) and x->>'date'=item->>'date' and lower(btrim(x->>'description'))=lower(btrim(item->>'description')) and (x->>'amount')::numeric=(item->>'amount')::numeric and x->>'kind'=item->>'kind' and x->>'destination_account_id' is not distinct from item->>'destination_account_id'))) then
   raise unique_violation using message='duplicate import row';
  end if;
  if item->>'kind'<>'transfer' and item ? 'category_code' then
   if item->>'category_code' is null or item->>'category_code' !~ '^[a-z][a-z0-9_-]{0,39}$' or item->>'category_code'='transfer' then raise check_violation; end if;
   insert into public.finance_categories(id,owner_id,code,name,kind) values(gen_random_uuid(),auth.uid(),item->>'category_code',item->>'category_code',case when item->>'kind'='income' then 'income' else 'expense' end) on conflict(owner_id,code) do nothing;
   select * into strict c from public.finance_categories where owner_id=auth.uid() and code=item->>'category_code' for share;
   if c.archived_at is not null then raise check_violation; end if;
   item:=item||jsonb_build_object('category_id',c.id);
  end if;
  resolved:=resolved||jsonb_build_array(item);
 end loop;
 n:=jsonb_array_length(resolved);
 insert into public.finance_import_batches(id,payload_hash,result) values(p_id,h,n);
 insert into public.finance_transactions(id,date,description,amount,kind,account_id,destination_account_id,category_id,source,batch_id,row_index,reference,occurred_at,reporting_role,report_group,cash_account_id,cash_received,funding_transaction_id)
 select (v->>'id')::uuid,(v->>'date')::date,v->>'description',(v->>'amount')::numeric,v->>'kind',(v->>'account_id')::uuid,(v->>'destination_account_id')::uuid,(v->>'category_id')::uuid,'csv',p_id,(i-1)::integer,v->>'reference',(v->>'occurred_at')::timestamptz,coalesce(v->>'reporting_role','standard'),v->>'report_group',(v->>'cash_account_id')::uuid,coalesce((v->>'cash_received')::numeric,0),(v->>'funding_transaction_id')::uuid from jsonb_array_elements(resolved) with ordinality as x(v,i);
 if exists(select 1 from public.finance_transactions where owner_id=auth.uid() and batch_id=p_id and amount>1000000000) then raise check_violation; end if;
 return n;
end $$;
