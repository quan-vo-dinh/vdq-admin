create table public.learning_habits (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id),
 title text not null check(length(btrim(title)) between 1 and 80), intention text not null default '' check(length(intention)<=240),
 target_minutes integer not null check(target_minutes between 1 and 1440), started_on date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
 archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0), unique(owner_id,id)
);
create table public.learning_checkins (
 id uuid primary key, owner_id uuid not null default auth.uid() references auth.users(id), habit_id uuid not null,
 checked_on date not null, minutes integer not null check(minutes between 1 and 1440), note text not null default '' check(length(note)<=500),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), revision integer not null default 1 check(revision>0),
 foreign key(owner_id,habit_id) references public.learning_habits(owner_id,id), unique(owner_id,habit_id,checked_on)
);
create index on public.learning_checkins(owner_id,checked_on);
create index on public.learning_checkins(habit_id,checked_on);
do $$ declare t text; begin foreach t in array array['learning_habits','learning_checkins'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public,anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_only on public.%I to authenticated using(owner_id=(select auth.uid()) and (select private.is_owner())) with check(owner_id=(select auth.uid()) and (select private.is_owner()))',t);
 execute format('create trigger revision before update on public.%I for each row execute function private.bump_revision()',t);
end loop; end $$;
grant insert(id,title,intention,target_minutes),update(title,intention,target_minutes,archived) on public.learning_habits to authenticated;
-- Check-in writes only through this function. Lock habit FIRST in every operation;
-- archive's UPDATE takes the same row lock, so concurrent check-in cannot bypass archive.
create function public.learning_checkin(p_habit uuid,p_id uuid,p_revision integer,p_minutes integer,p_note text,p_undo boolean,p_date date) returns void
language plpgsql security definer set search_path='' as $$
declare h public.learning_habits; r public.learning_checkins; d date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; begin
 if not private.is_owner() then raise insufficient_privilege; end if;
 if p_revision is null or p_revision<0 or p_date is distinct from d then raise exception 'conflict'; end if;
 select * into h from public.learning_habits where id=p_habit and owner_id=auth.uid() for update;
 if not found then raise exception 'missing'; end if;
 if h.archived then raise check_violation using message='archived'; end if;
 select * into r from public.learning_checkins where habit_id=p_habit and owner_id=auth.uid() and checked_on=d for update;
 if found then
 if r.revision<>p_revision or r.id<>p_id then raise exception 'conflict'; end if;
 if p_undo then delete from public.learning_checkins where id=r.id and owner_id=auth.uid();
 else update public.learning_checkins set minutes=p_minutes,note=p_note where id=r.id and owner_id=auth.uid(); end if;
 else
 if p_revision<>0 or p_undo then raise exception 'conflict'; end if;
 insert into public.learning_checkins(id,habit_id,checked_on,minutes,note) values(p_id,p_habit,d,p_minutes,p_note);
 end if;
end $$;
revoke all on function public.learning_checkin(uuid,uuid,integer,integer,text,boolean,date) from public,anon,authenticated;
grant execute on function public.learning_checkin(uuid,uuid,integer,integer,text,boolean,date) to authenticated;
