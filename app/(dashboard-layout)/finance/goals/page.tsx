import type { Metadata } from "next";
import { FinancePageContent } from "@/app/components/finance/page-content";
import { GoalsPage } from "@/app/components/finance/goals";
export const metadata: Metadata = { title: "Tài chính cá nhân | Mục tiêu" };
export default function Page() {
  return <FinancePageContent path="/finance/goals"><GoalsPage /></FinancePageContent>;
}
