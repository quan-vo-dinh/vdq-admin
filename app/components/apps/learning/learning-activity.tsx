"use client";
import { DashboardCard } from "@/app/components/shared/dashboard-card";

import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useLearning } from "@/app/context/learning-context";
import { shiftDay, learningSummary } from "@/lib/learning/model";

import { cn } from "@/lib/utils";

import { useLearningLocale } from "./locale";
export function LearningActivity({
  onSelect,
}: {
  onSelect: (message: string) => void;
}) {
  const { t } = useLearningLocale();
  const { data } = useLearning();
  const { today, habits } = data;
  const { entries } = learningSummary(habits, today);
  const dates = Array.from({ length: 112 }, (_, i) => shiftDay(today, i - 111));
  return (
    <DashboardCard className="col-span-12">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            {t("Những ngày đã gieo hạt", "The days you planted a seed")}
          </CardTitle>
          <Badge variant="outline">
            {t("16 tuần gần nhất", "Last 16 weeks")}
          </Badge>
        </div>
        <CardDescription>
          {t(
            "Mỗi ô là một ngày. Màu đậm hơn khi bạn hoàn thành nhiều mục học hơn; rê chuột hoặc chọn ô để đọc ngày.",
            "Each square is a day. More completed habits make a darker square; hover or focus a square for details.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="learning-calendar-scroll">
          <div className="learning-calendar">
            {dates.map((date) => {
              const count = entries.filter((e) => e.date === date).length;
              const label = `${date}: ${count} ${t("mục đã học", "habits completed")}`;
              return (
                <button
                  type="button"
                  key={date}
                  title={label}
                  aria-label={label}
                  onClick={() => onSelect(label)}
                  className={cn(
                    "learning-cell",
                    count === 1 && "learning-cell-some",
                    count > 1 && "learning-cell-full",
                    date === today && "learning-cell-today",
                  )}
                />
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {dates[0]} → {today} · UTC+7
          </span>
          <div className="flex items-center gap-2">
            <span>{t("Chưa học", "No activity")}</span>
            <span className="learning-cell" />
            <span className="learning-cell learning-cell-some" />
            <span className="learning-cell learning-cell-full" />
            <span>{t("Nhiều mục", "More habits")}</span>
          </div>
        </div>
      </CardContent>
    </DashboardCard>
  );
}
