-- Owner-bound management uses the same device/account locks as ingestion.
create function public.codex_confirm_identity(p_owner uuid,p_device uuid,p_identity text,p_target uuid default null,p_new_name text default null,p_group text default 'personal') returns jsonb
language plpgsql security invoker set search_path='' as $$
declare d public.codex_devices; a public.codex_accounts; target public.codex_accounts; begin
 select * into d from public.codex_devices where id=p_device and owner_id=p_owner for update;
 if d.id is null or d.revoked_at is not null or d.pending_identity is distinct from p_identity or p_identity is null then raise exception 'identity_changed' using errcode='P0001'; end if;
 -- Serialize identity assignments across devices of this owner.
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,1));
 select * into a from public.codex_accounts where id=d.account_id and owner_id=p_owner for update;
 if p_target is not null then
  select * into target from public.codex_accounts where id=p_target and owner_id=p_owner for update;
  if target.id is null or target.identity_key is distinct from p_identity then raise exception 'target_identity_mismatch' using errcode='P0001'; end if;
 elsif p_new_name is not null then
  if exists(select 1 from public.codex_accounts where owner_id=p_owner and identity_key=p_identity) then raise exception 'identity_already_linked' using errcode='P0001'; end if;
  insert into public.codex_accounts(owner_id,name,account_group,identity_key,identity_label) values(p_owner,p_new_name,p_group,p_identity,d.pending_label) returning * into target;
 else
  if a.identity_key is not null and a.identity_key<>p_identity and a.identity_key like 'codex-v2:%' then raise exception 'new_account_required' using errcode='P0001'; end if;
  if exists(select 1 from public.codex_accounts where owner_id=p_owner and identity_key=p_identity and id<>a.id) then raise exception 'identity_already_linked' using errcode='P0001'; end if;
  update public.codex_accounts set identity_key=p_identity,identity_label=d.pending_label where id=a.id returning * into target;
 end if;
 update public.codex_devices set account_id=target.id,confirmed_identity=p_identity,pending_identity=null,pending_label=null,last_error=null,sync_requested_at=now() where id=d.id;
 return jsonb_build_object('ok',true,'accountId',target.id);
end $$;
revoke all on function public.codex_confirm_identity(uuid,uuid,text,uuid,text,text) from public,anon,authenticated;
grant execute on function public.codex_confirm_identity(uuid,uuid,text,uuid,text,text) to service_role;
create function public.codex_delete_history(p_owner uuid,p_account uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 -- Pause first on web; do not erase data while a companion is collecting.
 perform 1 from public.codex_accounts where id=p_account and owner_id=p_owner and paused for update;
 if not found then raise exception 'pause_account_first' using errcode='P0001'; end if;
 delete from public.codex_daily_usage where owner_id=p_owner and account_id=p_account;
 delete from public.codex_observations where owner_id=p_owner and account_id=p_account;
 update public.codex_accounts set observed_at=null,usage_observed_at=null,quota_observed_at=null,summary=null,quota_windows='[]',usage_status='unavailable',quota_status='unavailable' where owner_id=p_owner and id=p_account;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.codex_delete_history(uuid,uuid) from public,anon,authenticated;
grant execute on function public.codex_delete_history(uuid,uuid) to service_role;
-- These are derived data; the browser can read them but cannot forge observations.
revoke insert,update,delete on public.codex_daily_usage,public.codex_observations from authenticated;
