"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { DashboardCard } from "@/app/components/shared/dashboard-card";

import { BookOpen, Check, Flame, Trophy, CalendarDays } from "lucide-react";

import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { useLearning } from "@/app/context/learning-context";

import { cn } from "@/lib/utils";

import { useLearningLocale } from "./locale";
import { learningSummary } from "@/lib/learning/model";
export function LearningOverview() {
  const { t, language } = useLearningLocale();
  const { data } = useLearning();
  const { active, completed, allDone, uniqueDays, totalMinutes, best } =
    learningSummary(data.habits, data.today);
  return (
    <div className="learning-top-grid col-span-12">
      <DashboardCard className="learning-hero">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-primary" />
            <CardTitle>
              {allDone
                ? t("Hôm nay, bạn đã giữ lời.", "You kept your promise today.")
                : t(
                    "Một buổi học nhỏ. Một mắt xích mới.",
                    "One small session. One more link.",
                  )}
            </CardTitle>
          </div>
          <CardDescription>
            {allDone
              ? t(
                  "Chuỗi đã được nối. Ngày mai mình lại gặp nhau ở đây.",
                  "Your chain continues. See you here tomorrow.",
                )
              : t(
                  "Bắt đầu bằng 15 phút cũng tính. Quan trọng là có mặt.",
                  "Even 15 minutes counts. What matters is showing up.",
                )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-5xl font-semibold tracking-tighter tabular-nums">
                <NumberTicker value={completed} />
                <span className="text-xl text-muted-foreground">
                  {" "}
                  / <NumberTicker value={active.length} />
                </span>
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(
                  "mục học đã hoàn thành hôm nay",
                  "learning habits completed today",
                )}
              </p>
            </div>
            <div
              className={cn(
                "learning-flame",
                allDone && "learning-flame-complete",
              )}
            >
              <Flame aria-hidden="true" />
            </div>
          </div>
          <Progress
            className="mt-6"
            value={active.length ? (completed / active.length) * 100 : 0}
            aria-label={t("Tiến độ hôm nay", "Today's progress")}
          />
        </CardContent>
        <CardFooter>
          <Badge variant={allDone ? "default" : "secondary"}>
            {allDone ? (
              <Check data-icon="inline-start" />
            ) : (
              <CalendarDays data-icon="inline-start" />
            )}
            {allDone
              ? t("Đủ bài, nghỉ thôi ✨", "All done. Take a breath ✨")
              : t(
                  "Điểm danh theo ngày Việt Nam · UTC+7",
                  "Daily check-ins · Vietnam time, UTC+7",
                )}
          </Badge>
        </CardFooter>
      </DashboardCard>
      <DashboardCard>
        <CardHeader>
          <CardTitle>
            {t("Từng chút đều có ý nghĩa", "Every little bit adds up")}
          </CardTitle>
          <CardDescription>
            {t(
              "Hành trình tích lũy của tất cả mục học",
              "Your journey across all learning habits",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {[
            {
              icon: CalendarDays,
              value: uniqueDays,
              label: t("ngày đã có mặt", "days you showed up"),
            },
            {
              icon: Trophy,
              value: best,
              label: t(
                "ngày · chuỗi tốt nhất của một mục",
                "days · longest habit streak",
              ),
            },
            {
              icon: BookOpen,
              value: totalMinutes,
              label: t("phút đầu tư cho mình", "minutes invested in yourself"),
            },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="rounded-lg bg-muted p-2.5">
                <Icon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <strong className="text-xl tabular-nums">
                  <NumberTicker value={value.toLocaleString(language === "vi" ? "vi-VN" : "en-GB")} />
                </strong>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </DashboardCard>
    </div>
  );
}
