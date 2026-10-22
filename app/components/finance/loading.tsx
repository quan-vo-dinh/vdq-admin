"use client";

import { Suspense } from "react";
import { usePathname } from "@/lib/platform/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function Panel({ children }: { children?: React.ReactNode }) {
  return <div className="min-w-0 border border-border p-5">
    <Skeleton className="mb-5 h-5 w-40" />{children || <Skeleton className="h-64 w-full" />}
  </div>;
}

export function FinancePageSkeleton({ path = "/finance", header = true }: { path?: string; header?: boolean }) {
  const goals = path.endsWith("/goals");
  const budgets = path.endsWith("/budgets");
  const transactions = path.endsWith("/transactions");
  const cashFlow = path.endsWith("/cash-flow");
  return <div className="flex min-w-0 flex-col gap-4" role="status" aria-label="Đang tải trang tài chính" aria-busy="true">
    {header && <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-3"><Skeleton className="h-7 w-64 max-w-full" /><Skeleton className="h-4 w-72 max-w-full" /></div>
      <Skeleton className="h-9 w-56" />
    </div>}
    {goals ? <>
      <div className="grid grid-cols-2 gap-4"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
      <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map(i => <div key={i} className="grid min-h-72 grid-cols-[2fr_3fr] gap-4 border border-border p-4">
        <Skeleton className="h-full min-h-60 w-full" />
        <div className="flex min-w-0 flex-col gap-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="mt-4 h-9 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="mt-auto h-8 w-28" /></div>
      </div>)}</div>
    </> : budgets ? <div className="grid gap-4 lg:grid-cols-[7fr_5fr]">
      <Panel><Skeleton className="h-80 w-full" /><div className="mt-5 space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div></Panel>
      <Panel><Skeleton className="h-28 w-28 rounded-full" /><div className="mt-5 grid grid-cols-2 gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div></Panel>
    </div> : transactions ? <>
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-28" />)}</div>
      <Panel><Skeleton className="mb-5 h-9 w-full" /><div className="space-y-3">{[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></Panel>
    </> : <>
      <div className="grid gap-4 lg:grid-cols-[7fr_5fr]"><Panel><Skeleton className="h-80 w-full" /></Panel><Panel><div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-36" />)}</div></Panel></div>
      <div className="grid gap-4 lg:grid-cols-2"><Panel /><Panel>{!cashFlow && <div className="grid grid-cols-[2fr_3fr] gap-4"><Skeleton className="h-36" /><div className="space-y-4"><Skeleton className="h-6 w-full" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-4 w-full" /></div></div>}</Panel></div>
    </>}
  </div>;
}

function CurrentFinanceSkeleton({ header }: { header: boolean }) {
  const path = usePathname();
  return <FinancePageSkeleton path={path} header={header} />;
}

export function FinanceLoading({ header = true }: { header?: boolean }) {
  return <Suspense fallback={<FinancePageSkeleton header={header} />}><CurrentFinanceSkeleton header={header} /></Suspense>;
}
