-- Codex account aggregates are distinct from device credentials and session telemetry.
create table public.codex_accounts (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 name text not null check(length(btrim(name)) between 1 and 80), account_group text not null default 'personal' check(account_group in ('personal','work')),
 identity_key text, identity_label text, paused boolean not null default false,
 plan text, observed_at timestamptz, usage_observed_at timestamptz, quota_observed_at timestamptz,
 usage_status text not null default 'unavailable', quota_status text not null default 'unavailable',
 summary jsonb, quota_windows jsonb not null default '[]', created_at timestamptz not null default now(),
 unique(owner_id,id)
);
create table public.codex_devices (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid() references auth.users(id),
 account_id uuid not null, name text not null check(length(btrim(name)) between 1 and 80),
 token_hash text not null check(length(token_hash)=64), profile text, version text,
 paused boolean not null default false, revoked_at timestamptz, heartbeat_at timestamptz,
 observed_at timestamptz, last_error text, sync_requested_at timestamptz,
 pending_identity text, pending_label text, created_at timestamptz not null default now(),
 foreign key(owner_id,account_id) references public.codex_accounts(owner_id,id), unique(owner_id,id)
);
create table public.codex_daily_usage (
 owner_id uuid not null default auth.uid() references auth.users(id), account_id uuid not null,
 usage_date date not null, tokens bigint not null check(tokens between 0 and 9007199254740991),
 collected_at timestamptz not null, device_id uuid, received_at timestamptz not null default now(),
 primary key(account_id,usage_date), foreign key(owner_id,account_id) references public.codex_accounts(owner_id,id)
);
create table public.codex_observations (
 owner_id uuid not null default auth.uid() references auth.users(id), device_id uuid not null,
 batch_id uuid not null, account_id uuid not null, collected_at timestamptz not null,
 received_at timestamptz not null default now(), usage_status text not null, quota_status text not null,
 quota_windows jsonb, summary jsonb,
 primary key(device_id,batch_id), foreign key(owner_id,device_id) references public.codex_devices(owner_id,id),
 foreign key(owner_id,account_id) references public.codex_accounts(owner_id,id)
);
create table public.codex_pairings (
 code_hash text primary key check(length(code_hash)=64), owner_id uuid not null default auth.uid() references auth.users(id),
 account_id uuid not null, expires_at timestamptz not null, created_at timestamptz not null default now(),
 foreign key(owner_id,account_id) references public.codex_accounts(owner_id,id)
);
create index on public.codex_daily_usage(owner_id,usage_date desc);
create index on public.codex_observations(owner_id,collected_at desc);
do $$ declare t text; begin
 foreach t in array array['codex_accounts','codex_devices','codex_daily_usage','codex_observations','codex_pairings'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_only on public.%I to authenticated using (owner_id=(select auth.uid()) and (select private.is_owner())) with check (owner_id=(select auth.uid()) and (select private.is_owner()))',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated,service_role',t);
 end loop;
end $$;
-- Never expose credential hashes to the authenticated browser's direct DB client.
revoke select,insert,update,delete on public.codex_devices,public.codex_pairings from authenticated;
grant select(id,owner_id,account_id,name,profile,version,paused,revoked_at,heartbeat_at,observed_at,last_error,sync_requested_at,pending_identity,pending_label,created_at) on public.codex_devices to authenticated;
grant update(name,paused,revoked_at,sync_requested_at) on public.codex_devices to authenticated;
-- Pairing codes are exchanged atomically; this RPC is server-only.
create function public.codex_pair_device(p_hash text,p_name text,p_token_hash text,p_profile text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare pairing public.codex_pairings; device uuid; begin
 delete from public.codex_pairings where code_hash=p_hash and expires_at>now() returning * into pairing;
 if pairing.code_hash is null then raise exception 'pairing_expired' using errcode='P0001'; end if;
 if exists(select 1 from public.codex_accounts where id=pairing.account_id and paused) then raise exception 'account_paused' using errcode='P0001'; end if;
 insert into public.codex_devices(owner_id,account_id,name,token_hash,profile) values(pairing.owner_id,pairing.account_id,p_name,p_token_hash,p_profile) returning id into device;
 return jsonb_build_object('id',device,'accountId',pairing.account_id);
end $$;
revoke all on function public.codex_pair_device(text,text,text,text) from public,anon,authenticated;
grant execute on function public.codex_pair_device(text,text,text,text) to service_role;
-- Row locking makes revocation, duplicate batches and competing device observations deterministic.
create function public.codex_ingest(p_device uuid,p_token_hash text,p_batch jsonb) returns jsonb
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
 if (p_batch->>'identityKey') is not null and a.identity_key is distinct from (p_batch->>'identityKey') then
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
-- Preserve existing paired credentials and historical aggregate buckets. No token rotation.
do $$ declare item record; a uuid; identity text; source jsonb; day jsonb; begin
 for item in select * from public.developer_documents where collection='device' loop
 identity:=coalesce(item.payload->>'accountKey','legacy-device-'||item.id);
 select id into a from public.codex_accounts where owner_id=item.owner_id and identity_key=identity;
 source:=item.payload->'data'->'sources'->0;
 if a is null then
 insert into public.codex_accounts(owner_id,name,account_group,identity_key,identity_label,plan,observed_at,usage_observed_at,quota_observed_at,usage_status,quota_status,quota_windows)
 values(item.owner_id,coalesce(item.payload->>'name','Codex Mac'),case when source->>'scope'='work' then 'work' else 'personal' end,identity,'Legacy profile',source->>'detail',nullif(item.payload->>'observedAt','')::timestamptz,nullif(item.payload->>'observedAt','')::timestamptz,nullif(item.payload->>'observedAt','')::timestamptz,'ok','ok',
 case when source->>'quota' is not null then jsonb_build_array(jsonb_build_object('bucket','codex','kind','primary','usedPercent',(source->>'quota')::numeric,'windowDurationMins',300,'resetsAt',source->>'resetsAt')) else '[]'::jsonb end) returning id into a;
 end if;
 insert into public.codex_devices(id,owner_id,account_id,name,token_hash,observed_at,heartbeat_at)
 values(item.id::uuid,item.owner_id,a,coalesce(item.payload->>'name','Codex Mac'),item.payload->>'tokenHash',nullif(item.payload->>'observedAt','')::timestamptz,nullif(item.payload->>'observedAt','')::timestamptz);
 for day in select value from jsonb_array_elements(coalesce(item.payload->'daily','[]')) loop
 insert into public.codex_daily_usage(owner_id,account_id,usage_date,tokens,collected_at,device_id)
 values(item.owner_id,a,(day->>'date')::date,(day->>'tokens')::bigint,(item.payload->>'observedAt')::timestamptz,item.id::uuid)
 on conflict(account_id,usage_date) do update set tokens=excluded.tokens,collected_at=excluded.collected_at,device_id=excluded.device_id where excluded.collected_at>public.codex_daily_usage.collected_at;
 end loop;
 a:=null;
 end loop;
end $$;
