import type { Metadata } from "next";
import { FinancePageContent } from "@/app/components/finance/page-content";
import { TransactionsPage } from "@/app/components/finance/transactions";
export const metadata: Metadata = { title: "Tài chính cá nhân | Giao dịch" };
export default function Page() {
  return <FinancePageContent path="/finance/transactions"><TransactionsPage /></FinancePageContent>;
}
