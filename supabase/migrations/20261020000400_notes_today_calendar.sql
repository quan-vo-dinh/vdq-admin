create function private.bump_revision() returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  new.created_at := old.created_at;
  new.owner_id := old.owner_id;
  new.id := old.id;
  return new;
end $$;

create table public.notes (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 200),
 content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}' check(jsonb_typeof(content)='object' and content->>'type'='doc' and octet_length(content::text)<=250000),
 color text not null default 'primary' check(color in ('primary','chart-4','destructive','chart-2','chart-3')),
 note_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0)
);
create index on public.notes(owner_id,note_at desc,id);
create table public.today_items (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id), item_date date not null,
 slot integer not null check(slot between 1 and 3), title text not null check(length(btrim(title)) between 1 and 160),
 category text not null check(category in ('work','personal','learning')), done boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0), unique(owner_id,item_date,slot)
);
create table public.calendar_events (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 160), description text not null default '' check(length(description)<=5000),
 color text not null check(color in ('violet','blue','green','orange','rose','slate')),
 category text not null check(category in ('work','meeting','personal','learning')), kind text not null check(kind in ('event','task')),
 status text not null check(status in ('planned','confirmed','completed','cancelled')), priority text not null check(priority in ('low','medium','high')),
 location text not null default '' check(length(location)<=300), attendees text not null default '' check(length(attendees)<=1000),
 starts_at timestamptz, ends_at timestamptz, starts_on date, ends_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0),
 check((starts_at is not null and ends_at is not null and ends_at>starts_at and starts_on is null and ends_on is null) or
 (starts_on is not null and ends_on is not null and ends_on>starts_on and starts_at is null and ends_at is null))
);
create index on public.calendar_events(owner_id,starts_at,ends_at);
create index on public.calendar_events(owner_id,starts_on,ends_on);
create table public.calendar_settings (
 id uuid primary key default auth.uid(), owner_id uuid not null default auth.uid() unique references auth.users(id),
 settings jsonb not null default '{"badgeStyle":"mixed","workStart":9,"workEnd":18,"visibleStart":7,"visibleEnd":21,"showWeekends":true,"workDays":[1,2,3,4,5]}' check(jsonb_typeof(settings)='object' and octet_length(settings::text)<2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0), check(id=owner_id)
);

do $$ declare t text; begin
 foreach t in array array['notes','today_items','calendar_events','calendar_settings'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select,delete on public.%I to authenticated',t);
 execute format('create policy owner_only on public.%I to authenticated using (owner_id=(select auth.uid()) and (select private.is_owner())) with check (owner_id=(select auth.uid()) and (select private.is_owner()))',t);
 execute format('create trigger revision before update on public.%I for each row execute function private.bump_revision()',t);
 end loop;
end $$;
grant insert(id,title,content,color,note_at), update(title,content,color,note_at) on public.notes to authenticated;
grant update(done,title,category) on public.today_items to authenticated;
grant insert(id,title,description,color,category,kind,status,priority,location,attendees,starts_at,ends_at,starts_on,ends_on), update(title,description,color,category,kind,status,priority,location,attendees,starts_at,ends_at,starts_on,ends_on) on public.calendar_events to authenticated;
grant insert(id), update(settings) on public.calendar_settings to authenticated;
revoke delete on public.calendar_settings from authenticated;

-- A single per-owner transaction lock serializes capacity changes across all dates.
-- It therefore also orders every source/destination pair without deadlocks.
create function public.create_today(p_id uuid,p_date date,p_title text,p_category text) returns public.today_items
language plpgsql security definer set search_path='' as $$
declare r public.today_items; s integer; begin
 if not private.is_owner() then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into r from public.today_items where id=p_id and owner_id=auth.uid();
 if found then return r; end if;
 select x into s from generate_series(1,3) x where not exists(select 1 from public.today_items where owner_id=auth.uid() and item_date=p_date and slot=x) order by x limit 1;
 if s is null then raise exception 'full' using errcode='P0001'; end if;
 insert into public.today_items(id,owner_id,item_date,slot,title,category) values(p_id,auth.uid(),p_date,s,p_title,p_category) returning * into r;
 return r;
end $$;
create function public.move_today(p_id uuid,p_date date,p_revision integer) returns public.today_items
language plpgsql security definer set search_path='' as $$
declare r public.today_items; s integer; begin
 if not private.is_owner() then raise insufficient_privilege; end if;
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
revoke all on function public.create_today(uuid,date,text,text), public.move_today(uuid,date,integer) from public,anon,authenticated;
grant execute on function public.create_today(uuid,date,text,text), public.move_today(uuid,date,integer) to authenticated;
