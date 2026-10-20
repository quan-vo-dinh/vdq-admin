# SQL migrations

P02: `20261020000100_owner_foundation.sql` creates the empty private owner registry,
`private.is_owner()` and authenticated-only `public.assert_owner()`.
Apply only with `pnpm exec supabase migration up --local`. Cloud migrations wait for P11.
No test tables, demo identities, or owner UUIDs are seeded in production migrations.

Every domain migration must enable RLS, revoke existing PUBLIC/anon/authenticated
object grants, then grant only required operations to authenticated. Policies use
`(select private.is_owner()) AND owner_id = (select auth.uid())` in both USING and
WITH CHECK. Private schema is not exposed through Data API. Postgres-created app
objects have closed default privileges. Supabase-managed `supabase_admin` defaults
cannot be changed by the migration role; don't create app objects as that role or
modify `rls_auto_enable`. Explicit app object grants/RLS remain mandatory.

App API contract: 400 invalid input, 401 no verified session, 403 non-owner/disabled/
Origin mismatch, 404 missing row, 409 stale revision/conflict, 500 unavailable or
missing configuration. Error JSON preserves `{code}` plus HTTP status. Private
responses use `private, no-store`; errors never expose tokens or SQL details.

Business IDs are UUIDs; identity comes from server-verified Auth, never request
owner fields. Business days use DATE/`YYYY-MM-DD` in Asia/Ho_Chi_Minh, instants use
timestamptz. Domain revisions increase in DB, with atomic expectedRevision filters
on app update/delete and 409 retaining drafts (implemented first in P04). RLS does
not enforce app CAS for an owner using Data API directly. Stable create UUIDs make
retries safe. No global mutation ledger, early domain tables or money framework.
