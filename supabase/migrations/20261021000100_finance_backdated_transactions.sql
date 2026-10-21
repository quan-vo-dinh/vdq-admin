-- Allow historical actual transactions before the reporting start date.
-- Future actuals, archived accounts and category checks remain enforced.
create or replace function private.finance_transaction_guard() returns trigger language plpgsql set search_path='' as $$
declare k text; a timestamptz; begin
 if new.date > (now() at time zone 'Asia/Ho_Chi_Minh')::date then raise check_violation using message='invalid date'; end if;
 select archived_at into a from public.finance_accounts where owner_id=new.owner_id and id=new.account_id for share;
 if a is not null then raise check_violation using message='archived account'; end if;
 if new.destination_account_id is not null then
 select archived_at into a from public.finance_accounts where owner_id=new.owner_id and id=new.destination_account_id for share;
 if a is not null then raise check_violation; end if;
 end if;
 if new.kind<>'transfer' then
 select kind,archived_at into k,a from public.finance_categories where owner_id=new.owner_id and id=new.category_id for share;
 if k is distinct from (case when new.kind='income' then 'income' else 'expense' end) or a is not null then raise check_violation using message='category kind'; end if;
 end if;
 return new;
end $$;
