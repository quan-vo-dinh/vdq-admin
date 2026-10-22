"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { HeadingText } from "@/app/components/shared/heading-text";
import {
  useId,
  type Dispatch,
  type SetStateAction,
  type CSSProperties,
} from "react";
import { Plus } from "lucide-react";
import { vi as viLocale, enGB } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useCalendar } from "@/app/context/calendar-context";
import { useCalendarLocale } from "./locale";
import { dateKey, fromKey, addDays, overlaps } from "@/lib/calendar/utils";
import type { CalendarEvent, EventCategory } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
const categoryColors = {
  work: "violet",
  meeting: "orange",
  personal: "rose",
  learning: "green",
};

type Props = {
  date: Date;
  onDateChange: (date: Date) => void;
  selectedCategories: EventCategory[];
  onCategoriesChange: Dispatch<SetStateAction<EventCategory[]>>;
  rangeStart: Date;
  rangeEnd: Date;
  tasks: CalendarEvent[];
  completed: number;
  weekStart: Date;
  onComplete: (event: CalendarEvent) => void;
  onCreateTask: () => void;
  onEdit: (event: CalendarEvent) => void;
};
export function CalendarSidebar({
  date,
  onDateChange,
  selectedCategories,
  onCategoriesChange,
  rangeStart,
  rangeEnd,
  tasks,
  completed,
  weekStart,
  onComplete,
  onCreateTask,
  onEdit,
}: Props) {
  const { events, busy } = useCalendar();
  const { text, vi, date: formatDate, categories } = useCalendarLocale();
  const filterId = useId();
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold"><HeadingText>
          {text("Lịch của tôi", "My calendars")}
        </HeadingText></h2>
        <Badge variant="outline"><NumberTicker value={selectedCategories.length} />/4</Badge>
      </div>
      <Calendar
        mode="single"
        selected={date}
        month={date}
        onMonthChange={onDateChange}
        onSelect={(value) => {
          if (value) onDateChange(value);
        }}
        locale={vi ? viLocale : enGB}
        weekStartsOn={1}
        className="calendar-mini mx-auto w-full"
        style={{ "--cell-size": "24px" } as CSSProperties}
      />
      <Separator />
      <FieldSet>
        <FieldLegend variant="label">
          {text("Nhóm lịch", "Calendars")}
        </FieldLegend>
        <FieldGroup className="gap-3">
          {(Object.keys(categories) as EventCategory[]).map((category) => (
            <Field key={category} orientation="horizontal" className="gap-2">
              <Checkbox
                id={`${filterId}-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) =>
                  onCategoriesChange((previous) =>
                    checked
                      ? [...previous, category]
                      : previous.filter((c) => c !== category),
                  )
                }
              />
              <FieldLabel
                htmlFor={`${filterId}-${category}`}
                className="flex flex-1 items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="calendar-dot"
                    data-color={categoryColors[category]}
                  />
                  {categories[category]}
                </span>
                <span className="text-sm text-muted-foreground">
                  {
                    events.filter(
                      (e) =>
                        e.category === category &&
                        overlaps(e, {
                          start: `${dateKey(rangeStart)}T00:00`,
                          end: `${dateKey(rangeEnd)}T00:00`,
                        }),
                    ).length
                  }
                </span>
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>
      <Separator />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold"><HeadingText>
            {text("Công việc tuần này", "Tasks this week")}
          </HeadingText></h2>
          <Badge variant="secondary">
            <NumberTicker value={completed} />/<NumberTicker value={tasks.length} />
          </Badge>
        </div>
        <Progress
          value={tasks.length ? (completed / tasks.length) * 100 : 0}
          aria-label={text("Tiến độ công việc tuần", "Weekly task progress")}
        />
        <p className="text-sm text-muted-foreground">
          {formatDate(weekStart, { day: "numeric", month: "short" })} –{" "}
          {formatDate(addDays(weekStart, 6), {
            day: "numeric",
            month: "short",
          })}
        </p>
        {tasks.length ? (
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <Checkbox
                  checked={task.status === "completed"}
                  disabled={busy}
                  onCheckedChange={() => onComplete(task)}
                  aria-label={`${text("Hoàn thành", "Complete")} ${task.title}`}
                />
                <button
                  className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                  onClick={() => onEdit(task)}
                >
                  <span
                    className={cn(
                      "text-sm leading-relaxed",
                      task.status === "completed" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(fromKey(task.start), {
                      weekday: "short",
                      day: "numeric",
                    })}{" "}
                    ·{" "}
                    {task.allDay
                      ? text("Cả ngày", "All day")
                      : task.start.slice(11)}
                    {task.priority === "high" &&
                      ` · ↑ ${text("Ưu tiên cao", "High priority")}`}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {text(
              "Chưa có công việc trong tuần.",
              "No tasks planned this week.",
            )}
          </p>
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onCreateTask}
        >
          <Plus data-icon="inline-start" />
          {text("Thêm công việc", "Add task")}
        </Button>
      </div>
      <Separator />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {text(
          "Phím tắt: N tạo mới · T hôm nay · ← → chuyển lịch · 1–5 đổi chế độ xem.",
          "Shortcuts: N new · T today · ← → navigate · 1–5 switch views.",
        )}
      </p>
    </div>
  );
}
