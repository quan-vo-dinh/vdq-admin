-- Allow dated planned transactions. Existing rows, grants, RLS and ledger locks are retained.
create or replace function private.finance_transaction_guard() returns trigger language plpgsql set search_path='' as $$
declare a timestamptz; begin
 select archived_at into a from public.finance_accounts where owner_id=new.owner_id and id=new.account_id for share;
 if a is not null then raise check_violation using message='archived account'; end if;
 if new.destination_account_id is not null then
 select archived_at into a from public.finance_accounts where owner_id=new.owner_id and id=new.destination_account_id for share;
 if a is not null then raise check_violation; end if;
 end if;
 if new.kind<>'transfer' then
 select archived_at into a from public.finance_categories where owner_id=new.owner_id and id=new.category_id for share;
 if not found or a is not null then raise check_violation using message='category missing or archived'; end if;
 end if;
 return new;
end $$;

create or replace function private.finance_ledger_lock() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(coalesce(new.owner_id,old.owner_id)::text||':finance_ledger',0));
 if tg_table_name='finance_transactions' and tg_op<>'DELETE' then
  if new.date <= (now() at time zone 'Asia/Ho_Chi_Minh')::date and new.occurred_at>now() then raise check_violation using message='future actual transaction'; end if;
  if new.cash_account_id is not null and exists(select 1 from public.finance_accounts where owner_id=new.owner_id and id=new.cash_account_id and archived_at is not null) then raise check_violation using message='archived cash account'; end if;
 end if;
 return coalesce(new,old);
end $$;
