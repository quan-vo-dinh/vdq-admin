# Profile validation and Finance backfill — 2026-10-21

Profile social URLs accept domain-only input and are normalized to HTTPS before
storage. Credentials in URLs, non-HTTP protocols, malformed links, invalid email
and unknown fields remain rejected. Partial profile patches preserve other fields.
The UI displays API-specific validation messages and an error Alert in the dialog.

Finance report months now use a native month input and previous/next controls,
independent of the original starts_on/current-month window. Actual transactions
and CSV imports accept past dates before starts_on. Goal deadlines accept past
dates; existing overdue goals can be edited. Actual transactions after today in
Asia/Ho_Chi_Minh remain rejected; planned future obligations remain bills.

Migration 20261021000100 replaces only private.finance_transaction_guard's lower
date restriction. It retains future-date, archived-account and category checks,
existing trigger/RLS and all stored data. Applied local and linked production;
dry-run confirmed this was the only pending migration.

Validation:
- 14 Finance unit tests, 21 backend setup tests, scoped lint and local build pass.
- Local API: domain-only URL save/reload, unsafe URL rejection, stale revision
  rejection and preservation of unpatched fields pass. Original profile restored.
- Production build READY. Production API saved/reloaded existing profile values,
  created/read a backdated actual transaction and created an overdue goal.
  A future actual transaction was rejected with 400.
- Temporary account, transaction and goal removed; verification sessions logged out.
- Browser visual/date-picker interaction was not tested: browser use is disabled.
