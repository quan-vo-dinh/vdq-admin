"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { DashboardCard } from "@/app/components/shared/dashboard-card";

import { Flame, Trophy } from "lucide-react";

import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { useLearning } from "@/app/context/learning-context";

import { cn } from "@/lib/utils";

import { useLearningLocale } from "./locale";
import { learningSummary, milestones } from "@/lib/learning/model";
export function MilestonePanel() {
  const { t } = useLearningLocale();
  const { data } = useLearning();
  const { leading, leadingRun, nextMilestone } = learningSummary(
    data.habits,
    data.today,
  );
  return (
    <aside className="learning-milestone-panel flex min-w-0 flex-col gap-px bg-background">
      <DashboardCard>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <CardTitle>{t("Cột mốc kế tiếp", "Your next milestone")}</CardTitle>
          </div>
          <CardDescription>
            {leading?.title ??
              t("Hành trình bắt đầu từ hôm nay", "Your journey starts today")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">
              <NumberTicker value={nextMilestone} />
            </span>
            <span className="text-sm text-muted-foreground">
              {t("ngày liên tiếp", "consecutive days")}
            </span>
          </div>
          <Progress
            value={(leadingRun / nextMilestone) * 100}
            aria-label={t("Tiến độ đến cột mốc", "Milestone progress")}
          />
          <p className="text-sm text-muted-foreground">
            {t(
              `Còn ${nextMilestone - leadingRun} ngày. Phiên bản tương lai của bạn đang cổ vũ đấy.`,
              `${nextMilestone - leadingRun} days to go. Your future self is cheering you on.`,
            )}
          </p>
          <div className="learning-milestones">
            {milestones.map((n) => (
              <div
                key={n}
                className={cn(
                  "learning-milestone",
                  leadingRun >= n && "learning-milestone-earned",
                )}
              >
                <Trophy className="size-4" />
                <span>{n}</span>
                <span className="text-xs">{t("ngày", "days")}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {t(
              "Mốc tính theo chuỗi hiện tại của mục học dẫn đầu.",
              "Milestones follow the leading habit's current streak.",
            )}
          </p>
        </CardFooter>
      </DashboardCard>
      <Alert>
        <Flame />
        <AlertTitle>
          {t("Đứt chuỗi không phải hết đường", "A broken streak isn't the end")}
        </AlertTitle>
        <AlertDescription>
          {t(
            "Bỏ một ngày thì chuỗi bắt đầu lại. Những buổi đã học và kỷ lục vẫn còn. Hôm nay luôn là một khởi đầu hợp lệ.",
            "Miss a day and your streak restarts. Past sessions and personal bests stay. Today is always a valid fresh start.",
          )}
        </AlertDescription>
      </Alert>
    </aside>
  );
}
