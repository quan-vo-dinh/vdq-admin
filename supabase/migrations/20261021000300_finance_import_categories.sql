-- Create missing categories and transactions atomically. Keep the two-argument RPC and legacy category_id callers.
create or replace function public.finance_import(p_id uuid,p_rows jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare r public.finance_import_batches; h text; n integer; item jsonb; c public.finance_categories; expected_kind text; resolved jsonb := '[]'::jsonb; begin
 if not private.is_owner() then raise insufficient_privilege; end if;
 if jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows) not between 1 and 1000 or octet_length(p_rows::text)>1000000 then raise check_violation; end if;
 h:=encode(extensions.digest(p_rows::text,'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_id::text,0));
 select * into r from public.finance_import_batches where owner_id=auth.uid() and id=p_id;
 if found then
 if r.payload_hash<>h then raise exception 'conflict'; end if;
 return r.result;
 end if;
 -- Serialize category discovery across batches; category uniqueness also protects manual creation.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':finance_categories',0));
 for item in select value from jsonb_array_elements(p_rows) loop
   if item->>'kind' <> 'transfer' and item ? 'category_code' then
     expected_kind := case when item->>'kind'='income' then 'income' else 'expense' end;
     if (item->>'category_code') is null or (item->>'category_code') !~ '^[a-z][a-z0-9_-]{0,39}$' or item->>'category_code'='transfer' then
       raise check_violation using message='invalid category code';
     end if;
     insert into public.finance_categories(id,owner_id,code,name,kind)
       values(gen_random_uuid(),auth.uid(),item->>'category_code',item->>'category_code',expected_kind)
       on conflict(owner_id,code) do nothing;
     select * into strict c from public.finance_categories
       where owner_id=auth.uid() and code=item->>'category_code' for share;
     if c.kind<>expected_kind or c.archived_at is not null then
       raise check_violation using message='category kind or archived';
     end if;
     item := item || jsonb_build_object('category_id',c.id);
   end if;
   resolved := resolved || jsonb_build_array(item);
 end loop;
 n:=jsonb_array_length(p_rows);
 insert into public.finance_import_batches(id,payload_hash,result) values(p_id,h,n);
 insert into public.finance_transactions(id,date,description,amount,kind,account_id,destination_account_id,category_id,source,batch_id,row_index)
 select (v->>'id')::uuid,(v->>'date')::date,v->>'description',(v->>'amount')::numeric,v->>'kind',(v->>'account_id')::uuid,(v->>'destination_account_id')::uuid,(v->>'category_id')::uuid,'csv',p_id,(i-1)::integer from jsonb_array_elements(resolved) with ordinality as x(v,i);
 if exists(select 1 from public.finance_transactions where owner_id=auth.uid() and batch_id=p_id and amount>1000000000) then raise check_violation; end if;
 return n;
end $$;
revoke all on function public.finance_import(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finance_import(uuid,jsonb) to authenticated;
