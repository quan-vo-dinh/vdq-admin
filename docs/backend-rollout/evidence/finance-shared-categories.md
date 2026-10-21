# Shared Finance categories — 2026-10-21

One category code/ID can be used by income, expense and refund transactions.
Transaction `kind` alone determines direction; category `kind` remains its
initial grouping label. Existing IDs, history, revision checks and RLS stay intact.
CSV preview and manual editor accept all active categories. Overview includes
income-labelled categories in budgets when they have expense/refund history or
an explicit budget, so spending is not dropped from category reports.

Database migration: `20261021000400_finance_shared_categories.sql`. It replaces
only the transaction guard, budget guard and import RPC; no historical data is
rewritten. Preserve migration order, especially `20261021000300`.

Validation:
- `pnpm test:finance`: 16/16 pass.
- `node scripts/backend/test-finance-shared-categories-local.mjs`: pass. Applies
  migration in a rollback-only transaction, performs CRUD as authenticated with
  existing local owner claims (no JWT minted), then rolls back. Covers shared
  import/manual/budget, retry, changed-payload conflict, atomic rollback, archive
  checks, non-owner denial and owner RLS.
- Scoped ESLint: pass. `pnpm build`: pass.
- Exported staged snapshot: TypeScript check passes independently of unrelated
  working-tree edits. Unit suite ran in the main checkout; its isolated runner
  was blocked by pnpm's external node_modules symlink safety guard.

Production migration requires separate user approval; pushing code alone does
not update Supabase functions. Existing APKs also contain the old CSV validator:
install the new 0.1.2-p12 debug APK in place (versionCode 3), using the same debug
certificate/app ID. Production website deploy is not manually invoked here.
Native visual acceptance remains pending; this change does not claim P12 complete.
