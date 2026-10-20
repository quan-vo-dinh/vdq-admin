-- No owner is seeded. Bootstrap is an explicit, verified, admin-only operation.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.app_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  github_user_id text not null unique check (github_user_id ~ '^[1-9][0-9]*$'),
  enabled boolean not null default true
);
alter table private.app_owner enable row level security;
revoke all on private.app_owner from public, anon, authenticated;

-- Apply least privilege to existing public objects and future app migrations.
-- Platform functions (including rls_auto_enable) are deliberately left intact.
revoke all on all tables in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create function private.is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists(select 1 from private.app_owner o where o.user_id = (select auth.uid()) and o.enabled)
$$;
revoke all on function private.is_owner() from public, anon, authenticated;
-- Only authenticated policies can call this helper; private is NOT exposed by PostgREST.
grant usage on schema private to authenticated;
grant execute on function private.is_owner() to authenticated;

create function public.assert_owner() returns table(user_id uuid, github_user_id text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_owner() then
    raise insufficient_privilege using message = 'Owner access required';
  end if;
  return query select o.user_id, o.github_user_id from private.app_owner o
    where o.user_id = (select auth.uid()) and o.enabled;
end
$$;
revoke all on function public.assert_owner() from public, anon, authenticated;
grant execute on function public.assert_owner() to authenticated;
