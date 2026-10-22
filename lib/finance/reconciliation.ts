import { assetEffect, expenseGroup, monthlyTotals, reportingEffect, sum, type Account, type FinanceData, type Transaction } from "./model";
import { inFinancePeriod, type FinancePeriod } from "./period";
import { transactionKey } from "./csv";

const localDay = (timestamp: string) => new Intl.DateTimeFormat("en-CA", {timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit"}).format(new Date(timestamp));

/** Checkpoints compare; they never rewrite opening balances or create plug entries. */
export function reconcileAccount(data: FinanceData, account: Account, observedAt: string, observed: number) {
  const day = localDay(observedAt), cutoff = Date.parse(observedAt);
  const relevant = data.transactions.filter(t => t.date <= day && (!account.openingOn || t.date >= account.openingOn) && assetEffect(t, account.id) !== 0);
  // Date-only rows cannot establish ordering within a statement day.
  const ambiguous = relevant.filter(t => t.date === day && !t.occurredAt);
  const included = relevant.filter(t => t.occurredAt ? Date.parse(t.occurredAt) <= cutoff : t.date < day);
  const events = (data.scopeEvents ?? []).filter(e => e.account === account.id && Date.parse(e.occurredAt) <= cutoff && (!account.openingOn || localDay(e.occurredAt) >= account.openingOn));
  const calculated = account.opening + sum(included, t => assetEffect(t, account.id)) - sum(events.filter(e => e.kind === "external_outflow"), e => e.amount);
  const excluded = (account.openingExcluded ?? 0) + sum(events, e => e.kind === "exclude" ? e.amount : -e.amount);
  const ready = !!account.openingOn && account.openingOn <= day && ambiguous.length === 0 && excluded >= 0;
  return {calculated, excluded, tracked: calculated - excluded, difference: ready ? observed - calculated : null, ready, ambiguous: ambiguous.length};
}

export function expenseGroups(transactions: Transaction[], period: FinancePeriod) {
  return (["food", "transport", "other"] as const).map(code => ({code, amount: sum(transactions.filter(t => inFinancePeriod(t.date, period) && expenseGroup(t.category) === code), t => reportingEffect(t).expense - reportingEffect(t).refund)}));
}
export function spendingBasis(transactions: Transaction[], period: FinancePeriod) {
  const rows=transactions.filter(t=>inFinancePeriod(t.date,period));
  const budget=monthlyTotals(rows,period).expenses;
  const assetExpense=sum(rows,t=>t.reportingRole==="support_return"?0:t.kind==="refund"?-t.amount:t.kind!=="expense"?0:t.reportingRole==="cash_withdrawal"?t.amount-(t.cashReceived??0):t.amount);
  return {budget,assetExpense,difference:budget-assetExpense};
}
export function transactionGroups(transactions: Transaction[], period: FinancePeriod) {
  const names = [...new Set(transactions.filter(t => t.reportGroup && inFinancePeriod(t.date, period)).map(t => t.reportGroup!))];
  return names.map(name => {
    const rows = transactions.filter(t => t.reportGroup === name && inFinancePeriod(t.date, period));
    return {name, count: rows.length, grossIncome:sum(rows.filter(t=>t.kind==="income"),t=>t.amount), returned:sum(rows.filter(t=>t.reportingRole==="support_return"),t=>t.amount), assetExpense:spendingBasis(rows,period).assetExpense, ...monthlyTotals(rows, period), assetChange: sum(rows, t => t.kind === "transfer" ? 0 : (t.kind === "expense" ? -t.amount : t.amount) + (t.reportingRole === "cash_withdrawal" ? t.cashReceived ?? 0 : 0))};
  });
}
export function financeIssues(data: FinanceData) {
  const keys = new Map<string, number>();
  for (const t of data.transactions) keys.set(transactionKey(t), (keys.get(transactionKey(t)) ?? 0) + 1);
  return {
    missingBaselines: data.accounts.filter(a => !a.openingOn).length,
    duplicateCandidates: [...keys.values()].filter(n => n > 1).reduce((s,n) => s+n-1,0),
    missingReferences: data.transactions.filter(t => t.source === "csv" && !t.reference).length,
    beforeBaseline: data.transactions.filter(t => data.accounts.some(a => a.openingOn && t.date < a.openingOn && (a.id === t.account || a.id === t.destination || a.id === t.cashAccount))).length,
    // A label does not turn a one-sided entry into an internal transfer.
    suspiciousTransfers: data.transactions.filter(t => t.kind !== "transfer" && /^(internal_transfer|transfer|cashin|cashout)$/.test(t.category)).length,
  };
}
