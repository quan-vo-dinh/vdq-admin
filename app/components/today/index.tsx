"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ArrowUpRight, BookOpen, CalendarDays, Code2 } from "lucide-react";
import { getFetcher } from "@/app/api/global-fetcher";
import type { CalendarData } from "@/lib/calendar/types";
import { priorityActivity } from "@/lib/today/activity";
import { upcomingEvents } from "@/lib/today/agenda";
import { TodayBanner, FocusOverview, PersonalMetrics } from "./overview";
import OverviewTab from "@/app/components/dashboards/modern/overview-tab";
import TotalSales from "@/app/components/dashboards/modern/total-sales";
import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { Message } from "./shared";
import { NotesContext, NotesProvider } from "@/app/context/notes-context";
import { TodayProvider, useToday } from "@/app/context/today-context";
import { Priorities } from "./priorities";
import { Agenda } from "./agenda";
import { QuickNote, RecentNotes } from "./notes";
import { useTodayClock, useTodayLocale } from "./shared";
function Workspace() {
  const { text } = useTodayLocale();
  const { day, now } = useTodayClock();
  const { items, isLoading, error, reload } = useToday();
  const { notes, error: notesError, loading: notesLoading } = useContext(NotesContext);
  const { data: calendar, error: calendarError, isLoading: calendarLoading } = useSWR<CalendarData>("/api/calendar", getFetcher);
  const { mutate } = useSWRConfig();
  const [period, setPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const available = !!day && !isLoading && !error;
  const today = items.filter(item => item.date === day);
  const completed = today.filter(item => item.done).length;
  const activity = priorityActivity(items, day, period);
  async function refresh() {
    setRefreshing(true); setRefreshError(false);
    try { await Promise.all([reload(), mutate("/api/calendar"), mutate("/api/notes")]); }
    catch { setRefreshError(true); }
    finally { setRefreshing(false); }
  }
  function exportActivity() {
    const csv = ["date,planned,completed", ...activity.map(point => `${point.date},${point.planned},${point.completed}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `bin-priorities-${day}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-4">
    <TodayShortcuts />
    <OverviewTab onRefresh={() => void refresh()} onExport={exportActivity} busy={refreshing || !available} />
    {refreshError && <Message error>{text("Chưa làm mới được một số dữ liệu. Thử lại nhé.", "Some data could not refresh. Please retry.")}</Message>}
    <StyleAwareWrapper lyraClassName="grid grid-cols-12 p-px gap-px bg-border" defaultClassName="grid grid-cols-12 gap-4">
      <div className="col-span-12"><TodayBanner completed={completed} total={today.length} day={day} available={available} /></div>
      <StyleDivider wrapperClassName="col-span-12" />
      <div className="col-span-12 min-w-0 bg-background lg:col-span-7">{error ? <div className="p-6"><Message error>{text("Chưa tải được tiến độ công việc. Dùng nút làm mới để thử lại.", "Could not load priority progress. Use refresh to retry.")}</Message></div> : !available ? <div className="p-6"><Message>{text("Đang tải tiến độ…", "Loading progress…")}</Message></div> : <TotalSales chartData={activity} period={period} onPeriodChange={setPeriod} />}</div>
      <div className="col-span-12 min-w-0 lg:col-span-5"><FocusOverview available={available} values={[today.filter(item => item.category === "work").length, today.filter(item => item.category === "personal").length, today.filter(item => item.category === "learning").length, completed]} /></div>
      <StyleDivider wrapperClassName="col-span-12" />
      <PersonalMetrics waiting={available ? items.filter(item => item.date < day && !item.done).length : null} upcoming={calendarLoading || calendarError || !day ? null : upcomingEvents(calendar?.events ?? [], day, now).length} notes={notesLoading || notesError ? null : notes.filter(note => !note.deleted).length} />
      <StyleDivider wrapperClassName="col-span-12" />
      <section id="today-priorities" className="col-span-12 min-w-0 scroll-mt-4 bg-background lg:col-span-7" aria-label={text("Ưu tiên hôm nay", "Today’s priorities")}><Priorities day={day} /></section>
      <section id="upcoming-agenda" className="col-span-12 min-w-0 scroll-mt-4 bg-background lg:col-span-5" aria-label={text("Lịch sắp tới", "Coming up")}><Agenda day={day} now={now} /></section>
      <StyleDivider wrapperClassName="col-span-12" />
      <section className="col-span-12 min-w-0 bg-background lg:col-span-7" aria-label={text("Ghi chú gần đây", "Recent notes")}><RecentNotes /></section>
      <section id="quick-note" className="col-span-12 min-w-0 scroll-mt-4 bg-background lg:col-span-5" aria-label={text("Ghi nhanh", "Quick capture")}><QuickNote /></section>
    </StyleAwareWrapper>
  </div>;
}
export default function TodayHome() {
  return <TodayProvider><NotesProvider><Workspace /></NotesProvider></TodayProvider>;
}

export function TodayShortcuts() {
  const { text } = useTodayLocale();
  return (
    <nav aria-label={text("Góc quen thuộc", "Your usual places")} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{[
      { href: "/developer", icon: Code2, title: "Developer", detail: text("Trở lại góc làm việc", "Back to your workspace") },
      { href: "/apps/calendar", icon: CalendarDays, title: text("Lịch & kế hoạch", "Calendar & plans"), detail: text("Sắp xếp tuần của mình", "Make room for your week") },
      { href: "/apps/tickets", icon: BookOpen, title: text("Học mỗi ngày", "Daily learning"), detail: text("Mỗi ngày một chút", "A little every day") },
      { href: "/developer/feed", icon: BookOpen, title: text("Bảng tin developer", "Developer feed"), detail: text("Đọc có chọn lọc thôi nha", "A little selective reading") },
    ].map(item => <Link key={item.href} href={item.href} className="flex min-w-0 items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"><item.icon className="size-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></Link>)}</nav>
  );
}
