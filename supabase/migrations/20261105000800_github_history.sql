-- Historical facts are independent of the selected Inbox repositories.
alter table public.developer_documents drop constraint developer_documents_collection_check;
alter table public.developer_documents add constraint developer_documents_collection_check
 check(collection in ('connection','snapshot','sync','device','pairing','bookmarks','history'));
create table public.github_history_events (
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 source_id text not null,
 event_key text not null,
 day date not null,
 kind text not null check(kind in ('contributions','prs','lines')),
 count integer not null default 0 check(count>=0),
 additions bigint not null default 0 check(additions>=0),
 deletions bigint not null default 0 check(deletions>=0),
 primary key(owner_id,source_id,event_key)
);
create index github_history_period on public.github_history_events(owner_id,source_id,day);
alter table public.github_history_events enable row level security;
create policy owner_only on public.github_history_events to authenticated
 using(owner_id=(select auth.uid()) and (select private.is_owner()))
 with check(owner_id=(select auth.uid()) and (select private.is_owner()));
grant select,insert,update,delete on public.github_history_events to authenticated,service_role;
create function public.github_history_totals(p_today date default current_date)
 returns table(source_id text,period text,contributions bigint,prs bigint,additions bigint,deletions bigint)
 language sql stable security invoker set search_path='' as $$
 select e.source_id,p.period,
 coalesce(sum(e.count) filter(where e.kind='contributions'),0)::bigint,
 coalesce(sum(e.count) filter(where e.kind='prs'),0)::bigint,
 coalesce(sum(e.additions),0)::bigint,coalesce(sum(e.deletions),0)::bigint
 from public.github_history_events e
 cross join (values ('all',null::date),('year',p_today-364),('month',p_today-29)) p(period,since)
 where e.day<=p_today and (p.since is null or e.day>=p.since)
 group by e.source_id,p.period;
$$;
revoke all on function public.github_history_totals(date) from public,anon;
grant execute on function public.github_history_totals(date) to authenticated,service_role;
