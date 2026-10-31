import { calendarMonthRange, periodDays, inFinancePeriod, periodMonthShares, type FinancePeriod } from "./period";
export type TransactionKind = "expense" | "income" | "transfer" | "refund";
export type Transaction = {
  id: string;
  revision?: number;
  date: string;
  description: string;
  amount: number;
  kind: TransactionKind;
  category: string;
  account: string;
  destination?: string;
  source: "demo" | "manual" | "csv";
  reference?: string;
  occurredAt?: string;
  reportingRole?: "standard" | "support_return" | "cash_withdrawal" | "prepaid_cash";
  reportGroup?: string;
  cashAccount?: string;
  cashReceived?: number;
  fundingTransaction?: string;
};
export type Account = {
  id: string;
  revision?: number;
  name: string;
  opening: number;
  note: string;
  archivedAt?: string | null;
  openingOn?: string | null;
  openingExcluded?: number;
};
export type Budget = {
  archivedAt?: string | null;
  id: string;
  revision?: number;
  name: string;
  limit: number;
  fixed: boolean;
  resourceId?: string;
  categoryId?: string;
  monthRows?: {id: string; month: string; revision: number}[];
  monthlyLimits?: Record<string, number>;
};
export const budgetLimit = (budget: Budget, period: FinancePeriod): number =>
  typeof period === "string"
    ? budget.monthlyLimits?.[period] ?? budget.limit
    : Math.round(periodMonthShares(period).reduce((total,{month,share}) => total+(budget.monthlyLimits?.[month] ?? budget.limit)*share,0));
export type Goal = {
  id: string;
  revision?: number;
  name: string;
  target: number;
  allocated: number;
  monthly: number;
  deadline: string;
  priority: "high" | "normal";
  visual: GoalVisual;
  image?: string;
};
export type GoalVisual =
  | "emergency"
  | "bike"
  | "phone"
  | "move"
  | "study"
  | "travel";
export type FinanceData = {
  checkpoints?: BalanceCheckpoint[];
  scopeEvents?: ScopeEvent[];
  settings?: {id: string; starts_on: string; revision: number};
  categories?: {id: string; code: string; name: string; kind: string; archived_at: string | null; revision: number}[];
  asOf: string;
  startsOn: string;
  transactions: Transaction[];
  scheduledTransactions?: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  bills: { id: string; revision?: number; name: string; date: string; amount: number }[];
};
export type BalanceCheckpoint = {
  id: string; revision: number; account: string; observedAt: string;
  amount: number; evidence: string;
};
export type ScopeEvent = {
  id: string; revision: number; account: string; occurredAt: string;
  amount: number; kind: "exclude" | "release" | "external_outflow"; evidence: string;
};
// Reporting convention and asset movement are deliberately separate.
export function reportingEffect(t: Transaction) {
  if (t.reportingRole === "support_return") return {income: -t.amount, expense: 0, refund: 0};
  if (t.reportingRole === "prepaid_cash") return {income: 0, expense: 0, refund: 0};
  return {income: t.kind === "income" ? t.amount : 0, expense: t.kind === "expense" ? t.amount : 0, refund: t.kind === "refund" ? t.amount : 0};
}
export function assetEffect(t: Transaction, account: string) {
  const cash = t.reportingRole === "cash_withdrawal" && t.cashAccount === account ? t.cashReceived ?? 0 : 0;
  if (t.kind === "transfer") return cash + (t.destination === account ? t.amount : 0) - (t.account === account ? t.amount : 0);
  return cash + (t.account === account ? (t.kind === "expense" ? -t.amount : t.amount) : 0);
}
export const financeDay = (timestamp: string) => new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(timestamp));
export const expenseGroup = (code: string): "food" | "transport" | "other" => code === "food" || code === "transport" ? code : "other";
export const kindLabels: Record<TransactionKind, string> = {
  expense: "Chi tiêu",
  income: "Thu nhập",
  transfer: "Chuyển khoản",
  refund: "Hoàn tiền",
};
export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
export const compactMoney = (value: number) =>
  `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(value / 1_000_000)} tr`;
export const sum = <T>(items: T[], get: (item: T) => number) =>
  items.reduce((total, item) => total + get(item), 0);
export function monthlyTotals(transactions: Transaction[], period: FinancePeriod) {
  const rows = transactions.filter((t) => inFinancePeriod(t.date, period));
  const income = sum(
    rows,
    (t) => reportingEffect(t).income,
  );
  const expenses = sum(
    rows,
    (t) => reportingEffect(t).expense,
  );
  const refunds = sum(
    rows,
    (t) => reportingEffect(t).refund,
  );
  return {
    income,
    expenses: expenses - refunds,
    refunds,
    net: income - expenses + refunds,
  };
}
/** Keep planned rows visible in the ledger, outside all actual reports. */
export function splitTransactions(rows: Transaction[], asOf: string) {
  return {
    transactions: rows.filter(row => row.date <= asOf),
    scheduledTransactions: rows.filter(row => row.date > asOf),
  };
}
export function ledgerTransactions(data: FinanceData) {
  return [...data.transactions, ...(data.scheduledTransactions ?? [])];
}
/** A review hint: more than twice the median of at least five earlier expenses
 * in the same category during the preceding 30 days. No automatic adjustment. */
export function unusualExpenses(data: FinanceData, period: FinancePeriod) {
  const actual = data.transactions.filter(t => t.date <= data.asOf && reportingEffect(t).expense > 0);
  return actual.filter(t => {
    if (!inFinancePeriod(t.date, period)) return false;
    const start = new Date(`${t.date}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 30);
    const from = start.toISOString().slice(0, 10);
    const previous = actual.filter(p => p.category === t.category && p.date >= from && p.date < t.date)
      .map(p => reportingEffect(p).expense).sort((a, b) => a - b);
    if (previous.length < 5) return false;
    const middle = Math.floor(previous.length / 2);
    const median = previous.length % 2 ? previous[middle] : (previous[middle - 1] + previous[middle]) / 2;
    return reportingEffect(t).expense > median * 2;
  });
}

/** Calendar-day comparison; a missing budget is unknown, not a zero allowance. */
export function dailySpendingComparison(data: FinanceData, period: FinancePeriod) {
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const transaction of data.transactions) {
    if (transaction.date > data.asOf || !inFinancePeriod(transaction.date, period)) continue;
    const effect = reportingEffect(transaction);
    totals.set(transaction.date, (totals.get(transaction.date) ?? 0) + effect.expense - effect.refund);
    if (effect.expense || effect.refund) counts.set(transaction.date, (counts.get(transaction.date) ?? 0) + 1);
  }
  return periodDays(period).map(date => {
    const month = date.slice(0, 7);
    const daysInMonth = Number(calendarMonthRange(month).to.slice(8));
    const allowance = data.budgets.length
      ? data.budgets.reduce((total, budget) => total + budgetLimit(budget, month), 0) / daysInMonth
      : null;
    const spent = date > data.asOf ? null : totals.get(date) ?? 0;
    return { date, spent, allowance, count: counts.get(date) ?? 0,
      difference: spent !== null && allowance !== null ? allowance - spent : null };
  });
}

export function accountBalance(account: Account, transactions: Transaction[], asOf = "9999-12-31") {
  // A baseline dated after the requested cutoff is not part of that historical position.
  if (account.openingOn && account.openingOn > asOf) return 0;
  return (
    account.opening +
    sum(transactions.filter(t => t.date <= asOf && (!account.openingOn || t.date >= account.openingOn)), t => assetEffect(t, account.id))
  );
}
export function categorySpent(
  transactions: Transaction[],
  category: string,
  period: FinancePeriod,
) {
  return sum(
    transactions.filter(
      (t) => t.category === category && inFinancePeriod(t.date, period),
    ),
    (t) => reportingEffect(t).expense - reportingEffect(t).refund,
  );
}
export function accountPosition(data: FinanceData, account: Account) {
  const hasBaseline=!!account.openingOn&&account.openingOn<=data.asOf;
  const events=(data.scopeEvents??[]).filter(e=>e.account===account.id && financeDay(e.occurredAt)<=data.asOf && (!account.openingOn || financeDay(e.occurredAt)>=account.openingOn));
  const balance=accountBalance(account,data.transactions,data.asOf)-sum(events.filter(e=>e.kind==="external_outflow"),e=>e.amount);
  const excluded=(hasBaseline?(account.openingExcluded??0):0)+sum(events,e=>e.kind==="exclude"?e.amount:-e.amount);
  return {balance,excluded,tracked:balance-excluded,known:hasBaseline&&excluded>=0};
}
export function overview(data: FinanceData) {
  const activeAccounts=data.accounts.filter(a=>!a.archivedAt);
  const positions=activeAccounts.map(a=>accountPosition(data,a));
  const balance=sum(positions,p=>p.balance),excluded=sum(positions,p=>p.excluded);
  const balanceKnown=positions.length>0&&positions.every(p=>p.known);
  const allocated = sum(data.goals, (g) => g.allocated);
  const committed = sum(data.bills, (b) => b.amount);
  return {
    balance,
    excluded,
    balanceKnown,
    accountCount:positions.length,
    tracked: balance - excluded,
    allocated,
    committed,
    available: balance - excluded - allocated - committed,
  };
}
export type ForecastInputs = {
  income: number;
  expenses: number;
  shock: number;
  salaryDay: number;
  reserve: number;
};
export function forecast(
  start: string,
  balance: number,
  days: number,
  inputs: ForecastInputs,
  bills: FinanceData["bills"] = [],
) {
  const startDate = new Date(`${start}T00:00:00+07:00`);
  let current = balance;
  const result = [{ date: start, balance: current, income: 0, expense: 0 }];
  for (let i = 1; i <= days; i++) {
    const date = new Date(
      startDate.getTime() + i * 86400000,
    ).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
    const day = Number(date.slice(8));
    const income = day === inputs.salaryDay ? inputs.income : 0;
    // Daily living cost plus a known one-off shock on day 7. Round VND, never float currency balances.
    const expense =
      Math.round(inputs.expenses / 30) +
      (i === 7 ? inputs.shock : 0) +
      sum(
        bills.filter((b) => b.date === date),
        (b) => b.amount,
      );
    current += income - expense;
    result.push({ date, balance: current, income, expense });
  }
  return result;
}
