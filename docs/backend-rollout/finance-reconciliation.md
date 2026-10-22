# Finance: balance integrity and reconciliation

Status: tested locally; production release authorized by the user on 2026-10-22. Encrypted backup verified before the additive migration and reviewed data correction. Deployment outcome is recorded in release evidence.

## Findings

The linked production inventory was read directly with a verified enabled owner. It contained new transactions and retained import receipts, accounts, categories, budgets, monthly overrides and a goal. An earlier cleanup does not describe current database state. Deleted transactions cannot be reconstructed from receipt counts or payload hashes.

The current imported ledger is a simplified budget report rather than a complete asset ledger. A salary was stored after a personal budget deduction and assigned to the remaining bank account. Internal movements and some offsetting records were omitted. The bank account has an undated zero opening balance. Other banks, a wallet and physical cash are absent. Consequently, income minus spending cannot represent money held across all locations. No production duplicate candidates matched the exact existing date/description/amount/kind/account key at capture time; this does not disprove duplicates reported in the older, deleted dataset.

The current account UUID mapping was verified from the database. One historical UUID is absent; its previous bank name cannot be established from current rows. The private audit contains the exact mapping. No UUID/name relationship was guessed.

The supplied workbook contains actual-source transcription rows plus three explicitly inferred differences. Its zero reconciliation difference includes those inferred rows. Independent recalculation of the source-only amounts leaves a nonzero unexplained difference. They must remain unresolved evidence rather than invented expense/fee transactions. Original notification images and a full bank statement were not supplied in the workspace. Workbook labels claiming evidence are historical assertions, not newly verified original evidence.

The old CSV preview explicitly allowed duplicate-looking rows, while database uniqueness covered only a batch's row index. New batch identifiers could import the same source again. A stale batch receipt could claim success after its transactions were deleted. The existing export code used filtered data rather than a table page, so pagination alone does not explain the reported historical two-row download. Summary metrics previously ignored table filters, creating a demonstrable discrepancy between metrics and export scope. Local browser testing now verifies an actual multi-page CSV download with the same filtered row count and total. Historical production export failure remains unproven without the original export and runtime state.

## Definitions and equations

- Account opening balance is the value immediately before 00:00 on `opening_on`, Asia/Ho_Chi_Minh. A null date means the starting point is unverified, not that the balance is zero. Earlier backfilled records remain in period reporting but are not counted again after a later baseline.
- Account balance = dated opening + signed account movements through the cutoff − already excluded funds paid out. Transfers decrease the source and increase the destination once. They contribute no income or expense.
- Within-scope money = total account balances − excluded money still held. This includes counted physical cash, even if its withdrawal was charged to a budget in advance.
- Unallocated money = within-scope money − goal allocations − declared bills. Allocations and bills are plans, not additional past expenses or bank debits.
- Reporting income = original receipts − returned support. Refunds reduce spending, not income. A support return must belong to a named group and does not also count as spending.
- Reporting expense = expense rows − refunds, with explicit ATM/cash conventions. A group exposes gross income, retained income, budget cost and net. Salary and gifts keep their original amounts; a named salary group shows the personal remainder without changing bank salary.
- Reconciliation difference = observed bank/cash balance − calculated account balance at that observation. A checkpoint is evidence only. It never resets a baseline, creates income, or inserts a balancing transaction.

`opening_on` has day precision. `occurred_at`, scope events and observations carry an explicit offset. Date-only transactions on the checkpoint day make intraday reconciliation unavailable. Missing seconds or conflicting posting dates must not be promoted to precise evidence automatically. The app uses occurrence day; a separate bank posting date is not yet implemented.

## Special cases

Only `food`, `transport`, and `other` appear in the expense group summary and spending composition. Existing detailed categories and their budget limits remain preserved. Every expense detail outside `food`/`transport` rolls into `other` in this reporting view. Detailed budget editing remains available for historical limits; merging those limits automatically would impose an unconfirmed budget policy.

An ATM budget expense can include both the amount withdrawn and a fee in one row. `cash_account_id` and `cash_received` preserve the cash received as an asset. Later `prepaid_cash` expenses reduce that cash without a second budget charge and must reference the funding withdrawal. Database validation checks the same owner, cash account, chronology and total allocation. Without a confirmed cash source, a normal cash expense remains separate; the user must resolve possible budget overlap. A spending-basis comparison exposes the difference between the budget convention and cash assets actually consumed.

Excluded funds use a separate event stream: `exclude` reduces within-scope money while bank money stays held; `release` returns it to scope; `external_outflow` decreases both bank and previously excluded funds. A payout therefore has no second effect on within-scope money. These records never enter income/expense reports or transfer statistics. A reservation's baseline/date must be supported; the historical private amount cannot be assigned an invented reservation time. Checkpoints may verify bank money independently of an unresolved reservation.

Support receipts, the returned support and trip expenses can share a group. Original bank debits are retained; a cash fare/Grab payment is assigned to cash. If the payment came from an ATM already fully charged to the budget, group economic cost and budget cost can differ. The system exposes that difference rather than counting the cash payment twice to force a group total.

## Implementation

- `20261022000100_finance_reconciliation.sql`: additive baseline/date fields, source reference uniqueness, occurrence times, reporting/group fields, ATM funding relationships, checkpoint/scope tables and owner RLS, decimal-text DTOs, a consistent snapshot RPC, serialized import/ledger writes, duplicate and stale-receipt checks.
- `lib/finance/model.ts` and `reconciliation.ts`: separate asset/reporting effects, dated balances, excluded funds, reconciliation, three expense groups and data-quality diagnostics.
- `lib/finance/server.ts`: owner-scoped snapshot read and CAS mutations for checkpoints/scope; exact-money validation; import preserves/remaps metadata and cash relationships.
- CSV accepts the existing seven columns and a full export with identifiers, references, occurrence time and policy metadata. Preview shows source/destination account names and blocks duplicates. Database rechecks inside the import transaction; no partial import or silent skipping. Distinct references allow genuine same-day/same-amount transactions. Without references, fallback matching is conservative and cannot detect all edited duplicates.
- Each internal movement is one two-account transfer row. Source and destination bank statements can carry different references for the same movement; automatic counterpart matching is not implemented. They must be reviewed and paired before importing, rather than importing both as separate transfers. The CSV dialog states this boundary.
- The original Overview layout is preserved. A small header button opens the reconciliation information in a dialog. Account setup accepts a dated baseline and initially excluded money. Transaction editor records references/groups and explicit cash/support policies. Summary cards and CSV use the same transaction filters. Missing baselines suppress claims of known balances.
- Backup tooling includes both new tables and retains pre-migration bundle compatibility. The read-only audit CLI writes a consistent owner snapshot, exact numeric text and SHA-256 outside the repository.
- Removed duplicate `MonthPicker` declarations left in the existing rebase result, which previously caused TypeScript failure.

## Verification and operation

```bash
pnpm test:finance
pnpm test:backend-setup
pnpm exec eslint lib/finance app/components/finance app/context/finance-context app/api/finance
pnpm build
pnpm mobile:typecheck
node scripts/backend/test-finance-reconciliation-local.mjs
# Execute supabase/tests/finance_reconciliation.test.sql only on the local DB.
# Every SQL fixture is rolled back. API fixtures are removed in finally.
node scripts/backend/audit-finance.mjs --target production --directory /absolute/private/path
python3 scripts/backend/reconcile-finance-sources.py --workbook /path/to/reference.xlsx --notes /path/to/revised.txt --directory /absolute/private/path
```

Actual validation results and the sensitive per-row comparison are stored outside Git in the private investigation folder. A sanitized validation manifest is kept alongside this document. Full-repository lint has an existing unrelated baseline; scoped lint passing does not mean full lint passes. Native-device testing and production browser acceptance are separate gates.

Before production rollout: verify a fresh private/encrypted backup and recovery path; apply only the reviewed additive migration; release through the requested GitHub/Preview/Vercel workflow; then read back inventory and verify application contracts. Do not restore deleted rows from batch counts, bulk replace the ledger, merge historical budgets or reimport the source workbook as ordinary expenses. The private correction review lists matched existing rows with expected revisions and unresolved inputs; it deliberately contains no executable production mutation.

For daily use without old account balances, collect an explicitly dated balance for each current location and begin a new forward ledger at that cutoff. That provides a new supported starting point, without pretending missing earlier ACB/wallet/cash movements have been reconstructed. Historical reconciliation remains independently open until evidence is supplied.

References: [GnuCash reconciliation](https://www.gnucash.org/docs/v5/C/gnucash-guide/chapter_txns.html), [Supabase owner-aware views](https://supabase.com/docs/guides/database/postgres/row-level-security), [PostgreSQL unique indexes](https://www.postgresql.org/docs/16/indexes-unique.html). The implemented choices use the user's explicit reporting conventions and never create automatic balance plugs.
