"use client";
import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useLearning } from "@/app/context/learning-context";

import { useLearningLocale } from "./locale";
import type { HabitValues } from "@/lib/learning/types";
import type { LearningEditor } from "./types";
export function HabitDialog({
  editor,
  onClose,
  onSave,
}: {
  editor: LearningEditor;
  onClose: () => void;
  onSave: (values: HabitValues, id: string, date: string) => Promise<void>;
}) {
  const { t } = useLearningLocale();
  const { data, failure, busy } = useLearning();
  const [createId] = useState(() => crypto.randomUUID());
  const [date] = useState(data.today);
  const entry = editor.habit?.entries.find((e) => e.date === data.today);
  const [title, setTitle] = useState(editor.habit?.title ?? "");
  const [intention, setIntention] = useState(editor.habit?.intention ?? "");
  const [minutes, setMinutes] = useState(
    String(
      (editor.kind === "check" ? entry?.minutes : undefined) ??
        editor.habit?.minutes ??
        15,
    ),
  );
  const [note, setNote] = useState(entry?.note ?? "");
  const checking = editor.kind === "check";
  const validMinutes =
    Number.isInteger(Number(minutes)) &&
    Number(minutes) >= 1 &&
    Number(minutes) <= 1440;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md" closeLabel={t("Đóng", "Close")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (validMinutes && (checking || title.trim()))
              onSave({
                title: title.trim(),
                intention: intention.trim(),
                minutes: Number(minutes),
                note: note.trim(),
              }, createId, date);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {checking
                ? t("Hôm nay bạn đã học gì?", "What did you learn today?")
                : editor.kind === "edit"
                  ? t("Điều chỉnh mục học", "Edit your learning habit")
                  : t("Gieo một thói quen mới", "Plant a new learning habit")}
            </DialogTitle>
            <DialogDescription>
              {checking
                ? editor.habit?.title
                : t(
                    "Chọn mục tiêu nhỏ đến mức hôm bận vẫn làm được.",
                    "Keep it small enough to do even on a busy day.",
                  )}
            </DialogDescription>
          </DialogHeader>
          {failure && <p role="alert">{failure}</p>}
          <FieldGroup className="my-6">
            {!checking && (
              <>
                <Field>
                  <FieldLabel htmlFor="learning-title">
                    {t("Bạn muốn học gì?", "What do you want to learn?")}
                  </FieldLabel>
                  <Input
                    id="learning-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    required
                    placeholder={t(
                      "Ví dụ: Tiếng Anh, đọc sách, TypeScript…",
                      "English, reading, TypeScript…",
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="learning-intention">
                    {t(
                      "Một lời nhắc cho chính mình",
                      "A reminder for yourself",
                    )}
                  </FieldLabel>
                  <Textarea
                    id="learning-intention"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    maxLength={240}
                    placeholder={t("Mình học vì…", "I'm learning because…")}
                  />
                </Field>
              </>
            )}
            <Field data-invalid={!validMinutes || undefined}>
              <FieldLabel htmlFor="learning-minutes">
                {checking
                  ? t("Số phút đã học", "Minutes learned")
                  : t("Mục tiêu mỗi ngày (phút)", "Daily target (minutes)")}
              </FieldLabel>
              <Input
                id="learning-minutes"
                type="number"
                min={1}
                max={1440}
                step={1}
                required
                value={minutes}
                aria-invalid={!validMinutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
              <FieldDescription>
                {t(
                  "Từ 1 đến 1.440 phút. Học ít hơn mục tiêu vẫn được điểm danh, miễn là bạn thực sự đã học.",
                  "1–1,440 minutes. A shorter session still counts if you actually learned something.",
                )}
              </FieldDescription>
            </Field>
            {checking && (
              <Field>
                <FieldLabel htmlFor="learning-note">
                  {t(
                    "Điều đã học (không bắt buộc)",
                    "What you learned (optional)",
                  )}
                </FieldLabel>
                <Textarea
                  id="learning-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder={t(
                    "Một từ mới, một ý tưởng, một điều đã hiểu…",
                    "A new word, an idea, something that clicked…",
                  )}
                />
                <FieldDescription>
                  {t(
                    "Chỉ điểm danh hôm nay. Mỗi mục chỉ ghi nhận một buổi mỗi ngày.",
                    "Today only. Each habit records one session per day.",
                  )}
                </FieldDescription>
              </Field>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("Để sau", "Not now")}
            </Button>
            <Button
              type="submit"
              disabled={busy || !validMinutes || (!checking && !title.trim())}
            >
              {checking ? (
                <Check data-icon="inline-start" />
              ) : (
                <ArrowRight data-icon="inline-end" />
              )}
              {checking
                ? t("Lưu buổi học", "Save session")
                : t("Lưu mục học", "Save habit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
