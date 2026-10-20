"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


import { useLearning } from "@/app/context/learning-context";
import type { LearningHabit, HabitValues } from "@/lib/learning/types";

import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { PageTitleIcon } from "@/app/components/shared/page-title-icon";
import { HeadingText } from "@/app/components/shared/heading-text";
import { useLearningLocale } from "./locale";
import { LearningOverview } from "./learning-overview";
import { HabitList } from "./habit-list";
import { MilestonePanel } from "./milestone-panel";
import { LearningActivity } from "./learning-activity";
import { LearningHistory } from "./learning-history";
import { HabitDialog } from "./habit-dialog";
import { CelebrationDialog } from "./celebration-dialog";
import type { LearningEditor, Celebration } from "./types";
export function LearningWorkspace() {
  const { t, language } = useLearningLocale();
  const { data, error, failure, isLoading, loaded, busy, createHabit, editHabit, checkIn, undoCheckIn, setArchived } =
    useLearning();
  const { today } = data;
  const [editor, setEditor] = useState<LearningEditor | null>(null);
  const [archive, setArchive] = useState<LearningHabit | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [notice, setNotice] = useState("");
  async function undo(h: LearningHabit) {
    const entry=h.entries.find(e=>e.date===today); if(!entry)return;
    try {await undoCheckIn(h.id,entry);} catch {return;}
    setNotice(
      t(
        "Đã hoàn tác điểm danh hôm nay. Chuỗi được tính lại.",
        "Today's check-in undone. Streak recalculated.",
      ),
    );
  }
  async function save(values: HabitValues, createId: string, date: string) {
    try {
    if (editor?.kind === "check") {
      const result = await checkIn(editor.habit.id, values.minutes, values.note, editor.habit.entries.find(e=>e.date===date), date, createId);
      if (result) setCelebration(result);
      else
        setNotice(
          t(
            "Đã cập nhật buổi học hôm nay.",
            "Today's learning session updated.",
          ),
        );
    } else if (editor?.kind === "edit") await editHabit(editor.habit.id, values, editor.habit.revision);
    else await createHabit(values,createId);
    setEditor(null);
    } catch {return;}
  }
  if (!loaded) return <p role={error?'alert':'status'}>{error?'Không tải được dữ liệu Learning. Thử tải lại trang.':'Đang tải Learning…'}</p>;
  return (
    <div className="learning-page flex flex-col gap-6">
      {(failure || error) && <p role="alert">{failure || "Không tải được dữ liệu Learning."}</p>}
      {isLoading && <p role="status">Đang tải…</p>}
      <fieldset disabled={busy || isLoading || !!error} className="contents">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {t("HỌC MỖI NGÀY", "DAILY LEARNING")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(`${today}T12:00:00Z`))}
            </span>
          </div>
          <h1 className="flex items-center gap-2 text-xl tracking-tight">
            <HeadingText>
              {t(
                "Mỗi ngày một chút. Đi thật xa.",
                "A little every day. A long way ahead.",
              )}
            </HeadingText>
          <PageTitleIcon /></h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Không cần học cả thế giới hôm nay. Chỉ cần giữ lời với chính mình.",
              "You don't need to learn everything today. Just keep one promise to yourself.",
            )}
          </p>
        </div>
        <Button onClick={() => setEditor({ kind: "create" })}>
          <Plus data-icon="inline-start" />
          {t("Thêm mục học", "Add a learning habit")}
        </Button>
      </header>
      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <StyleDivider wrapperClassName="col-span-12" />
      </div>
      <StyleAwareWrapper lyraClassName="learning-board grid grid-cols-12 gap-px bg-border p-px">
        <LearningOverview />
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="learning-main-grid col-span-12">
          <HabitList
            setEditor={setEditor}
            setArchive={setArchive}
            undo={undo}
          />
          <MilestonePanel />
        </div>
        <StyleDivider wrapperClassName="col-span-12" />
        <LearningActivity onSelect={setNotice} />
        <StyleDivider wrapperClassName="col-span-12" />
        <LearningHistory />
      </StyleAwareWrapper>
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted-foreground"
      >
        {notice}
      </p>
      {editor && (
        <HabitDialog
          key={`${editor.kind}-${editor.kind === "create" ? "new" : editor.habit.id}`}
          editor={editor}
          onClose={() => setEditor(null)}
          onSave={save}
        />
      )}
      <Dialog
        open={!!archive}
        onOpenChange={(open) => {
          if (!open) setArchive(null);
        }}
      >
        <DialogContent size="sm" closeLabel={t("Đóng", "Close")}>
          <DialogHeader>
            <DialogTitle>
              {t("Tạm dừng mục học?", "Pause this learning habit?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Lịch sử và kỷ lục được giữ lại. Những ngày tạm dừng vẫn tính là ngày không học, nên chuỗi có thể bị ngắt.",
                "History and personal bests are kept. Paused days still count as missed days, so the streak may break.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchive(null)}>
              {t("Tiếp tục học", "Keep learning")}
            </Button>
            <Button
              onClick={async () => {
                try {if (archive) await setArchived(archive.id, true, archive.revision);} catch {return;}
                setArchive(null);
              }}
            >
              {t("Tạm dừng", "Pause habit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </fieldset>
      <CelebrationDialog
        celebration={celebration}
        onClose={() => setCelebration(null)}
      />
    </div>
  );
}
