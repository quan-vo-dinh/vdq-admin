"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { useState } from "react";
import Link from "@/lib/platform/link";
import {
  ArrowRight,
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
import { selectSessions } from "@/lib/developer/model";
import { aggregateTotals } from "@/lib/developer/live/history-model";
import { modelName } from "@/lib/developer/models";
import { Choice, NoResults, useDeveloperLocale } from "./shared";
import { usageRows, usageTotal } from "@/lib/developer/codex/analytics";
import { CodexTrend } from "./codex-usage";
import { BrandIcon } from "./brand-icon";
import { GitHubAnalytics } from "./github";
import { DeveloperInbox } from "./inbox";
import { GitHubActivityDialog } from "./github-activity";
import { UsageAllowances } from "./usage-allowances";
function ActivitySection() {
  const { text } = useDeveloperLocale();
  const { data, githubAccount, setGithubAccount } = useDeveloper();
  const unread = data.notifications.filter((n) => !n.read).length;
  return (
    <div className="grid min-w-0 grid-cols-1 divide-y divide-border xl:grid-cols-2 xl:divide-x xl:divide-y-0">
      <section className="min-w-0" aria-labelledby="contributions-heading">
        <div className="flex items-center justify-between gap-3 px-6 pt-3">
          <h2
            id="contributions-heading"
            className="flex shrink-0 items-center gap-2 font-semibold"
          >
            <BrandIcon brand="github" /> Contributions
          </h2>
          <div className="min-w-0 max-w-60 [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:max-w-full">
            <Choice
              label={text("Tài khoản GitHub", "GitHub account")}
              value={githubAccount}
              onChange={setGithubAccount}
              items={[
                { value: "all", label: text("Mọi tài khoản", "All accounts") },
                ...data.sources.filter(s => s.provider === "GitHub").map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
        </div>
        <GitHubAnalytics />
      </section>
      <section
        id="inbox"
        className="min-w-0 scroll-mt-20"
        aria-labelledby="inbox-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
          <h2
            id="inbox-heading"
            className="flex items-center gap-2 font-semibold"
          >
            <Inbox /> Inbox <Badge variant="secondary">{unread}</Badge>
          </h2>
          <GitHubActivityDialog />
        </div>
        <DeveloperInbox />
      </section>
    </div>
  );
}
export function Overview() {
  const { data, days, setDays, githubAccount } = useDeveloper();
  const { text } = useDeveloperLocale();
  const [provider, setProvider] = useState("all");
  const [source, setSource] = useState("all");
  const [model, setModel] = useState("all");
  const accounts = data.sources.filter(s => s.provider !== "GitHub" && (provider === "all" || s.provider === provider));
  const models = [...new Set(selectSessions(data, days, source, provider).map(s => s.model))];
  const totalTokens = provider !== "Claude Code" && model === "all" ? usageTotal(usageRows(data, days, source)) : null;
  const githubIds = data.sources.filter(s => s.provider === "GitHub" && (githubAccount === "all" || s.id === githubAccount)).map(s => s.id);
  const periods = [
    { id: "all" as const, label: text("Từ trước đến nay", "All time") },
    { id: "year" as const, label: text("1 năm", "1 year") },
    { id: "month" as const, label: text("30 ngày", "30 days") },
  ].map(period => ({ ...period, totals: aggregateTotals(data.githubTotals ?? [], period.id, githubIds) }));
  const metrics = [
    { title: text("Dòng code thay đổi", "Lines changed"), key: "lines" as const, icon: FileDiff },
    { title: "Contributions", key: "contributions" as const, icon: Activity },
  ];
  const fullNumber = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
  return (
    <StyleAwareWrapper
      lyraClassName="developer-board grid grid-cols-12 gap-px bg-border p-px"
      defaultClassName="grid grid-cols-12 gap-4"
    >
      <div className="col-span-12 self-start lg:col-span-7">
        <DashboardCard className="flex flex-col gap-0! pt-0!">
          <CardHeader className="developer-chart-header flex h-12 flex-row flex-nowrap items-center justify-between gap-2 border-b border-border px-4 py-1!">
            <CardTitle className="flex shrink-0 items-center gap-2">
              <Sparkles />
              {text("Tổng quan sử dụng AI", "AI usage overview")}
            </CardTitle>
            <CardAction className="developer-chart-actions col-auto row-auto flex min-w-0 items-center gap-2 overflow-x-auto self-auto [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:max-w-32 [&_[data-slot=select-trigger]]:text-xs">
            <div className="developer-chart-filters flex shrink-0 items-center gap-2">
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
                  {totalTokens !== null ? (
                    <NumberTicker value={totalTokens} />
                  ) : (
                    "—"
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  tokens · {days} {text("ngày", "days")}
                </span>
              </div>
            </div>
            {provider !== "Claude Code" && model === "all" ? <CodexTrend source={source} days={days} /> : <NoResults />}
          </CardContent>
        </DashboardCard>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <DashboardCard className="gap-0 pt-0! pb-0">
          <CardHeader className="flex h-12 flex-row items-center border-b px-4 py-1!">
            <CardTitle>
              {text("Hạn mức sử dụng AI", "AI usage allowances")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <UsageAllowances />
          </CardContent>
        </DashboardCard>
      </div>
      <StyleDivider wrapperClassName="col-span-12" />
      <div className="col-span-12 grid min-w-0 grid-cols-6 gap-px bg-border">
      {metrics.map((m) => (
        <div key={m.key} className="col-span-6 min-w-0 lg:col-span-3">
          <DashboardCard className="h-full gap-0! py-3!">
            <CardContent className="flex flex-col gap-2 px-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">{m.title}</p>
                <div className="w-fit rounded-md border border-border p-1.5"><m.icon size={16} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3 divide-x">
                {periods.map(({ id, label, totals }) => {
                  const value = m.key === "lines" ? totals.additions + totals.deletions : totals[m.key];
                  const complete = totals.complete[m.key];
                  return (
                    <div key={id} className="flex min-w-0 flex-col items-start gap-2 pr-3 last:pr-0">
                      <Badge variant="outline" className="max-w-full whitespace-normal bg-chart-2/10! text-chart-2!">{label}</Badge>
                      <div className="min-w-0 tabular-nums" title={!complete ? text("Đang đồng bộ lịch sử, số hiện tại chưa đầy đủ", "History sync in progress; current count is incomplete") : undefined}>
                        <span className="break-words text-xl font-semibold 2xl:text-2xl">{!complete && value > 0 ? "≥ " : ""}{complete || value > 0 ? fullNumber(value) : "—"}</span>
                        {m.key === "lines" && (complete || value > 0) && (
                          <div className="mt-1 flex flex-wrap gap-x-2 text-sm">
                            <span className="text-success-foreground">+{fullNumber(totals.additions)}</span>
                            <span className="text-destructive">−{fullNumber(totals.deletions)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </DashboardCard>
        </div>
      ))}
      </div>
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
