"use client";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import useSWR from "swr";
import { getFetcher } from "@/app/api/global-fetcher";
import type { CalendarData } from "@/lib/calendar/types";
import { calendarTimestamp, upcomingEvents } from "@/lib/today/agenda";
import { Panel, Message, useTodayLocale } from "./shared";
import { Button } from "@/components/ui/button";
export function Agenda({ day, now }: { day: string; now: number }) {
  const { text, date } = useTodayLocale();
  const { data, error, isLoading, mutate } = useSWR<CalendarData>("/api/calendar", getFetcher);
  const events = upcomingEvents(data?.events ?? [], day, now);
  return <Panel icon={<CalendarDays className="size-4" />} title={text("Lịch sắp tới", "Coming up")} description={text("Hôm nay và 6 ngày tiếp theo · giờ Việt Nam", "Today and the next 6 days · Vietnam time")} action={<Link href="/apps/calendar" className="text-muted-foreground hover:text-foreground" aria-label={text("Mở lịch", "Open calendar")}><ArrowUpRight className="size-4" /></Link>}>
    <div className="space-y-3">
      {isLoading || !day ? <Message>{text("Đang xem lịch…", "Checking your calendar…")}</Message> : error ? <><Message error>{text("Chưa tải được lịch.", "Could not load calendar.")}</Message><Button variant="outline" onClick={() => mutate()}>{text("Thử lại", "Retry")}</Button></> : !events.length ? <div className="rounded-lg border border-dashed border-border p-5"><p className="mb-1 font-medium">{text("Lịch đang thoáng!", "A little breathing room!")}</p><Message>{text("Chừa chỗ cho việc quan trọng, hoặc nghỉ ngơi.", "Make room for a priority, or a little rest.")}</Message></div> : events.slice(0, 5).map(event => {
        const eventDay = event.start.slice(0, 10);
        const ongoing = eventDay < day;
        return <Link key={event.id} href={`/apps/calendar?date=${ongoing ? day : eventDay}`} className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
          <div className="flex w-10 shrink-0 flex-col items-center rounded-md bg-muted py-1 font-mono"><span className="text-[10px] text-muted-foreground">{date(`${eventDay}T12:00:00+07:00`, { month: "2-digit" })}</span><span className="text-lg leading-6">{eventDay.slice(8)}</span></div>
          <div className="min-w-0 flex-1"><p className="line-clamp-2 font-medium">{event.title}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{event.allDay ? text("Cả ngày", "All day") : `${event.start.slice(11, 16)} – ${event.end.slice(11, 16)}`}{(ongoing || calendarTimestamp(event.start) <= now) && <span> · {text("Đang diễn ra", "In progress")}</span>}</p>{event.location && <p className="mt-1 truncate text-xs text-muted-foreground">{event.location}</p>}</div><ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
        </Link>;
      })}
      {!error && events.length > 5 && <p className="text-xs text-muted-foreground">+{events.length - 5} {text("lịch hẹn khác trong Calendar", "more in Calendar")}</p>}
    </div>
  </Panel>;
}
