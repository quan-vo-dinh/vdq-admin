export type TransactionKind = "expense" | "income" | "transfer" | "refund";
export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  kind: TransactionKind;
  category: string;
  account: string;
  destination?: string;
  source: "demo" | "manual" | "csv";
};
export type Account = {
  id: string;
  name: string;
  opening: number;
  note: string;
};
export type Budget = {
  id: string;
  name: string;
  limit: number;
  fixed: boolean;
  monthlyLimits?: Record<string, number>;
};
export const budgetLimit = (budget: Budget, month: string) =>
  budget.monthlyLimits?.[month] ?? budget.limit;
export type Goal = {
  id: string;
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
  asOf: string;
  startsOn: string;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  bills: { id: string; name: string; date: string; amount: number }[];
};
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
export function monthlyTotals(transactions: Transaction[], month: string) {
  const rows = transactions.filter((t) => t.date.startsWith(month));
  const income = sum(
    rows.filter((t) => t.kind === "income"),
    (t) => t.amount,
  );
  const expenses = sum(
    rows.filter((t) => t.kind === "expense"),
    (t) => t.amount,
  );
  const refunds = sum(
    rows.filter((t) => t.kind === "refund"),
    (t) => t.amount,
  );
  return {
    income,
    expenses: expenses - refunds,
    refunds,
    net: income - expenses + refunds,
  };
}
export function accountBalance(account: Account, transactions: Transaction[]) {
  return (
    account.opening +
    sum(transactions, (t) => {
      if (t.kind === "transfer")
        return (
          (t.destination === account.id ? t.amount : 0) -
          (t.account === account.id ? t.amount : 0)
        );
      if (t.account !== account.id) return 0;
      return t.kind === "expense" ? -t.amount : t.amount;
    })
  );
}
export function categorySpent(
  transactions: Transaction[],
  category: string,
  month: string,
) {
  return sum(
    transactions.filter(
      (t) => t.category === category && t.date.startsWith(month),
    ),
    (t) =>
      t.kind === "expense" ? t.amount : t.kind === "refund" ? -t.amount : 0,
  );
}
export function overview(data: FinanceData) {
  const balance = sum(data.accounts, (a) =>
    accountBalance(a, data.transactions),
  );
  const allocated = sum(data.goals, (g) => g.allocated);
  const committed = sum(data.bills, (b) => b.amount);
  return {
    balance,
    allocated,
    committed,
    available: balance - allocated - committed,
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
export function purchaseScenario(
  balance: number,
  price: number,
  extras: number,
  monthlyCost: number,
  monthlySurplus: number,
  reserve: number,
  delay: number,
) {
  const total = price + extras;
  const after = balance + monthlySurplus * delay - total;
  return {
    total,
    after,
    aboveReserve: after - reserve,
    monthlyAfter: monthlySurplus - monthlyCost,
    monthsToAfford:
      monthlySurplus > 0
        ? Math.max(0, Math.ceil((total + reserve - balance) / monthlySurplus))
        : null,
  };
}
