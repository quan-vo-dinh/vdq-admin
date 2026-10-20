"use client";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, CheckCheck, CircleUserRound, Code2, LayoutGrid, NotebookText, Target } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { Button } from "@/components/ui/button";
import { useTodayLocale } from "./shared";
export function TodayBanner({ completed, total, day, available }: { completed: number; total: number; day: string; available: boolean }) {
  const { text, date } = useTodayLocale();
  return <DashboardCard className="py-3"><CardContent className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-col gap-1"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-chart-2" /><p className="text-sm font-medium">{text("Hôm nay", "Today")}</p><span className="size-1 rounded-full bg-border" /><p className="text-sm text-muted-foreground">{day ? date(`${day}T12:00:00+07:00`, { day: "numeric", month: "short", year: "numeric" }) : "…"}</p></div><p className="text-sm">{!available ? text("Đang đồng bộ kế hoạch của bạn…", "Syncing your plans…") : total === 0 ? text("Chọn ba việc quan trọng. Làm từng việc một thôi nha.", "Pick three priorities. One thing at a time.") : text(`Đã hoàn thành ${completed}/${total} việc ưu tiên hôm nay.`, `${completed}/${total} priorities completed today.`)}</p></div>
    <Button variant="outline" className="h-auto rounded-md px-4 py-2" nativeButton={false} render={<Link href="#today-priorities" />}>{text("Xem việc hôm nay", "Today’s priorities")}<ArrowRight /></Button>
  </CardContent></DashboardCard>;
}
export function FocusOverview({ values, available }: { values: [number, number, number, number]; available: boolean }) {
  const { text } = useTodayLocale();
  const entries = [
    { title: text("Công việc", "Work"), icon: Code2, value: values[0] },
    { title: text("Cá nhân", "Personal"), icon: CircleUserRound, value: values[1] },
    { title: text("Học tập", "Learning"), icon: BookOpen, value: values[2] },
    { title: text("Đã hoàn thành", "Completed"), icon: CheckCheck, value: values[3] },
  ];
  return <DashboardCard className="flex flex-col gap-0! pb-0!"><CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2"><LayoutGrid size={16} className="text-muted-foreground" />{text("Hôm nay tập trung gì?", "Today’s focus")}</CardTitle></CardHeader><CardContent className="h-full! px-0!"><div className="grid h-full min-h-64 grid-cols-2 gap-px bg-border">{entries.map(entry => <div key={entry.title} className="flex flex-col justify-between gap-6 bg-background p-6"><div className="w-fit rounded-md border border-border p-2"><entry.icon size={16} /></div><div><p className="text-2xl font-semibold">{available ? entry.value : "—"}</p><p className="text-sm">{entry.title}</p></div></div>)}</div></CardContent></DashboardCard>;
}
export function PersonalMetrics({ waiting, upcoming, notes }: { waiting: number | null; upcoming: number | null; notes: number | null }) {
  const { text } = useTodayLocale();
  const entries = [
    { title: text("Việc còn chờ từ hôm trước", "Unfinished from earlier days"), value: waiting, icon: Target, href: "#today-priorities", action: text("Sắp xếp lại", "Replan") },
    { title: text("Lịch sắp tới · 7 ngày", "Coming up · 7 days"), value: upcoming, icon: CalendarDays, href: "#upcoming-agenda", action: text("Xem kế hoạch", "See plans") },
    { title: text("Ghi chú đang lưu", "Saved notes"), value: notes, icon: NotebookText, href: "/apps/notes", action: text("Mở ghi chú", "Open notes") },
  ];
  return <>{entries.map(entry => <div key={entry.href} className="col-span-12 lg:col-span-4"><DashboardCard className="py-6"><CardContent className="px-6"><div className="flex w-full flex-col items-start gap-4"><div className="flex w-full items-center justify-between gap-3"><div className="flex flex-col gap-1"><p className="text-sm">{entry.title}</p><p className="text-2xl font-semibold">{entry.value ?? "—"}</p></div><div className="w-fit rounded-md border border-border p-2.5"><entry.icon size={16} /></div></div><Button variant="outline" className="h-auto rounded-md px-4 py-2" nativeButton={false} render={<Link href={entry.href} />}>{entry.action}<ArrowRight size={18} /></Button></div></CardContent></DashboardCard></div>)}</>;
}
