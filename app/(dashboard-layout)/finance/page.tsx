import type { Metadata } from "next";
import { FinancePageContent } from "@/app/components/finance/page-content";
import { OverviewPage } from "@/app/components/finance/overview";
export const metadata: Metadata = { title: "Tài chính cá nhân | Tổng quan" };
export default function Page() {
  return <FinancePageContent path="/finance"><OverviewPage /></FinancePageContent>;
}
