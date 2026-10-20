-- Direct RPC callers must supply a positive revision, just like the HTTP adapter.
create or replace function public.move_today(p_id uuid,p_date date,p_revision integer) returns public.today_items
language plpgsql security definer set search_path='' as $$
declare r public.today_items; s integer; begin
 if not private.is_owner() then raise insufficient_privilege; end if;
 if p_revision is null or p_revision<1 then raise exception 'invalid revision' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into r from public.today_items where id=p_id and owner_id=auth.uid() for update;
 if not found then raise exception 'missing' using errcode='P0001'; end if;
 if r.revision<>p_revision then raise exception 'conflict' using errcode='P0001'; end if;
 if r.item_date=p_date then return r; end if;
 select x into s from generate_series(1,3) x where not exists(select 1 from public.today_items where owner_id=auth.uid() and item_date=p_date and slot=x) order by x limit 1;
 if s is null then raise exception 'full' using errcode='P0001'; end if;
 update public.today_items set item_date=p_date,slot=s where id=p_id returning * into r;
 return r;
end $$;
