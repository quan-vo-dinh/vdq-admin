-- Owner-scoped integration state. Credentials are AES-GCM ciphertext, never plaintext.
create table public.developer_documents (
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 collection text not null check(collection in ('connection','snapshot','sync','device','pairing','bookmarks')),
 id text not null check(length(id) between 1 and 200),
 payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=2000000),
 lease_until timestamptz not null default 'epoch',
 updated_at timestamptz not null default now(),
 primary key(owner_id,collection,id)
);
alter table public.developer_documents enable row level security;
create policy owner_only on public.developer_documents to authenticated
 using(owner_id=(select auth.uid()) and (select private.is_owner()))
 with check(owner_id=(select auth.uid()) and (select private.is_owner()));
grant select,insert,update,delete on public.developer_documents to authenticated;
