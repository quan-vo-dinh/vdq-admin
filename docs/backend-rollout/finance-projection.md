# Salary-cycle savings projection

`/finance/cash-flow` estimates savings by exact dates, independently of the actual ledger.

## Salary and following-month budget

Each salary cycle uses the last calendar day of its salary month, including leap years. The reserved spending period is the entire following calendar month. For example, salary on 31 October funds spending from 1–30 November.

Savings = take-home salary minus that following-month reserve. The reserve is separated once; it is not an actual expense transaction and is not deducted again in November. Salary and reserve amounts may differ for every cycle.

Contributions default to payday and can be delayed, never advanced. A known negative remainder draws from savings on payday. Unknown salary/reserve also makes savings unknown from payday because an immediate deficit cannot be ruled out.

The chart is a dated step line, without gradual accrual before payday. Contributions sort by their chosen dates, group on shared dates, and are excluded after the plan's end. Goal milestones use full dates compared to exact deadlines.

## Starting funds and goals

Starting funds are zero, current tracked money, or one manually entered total. For current/manual money, the spending reserve must be explicitly specified; only the remainder becomes starting savings. Blank is unknown, not zero. Current money cannot seed a past valuation date.

Starting funds must precede the projected salary receipts: never re-enter salary already included in the balance. Goal allocations already belong to tracked money and are not added again; goal monthly contributions are also not added automatically.

Selected goals consume one pool in priority order. Goal N requires the sum of full targets through N. The first crossing date is displayed. Later negative changes may reduce savings. Crossing a threshold is a forecast, not an actual purchase.

## Saving and compatibility

One owner-scoped plan with optimistic revisions. Saving/deleting never modifies transactions, accounts, goal allocations or actual budgets. Up to 120 salary months and 240 stored cycle entries are supported. Enter whole non-negative VND amounts up to 1 trillion; a derived negative remainder is allowed.

Existing v1 monthly net estimates remain unchanged in storage. GET upgrades their structure in memory, keeping old values as `legacyNet` references. No salary, budget or confirmed receipt date is fabricated. These references do not fund the new projections until the user enters salary and reserve amounts. Only explicit Save writes v2.

## API contract

`/api/finance/projection` uses existing owner authentication, Origin/CSRF checks, private no-store responses and mobile transport.

- GET: `{ saved: null | { id, revision, plan } }`; legacy plans normalize to v2 in the response only.
- PUT: `{ id: UUID, expectedRevision: 0 | positive integer, plan }`. Revision 0 creates a plan; later writes require its exact ID and revision. Duplicate owner or stale revision: 409. Invalid input: 400.
- DELETE: `{ id, expectedRevision }`; deletes that owner plan at the exact revision. Returns `{ saved: null }`; stale/missing: 409.
- Plan v2: `{ version: 2, startDate: YYYY-MM-DD, endDate: YYYY-MM-DD, baseMode: none|current|manual, manualBase: integer-string|empty-string, openingReserve: integer-string|empty-string, cycles: { [YYYY-MM]: { income: integer-string|empty-string, spending: integer-string|empty-string, savingDate: YYYY-MM-DD, legacyNet?: integer-string } }, goalIds: UUID[] }`.

Migrations, in order:

1. `supabase/migrations/20261025000100_finance_projection_plans.sql`: owner-scoped table, RLS, restricted column grants and revision trigger.
2. `supabase/migrations/20261025000200_finance_salary_cycle_projection.sql`: accepts v1 and v2 documents without rewriting existing plans.

Apply migrations to each intended database before using saved plans. Never reset a database for this. Both have been applied locally; production is not changed by local code edits or migrations.

Backup/audit includes the plan table, with compatibility for backups predating it.

Checks: `node scripts/test-finance-projection.mjs`, existing Finance/backend tests, configured Vercel build and mobile type-check. Local schema checks verify version compatibility without persisting test data. No browser automation is used.
