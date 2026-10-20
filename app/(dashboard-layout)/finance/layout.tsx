import type { ReactNode } from "react";
import { FinanceProvider } from "@/app/context/finance-context";
import { FinanceShell } from "@/app/components/finance/shell";
import { financeDemo } from "@/lib/finance/demo";
export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider initialData={financeDemo()}>
      <FinanceShell>{children}</FinanceShell>
    </FinanceProvider>
  );
}
