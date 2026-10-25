-- Preserve old plans unchanged; the API upgrades them in memory and saves v2 only on explicit Save.
alter table public.finance_projection_plans
 drop constraint finance_projection_plans_plan_check;
alter table public.finance_projection_plans
 add constraint finance_projection_plans_plan_check check (
  jsonb_typeof(plan)='object' and
  (plan @> '{"version":1}'::jsonb or plan @> '{"version":2}'::jsonb)
 );
