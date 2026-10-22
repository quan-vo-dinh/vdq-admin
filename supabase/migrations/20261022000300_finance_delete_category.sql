-- Record intentional removal of seeded categories so financeOverview does not recreate them.
create table public.finance_category_tombstones (
 owner_id uuid not null references auth.users(id),
 code text not null check(code in ('food','home','transport','shopping','learning','fun','other','salary','freelance')),
 deleted_at timestamptz not null default now(),
 primary key(owner_id,code)
);
alter table public.finance_category_tombstones enable row level security;
revoke all on public.finance_category_tombstones from public,anon,authenticated;
grant select on public.finance_category_tombstones to authenticated;
create policy owner_only on public.finance_category_tombstones to authenticated
 using(owner_id=(select auth.uid()) and (select private.is_owner()));

-- Delete a category and its budget settings atomically, but never remove transaction history.
create function public.finance_delete_category(p_category_id uuid, p_revision integer)
returns text
language plpgsql
security definer
set search_path=''
as $$
declare category_code text; deleted_rows integer;
begin
 if not private.is_owner() then raise insufficient_privilege; end if;

 select code into category_code
 from public.finance_categories
 where owner_id=auth.uid() and id=p_category_id and revision=p_revision
 for update;
 if not found then
  if exists(select 1 from public.finance_categories where owner_id=auth.uid() and id=p_category_id) then return 'conflict'; end if;
  return 'missing';
 end if;

 if exists(select 1 from public.finance_transactions where owner_id=auth.uid() and category_id=p_category_id) then
  return 'has_transactions';
 end if;

 delete from public.finance_budget_months m
 using public.finance_budgets b
 where b.owner_id=auth.uid() and b.category_id=p_category_id
   and m.owner_id=auth.uid() and m.budget_id=b.id;
 delete from public.finance_budgets where owner_id=auth.uid() and category_id=p_category_id;

 if category_code in ('food','home','transport','shopping','learning','fun','other','salary','freelance') then
  insert into public.finance_category_tombstones(owner_id,code)
  values(auth.uid(),category_code)
  on conflict(owner_id,code) do nothing;
 end if;

 delete from public.finance_categories
 where owner_id=auth.uid() and id=p_category_id and revision=p_revision;
 get diagnostics deleted_rows = row_count;
 if deleted_rows<>1 then raise serialization_failure using message='category changed while deleting'; end if;
 return 'deleted';
end
$$;

revoke all on function public.finance_delete_category(uuid,integer) from public,anon;
grant execute on function public.finance_delete_category(uuid,integer) to authenticated;
