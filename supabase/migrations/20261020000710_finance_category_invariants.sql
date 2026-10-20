-- Preserve historical category meaning; archive remains available.
create function private.finance_category_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.kind<>old.kind or new.code<>old.code) and
 (exists(select 1 from public.finance_transactions where owner_id=old.owner_id and category_id=old.id) or exists(select 1 from public.finance_budgets where owner_id=old.owner_id and category_id=old.id)) then
 raise check_violation using message='category has history';
 end if;
 return new;
end $$;
create trigger category_guard before update on public.finance_categories for each row execute function private.finance_category_guard();
create function private.finance_budget_guard() returns trigger language plpgsql set search_path='' as $$
declare k text; begin
 select kind into k from public.finance_categories where owner_id=new.owner_id and id=new.category_id for share;
 if k is distinct from 'expense' then raise check_violation using message='expense category required'; end if;
 return new;
end $$;
create trigger budget_guard before insert or update on public.finance_budgets for each row execute function private.finance_budget_guard();
