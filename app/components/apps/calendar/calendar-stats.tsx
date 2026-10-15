"use client";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalendarLocale } from "./locale";

type Stat = {
  label: string;
  shortLabel: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
};
export function CalendarStats({
  stats,
  period,
}: {
  stats: Stat[];
  period: string;
}) {
  const { text } = useCalendarLocale();
  return (
    <TooltipProvider delay={300}>
      <div
        className="calendar-stats flex items-center gap-1"
        aria-label={text("Thống kê tuần đang chọn", "Selected week statistics")}
      >
        {stats.map((stat) => (
          <Popover key={stat.label}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <PopoverTrigger
                    render={<Button variant="ghost" size="sm" />}
                    aria-label={`${stat.label}: ${stat.value}`}
                  />
                }
              >
                <stat.icon data-icon="inline-start" />
                <span className="hidden xl:inline">{stat.shortLabel}</span>
                <span className="tabular-nums">{stat.value}</span>
              </TooltipTrigger>
              <TooltipContent>
                {stat.label} ·{" "}
                {text("Bấm để xem chi tiết", "Click for details")}
              </TooltipContent>
            </Tooltip>
            <PopoverContent align="end">
              <PopoverHeader>
                <PopoverTitle>
                  {stat.label}: {stat.value}
                </PopoverTitle>
                <PopoverDescription>
                  {period} · {text("Tuần đang chọn", "Selected week")}
                </PopoverDescription>
              </PopoverHeader>
              <p>{stat.detail}</p>
              <p className="text-xs text-muted-foreground">
                {text(
                  "Các chỉ số tính trên cả tuần; bộ lọc chỉ áp dụng cho vùng lịch.",
                  "Statistics cover the full week; filters apply only to the calendar.",
                )}
              </p>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </TooltipProvider>
  );
}
