import { ledgerTransactions, type FinanceData } from "./model";

export const defaultCategoryCodes = ["food", "home", "transport", "shopping", "learning", "fun", "other", "salary", "freelance"] as const;
export function isDefaultCategory(code: string) {
  return (defaultCategoryCodes as readonly string[]).includes(code);
}
export function categoryHasHistory(data: FinanceData, code: string) {
  return ledgerTransactions(data).some(t => t.category === code) || data.budgets.some(b => b.id === code && !!b.resourceId);
}
export function categoryHasTransactions(data: FinanceData, code: string) {
  return ledgerTransactions(data).some(t => t.category === code);
}
export function accountHasHistory(data: FinanceData, id: string) {
  return ledgerTransactions(data).some(t => t.account === id || t.destination === id || t.cashAccount === id)
    || (data.checkpoints ?? []).some(c => c.account === id)
    || (data.scopeEvents ?? []).some(e => e.account === id);
}
