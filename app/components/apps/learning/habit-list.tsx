"use client";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { HabitCard } from "./habit-card";
import { useState } from "react";
import { Plus, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { useLearning } from "@/app/context/learning-context";
import type { LearningHabit } from "@/lib/learning/types";

import { useLearningLocale } from "./locale";

import type { LearningEditor } from "./types";
export function HabitList({
  setEditor,
  setArchive,
  undo,
}: {
  setEditor: (editor: LearningEditor) => void;
  setArchive: (habit: LearningHabit) => void;
  undo: (habit: LearningHabit) => void;
}) {
  const { t } = useLearningLocale();
  const { data, setArchived } = useLearning();
  const { habits, today } = data;
  const active = habits.filter((h) => !h.archived);
  const [showArchived, setShowArchived] = useState(false);
  return (
    <section
      className="learning-habits flex min-w-0 flex-col gap-px bg-border"
      aria-labelledby="learning-today-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 bg-background p-4">
        <h2 id="learning-today-title" className="text-lg font-semibold">
          {t("Hôm nay học gì?", "What are we learning today?")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("Đều đặn > hoàn hảo", "Consistency > perfection")}
        </span>
      </div>
      {!active.length && (
        <DashboardCard>
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {t("Bắt đầu từ một điều nhỏ", "Start with one small thing")}
                </EmptyTitle>
                <EmptyDescription>
                  {t(
                    "Thêm điều bạn muốn học, rồi quay lại mỗi ngày.",
                    "Add something to learn, then show up every day.",
                  )}
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={() => setEditor({ kind: "create" })}>
                <Plus data-icon="inline-start" />
                {t("Tạo mục học đầu tiên", "Create your first learning habit")}
              </Button>
            </Empty>
          </CardContent>
        </DashboardCard>
      )}
      {active.map((h) => (
        <HabitCard
          key={h.id}
          habit={h}
          today={today}
          onEdit={setEditor}
          onPause={setArchive}
          onUndo={undo}
        />
      ))}
      {habits.some((h) => h.archived) && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive data-icon="inline-start" />
            {t("Mục đã tạm dừng", "Paused habits")} (
            {habits.filter((h) => h.archived).length})
          </Button>
          {showArchived && (
            <div className="mt-3 flex flex-col gap-2">
              {habits
                .filter((h) => h.archived)
                .map((h) => (
                  <DashboardCard key={h.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 bg-background p-4">
                      <span className="text-sm">
                        {h.title} · {h.entries.length}{" "}
                        {t("buổi học", "sessions")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setArchived(h.id, false)}
                      >
                        {t("Học tiếp", "Resume")}
                      </Button>
                    </CardContent>
                  </DashboardCard>
                ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
