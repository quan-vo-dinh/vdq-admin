-- Device pairing/ingestion uses a dedicated server-only service-role client.
-- Browser access remains subject to the existing authenticated owner RLS policy.
grant select, insert, update, delete on public.developer_documents to service_role;
