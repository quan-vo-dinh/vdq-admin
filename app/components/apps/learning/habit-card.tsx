"use client";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { Check, Flame, Pencil, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { streaks, shiftDay } from "@/lib/learning/model";
import type { LearningHabit } from "@/lib/learning/types";
import type { LearningEditor } from "./types";
import { useLearningLocale } from "./locale";
import { cn } from "@/lib/utils";
export function HabitCard({
  habit: h,
  today,
  onEdit: setEditor,
  onPause: setArchive,
  onUndo: undo,
}: {
  habit: LearningHabit;
  today: string;
  onEdit: (editor: LearningEditor) => void;
  onPause: (habit: LearningHabit) => void;
  onUndo: (habit: LearningHabit) => void;
}) {
  const { t } = useLearningLocale();
  const entry = h.entries.find((e) => e.date === today),
    done = !!entry,
    stats = streaks(h.entries, today);
  const week = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  return (
    <DashboardCard
      key={h.id}
      className={cn("learning-habit", done && "learning-habit-done")}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle>{h.title}</CardTitle>
            <CardDescription>
              {h.intention ||
                t(
                  "Dành một chút thời gian cho điều mình muốn giỏi hơn.",
                  "Make time for something you want to get better at.",
                )}
            </CardDescription>
          </div>
          <div className="flex shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${t("Sửa", "Edit")} ${h.title}`}
              onClick={() => setEditor({ kind: "edit", habit: h })}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${t("Tạm dừng", "Pause")} ${h.title}`}
              onClick={() => setArchive(h)}
            >
              <Archive />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={stats.current ? "default" : "secondary"}>
            <Flame data-icon="inline-start" />
            {stats.current} {t("ngày liên tiếp", "day streak")}
          </Badge>
          <Badge variant="outline">
            {h.minutes} {t("phút / ngày", "min / day")}
          </Badge>
          {done && (
            <Badge variant="secondary">
              <Check data-icon="inline-start" />
              {t("Đã học hôm nay", "Done today")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="flex justify-between gap-1"
          aria-label={t("7 ngày gần nhất", "Last 7 days")}
        >
          {week.map((date) => {
            const hit = h.entries.some((e) => e.date === date);
            return (
              <div
                key={date}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs text-muted-foreground">
                  {date.slice(8)}/{date.slice(5, 7)}
                </span>
                <span
                  className={cn(
                    "learning-day",
                    hit && "learning-day-done",
                    date === today && "learning-day-today",
                  )}
                  aria-label={`${date}: ${hit ? t("đã học", "done") : t("chưa học", "no check-in")}`}
                >
                  {hit ? (
                    <Check className="size-4" />
                  ) : date === today ? (
                    <span className="size-1.5 rounded-full bg-current" />
                  ) : (
                    <span className="text-xs">—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        {entry?.note && (
          <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            {entry.note}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {t("Kỷ lục", "Best")}: {stats.best} {t("ngày", "days")} ·{" "}
          {h.entries.length} {t("buổi học", "sessions")}
        </span>
        <div className="flex flex-wrap gap-2">
          {done ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => undo(h)}>
                <RotateCcw data-icon="inline-start" />
                {t("Hoàn tác", "Undo")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditor({ kind: "check", habit: h })}
              >
                <Pencil data-icon="inline-start" />
                {t("Ghi chú buổi học", "Session notes")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditor({ kind: "check", habit: h })}>
              <Check data-icon="inline-start" />
              {t("Mình đã học hôm nay", "I learned today")}
            </Button>
          )}
        </div>
      </CardFooter>
    </DashboardCard>
  );
}
