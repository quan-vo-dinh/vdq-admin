import { Skeleton } from "@/components/ui/skeleton";
export default function CalendarLoading() {
  return (
    <div className="calendar-workspace">
      <Skeleton className="h-9 w-1/2 shrink-0" />
      <Skeleton className="min-h-0 w-full flex-1" />
    </div>
  );
}
