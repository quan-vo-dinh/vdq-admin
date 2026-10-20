import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="flex flex-col gap-5" aria-label="Loading Developer Feed">
      <Skeleton className="h-12 w-64" />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-96 w-full" />
        ))}
      </div>
    </div>
  );
}
