"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { useLanguage } from "@/app/context/language-context";
import { dayKey } from "@/lib/today/model";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
const subscribe = (callback: () => void) => { const timer = setInterval(callback, 30_000); return () => clearInterval(timer); };
export function useTodayLocale() {
  const { language } = useLanguage();
  return { language, text: (vi: string, en: string) => language === "vi" ? vi : en,
    date: (value: string, options?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh", ...options }).format(new Date(value)) };
}
export function useTodayClock() {
  const day = useSyncExternalStore(subscribe, () => dayKey(), () => "");
  const minute = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 60_000), () => 0);
  return { day, now: minute * 60_000 };
}
export function Panel({ title, description, icon, action, children }: { title: string; description: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <Card className="h-full min-w-0 rounded-none! ring-0!">
    <CardHeader><CardTitle><span className="flex items-center gap-2">{icon}{title}</span></CardTitle><CardDescription>{description}</CardDescription>{action && <CardAction>{action}</CardAction>}</CardHeader>
    <CardContent>{children}</CardContent>
  </Card>;
}
export function Message({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p role={error ? "alert" : "status"} className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{children}</p>;
}
