import type { Metadata } from "next";
import { FinancePageContent } from "@/app/components/finance/page-content";
import { CashFlowPage } from "@/app/components/finance/cash-flow";
export const metadata: Metadata = { title: "Tài chính cá nhân | Dòng tiền" };
export default function Page() {
  return <FinancePageContent path="/finance/cash-flow"><CashFlowPage /></FinancePageContent>;
}
