"use client";
import { saveTextFile } from "@/lib/platform/files";
import { useSearchParams } from "@/lib/platform/navigation";
import { validDay } from "@/lib/today/model";
import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import { HeadingText } from "@/app/components/shared/heading-text";
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  CalendarDays,
  CalendarRange,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ListFilter,
  Plus,
  Search,
  Settings2,
  Target,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarProvider, useCalendar } from "@/app/context/calendar-context";
import {
  addDays,
  blankEvent,
  dateKey,
  fromKey,
  isActive,
  moveDate,
  nowInSaigon,
  overlaps,
  rangeForView,
  startOfWeek,
} from "@/lib/calendar/utils";
import { cn } from "@/lib/utils";
import type {
  CalendarEvent,
  CalendarView,
  EventCategory,
  EventInput,
  EventStatus,
} from "@/lib/calendar/types";
import { CalendarViews } from "./calendar-views";
import { EventEditor } from "./event-editor";
import { SettingsDialog } from "./settings-dialog";
import { useCalendarLocale } from "./locale";
import { Choice } from "./choice";
import { CalendarSidebar } from "./calendar-sidebar";
import { CalendarStats } from "./calendar-stats";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { calendarICS, movedEvent, weekTaskEnd } from "@/lib/calendar/export";

function subscribeClock(callback: () => void) {
  const timer = setInterval(callback, 60_000);
  return () => clearInterval(timer);
}

const viewOrder: CalendarView[] = ["agenda", "year", "month", "week", "day"];
function CalendarWorkspace({ initialDate }: { initialDate?: string }) {
  const { events, settings, error, isLoading, busy, reload, updateEvent } =
    useCalendar();
  const { text, date: formatDate, views } = useCalendarLocale();
  const now = useSyncExternalStore(subscribeClock, nowInSaigon, () => "");
  const [selectedDate, setDate] = useState<Date | null>(() => initialDate ? fromKey(initialDate) : null);
  const date = useMemo(
    () => selectedDate ?? (now ? fromKey(now) : null),
    [selectedDate, now],
  );
  const [view, setView] = useState<CalendarView>(initialDate ? "day" : "week");
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(
    ["work", "meeting", "personal", "learning"],
  );
  const [status, setStatus] = useState<"all" | "active" | EventStatus>("all");
  const [editor, setEditor] = useState<(EventInput & { id?: string }) | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fitHours, setFitHours] = useState(true);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        !date ||
        editor ||
        settingsOpen ||
        filtersOpen ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'input,textarea,select,button,[role="combobox"],[role="dialog"],[contenteditable="true"]',
          ))
      )
        return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setEditor(blankEvent(date));
      }
      if (event.key.toLowerCase() === "t") setDate(fromKey(nowInSaigon()));
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setDate(moveDate(date, view, event.key === "ArrowLeft" ? -1 : 1));
      }
      if (/^[1-5]$/.test(event.key)) setView(viewOrder[Number(event.key) - 1]);
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, [date, view, editor, settingsOpen, filtersOpen]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return events.filter(
      (event) =>
        selectedCategories.includes(event.category) &&
        (status === "all" || status === "active"
          ? status === "all" || isActive(event)
          : event.status === status) &&
        (!needle ||
          [
            event.title,
            event.description,
            event.location,
            event.attendees,
          ].some((value) => value.toLocaleLowerCase().includes(needle))),
    );
  }, [events, query, selectedCategories, status]);
  const today = now.slice(0, 10);
  if (!date || isLoading)
    return (
      <div
        className="calendar-theme calendar-workspace"
        aria-label={text("Đang tải lịch", "Loading calendar")}
      >
        <Skeleton className="h-9 w-1/2 shrink-0" />
        <Skeleton className="min-h-0 w-full flex-1" />
      </div>
    );
  const weekStart = startOfWeek(date);
  const weekEvents = events.filter((e) =>
    overlaps(e, {
      start: `${dateKey(weekStart)}T00:00`,
      end: weekTaskEnd(weekStart),
    }),
  );
  const tasks = weekEvents
    .filter((e) => e.kind === "task" && e.status !== "cancelled")
    .sort(
      (a, b) =>
        Number(b.priority === "high") - Number(a.priority === "high") ||
        a.start.localeCompare(b.start),
    );
  const completed = tasks.filter((e) => e.status === "completed").length;
  const activeTimed = weekEvents.filter((e) => !e.allDay && isActive(e));
  const conflictCount = activeTimed.reduce(
    (total, e, index) =>
      total +
      activeTimed.slice(index + 1).filter((other) => overlaps(e, other)).length,
    0,
  );
  // Merge overlapping intervals and clip to this week before computing occupied hours.
  const intervals = weekEvents
    .filter((e) => !e.allDay && e.status !== "cancelled")
    .map((e) => [
      Math.max(
        Date.parse(`${e.start}:00+07:00`),
        Date.parse(`${dateKey(weekStart)}T00:00:00+07:00`),
      ),
      Math.min(
        Date.parse(`${e.end}:00+07:00`),
        Date.parse(`${dateKey(addDays(weekStart, 7))}T00:00:00+07:00`),
      ),
    ])
    .sort((a, b) => a[0] - b[0]);
  let occupied = 0;
  let end = 0;
  for (const [start, finish] of intervals) {
    occupied += Math.max(0, finish - Math.max(start, end));
    end = Math.max(end, finish);
  }
  const [rangeStart, rangeEnd] = rangeForView(date, view);
  const visible = filtered.filter((e) =>
    overlaps(e, {
      start: `${dateKey(rangeStart)}T00:00`,
      end: `${dateKey(rangeEnd)}T00:00`,
    }),
  );
  const heading =
    view === "year"
      ? String(date.getFullYear())
      : view === "week"
        ? `${formatDate(weekStart, { day: "numeric", month: "short" })} – ${formatDate(addDays(weekStart, 6), { day: "numeric", month: "short", year: "numeric" })}`
        : formatDate(
            date,
            view === "day"
              ? { day: "numeric", month: "long", year: "numeric" }
              : { month: "long", year: "numeric" },
          );
  const create = (day: Date, hour?: number) => setEditor(blankEvent(day, hour));
  const day = (value: Date) => {
    setDate(value);
    setView("day");
  };
  async function complete(event: CalendarEvent) {
    try {
      await updateEvent({
        ...event,
        status: event.status === "completed" ? "planned" : "completed",
      });
      setNotice(text("Đã cập nhật công việc.", "Task updated."));
    } catch {
      setActionError(
        text(
          "Không thể cập nhật công việc. Vui lòng thử lại.",
          "Could not update task. Please retry.",
        ),
      );
    }
  }
  async function move(event: CalendarEvent, target: Date, hour?: number) {
    try {
      await updateEvent(movedEvent(event, target, hour));
      setNotice(
        text(
          "Đã chuyển lịch. Bạn có thể mở sự kiện để điều chỉnh giờ.",
          "Plan moved. Open the event to adjust the time.",
        ),
      );
    } catch {
      setActionError(
        text(
          "Không thể chuyển lịch. Vui lòng thử lại.",
          "Could not move plan. Please retry.",
        ),
      );
    }
  }
  function exportCalendar() {
    void saveTextFile(`calendar-${dateKey(rangeStart)}.ics`, calendarICS(visible), 'text/calendar;charset=utf-8').then(() => {
    setNotice(
      text(
        `Đã xuất ${visible.length} kế hoạch trong phạm vi đang xem.`,
        `Exported ${visible.length} plans in the current view.`,
      ),
    );
    }).catch(() => setActionError('Không xuất được file. Vui lòng thử lại.'));
  }
  const sidebarProps = {
    date,
    onDateChange: setDate,
    selectedCategories,
    onCategoriesChange: setSelectedCategories,
    rangeStart,
    rangeEnd,
    tasks,
    completed,
    weekStart,
    onComplete: complete,
    onCreateTask: () => setEditor({ ...blankEvent(date), kind: "task" }),
    onEdit: (event: CalendarEvent) => setEditor(event),
  };
  return (
    <div className="calendar-theme calendar-workspace">
      <header className="calendar-workspace-header flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="hidden size-8 shrink-0 items-center justify-center rounded-lg border bg-card sm:flex">
            <CalendarRange className="size-4 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl tracking-tight"><HeadingText>{text("Lịch của bin", "bin’s calendar")}</HeadingText></h1>
              <Badge variant="secondary">
                {text("Không gian cá nhân", "Personal workspace")}
              </Badge>
            </div>
            <PersonalizedIntro taglineOnly />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCalendar}
            aria-label={text("Xuất lịch", "Export calendar")}
            disabled={!!error}
          >
            <Download data-icon="inline-start" />
            <span className="hidden sm:inline">
              {text("Xuất lịch", "Export")}
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setSettingsOpen(true)}
            disabled={!!error}
            aria-label={text("Tùy chỉnh lịch", "Calendar settings")}
          >
            <Settings2 />
          </Button>
          <Button
            size="sm"
            onClick={() => create(date)}
            disabled={!!error || busy}
          >
            <Plus data-icon="inline-start" />
            {text("Tạo kế hoạch", "New plan")}
          </Button>
        </div>
        <CalendarStats
          stats={[
            {
              label: text("Kế hoạch trong tuần", "Plans this week"),
              shortLabel: text("Kế hoạch", "Plans"),
              value: weekEvents.filter((e) => e.status !== "cancelled").length,
              detail: text(
                "Sự kiện và công việc, không tính kế hoạch đã hủy.",
                "Events and tasks, excluding cancelled plans.",
              ),
              icon: CalendarDays,
            },
            {
              label: text("Thời gian đã lên lịch", "Scheduled time"),
              shortLabel: text("Đã xếp lịch", "Scheduled"),
              value: `${Number((occupied / 3600000).toFixed(1))}h`,
              detail: text(
                "Thời gian đã xếp trong tuần; không tính lịch cả ngày và không cộng lặp các khoảng trùng giờ.",
                "Occupied time this week, excluding all-day events and counting overlaps once.",
              ),
              icon: Clock3,
            },
            {
              label: text("Công việc hoàn thành", "Tasks completed"),
              shortLabel: text("Hoàn thành", "Completed"),
              value: `${completed}/${tasks.length}`,
              detail: text(
                "Số công việc hoàn thành trên tổng công việc của tuần đang chọn.",
                "Completed tasks out of all tasks in the selected week.",
              ),
              icon: CheckCheck,
            },
            {
              label: text("Lịch trùng thời gian", "Scheduling conflicts"),
              shortLabel: text("Trùng lịch", "Conflicts"),
              value: conflictCount,
              detail: text(
                "Số cặp lịch trùng thời gian, không tính lịch cả ngày, đã hủy hoặc hoàn thành.",
                "Overlapping pairs, excluding all-day, cancelled and completed plans.",
              ),
              icon: Target,
            },
          ]}
          period={`${formatDate(weekStart, { day: "numeric", month: "short" })} – ${formatDate(addDays(weekStart, 6), { day: "numeric", month: "short" })}`}
        />
      </header>
      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>
            {text("Không tải được lịch", "Could not load calendar")}
          </AlertTitle>
          <AlertDescription>
            {text(
              "Kiểm tra kết nối và quyền ghi thư mục dữ liệu.",
              "Check your connection and storage permissions.",
            )}
            <Button size="sm" variant="outline" onClick={() => reload()}>
              {text("Thử lại", "Retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="calendar-board flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
            <aside
              className={cn(
                "calendar-rail hidden w-[220px] shrink-0 overflow-y-auto border-r lg:block",
              )}
              aria-label={text("Bộ lọc và công việc", "Filters and tasks")}
            >
              <CalendarSidebar {...sidebarProps} />
            </aside>
            <main
              className="calendar-main flex min-h-0 min-w-0 flex-1 flex-col"
              aria-label={text("Lịch kế hoạch", "Planning calendar")}
            >
              <div className="calendar-toolbar flex shrink-0 flex-col gap-2 border-b p-2 sm:px-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDate(fromKey(nowInSaigon()))}
                    >
                      {text("Hôm nay", "Today")}
                    </Button>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDate(moveDate(date, view, -1))}
                        aria-label={text("Khoảng trước", "Previous period")}
                      >
                        <ChevronLeft />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDate(moveDate(date, view, 1))}
                        aria-label={text("Khoảng tiếp theo", "Next period")}
                      >
                        <ChevronRight />
                      </Button>
                    </div>
                    <h2
                      className="text-base font-semibold capitalize"
                      aria-live="polite"
                    ><HeadingText>
                      {heading}
                    </HeadingText></h2>
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Button
                      className="lg:hidden"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setFiltersOpen(!filtersOpen)}
                      aria-expanded={filtersOpen}
                      aria-label={text("Mở bộ lọc", "Show filters")}
                    >
                      <ListFilter />
                    </Button>
                    <ToggleGroup
                      variant="outline"
                      size="sm"
                      value={[view]}
                      onValueChange={(v) => {
                        if (v[0]) setView(v[0] as CalendarView);
                      }}
                      spacing={0}
                      aria-label={text("Chế độ xem lịch", "Calendar view")}
                    >
                      {viewOrder.map((v) => (
                        <ToggleGroupItem key={v} value={v}>
                          {views[v]}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <InputGroup className="max-w-sm">
                    <InputGroupAddon>
                      <Search />
                    </InputGroupAddon>
                    <InputGroupInput
                      aria-label={text("Tìm kế hoạch", "Search plans")}
                      placeholder={text(
                        "Tìm sự kiện, công việc, địa điểm…",
                        "Search events, tasks, locations…",
                      )}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </InputGroup>
                  <div className="flex flex-wrap items-center gap-2">
                    {(view === "week" || view === "day") && (
                      <ToggleGroup
                        variant="outline"
                        size="sm"
                        spacing={0}
                        value={[fitHours ? "fit" : "detail"]}
                        onValueChange={(v) => {
                          if (v[0]) setFitHours(v[0] === "fit");
                        }}
                        aria-label={text(
                          "Mật độ khung giờ",
                          "Time grid density",
                        )}
                      >
                        <ToggleGroupItem value="fit">
                          {text("Vừa màn hình", "Fit")}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="detail">
                          {text("Chi tiết", "Detail")}
                        </ToggleGroupItem>
                      </ToggleGroup>
                    )}
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {visible.length} {text("kế hoạch", "plans")}
                    </span>
                    <div className="w-36">
                      <Choice
                        label={text("Lọc trạng thái", "Filter status")}
                        value={status}
                        onChange={setStatus}
                        options={[
                          {
                            value: "all",
                            label: text("Mọi trạng thái", "All statuses"),
                          },
                          {
                            value: "active",
                            label: text("Chưa hoàn thành", "Active plans"),
                          },
                          {
                            value: "planned",
                            label: text("Dự kiến", "Planned"),
                          },
                          {
                            value: "confirmed",
                            label: text("Đã xác nhận", "Confirmed"),
                          },
                          {
                            value: "completed",
                            label: text("Hoàn thành", "Completed"),
                          },
                          {
                            value: "cancelled",
                            label: text("Đã hủy", "Cancelled"),
                          },
                        ]}
                      />
                    </div>
                    {(query ||
                      selectedCategories.length !== 4 ||
                      status !== "all") && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={text("Xóa bộ lọc", "Clear filters")}
                        onClick={() => {
                          setQuery("");
                          setSelectedCategories([
                            "work",
                            "meeting",
                            "personal",
                            "learning",
                          ]);
                          setStatus("all");
                        }}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="calendar-view-viewport">
                <CalendarViews
                  date={date}
                  today={today}
                  now={now}
                  events={filtered}
                  settings={settings}
                  view={view}
                  onCreate={create}
                  onEdit={setEditor}
                  onDay={day}
                  onMove={move}
                  onComplete={complete}
                  busy={busy}
                  fitHours={fitHours}
                />
              </div>
              <div className="calendar-grid-footer flex shrink-0 flex-wrap items-center justify-between gap-1 border-t px-3 py-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm border bg-muted" />
                  {text("Ngoài giờ làm việc", "Outside working hours")} ·{" "}
                  {String(settings.workStart).padStart(2, "0")}:00–
                  {String(settings.workEnd).padStart(2, "0")}:00
                </span>
                <span className="hidden xl:inline">
                  {text(
                    "Nhấn ô trống để tạo lịch · Kéo sự kiện để đổi ngày/giờ",
                    "Click a free slot to create · Drag an event to reschedule",
                  )}
                </span>
              </div>
            </main>
          </div>
        </>
      )}
      <div
        role="status"
        aria-live="polite"
        className="calendar-save-status shrink-0 truncate text-xs text-muted-foreground"
      >
        {notice ||
          text(
            "Lịch cá nhân · GMT+7 · Lưu tự động sau mỗi thao tác thành công",
            "Personal calendar · GMT+7 · Saved after each successful change",
          )}
      </div>
      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>
            {actionError}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActionError("")}
            >
              {text("Đóng", "Dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="calendar-theme w-72 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {text("Lịch & công việc", "Calendars & tasks")}
            </SheetTitle>
            <SheetDescription>
              {text(
                "Bộ lọc và kế hoạch cho tuần đang chọn.",
                "Filters and tasks for the selected week.",
              )}
            </SheetDescription>
          </SheetHeader>
          {filtersOpen && <CalendarSidebar {...sidebarProps} />}
        </SheetContent>
      </Sheet>
      {editor && (
        <EventEditor
          initial={editor}
          onClose={() => setEditor(null)}
          onSaved={setNotice}
        />
      )}
      {settingsOpen && (
        <SettingsDialog
          onClose={() => setSettingsOpen(false)}
          onSaved={setNotice}
        />
      )}
    </div>
  );
}
function CalendarEntry() {
  const params = useSearchParams();
  const rawDate = params.get("date");
  const initialDate = validDay(rawDate) ? rawDate : undefined;
  return (
    <CalendarProvider>
      <CalendarWorkspace key={initialDate} initialDate={initialDate} />
    </CalendarProvider>
  );
}

export default function BigCalendar() { return <Suspense fallback={<p>…</p>}><CalendarEntry /></Suspense>; }
