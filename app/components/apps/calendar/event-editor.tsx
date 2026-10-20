"use client";
import { useRef, useState, type FormEvent } from "react";
import { Copy, Trash2, AlertTriangle, CalendarPlus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useCalendar } from "@/app/context/calendar-context";
import {
  addDays,
  dateKey,
  displayEndDay,
  fromKey,
  isActive,
  overlaps,
} from "@/lib/calendar/utils";
import { parseEvent } from "@/lib/calendar/validation";
import {
  eventColors,
  type CalendarEvent,
  type EventInput,
} from "@/lib/calendar/types";
import { useCalendarLocale } from "./locale";
import { Choice } from "./choice";

export function EventEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: EventInput & { id?: string };
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const { text, categories, statuses, priorities, colors } =
    useCalendarLocale();
  const { events, addEvent, updateEvent, deleteEvent, busy } = useCalendar();
  const createId = useRef("");
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const conflicts =
    !draft.allDay && isActive(draft as CalendarEvent)
      ? events.filter(
          (e) =>
            e.id !== draft.id && !e.allDay && isActive(e) && overlaps(e, draft),
        )
      : [];
  async function submit(e: FormEvent) {
    e.preventDefault();
    setInvalid(true);
    setError("");
    if (!parseEvent(draft)) {
      setError(
        text(
          "Kiểm tra tiêu đề và thời gian. Thời điểm kết thúc phải sau bắt đầu (năm 2000–2100).",
          "Check the title and dates. End must be after start (years 2000–2100).",
        ),
      );
      return;
    }
    try {
      if (draft.id) await updateEvent(draft as CalendarEvent);
      else { createId.current ||= crypto.randomUUID(); await addEvent(draft, createId.current); }
      onSaved(text("Đã lưu vào lịch.", "Saved to your calendar."));
      onClose();
    } catch {
      setError(
        text(
          "Chưa lưu được. Vui lòng thử lại; nội dung của bạn vẫn ở đây.",
          "Could not save. Please retry; your input is still here.",
        ),
      );
    }
  }
  function changeAllDay(checked: boolean) {
    setDraft((previous) => ({
      ...previous,
      allDay: checked,
      start: `${previous.start.slice(0, 10)}T${checked ? "00:00" : "09:00"}`,
      end: checked
        ? `${dateKey(addDays(fromKey(previous.end), 1))}T00:00`
        : `${displayEndDay(previous)}T10:00`,
    }));
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        data-readable-feature
        className="calendar-theme max-h-[92dvh] overflow-y-auto sm:max-w-xl"
        showCloseButton={!busy}
      >
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>
              {draft.id
                ? text("Chi tiết lịch", "Schedule details")
                : text("Thêm vào kế hoạch", "Add to your plan")}
            </DialogTitle>
            <DialogDescription>
              {text(
                "Dành thời gian cho những điều quan trọng. Múi giờ GMT+7.",
                "Make time for what matters. Timezone GMT+7.",
              )}
            </DialogDescription>
          </DialogHeader>
          <FieldSet disabled={busy}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel>{text("Loại kế hoạch", "Plan type")}</FieldLabel>
                <ToggleGroup
                  value={[draft.kind]}
                  onValueChange={(v) => {
                    if (v[0]) set("kind", v[0] as EventInput["kind"]);
                  }}
                  variant="outline"
                >
                  <ToggleGroupItem value="event">
                    {text("Sự kiện", "Event")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="task">
                    {text("Công việc", "Task")}
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
              <Field data-invalid={invalid && !draft.title.trim()}>
                <FieldLabel htmlFor="event-title">
                  {text("Tiêu đề", "Title")} *
                </FieldLabel>
                <Input
                  id="event-title"
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder={text(
                    "Bạn đang lên kế hoạch gì?",
                    "What are you planning?",
                  )}
                  required
                  maxLength={160}
                  aria-invalid={invalid && !draft.title.trim()}
                  autoFocus
                />
              </Field>
              <Field orientation="horizontal">
                <Switch
                  id="event-all-day"
                  checked={draft.allDay}
                  onCheckedChange={changeAllDay}
                />
                <FieldLabel htmlFor="event-all-day">
                  {text(
                    "Sự kiện cả ngày / nhiều ngày",
                    "All-day / multi-day event",
                  )}
                </FieldLabel>
              </Field>
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field data-invalid={invalid && draft.end <= draft.start}>
                  <FieldLabel htmlFor="event-start">
                    {text("Bắt đầu", "Start")} *
                  </FieldLabel>
                  <Input
                    id="event-start"
                    type={draft.allDay ? "date" : "datetime-local"}
                    value={
                      draft.allDay ? draft.start.slice(0, 10) : draft.start
                    }
                    onChange={(e) =>
                      set(
                        "start",
                        draft.allDay
                          ? `${e.target.value}T00:00`
                          : e.target.value,
                      )
                    }
                    required
                    aria-invalid={invalid && draft.end <= draft.start}
                  />
                </Field>
                <Field data-invalid={invalid && draft.end <= draft.start}>
                  <FieldLabel htmlFor="event-end">
                    {text("Kết thúc", "End")} *
                  </FieldLabel>
                  <Input
                    id="event-end"
                    type={draft.allDay ? "date" : "datetime-local"}
                    value={draft.allDay ? displayEndDay(draft) : draft.end}
                    onChange={(e) =>
                      set(
                        "end",
                        draft.allDay
                          ? `${dateKey(addDays(fromKey(e.target.value), 1))}T00:00`
                          : e.target.value,
                      )
                    }
                    required
                    aria-invalid={invalid && draft.end <= draft.start}
                  />
                </Field>
              </FieldGroup>
              {draft.allDay && (
                <FieldDescription>
                  {text(
                    "Ngày kết thúc được tính trọn ngày.",
                    "The end date includes the entire day.",
                  )}
                </FieldDescription>
              )}
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="event-category">
                    {text("Nhóm lịch", "Calendar")}
                  </FieldLabel>
                  <Choice
                    id="event-category"
                    label={text("Nhóm lịch", "Calendar")}
                    value={draft.category}
                    onChange={(v) => set("category", v)}
                    options={Object.entries(categories).map(
                      ([value, label]) => ({
                        value: value as EventInput["category"],
                        label,
                      }),
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="event-priority">
                    {text("Độ ưu tiên", "Priority")}
                  </FieldLabel>
                  <Choice
                    id="event-priority"
                    label={text("Độ ưu tiên", "Priority")}
                    value={draft.priority}
                    onChange={(v) => set("priority", v)}
                    options={Object.entries(priorities).map(
                      ([value, label]) => ({
                        value: value as EventInput["priority"],
                        label,
                      }),
                    )}
                  />
                </Field>
              </FieldGroup>
              <Field>
                <FieldLabel>{text("Màu sự kiện", "Event color")}</FieldLabel>
                <ToggleGroup
                  value={[draft.color]}
                  onValueChange={(v) => {
                    if (v[0]) set("color", v[0] as EventInput["color"]);
                  }}
                  aria-label={text("Màu sự kiện", "Event color")}
                  variant="outline"
                  className="flex-wrap"
                >
                  {eventColors.map((color) => (
                    <ToggleGroupItem
                      key={color}
                      value={color}
                      aria-label={colors[color]}
                      title={colors[color]}
                    >
                      <span className="calendar-dot" data-color={color} />
                      <span className="sr-only">{colors[color]}</span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel htmlFor="event-status">
                  {text("Trạng thái", "Status")}
                </FieldLabel>
                <Choice
                  id="event-status"
                  label={text("Trạng thái", "Status")}
                  value={draft.status}
                  onChange={(v) => set("status", v)}
                  options={Object.entries(statuses).map(([value, label]) => ({
                    value: value as EventInput["status"],
                    label,
                  }))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="event-location">
                  {text(
                    "Địa điểm / liên kết cuộc họp",
                    "Location / meeting link",
                  )}
                </FieldLabel>
                <Input
                  id="event-location"
                  value={draft.location}
                  onChange={(e) => set("location", e.target.value)}
                  maxLength={300}
                  placeholder={text(
                    "Phòng họp, Google Meet, ...",
                    "Meeting room, Google Meet, ...",
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="event-attendees">
                  {text("Người tham gia", "Attendees")}
                </FieldLabel>
                <Input
                  id="event-attendees"
                  value={draft.attendees}
                  onChange={(e) => set("attendees", e.target.value)}
                  maxLength={1000}
                  placeholder={text(
                    "Tên hoặc email, phân cách bằng dấu phẩy",
                    "Names or emails, separated by commas",
                  )}
                />
                <FieldDescription>
                  {text(
                    "Dùng để ghi chú; không gửi lời mời.",
                    "For reference; invitations are not sent.",
                  )}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="event-description">
                  {text("Mô tả & mục tiêu", "Description & goals")}
                </FieldLabel>
                <Textarea
                  id="event-description"
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={5000}
                  rows={3}
                  placeholder={text(
                    "Nội dung, đầu việc, kết quả mong đợi…",
                    "Notes, action items, expected outcomes…",
                  )}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
          {conflicts.length > 0 && (
            <Alert>
              <AlertTriangle />
              <AlertTitle>
                {text("Có lịch trùng thời gian", "Scheduling conflict")}
              </AlertTitle>
              <AlertDescription>
                {conflicts.map((e) => e.title).join(" · ")}.{" "}
                {text(
                  "Bạn vẫn có thể lưu lịch này.",
                  "You can still save this event.",
                )}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>
                {text("Chưa thể thực hiện", "Action unsuccessful")}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="flex-wrap">
            {draft.id && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmDelete(true)}
                  aria-label={text("Xóa sự kiện", "Delete event")}
                >
                  <Trash2 />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setDraft({
                      ...draft,
                      id: undefined,
                      title:
                        `${draft.title} (${text("bản sao", "copy")})`.slice(
                          0,
                          160,
                        ),
                    });
                    setInvalid(false);
                  }}
                >
                  <Copy data-icon="inline-start" />
                  {text("Nhân bản", "Duplicate")}
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              {text("Đóng", "Close")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? (
                <Spinner data-icon="inline-start" />
              ) : draft.id ? (
                <Check data-icon="inline-start" />
              ) : (
                <CalendarPlus data-icon="inline-start" />
              )}
              {text("Lưu kế hoạch", "Save plan")}
            </Button>
          </DialogFooter>
        </form>
        <AlertDialog
          open={confirmDelete}
          onOpenChange={(open) => {
            if (!busy) setConfirmDelete(open);
          }}
        >
          <AlertDialogContent data-readable-feature>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {text("Xóa kế hoạch này?", "Delete this plan?")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {draft.title}.{" "}
                {text(
                  "Thao tác này sẽ xóa sự kiện khỏi lịch.",
                  "This will remove the event from your calendar.",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>
                {text("Giữ lại", "Keep it")}
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  try {
                    await deleteEvent(draft.id!, draft.revision);
                    onSaved(text("Đã xóa kế hoạch.", "Plan deleted."));
                    onClose();
                  } catch {
                    setConfirmDelete(false);
                    setError(
                      text(
                        "Không thể xóa. Vui lòng thử lại.",
                        "Could not delete. Please retry.",
                      ),
                    );
                  }
                }}
              >
                {busy && <Spinner data-icon="inline-start" />}
                {text("Xóa kế hoạch", "Delete plan")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
