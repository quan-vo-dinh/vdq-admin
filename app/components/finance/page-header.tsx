"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import { useFinance } from "@/app/context/finance-context";
import { FinanceManage } from "./manage";
import { TransactionEditor } from "./transaction-editor";
import { useFinanceLocale } from "./locale";

export function FinancePageHeader({ children }: { children?: ReactNode }) {
  const { data } = useFinance();
  const { text } = useFinanceLocale();
  const [adding, setAdding] = useState(false);

  return <>
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1 basis-80"><PersonalizedIntro /></div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {children}
        <FinanceManage />
        <Button disabled={!data?.accounts.some(account => !account.archivedAt)} size="sm" onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" />{text("Ghi giao dịch")}
        </Button>
      </div>
    </div>
    {adding && data && <TransactionEditor onClose={() => setAdding(false)} />}
  </>;
}
