create table public.profiles (
 id uuid primary key default auth.uid(), owner_id uuid not null unique default auth.uid() references auth.users(id),
 personal jsonb not null default '{"firstName":"","lastName":"","email":"","phone":"","position":"","facebook":"","linkedin":"","github":"","instagram":""}',
 address jsonb not null default '{"location":"","state":"","pin":"","zip":"","taxNo":""}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1,
 check(id=owner_id), check(jsonb_typeof(personal)='object' and octet_length(personal::text)<8000 and personal - array['firstName','lastName','email','phone','position','facebook','linkedin','github','instagram'] = '{}'::jsonb),
 check(jsonb_typeof(address)='object' and octet_length(address::text)<4000 and address - array['location','state','pin','zip','taxNo'] = '{}'::jsonb)
);
create table public.user_preferences (
 id uuid primary key default auth.uid(), owner_id uuid not null unique default auth.uid() references auth.users(id),
 locale text not null default 'vi' check(locale in ('vi','en')), theme text not null default 'light' check(theme in ('light','dark')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1, check(id=owner_id)
);
-- finance_starts_on remains authoritative in finance_settings, not duplicated here.
do $$ declare t text; begin foreach t in array array['profiles','user_preferences'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant insert(id) on public.%I to authenticated',t);
 execute format('create policy owner_only on public.%I to authenticated using(owner_id=(select auth.uid()) and (select private.is_owner())) with check(owner_id=(select auth.uid()) and (select private.is_owner()))',t);
 execute format('create trigger revision before update on public.%I for each row execute function private.bump_revision()',t);
end loop; end $$;
grant update(personal,address) on public.profiles to authenticated;
grant update(locale,theme) on public.user_preferences to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('personal-media','personal-media',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy personal_media_owner on storage.objects for all to authenticated
 using(bucket_id='personal-media' and (storage.foldername(name))[1]=(select auth.uid())::text and (storage.foldername(name))[2]='goals' and (select private.is_owner()))
 with check(bucket_id='personal-media' and (storage.foldername(name))[1]=(select auth.uid())::text and (storage.foldername(name))[2]='goals' and (select private.is_owner()));
alter table public.finance_goals drop constraint finance_goals_image_path_check;
alter table public.finance_goals add constraint finance_goals_image_path_check check(image_path is null or image_path ~ ('^' || owner_id::text || '/goals/[0-9a-f-]{36}[.](jpg|png|webp)$'));
grant update(image_path) on public.finance_goals to authenticated;
