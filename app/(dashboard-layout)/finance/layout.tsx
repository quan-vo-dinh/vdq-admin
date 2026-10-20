import type { ReactNode } from "react";
import { FinanceProvider } from "@/app/context/finance-context";
import { FinanceShell } from "@/app/components/finance/shell";
export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <FinanceShell>{children}</FinanceShell>
    </FinanceProvider>
  );
}
