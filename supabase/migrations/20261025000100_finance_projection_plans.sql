-- Separate estimates from actual balances, transactions, budgets and goal allocations.
create table public.finance_projection_plans (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 revision integer not null default 1 check(revision>0),
 plan jsonb not null check(jsonb_typeof(plan)='object' and plan @> '{"version":1}'::jsonb),
 unique(owner_id)
);
alter table public.finance_projection_plans enable row level security;
revoke all on public.finance_projection_plans from public,anon,authenticated;
grant select,delete on public.finance_projection_plans to authenticated;
grant insert(id,plan),update(plan) on public.finance_projection_plans to authenticated;
create policy owner_only on public.finance_projection_plans to authenticated
 using(owner_id=(select auth.uid()) and (select private.is_owner()))
 with check(owner_id=(select auth.uid()) and (select private.is_owner()));
create trigger revision before update on public.finance_projection_plans for each row execute function private.bump_revision();
