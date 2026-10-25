import type { Metadata } from "next";
import { FinancePageContent } from "@/app/components/finance/page-content";
import { BudgetsPage } from "@/app/components/finance/budgets";
export const metadata: Metadata = { title: "Tài chính cá nhân | Ngân sách" };
export default function Page() {
  return <FinancePageContent path="/finance/budgets"><BudgetsPage /></FinancePageContent>;
}
