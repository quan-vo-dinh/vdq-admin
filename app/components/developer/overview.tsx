"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GitPullRequest,
  Inbox,
  Activity,
  Sparkles,
  FileDiff,
} from "lucide-react";
import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeveloper } from "@/app/context/developer-context";
import {
  selectSessions,
  selectContributions,
  codeChanges,
  tokens,
} from "@/lib/developer/model";
import { Choice, useDeveloperLocale } from "./shared";
import { modelName } from "@/lib/developer/models";
import { UsageTrend } from "./charts";
import { BrandIcon } from "./brand-icon";
import { GitHubAnalytics } from "./github";
import { DeveloperInbox } from "./inbox";
import { UsageAllowances } from "./usage-allowances";
function ActivitySection() {
  const { text } = useDeveloperLocale();
  const { data } = useDeveloper();
  const unread = data.notifications.filter((n) => !n.read).length;
  return (
    <div className="grid min-w-0 grid-cols-1 divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
      <section className="min-w-0" aria-labelledby="contributions-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <h2 id="contributions-heading" className="flex items-center gap-2 font-semibold">
            <BrandIcon brand="github" /> Contributions
          </h2>
          <span className="text-xs text-muted-foreground">
            {text("GitHub cá nhân & công việc", "Personal & work GitHub")}
          </span>
        </div>
        <GitHubAnalytics />
      </section>
      <section id="inbox" className="min-w-0 scroll-mt-20" aria-labelledby="inbox-heading">
        <h2 id="inbox-heading" className="flex items-center gap-2 px-6 pt-5 font-semibold">
          <Inbox /> Inbox <Badge variant="secondary">{unread}</Badge>
        </h2>
        <DeveloperInbox />
      </section>
    </div>
  );
}
export function Overview() {
  const { data, days, setDays } = useDeveloper();
  const { text, number } = useDeveloperLocale();
  const [provider, setProvider] = useState("all");
  const [source, setSource] = useState("all");
  const [model, setModel] = useState("all");
  const accounts = data.sources.filter(s => s.provider !== "GitHub" && (provider === "all" || s.provider === provider));
  const models = [...new Set(selectSessions(data, days, source, provider).map(s => s.model))];
  const sessions = selectSessions(data, days, source, provider, model);
  const contributions = selectContributions(data, days);
  const changes = codeChanges(data, 30);
  const metrics = [
    {
      title: "Contributions",
      value: contributions.reduce((n, r) => n + r.count, 0),
      sub: `${days} ${text("ngày · hai tài khoản", "days · two accounts")}`,
      badge: `${days} ${text("ngày", "days")}`,
      tinted: true,
      icon: Activity,
    },
    {
      title: text("Pull requests đã mở", "Pull requests opened"),
      value: contributions.reduce((n, r) => n + r.prs, 0),
      sub: `${days} ${text("ngày · không đồng nghĩa đã merge", "days · does not imply merged")}`,
      badge: `${days} ${text("ngày", "days")}`,
      tinted: false,
      icon: GitPullRequest,
    },
    {
      title: text("Dòng code thay đổi", "Lines changed"),
      value: changes.total,
      sub: text("Số dòng thêm và xóa trong 30 ngày qua", "Lines added and deleted over the past 30 days"),
      badge: text("30 ngày", "30 days"),
      changes,
      tinted: true,
      icon: FileDiff,
    },
  ];
  return (
    <StyleAwareWrapper
      lyraClassName="developer-board grid grid-cols-12 gap-px bg-border p-px"
      defaultClassName="grid grid-cols-12 gap-4"
    >
      <div className="col-span-12 self-start lg:col-span-7">
        <DashboardCard className="flex flex-col gap-0! pt-0!">
          <CardHeader className="flex h-12 flex-row flex-nowrap items-center justify-between gap-2 border-b border-border px-4 py-1!">
            <CardTitle className="flex shrink-0 items-center gap-2">
              <Sparkles />
              {text("Tổng quan sử dụng AI", "AI usage overview")}
            </CardTitle>
            <CardAction className="col-auto row-auto flex min-w-0 items-center gap-2 overflow-x-auto self-auto [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:max-w-32 [&_[data-slot=select-trigger]]:text-xs">
            <div className="flex shrink-0 items-center gap-2">
              <Choice label={text("Thời gian chart", "Chart period")} value={String(days)} onChange={v => { setDays(Number(v)); setModel("all"); }} items={[7, 14, 30].map(value => ({ value: String(value), label: `${value} ${text("ngày", "days")}` }))} />
              <Choice label={text("Hãng AI", "AI provider")} value={provider} onChange={v => { setProvider(v); setSource("all"); setModel("all"); }} items={[
                { value: "all", label: text("Mọi hãng", "All providers") },
                { value: "Codex", label: "Codex" }, { value: "Claude Code", label: "Claude Code" },
              ]} />
              <Choice label={text("Tài khoản AI", "AI account")} value={source} onChange={v => { setSource(v); setModel("all"); }} items={[
                { value: "all", label: text("Mọi tài khoản", "All accounts") },
                ...accounts.map(s => ({ value: s.id, label: s.name })),
              ]} />
              <Choice label="Model" value={model} onChange={setModel} items={[
                { value: "all", label: text("Mọi model", "All models") },
                ...[...new Set([...models, ...(model === "all" ? [] : [model])])].map(value => ({ value, label: modelName(value) })),
              ]} />
            </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/developer/ai" />}
                nativeButton={false}
              >
                {text("Chi tiết", "Details")}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-1">
              <span className="text-base font-normal leading-6">
                {text("Tổng token đã đốt", "Total observed tokens")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl font-semibold leading-8 tracking-[-0.3px] tabular-nums">
                  {number(tokens(sessions))}
                </span>
                <span className="text-sm text-muted-foreground">
                  tokens · {days} {text("ngày", "days")}
                </span>
              </div>
            </div>
            <UsageTrend rows={sessions} salesStyle />
          </CardContent>
        </DashboardCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DashboardCard className="gap-0 pt-0! pb-0">
          <CardHeader className="flex h-12 flex-row items-center border-b px-4 py-1!">
            <CardTitle>{text("Hạn mức sử dụng AI", "AI usage allowances")}</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <UsageAllowances />
          </CardContent>
        </DashboardCard>
      </div>
      <StyleDivider wrapperClassName="col-span-12" />
      {metrics.map((m) => (
        <div key={m.title} className="col-span-12 lg:col-span-4">
          <DashboardCard className="py-6">
            <CardContent className="flex flex-row justify-between px-6">
              <div className="flex w-full flex-col items-start gap-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-normal text-foreground">{m.title}</p>
                      {"changes" in m && <Badge variant="outline">{m.badge}</Badge>}
                    </div>
                    <div className="flex items-center gap-2" title={m.sub}>
                      <h3 className="text-2xl font-semibold tabular-nums">
                        {number(m.value)}
                      </h3>
                      {!("changes" in m) && <Badge
                        variant={m.tinted ? "default" : "outline"}
                        className={m.tinted ? "bg-chart-2/10! text-chart-2!" : undefined}
                      >
                        {m.badge}
                      </Badge>}
                    {"changes" in m && m.changes && (
                      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium tabular-nums">
                        <span className="text-success-foreground" aria-label={text(`${number(m.changes.additions)} dòng thêm`, `${number(m.changes.additions)} lines added`)}>+{number(m.changes.additions)}</span>
                        <span className="text-destructive" aria-label={text(`${number(m.changes.deletions)} dòng xóa`, `${number(m.changes.deletions)} lines deleted`)}>−{number(m.changes.deletions)}</span>
                      </span>
                    )}
                      <span className="sr-only">{m.sub}</span>
                    </div>

                  </div>
                  <div className="w-fit rounded-md border border-border p-2.5">
                    <m.icon size={16} />
                  </div>
                </div>
              </div>
            </CardContent>
          </DashboardCard>
        </div>
      ))}
      <StyleDivider wrapperClassName="col-span-12" />
      <div
        id="activity"
        className="col-span-12 min-w-0 scroll-mt-20 bg-background"
      >
        <ActivitySection />
      </div>
    </StyleAwareWrapper>
  );
}
