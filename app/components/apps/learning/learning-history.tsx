"use client";
import { DashboardCard } from "@/app/components/shared/dashboard-card";

import { BookOpen } from "lucide-react";

import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { useLearning } from "@/app/context/learning-context";

import { useLearningLocale } from "./locale";
import { learningSummary } from "@/lib/learning/model";
export function LearningHistory() {
  const { t } = useLearningLocale();
  const { data } = useLearning();
  const { entries } = learningSummary(data.habits, data.today);
  return (
    <DashboardCard className="col-span-12">
      <CardHeader>
        <CardTitle>
          {t("Dấu vết của sự kiên trì", "Proof that you kept going")}
        </CardTitle>
        <CardDescription>
          {t(
            "8 buổi học gần nhất · bao gồm mục đang tạm dừng",
            "Your 8 latest sessions · includes paused habits",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {entries.length ? (
            [...entries]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 8)
              .map((e) => (
                <div
                  key={`${e.id}-${e.date}`}
                  className="flex items-start gap-3"
                >
                  <div className="rounded-lg bg-muted p-2">
                    <BookOpen className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-sm font-medium">{e.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.date} · {e.minutes} {t("phút", "min")}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {e.note ||
                        t(
                          "Đã có mặt. Đã tiến thêm một chút.",
                          "Showed up. Moved forward a little.",
                        )}
                    </p>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {t(
                "Buổi học đầu tiên của bạn sẽ xuất hiện ở đây.",
                "Your first learning session will appear here.",
              )}
            </p>
          )}
        </div>
      </CardContent>
    </DashboardCard>
  );
}
