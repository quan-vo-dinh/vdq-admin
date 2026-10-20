"use client";
import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCalendar } from "@/app/context/calendar-context";
import { parseSettings } from "@/lib/calendar/validation";
import type { BadgeStyle } from "@/lib/calendar/types";
import { useCalendarLocale } from "./locale";

export function SettingsDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { settings, settingsRevision, saveSettings, busy } = useCalendar();
  const [expectedRevision] = useState(settingsRevision);
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState("");
  const { text } = useCalendarLocale();
  const weekLabels = text("T2,T3,T4,T5,T6,T7,CN", "Mo,Tu,We,Th,Fr,Sa,Su").split(
    ",",
  );
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!parseSettings(draft)) {
      setError(
        text(
          "Giờ bắt đầu phải trước giờ kết thúc. Chọn ít nhất một ngày làm việc.",
          "Start hour must precede end hour. Select at least one working day.",
        ),
      );
      return;
    }
    try {
      await saveSettings(draft, expectedRevision);
      onSaved(text("Đã lưu tùy chỉnh lịch.", "Calendar preferences saved."));
      onClose();
    } catch {
      setError(
        text(
          "Không thể lưu. Vui lòng thử lại.",
          "Could not save. Please retry.",
        ),
      );
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(v) => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent
        data-readable-feature
        className="sm:max-w-lg max-h-[90dvh] overflow-y-auto"
        showCloseButton={!busy}
      >
        <form onSubmit={save} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>
              {text("Không gian lịch của bạn", "Your calendar, your way")}
            </DialogTitle>
            <DialogDescription>
              {text(
                "Chỉ hiển thị khoảng thời gian bạn cần. Múi giờ Asia/Ho_Chi_Minh (GMT+7).",
                "Focus on the hours that matter. Timezone Asia/Ho_Chi_Minh (GMT+7).",
              )}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel>
                {text("Kiểu hiển thị sự kiện", "Event badge style")}
              </FieldLabel>
              <ToggleGroup
                value={[draft.badgeStyle]}
                onValueChange={(v) => {
                  if (v[0])
                    setDraft({ ...draft, badgeStyle: v[0] as BadgeStyle });
                }}
                variant="outline"
              >
                <ToggleGroupItem value="dot">
                  {text("Chấm", "Dot")}
                </ToggleGroupItem>
                <ToggleGroupItem value="color">
                  {text("Màu", "Color")}
                </ToggleGroupItem>
                <ToggleGroupItem value="mixed">
                  {text("Hỗn hợp", "Mixed")}
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel>{text("Ngày làm việc", "Working days")}</FieldLabel>
              <ToggleGroup
                multiple
                value={draft.workDays.map(String)}
                onValueChange={(v) =>
                  setDraft({ ...draft, workDays: v.map(Number) })
                }
                variant="outline"
                className="flex-wrap"
              >
                {weekLabels.map((label, i) => (
                  <ToggleGroupItem key={i} value={String((i + 1) % 7)}>
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>
                {text(
                  "Vùng ngoài giờ làm được tô nền để dễ phân biệt.",
                  "Non-working hours use a shaded background.",
                )}
              </FieldDescription>
            </Field>
            <FieldGroup className="grid grid-cols-2 gap-4">
              {(
                ["workStart", "workEnd", "visibleStart", "visibleEnd"] as const
              ).map((key, i) => (
                <Field key={key}>
                  <FieldLabel htmlFor={key}>
                    {
                      [
                        text("Giờ làm từ", "Work starts"),
                        text("Giờ làm đến", "Work ends"),
                        text("Hiển thị từ", "Display from"),
                        text("Hiển thị đến", "Display until"),
                      ][i]
                    }
                  </FieldLabel>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    max={24}
                    step={1}
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft({ ...draft, [key]: Number(e.target.value) })
                    }
                    required
                  />
                </Field>
              ))}
            </FieldGroup>
            <Field orientation="horizontal">
              <Switch
                id="weekends"
                checked={draft.showWeekends}
                onCheckedChange={(v) => setDraft({ ...draft, showWeekends: v })}
              />
              <FieldLabel htmlFor="weekends">
                {text(
                  "Hiển thị cuối tuần trong lịch tuần/tháng",
                  "Show weekends in week/month views",
                )}
              </FieldLabel>
            </Field>
          </FieldGroup>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              {text("Đóng", "Close")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              {text("Lưu tùy chỉnh", "Save preferences")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
