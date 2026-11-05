alter table public.codex_devices add column confirmed_identity text;
grant select(confirmed_identity) on public.codex_devices to authenticated;
-- Device binding is confirmed by the owner for every new device, even if emails match.
-- Function body is replaced below by the migration generator's checked source.
create or replace function public.codex_ingest(p_device uuid,p_token_hash text,p_batch jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare d public.codex_devices; a public.codex_accounts; stamp timestamptz; row jsonb; requested boolean; begin
 select * into d from public.codex_devices where id=p_device for update;
 if d.id is null or d.token_hash<>p_token_hash or d.revoked_at is not null then raise exception 'device_revoked' using errcode='P0001'; end if;
 select * into a from public.codex_accounts where id=d.account_id for update;
 if d.heartbeat_at>now()-interval '5 seconds' then return jsonb_build_object('retryAfter',5,'collect',false); end if;
 requested:=d.sync_requested_at is not null;
 update public.codex_devices set heartbeat_at=now(),version=coalesce(p_batch->>'version',version) where id=d.id;
 if d.paused or a.paused then return jsonb_build_object('paused',true,'collect',false); end if;
 if p_batch->>'type'='heartbeat' then return jsonb_build_object('collect',requested,'accountId',a.id,'name',a.name); end if;
 stamp:=(p_batch->>'collectedAt')::timestamptz;
 if exists(select 1 from public.codex_observations where device_id=d.id and batch_id=(p_batch->>'batchId')::uuid) then return jsonb_build_object('ok',true,'duplicate',true); end if;
 if (p_batch->>'identityKey') is not null and (a.identity_key is distinct from (p_batch->>'identityKey') or d.confirmed_identity is distinct from (p_batch->>'identityKey')) then
  update public.codex_devices set pending_identity=p_batch->>'identityKey',pending_label=p_batch->>'identityLabel',last_error='identity_confirmation_required' where id=d.id;
  return jsonb_build_object('confirmationRequired',true);
 end if;
 if a.identity_key is null then
  update public.codex_devices set last_error=coalesce(p_batch->>'accountStatus','login_required') where id=d.id;
  return jsonb_build_object('collect',false,'code','login_required');
 end if;
 if p_batch->>'identityKey' is null then
  update public.codex_devices set last_error=coalesce(p_batch->>'accountStatus','login_required') where id=d.id;
  return jsonb_build_object('collect',false,'code','login_required');
 end if;
 insert into public.codex_observations(owner_id,device_id,batch_id,account_id,collected_at,usage_status,quota_status,quota_windows,summary)
 values(d.owner_id,d.id,(p_batch->>'batchId')::uuid,a.id,stamp,p_batch->>'usageStatus',p_batch->>'quotaStatus',p_batch->'quotaWindows',p_batch->'summary');
 if p_batch->>'usageStatus'='ok' then
  for row in select value from jsonb_array_elements(p_batch->'daily') loop
   insert into public.codex_daily_usage(owner_id,account_id,usage_date,tokens,collected_at,device_id)
   values(d.owner_id,a.id,(row->>'date')::date,(row->>'tokens')::bigint,stamp,d.id)
   on conflict(account_id,usage_date) do update set tokens=excluded.tokens,collected_at=excluded.collected_at,device_id=excluded.device_id,received_at=now()
   where excluded.collected_at>public.codex_daily_usage.collected_at;
  end loop;
 end if;
 if a.observed_at is null or stamp>a.observed_at then
  update public.codex_accounts set observed_at=stamp,plan=coalesce(p_batch->>'plan',plan),usage_status=p_batch->>'usageStatus',quota_status=p_batch->>'quotaStatus' where id=a.id;
 end if;
 if p_batch->>'usageStatus'='ok' and (a.usage_observed_at is null or stamp>a.usage_observed_at) then
  update public.codex_accounts set usage_observed_at=stamp,summary=p_batch->'summary' where id=a.id;
 end if;
 if p_batch->>'quotaStatus'='ok' and (a.quota_observed_at is null or stamp>a.quota_observed_at) then
  update public.codex_accounts set quota_observed_at=stamp,quota_windows=p_batch->'quotaWindows' where id=a.id;
 end if;
 update public.codex_devices set observed_at=greatest(observed_at,stamp),last_error=null,
 sync_requested_at=case when sync_requested_at<=stamp then null else sync_requested_at end where id=d.id;
 return jsonb_build_object('ok',true);
end $$;
revoke all on function public.codex_ingest(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.codex_ingest(uuid,text,jsonb) to service_role;
