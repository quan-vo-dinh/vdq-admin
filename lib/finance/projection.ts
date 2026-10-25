export const MAX_PROJECTION_MONTHS = 120;
export const MAX_PROJECTION_AMOUNT = 1_000_000_000_000;
export type SalaryCycle = {
  income: string;
  spending: string;
  savingDate: string;
  legacyNet?: string;
};
export type SavingsPlan = {
  version: 2;
  startDate: string;
  endDate: string;
  baseMode: "none" | "current" | "manual";
  manualBase: string;
  openingReserve: string;
  cycles: Record<string, SalaryCycle>;
  goalIds: string[];
};
export type SavedSavingsPlan = {
  id: string;
  revision: number;
  plan: SavingsPlan;
};
export const validMonth = (value: string) =>
  /^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/.test(value);
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    validMonth(value.slice(0, 7)) &&
    Number.isFinite(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value
  );
}
/** Chart labels can be series names; only accept actual dates or timestamps. */
export function projectionChartDate(value: unknown): string | null {
  if (typeof value === "string" && validDate(value)) return value;
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  )
    return null;
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) return null;
  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) return null;
  const result = parsed.toISOString().slice(0, 10);
  return validDate(result) ? result : null;
}
export function addMonths(month: string, offset: number) {
  const [year, number] = month.split("-").map(Number),
    index = year * 12 + number - 1 + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}
export function lastDay(month: string) {
  const [year, number] = month.split("-").map(Number);
  return `${month}-${new Date(Date.UTC(year, number, 0)).getUTCDate()}`;
}
export function monthDistance(from: string, to: string) {
  const [fy, fm] = from.slice(0, 7).split("-").map(Number),
    [ty, tm] = to.slice(0, 7).split("-").map(Number);
  return (ty - fy) * 12 + tm - fm;
}
export function payrollMonths(startDate: string, endDate: string) {
  if (!validDate(startDate) || !validDate(endDate)) return [];
  const count = Math.min(
    MAX_PROJECTION_MONTHS,
    Math.max(0, monthDistance(startDate, endDate) + 1),
  );
  return Array.from({ length: count }, (_, i) =>
    addMonths(startDate.slice(0, 7), i),
  ).filter((month) => lastDay(month) >= startDate && lastDay(month) <= endDate);
}
export function planAmount(raw: string): number | null {
  if (!raw.trim()) return null;
  if (!/^-?\d{1,13}$/.test(raw)) throw new Error("invalid_amount");
  const amount = Number(raw);
  if (!Number.isSafeInteger(amount) || Math.abs(amount) > MAX_PROJECTION_AMOUNT)
    throw new Error("invalid_amount");
  return amount;
}
export function emptySavingsPlan(date: string): SavingsPlan {
  const startDate = validMonth(date) ? `${date}-01` : date;
  return {
    version: 2,
    startDate,
    endDate: lastDay(addMonths(startDate.slice(0, 7), 5)),
    baseMode: "none",
    manualBase: "0",
    openingReserve: "",
    cycles: {},
    goalIds: [],
  };
}
export function cycleFor(plan: SavingsPlan, month: string): SalaryCycle {
  return (
    plan.cycles[month] ?? {
      income: "",
      spending: "",
      savingDate: lastDay(month),
    }
  );
}
/** Legacy net estimates are retained as references, never invented salary/budget evidence. */
function upgradeLegacy(p: Record<string, unknown>): Record<string, unknown> {
  if (
    typeof p.startMonth !== "string" ||
    !validMonth(p.startMonth) ||
    !Number.isInteger(p.months) ||
    Number(p.months) < 1 ||
    Number(p.months) > 120 ||
    !p.amounts ||
    typeof p.amounts !== "object" ||
    Array.isArray(p.amounts)
  )
    throw new Error("invalid_legacy_plan");
  const cycles: Record<string, SalaryCycle> = {};
  for (const [month, net] of Object.entries(p.amounts)) {
    if (!validMonth(month) || typeof net !== "string")
      throw new Error("invalid_legacy_plan");
    planAmount(net);
    cycles[month] = {
      income: "",
      spending: "",
      savingDate: lastDay(month),
      legacyNet: net,
    };
  }
  return {
    version: 2,
    startDate: `${p.startMonth}-01`,
    endDate: lastDay(addMonths(p.startMonth, Number(p.months) - 1)),
    baseMode: p.baseMode,
    manualBase: p.manualBase,
    openingReserve: "",
    cycles,
    goalIds: p.goalIds,
  };
}
export function validateSavingsPlan(raw: unknown): SavingsPlan {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("invalid_plan");
  let p = raw as Record<string, unknown>;
  if (p.version === 1) p = upgradeLegacy(p);
  if (
    p.version !== 2 ||
    typeof p.startDate !== "string" ||
    typeof p.endDate !== "string" ||
    !validDate(p.startDate) ||
    !validDate(p.endDate) ||
    p.endDate < lastDay(p.startDate.slice(0, 7)) ||
    monthDistance(p.startDate, p.endDate) > 119
  )
    throw new Error("invalid_period");
  if (
    typeof p.baseMode !== "string" ||
    !["none", "current", "manual"].includes(p.baseMode) ||
    typeof p.manualBase !== "string" ||
    typeof p.openingReserve !== "string"
  )
    throw new Error("invalid_base");
  for (const field of [p.manualBase, p.openingReserve]) {
    const amount = planAmount(field);
    if (amount !== null && amount < 0) throw new Error("invalid_base");
  }
  if (
    !p.cycles ||
    typeof p.cycles !== "object" ||
    Array.isArray(p.cycles) ||
    Object.keys(p.cycles).length > 240
  )
    throw new Error("invalid_cycles");
  const cycles: Record<string, SalaryCycle> = {};
  for (const [month, value] of Object.entries(p.cycles)) {
    if (
      !validMonth(month) ||
      !value ||
      typeof value !== "object" ||
      Array.isArray(value)
    )
      throw new Error("invalid_cycle");
    const row = value as Record<string, unknown>;
    if (
      typeof row.income !== "string" ||
      typeof row.spending !== "string" ||
      typeof row.savingDate !== "string" ||
      !validDate(row.savingDate) ||
      row.savingDate < lastDay(month)
    )
      throw new Error("invalid_cycle");
    for (const field of [row.income, row.spending]) {
      const amount = planAmount(field);
      if (amount !== null && amount < 0)
        throw new Error("invalid_cycle_amount");
    }
    if (row.legacyNet !== undefined) {
      if (typeof row.legacyNet !== "string") throw new Error("invalid_legacy");
      planAmount(row.legacyNet);
    }
    cycles[month] = {
      income: row.income,
      spending: row.spending,
      savingDate: row.savingDate,
      ...(typeof row.legacyNet === "string"
        ? { legacyNet: row.legacyNet }
        : {}),
    };
  }
  if (
    !Array.isArray(p.goalIds) ||
    p.goalIds.length > 100 ||
    p.goalIds.some(
      (id) =>
        typeof id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id,
        ),
    ) ||
    new Set(p.goalIds).size !== p.goalIds.length
  )
    throw new Error("invalid_goals");
  return {
    version: 2,
    startDate: p.startDate,
    endDate: p.endDate,
    baseMode: p.baseMode as SavingsPlan["baseMode"],
    manualBase: p.manualBase,
    openingReserve: p.openingReserve,
    cycles,
    goalIds: p.goalIds as string[],
  };
}
const safeAmount = (raw: string) => {
  try {
    return planAmount(raw);
  } catch {
    return null;
  }
};
export function projectionRows(
  plan: SavingsPlan,
  currentBalance: number | null,
) {
  const capital =
    plan.baseMode === "none"
      ? 0
      : plan.baseMode === "current"
        ? currentBalance
        : safeAmount(plan.manualBase);
  const reserve =
    plan.baseMode === "none" ? 0 : safeAmount(plan.openingReserve);
  const initial =
    capital === null || reserve === null ? null : capital - reserve;
  const rows = payrollMonths(plan.startDate, plan.endDate).map((month) => {
    const cycle = cycleFor(plan, month),
      payDate = lastDay(month),
      nextMonth = addMonths(month, 1);
    const income = safeAmount(cycle.income),
      spending = safeAmount(cycle.spending);
    const invalidAmount =
      (cycle.income !== "" && (income === null || income < 0)) ||
      (cycle.spending !== "" && (spending === null || spending < 0));
    const surplus =
      income === null || spending === null || invalidAmount
        ? null
        : income - spending;
    const validSavingDate =
      validDate(cycle.savingDate) && cycle.savingDate >= payDate;
    // A budget deficit draws from savings on payday, even if positive savings are scheduled later.
    const savingDate =
      surplus === null || surplus < 0
        ? payDate
        : validSavingDate
          ? cycle.savingDate
          : payDate;
    return {
      month,
      ...cycle,
      payDate,
      expenseFrom: `${nextMonth}-01`,
      expenseTo: lastDay(nextMonth),
      incomeValue: income,
      spendingValue: spending,
      surplus: validSavingDate ? surplus : null,
      eventDate: savingDate,
      inHorizon: savingDate <= plan.endDate,
      invalid: invalidAmount || !validSavingDate,
      balance: null as number | null,
    };
  });
  const groups = new Map<string, typeof rows>();
  for (const row of rows.filter((r) => r.inHorizon))
    groups.set(row.eventDate, [...(groups.get(row.eventDate) ?? []), row]);
  let balance = initial;
  const chart: {
    date: string;
    timestamp: number;
    surplus: number | null;
    balance: number | null;
  }[] = [];
  const point = (date: string, surplus: number | null) => ({
    date,
    timestamp: Date.parse(date + "T00:00:00Z"),
    surplus,
    balance,
  });
  if (!groups.has(plan.startDate)) chart.push(point(plan.startDate, null));
  for (const [date, events] of [...groups.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const surplus = events.some((row) => row.surplus === null)
      ? null
      : events.reduce((sum, row) => sum + row.surplus!, 0);
    balance = balance === null || surplus === null ? null : balance + surplus;
    if (balance !== null && !Number.isSafeInteger(balance)) balance = null;
    for (const row of events) row.balance = balance;
    chart.push(point(date, surplus));
  }
  if (chart.at(-1)?.date !== plan.endDate)
    chart.push(point(plan.endDate, null));
  const missingDate =
    [...groups.entries()]
      .filter(([, events]) => events.some((row) => row.surplus === null))
      .map(([date]) => date)
      .sort()[0] ?? null;
  return { initial, capital, reserve, rows, chart, end: balance, missingDate };
}
export function projectedGoals(
  plan: SavingsPlan,
  current: number | null,
  goals: { id: string; name: string; target: number; deadline: string }[],
) {
  const projection = projectionRows(plan, current);
  let required = 0;
  return plan.goalIds.flatMap((id) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return [];
    required += goal.target;
    const reached =
      projection.initial !== null && projection.initial >= required
        ? "initial"
        : (projection.chart.find(
            (row) => row.balance !== null && row.balance >= required,
          )?.date ?? null);
    return [
      {
        ...goal,
        required,
        reached,
        reachedDate: reached === "initial" ? plan.startDate : reached,
      },
    ];
  });
}
export function savingsPlanFingerprint(plan: SavingsPlan) {
  return JSON.stringify([
    plan.version,
    plan.startDate,
    plan.endDate,
    plan.baseMode,
    plan.manualBase,
    plan.openingReserve,
    Object.entries(plan.cycles)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => [
        month,
        row.income,
        row.spending,
        row.savingDate,
        row.legacyNet ?? "",
      ]),
    plan.goalIds,
  ]);
}
