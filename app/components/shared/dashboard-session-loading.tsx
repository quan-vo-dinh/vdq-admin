"use client";

import { Suspense } from "react";
import { usePathname } from "@/lib/platform/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancePageSkeleton } from "@/app/components/finance/loading";
import DashboardPageSkeleton from "./dashboard-page-skeleton";

function SessionSkeleton({ path }: { path?: string }) {
  return <div className="flex min-h-svh gap-2 p-2" aria-busy="true" aria-label="Đang tải trang">
    <aside className="hidden w-60 shrink-0 space-y-6 border border-border p-4 md:block" aria-hidden="true">
      <Skeleton className="mb-10 h-10 w-40" />
      {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
    </aside>
    <div className="min-w-0 flex-1 border border-border">
      <div className="flex h-16 items-center justify-between gap-4 border-b border-border px-4" aria-hidden="true"><Skeleton className="h-8 w-64 max-w-[70%]" /><Skeleton className="h-9 w-9 rounded-full" /></div>
      <div className="mx-auto w-full p-3 sm:p-4">
        {path === "/finance" || path?.startsWith("/finance/") ? <FinancePageSkeleton path={path} /> : <DashboardPageSkeleton />}
      </div>
    </div>
  </div>;
}

function CurrentSessionSkeleton() {
  const path = usePathname();
  return <SessionSkeleton path={path} />;
}

export default function DashboardSessionLoading() {
  return <Suspense fallback={<SessionSkeleton />}><CurrentSessionSkeleton /></Suspense>;
}
