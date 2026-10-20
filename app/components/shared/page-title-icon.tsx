"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ChartNoAxesCombined, Code2, FilePenLine, LayoutDashboard, ListTodo, NotebookPen, Plug, ReceiptText, Rss, ScanFace, ShieldCheck, Sparkles, Target, TrendingUp, Wallet, type LucideIcon } from "lucide-react";

// Specific routes precede section fallbacks. Icons decorate the visible title.
const routeIcons: [string, LucideIcon][] = [
  ["/developer/connections", Plug], ["/developer/feed", Rss],
  ["/developer/ai", Sparkles], ["/developer", Code2],
  ["/finance/transactions", ReceiptText], ["/finance/budgets", ChartNoAxesCombined],
  ["/finance/goals", Target], ["/finance/cash-flow", TrendingUp], ["/finance", Wallet],
  ["/apps/calendar", CalendarDays], ["/apps/notes", NotebookPen],
  ["/apps/tickets", BookOpen], ["/apps/blog/create", FilePenLine],
  ["/apps/blog/edit", FilePenLine], ["/apps/blog", BookOpen],
  ["/pages/user-profile", ScanFace], ["/pages/form", FilePenLine],
  ["/pages/tables", ListTodo], ["/auth", ShieldCheck],
];
function RouteIcon() {
  const path = usePathname();
  const Icon = routeIcons.find(([route]) => path === route || path.startsWith(`${route}/`))?.[1] ?? LayoutDashboard;
  return <Icon className="size-6 shrink-0 text-foreground" aria-hidden="true" />;
}
export function PageTitleIcon() {
  return <Suspense fallback={null}><RouteIcon /></Suspense>;
}
