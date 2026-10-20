# Local database acceptance

`pnpm exec supabase test db --local` runs `owner.test.sql`: 28 pgTAP assertions in
a transaction, synthetic Auth users and a temporary-for-test public RLS table;
ROLLBACK removes all fixtures and restores the committed owner registry. The test replaces registry rows only inside its uncommitted transaction so it can run after real local bootstrap. Test operations run as authenticated/anon, not admin.
Covers registry protection, owner/non-owner/disabled/missing owner, WITH CHECK,
grants/default privileges and helper search_path. Never run on linked/cloud DB.

`pnpm test:backend-setup` includes auth redirect/Origin/env policy tests.
`scripts/backend/test-auth-local.mjs` additionally exercises real local Auth,
PostgREST and a separately started Next server. See P03 evidence for its environment
and rerun commands. Admin tooling only creates/removes the synthetic local fixtures;
actual requests use publishable key and user tokens. This is not OAuth acceptance.

P01 smoke tests intentionally assert the pre-foundation empty catalog; use P02/P03
tests after this migration. No need to rerun P01 baseline/cloud/dump/restore.
