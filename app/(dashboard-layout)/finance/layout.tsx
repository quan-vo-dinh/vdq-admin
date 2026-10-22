import type { ReactNode } from "react";
import { FinanceProvider } from "@/app/context/finance-context";
import { FinanceShell } from "@/app/components/finance/shell";
import styles from "@/app/components/finance/finance-ui.module.css";
export default function FinanceLayout({ children }: { children: ReactNode }) {
  return (
    <FinanceProvider>
      <FinanceShell className={styles.scope}>{children}</FinanceShell>
    </FinanceProvider>
  );
}
