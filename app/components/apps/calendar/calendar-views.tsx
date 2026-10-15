"use client";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
} from "react";
import { CheckCheck, ChevronRight, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  addDays,
  dateKey,
  displayEndDay,
  eventOnDay,
  isActive,
  layoutTimedEvents,
  monthDays,
  startOfWeek,
  timeLabel,
} from "@/lib/calendar/utils";
import type {
  BadgeStyle,
  CalendarEvent,
  CalendarSettings,
  CalendarView,
} from "@/lib/calendar/types";
import { useCalendarLocale } from "./locale";

type Props = {
  date: Date;
  today: string;
  now: string;
  events: CalendarEvent[];
  settings: CalendarSettings;
  view: CalendarView;
  onEdit: (event: CalendarEvent) => void;
  onCreate: (date: Date, hour?: number) => void;
  onDay: (date: Date) => void;
  onMove: (event: CalendarEvent, date: Date, hour?: number) => void;
  onComplete: (event: CalendarEvent) => void;
  busy: boolean;
  fitHours: boolean;
};
export function EventChip({
  event,
  style,
  onClick,
  compact = false,
  timed = false,
  draggable = true,
  badgeStyle,
}: {
  event: CalendarEvent;
  style?: CSSProperties;
  onClick: () => void;
  compact?: boolean;
  timed?: boolean;
  draggable?: boolean;
  badgeStyle: BadgeStyle;
}) {
  const { vi, text } = useCalendarLocale();
  return (
    <button
      type="button"
      className={cn(
        "calendar-event",
        compact && "calendar-event-compact",
        timed && "calendar-event-timed",
        event.status === "completed" && "calendar-event-completed",
        event.status === "cancelled" && "calendar-event-cancelled",
      )}
      data-color={event.color}
      data-badge-style={badgeStyle}
      style={style}
      onClick={onClick}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/calendar-event", event.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      title={`${event.title} · ${timeLabel(event, vi)}`}
      aria-label={`${text("Mở", "Open")} ${event.title}, ${timeLabel(event, vi)}`}
    >
      <span className="calendar-event-title">
        {badgeStyle !== "color" && (
          <span className="calendar-dot" data-color={event.color} />
        )}
        {event.kind === "task" && <CheckCheck className="size-3 shrink-0" />}
        <span className="truncate">{event.title}</span>
      </span>
      {!compact && (
        <span className="calendar-event-time">
          {timeLabel(event, vi)}
          {timed && event.location && (
            <span className="hidden xl:inline"> · {event.location}</span>
          )}
        </span>
      )}
    </button>
  );
}
function acceptDrop(e: DragEvent, props: Props, date: Date, hour?: number) {
  e.preventDefault();
  const event = props.events.find(
    (event) =>
      event.id === e.dataTransfer.getData("application/calendar-event"),
  );
  if (event && !props.busy) props.onMove(event, date, hour);
}
const allowDrop = (e: DragEvent) => {
  if (e.dataTransfer.types.includes("application/calendar-event")) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
};
export function CalendarViews(props: Props) {
  if (props.view === "week" || props.view === "day")
    return <TimeGrid {...props} />;
  if (props.view === "year") return <YearGrid {...props} />;
  if (props.view === "agenda") return <Agenda {...props} />;
  return <MonthGrid {...props} />;
}
function TimeGrid(props: Props) {
  const { date, events, settings, today, now, view, onCreate, onEdit } = props;
  const { text, date: formatDate } = useCalendarLocale();
  const days = (
    view === "day"
      ? [date]
      : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i))
  ).filter(
    (d) =>
      view === "day" || settings.showWeekends || ![0, 6].includes(d.getDay()),
  );
  const hours = Array.from(
    { length: settings.visibleEnd - settings.visibleStart },
    (_, i) => settings.visibleStart + i,
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const allDayRef = useRef<HTMLDivElement>(null);
  const [hourHeight, setHourHeight] = useState(60);
  useEffect(() => {
    const viewport = viewportRef.current;
    const header = headerRef.current;
    const allDay = allDayRef.current;
    if (!viewport || !header || !allDay) return;
    const measure = () => {
      const available =
        viewport.clientHeight - header.offsetHeight - allDay.offsetHeight - 2;
      setHourHeight(
        props.fitHours
          ? Math.max(22, Math.min(60, available / hours.length))
          : 60,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(header);
    observer.observe(allDay);
    measure();
    return () => observer.disconnect();
  }, [props.fitHours, hours.length]);
  const scale = hourHeight / 60;
  const rowsHeight = hours.length * hourHeight;
  const nowMinutes = Number(now.slice(11, 13)) * 60 + Number(now.slice(14, 16));
  const allDayEvents = events.filter(
    (e) => e.allDay && days.some((d) => eventOnDay(e, d)),
  );
  const clipped = events.filter(
    (e) =>
      !e.allDay &&
      days.some((d) => eventOnDay(e, d)) &&
      !days.some(
        (d) =>
          layoutTimedEvents([e], d, settings.visibleStart, settings.visibleEnd)
            .length,
      ),
  );
  return (
    <>
      {clipped.length > 0 && (
        <div className="max-h-14 shrink-0 overflow-y-auto flex flex-wrap items-center gap-2 border-b px-3 py-1 text-xs text-muted-foreground">
          {text("Ngoài khung giờ hiển thị:", "Outside visible hours:")}
          {clipped.map((e) => (
            <Button
              key={e.id}
              size="xs"
              variant="outline"
              onClick={() => onEdit(e)}
            >
              {e.title}
            </Button>
          ))}
        </div>
      )}
      <div
        ref={viewportRef}
        className={cn(
          "calendar-time-scroll",
          props.fitHours && "calendar-time-fit",
        )}
        style={{ "--calendar-hour-height": `${hourHeight}px` } as CSSProperties}
      >
        <div
          className={cn(
            "calendar-time-inner",
            view === "day" && "calendar-time-single",
          )}
          style={{ "--calendar-columns": days.length } as CSSProperties}
        >
          <div ref={headerRef} className="calendar-time-header">
            <div className="flex items-center justify-center text-[10px] text-muted-foreground">
              GMT+7
            </div>
            {days.map((day) => (
              <button
                key={dateKey(day)}
                className={cn(
                  "calendar-day-heading",
                  dateKey(day) === today && "calendar-is-today",
                )}
                onClick={() => props.onDay(day)}
              >
                <span className="text-xs text-muted-foreground">
                  {formatDate(day, { weekday: "short" })}
                </span>
                <span className="calendar-day-number">{day.getDate()}</span>
              </button>
            ))}
          </div>
          <div ref={allDayRef} className="calendar-all-day-grid">
            <div className="p-2 text-[10px] text-muted-foreground">
              {text("Cả ngày", "All day")}
            </div>
            <div
              className="calendar-all-day-events"
              style={{
                gridTemplateColumns: `repeat(${days.length}, minmax(0,1fr))`,
              }}
            >
              {allDayEvents.length === 0 && (
                <span
                  className="px-2 py-1 text-xs text-muted-foreground"
                  style={{ gridColumn: "1 / -1" }}
                >
                  {text("Không có sự kiện cả ngày", "No all-day events")}
                </span>
              )}
              {allDayEvents.map((event) => {
                const occupied = days
                  .map((d, i) => (eventOnDay(event, d) ? i : -1))
                  .filter((i) => i >= 0);
                return (
                  <div
                    key={event.id}
                    style={{
                      gridColumn: `${occupied[0] + 1} / ${occupied[occupied.length - 1] + 2}`,
                    }}
                  >
                    <EventChip
                      event={event}
                      compact
                      badgeStyle={settings.badgeStyle}
                      onClick={() => onEdit(event)}
                      draggable={!props.busy}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="calendar-time-body">
            <div className="relative" style={{ height: rowsHeight }}>
              {hours.map((hour, i) => (
                <span
                  className="calendar-hour-label"
                  key={hour}
                  style={{ top: i * hourHeight + 2 }}
                >
                  {String(hour).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((day) => {
              const slots = layoutTimedEvents(
                events,
                day,
                settings.visibleStart,
                settings.visibleEnd,
              );
              return (
                <div
                  key={dateKey(day)}
                  className="calendar-time-column"
                  style={{ height: rowsHeight }}
                >
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={cn(
                        "calendar-hour-slot",
                        (!settings.workDays.includes(day.getDay()) ||
                          hour < settings.workStart ||
                          hour >= settings.workEnd) &&
                          "calendar-outside-work",
                      )}
                      onClick={() => onCreate(day, hour)}
                      onDragOver={allowDrop}
                      onDrop={(e) => acceptDrop(e, props, day, hour)}
                      aria-label={`${text("Thêm kế hoạch", "Add plan")} ${formatDate(day)} ${hour}:00`}
                    />
                  ))}
                  {slots.map(({ event, start, end, column, columns }) => (
                    <EventChip
                      key={event.id}
                      event={event}
                      badgeStyle={settings.badgeStyle}
                      timed
                      compact={(end - start) * scale < 38}
                      draggable={!props.busy}
                      onClick={() => onEdit(event)}
                      style={{
                        position: "absolute",
                        top: (start - settings.visibleStart * 60) * scale,
                        height: Math.max((end - start) * scale - 2, 2),
                        left: `calc(${(column / columns) * 100}% + 3px)`,
                        width: `calc(${100 / columns}% - 6px)`,
                      }}
                    />
                  ))}
                  {dateKey(day) === today &&
                    nowMinutes >= settings.visibleStart * 60 &&
                    nowMinutes < settings.visibleEnd * 60 && (
                      <div
                        className="calendar-now-line"
                        style={{
                          top:
                            (nowMinutes - settings.visibleStart * 60) * scale,
                        }}
                        aria-label={text("Thời gian hiện tại", "Current time")}
                      >
                        <span />
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
function MonthGrid(props: Props) {
  const { date, today, settings, events, onCreate, onEdit, onDay } = props;
  const { date: formatDate, text } = useCalendarLocale();
  const days = monthDays(date).filter(
    (d) => settings.showWeekends || ![0, 6].includes(d.getDay()),
  );
  const columns = settings.showWeekends ? 7 : 5;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [eventLimit, setEventLimit] = useState(1);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const rowHeight = Math.max(76, (viewport.clientHeight - 30) / 6);
      setEventLimit(
        Math.max(1, Math.min(3, Math.floor((rowHeight - 48) / 22))),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    measure();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={viewportRef} className="calendar-month-scroll">
      <div
        className="calendar-month-grid"
        style={{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))` }}
      >
        {days.slice(0, columns).map((d) => (
          <div
            className="border-b px-2 py-3 text-center text-xs text-muted-foreground"
            key={dateKey(d)}
          >
            {formatDate(d, { weekday: "short" })}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = events
            .filter((e) => eventOnDay(e, day))
            .sort(
              (a, b) =>
                Number(b.allDay) - Number(a.allDay) ||
                a.start.localeCompare(b.start),
            );
          return (
            <div
              key={dateKey(day)}
              className={cn(
                "calendar-month-cell",
                day.getMonth() !== date.getMonth() && "calendar-other-month",
              )}
              onDragOver={allowDrop}
              onDrop={(e) => acceptDrop(e, props, day)}
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <button
                  type="button"
                  className={cn(
                    "calendar-month-number",
                    dateKey(day) === today && "calendar-selected-day",
                  )}
                  onClick={() => onDay(day)}
                  aria-label={formatDate(day, { dateStyle: "full" })}
                >
                  {day.getDate()}
                </button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onCreate(day)}
                  aria-label={`${text("Thêm ngày", "Add on")} ${formatDate(day)}`}
                >
                  <Plus />
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, eventLimit).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    compact
                    badgeStyle={settings.badgeStyle}
                    onClick={() => onEdit(event)}
                    draggable={!props.busy}
                  />
                ))}
                {dayEvents.length > eventLimit && (
                  <button
                    className="px-2 text-left text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => onDay(day)}
                  >
                    +{dayEvents.length - eventLimit}{" "}
                    {text("kế hoạch khác", "more plans")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function YearGrid(props: Props) {
  const { date, today, events, onDay } = props;
  const { date: formatDate, text } = useCalendarLocale();
  return (
    <div className="calendar-year-scroll grid grid-cols-1 content-start gap-4 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, month) => {
        const first = new Date(date.getFullYear(), month, 1, 12);
        const days = monthDays(first);
        const count = events.filter(
          (e) =>
            e.start <
              `${dateKey(new Date(date.getFullYear(), month + 1, 1, 12))}T00:00` &&
            e.end > `${dateKey(first)}T00:00`,
        ).length;
        return (
          <section key={month} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm capitalize">
                {formatDate(first, { month: "long" })}
              </h3>
              <Badge variant="secondary">{count}</Badge>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {text("T2,T3,T4,T5,T6,T7,CN", "M,T,W,T,F,S,S")
                .split(",")
                .map((label, i) => (
                  <span
                    key={i}
                    className="py-1 text-center text-[10px] text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              {days.map((day) => {
                const dayEvents = events.filter((e) => eventOnDay(e, day));
                return (
                  <button
                    key={dateKey(day)}
                    type="button"
                    className={cn(
                      "calendar-year-day",
                      day.getMonth() !== month && "invisible",
                      dateKey(day) === today && "calendar-selected-day",
                    )}
                    onClick={() => onDay(day)}
                    aria-label={`${formatDate(day, { dateStyle: "full" })}: ${dayEvents.length} ${text("kế hoạch", "plans")}`}
                    tabIndex={day.getMonth() !== month ? -1 : 0}
                  >
                    <span>{day.getDate()}</span>
                    <span className="flex h-1 gap-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          className="calendar-dot calendar-dot-tiny"
                          data-color={e.color}
                          key={e.id}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
function Agenda(props: Props) {
  const { date, events, onEdit, onComplete, busy, today } = props;
  const {
    date: formatDate,
    text,
    vi,
    statuses,
    priorities,
  } = useCalendarLocale();
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const days = Array.from(
    { length: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() },
    (_, i) => addDays(first, i),
  );
  const populated = days.filter((day) =>
    events.some((e) => eventOnDay(e, day)),
  );
  if (!populated.length)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCheck />
          </EmptyMedia>
          <EmptyTitle>
            {text("Không có kế hoạch phù hợp", "No matching plans")}
          </EmptyTitle>
          <EmptyDescription>
            {text(
              "Thử bỏ bộ lọc hoặc tạo sự kiện mới cho tháng này.",
              "Clear your filters or add a new event this month.",
            )}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  return (
    <div className="calendar-agenda-scroll flex flex-col overflow-y-auto">
      {populated.map((day) => (
        <section
          key={dateKey(day)}
          className="flex flex-col border-b last:border-0 sm:flex-row"
        >
          <button
            className={cn(
              "flex w-full shrink-0 items-center gap-2 bg-muted/30 p-4 text-left sm:w-32 sm:flex-col sm:items-start",
              dateKey(day) === today && "text-primary",
            )}
            onClick={() => props.onDay(day)}
          >
            <span className="text-2xl font-semibold tabular-nums">
              {day.getDate()}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(day, { weekday: "long", month: "short" })}
            </span>
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            {events
              .filter((e) => eventOnDay(e, day))
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 border-b px-4 py-4 last:border-0 hover:bg-muted/30"
                >
                  {event.kind === "task" ? (
                    <Checkbox
                      aria-label={`${text("Hoàn thành", "Complete")} ${event.title}`}
                      checked={event.status === "completed"}
                      disabled={busy || event.status === "cancelled"}
                      onCheckedChange={() => onComplete(event)}
                    />
                  ) : (
                    <span className="calendar-dot" data-color={event.color} />
                  )}
                  <button
                    className="flex min-w-0 flex-1 flex-col gap-1 text-left"
                    onClick={() => onEdit(event)}
                  >
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        event.status === "completed" &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {event.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {timeLabel(event, vi)}
                      {event.allDay &&
                        event.end.slice(0, 10) > dateKey(addDays(day, 1)) &&
                        ` → ${displayEndDay(event)}`}
                      {event.location && (
                        <>
                          <MapPin className="size-3" />
                          {event.location}
                        </>
                      )}
                    </span>
                  </button>
                  <div className="hidden flex-col items-end gap-1 sm:flex">
                    <Badge variant={isActive(event) ? "secondary" : "outline"}>
                      {statuses[event.status]}
                    </Badge>
                    {event.priority === "high" && (
                      <span className="text-xs text-muted-foreground">
                        {priorities.high} ↑
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${text("Chi tiết", "Details")} ${event.title}`}
                    onClick={() => onEdit(event)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
