-- Additive P12 migration. No owner or application records are modified.
create table private.mobile_login_window (
 singleton boolean primary key default true check (singleton),
 window_at timestamptz not null,
 attempts integer not null
);
alter table private.mobile_login_window enable row level security;
revoke all on private.mobile_login_window from public, anon, authenticated;
create or replace function public.consume_mobile_login_attempt() returns boolean
language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
 insert into private.mobile_login_window(singleton, window_at, attempts)
 values (true, clock_timestamp(), 1)
 on conflict (singleton) do update set
 attempts = case when private.mobile_login_window.window_at < clock_timestamp() - interval '1 minute' then 1 else least(private.mobile_login_window.attempts + 1, 11) end,
 window_at = case when private.mobile_login_window.window_at < clock_timestamp() - interval '1 minute' then clock_timestamp() else private.mobile_login_window.window_at end
 returning attempts <= 10 into allowed;
 return allowed;
end;
$$;
revoke all on function public.consume_mobile_login_attempt() from public, anon, authenticated;
grant execute on function public.consume_mobile_login_attempt() to service_role;
