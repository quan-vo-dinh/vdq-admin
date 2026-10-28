import { Skeleton } from "@/components/ui/skeleton";
import { PortfolioSurface } from "./surface";

function EntrySkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-16 sm:w-24" />
    </div>
  );
}

export function PortfolioLoading() {
  return (
    <PortfolioSurface>
      <div role="status" aria-busy="true" aria-label="Đang tải portfolio / Loading portfolio">
        <span className="sr-only">Đang tải portfolio / Loading portfolio</span>
        <div aria-hidden="true">
          <div className="flex justify-end gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
            {[0, 1, 2].map((id) => <Skeleton key={id} className="size-10 rounded-full" />)}
          </div>
          <div className="relative mx-auto flex min-h-dvh max-w-2xl flex-col gap-14 px-3 pt-6 pb-12 sm:px-6 sm:pb-16">
            <div className="flex flex-col justify-between gap-x-2 gap-y-6 md:flex-row">
              <div className="order-2 flex flex-1 flex-col gap-3 md:order-1 md:pt-2">
                <Skeleton className="h-10 w-3/4 sm:h-12" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
              </div>
              <Skeleton className="order-1 size-24 shrink-0 rounded-full md:order-2 md:size-32" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-28" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-col gap-6">
              <Skeleton className="h-6 w-44" />
              <EntrySkeleton />
              <EntrySkeleton />
              <EntrySkeleton />
            </div>
            <div className="flex flex-col gap-6">
              <Skeleton className="h-6 w-28" />
              <EntrySkeleton />
            </div>
          </div>
        </div>
      </div>
    </PortfolioSurface>
  );
}
