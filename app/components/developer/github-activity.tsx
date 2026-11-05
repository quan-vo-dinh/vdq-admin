"use client";

import { useState } from "react";
import { Activity, GitBranch, GitCommitHorizontal, GitMerge, GitPullRequest, MessageSquare, Search } from "lucide-react";
import { useDeveloper } from "@/app/context/developer-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type GitHubActivityKind } from "@/lib/developer/github-activity-demo";
import { vietnamDate, type Activity as GitHubActivity } from "@/lib/developer/live/types";
import { cn } from "@/lib/utils";
import { Choice, NoResults, useDeveloperLocale } from "./shared";

const eventStyles = {
  commit: { icon: GitCommitHorizontal, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  opened: { icon: GitPullRequest, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  merged: { icon: GitMerge, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  review: { icon: MessageSquare, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export function GitHubActivityDialog() {
  const { text } = useDeveloperLocale();
  const { activities } = useDeveloper();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("2000-01-01");
  const days = Array.from({length:7},(_,index)=>new Date(Date.parse(`${today}T12:00:00Z`)-index*86400000).toISOString().slice(0,10));
  const snapshot = open ? { days, events: activities.filter(event=>event.date>=days[6]&&event.date<=days[0]) } : null;
  return (
    <Dialog open={snapshot !== null} onOpenChange={(value)=>{ if(value) setToday(vietnamDate()); setOpen(value); }}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Activity data-icon="inline-start" />
        {text("Hoạt động GitHub · 7 ngày", "GitHub activity · 7 days")}
      </DialogTrigger>
      <DialogContent size="lg" className="max-h-[85dvh] gap-5 sm:p-6" closeLabel={text("Đóng", "Close")}>
        {snapshot && <ActivityContent snapshot={snapshot} />}
      </DialogContent>
    </Dialog>
  );
}

function ActivityContent({ snapshot }: { snapshot: { days: string[]; events: GitHubActivity[] } }) {
  const { data } = useDeveloper();
  const { text, language } = useDeveloperLocale();
  const [account, setAccount] = useState("all");
  const [organization, setOrganization] = useState("all");
  const [repo, setRepo] = useState("all");
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const labels: Record<GitHubActivityKind, string> = {
    commit: text("Commit", "Commits"),
    opened: text("Mở PR", "PRs opened"),
    merged: text("Merge PR", "PRs merged"),
    review: text("Review PR", "PR reviews"),
  };
  const accountName = (id: string) => data.sources.find((source) => source.id === id)?.name ?? id;
  const accounts = [...new Set(snapshot.events.map((event) => event.sourceId))];
  const organizations = [...new Set(snapshot.events.map((event) => event.repo.split("/")[0]))].sort();
  const repos = [...new Set(snapshot.events.filter((event) => organization === "all" || event.repo.split("/")[0] === organization).map((event) => event.repo))].sort();
  const rows = snapshot.events.filter((event) =>
    (account === "all" || event.sourceId === account) &&
    (organization === "all" || event.repo.split("/")[0] === organization) &&
    (repo === "all" || event.repo === repo) &&
    (kind === "all" || event.kind === kind) &&
    `${event.repo} ${event.title}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const dateLabel = (date: string) => new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${date}T12:00:00+07:00`));
  const reviewLabels = {
    approved: text("Đã chấp thuận", "Approved"),
    changes_requested: text("Yêu cầu chỉnh sửa", "Changes requested"),
    commented: text("Đã nhận xét", "Commented"),
  };
  const detail = (event: GitHubActivity) => {
    switch (event.kind) {
      case "commit": return `${event.sha} · ${event.branch}`;
      case "opened": return `#${event.pr} · ${event.branch} → ${event.target}`;
      case "merged": return `#${event.pr} → ${event.target}`;
      case "review": return `#${event.pr} · ${reviewLabels[event.result]}`;
    }
  };
  const hasFilters = account !== "all" || organization !== "all" || repo !== "all" || kind !== "all" || query !== "";
  return (
    <>
      <DialogHeader className="pr-7">
        <div className="flex flex-wrap items-center gap-2">
          <DialogTitle>{text("Hoạt động GitHub", "GitHub activity")}</DialogTitle>
        </div>
        <DialogDescription>
          {dateLabel(snapshot.days[6])} – {dateLabel(snapshot.days[0])} · {text("Giờ Việt Nam (UTC+7)", "Vietnam time (UTC+7)")}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-live="polite">
        {(Object.keys(labels) as GitHubActivityKind[]).map((type) => {
          const { icon: Icon, color } = eventStyles[type];
          return <div key={type} className="rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className={cn("size-4 shrink-0", color)} />{labels[type]}</div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{rows.filter((event) => event.kind === type).length}</p>
          </div>;
        })}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 [&_[data-slot=select-trigger]]:w-full [&_[data-slot=select-trigger]]:min-w-0">
        <Field className="min-w-0"><FieldLabel>{text("Tài khoản", "Account")}</FieldLabel>
          <Choice label={text("Tài khoản", "Account")} value={account} onChange={setAccount} items={[{ value: "all", label: text("Mọi tài khoản", "All accounts") }, ...accounts.map((value) => ({ value, label: accountName(value) }))]} />
        </Field>
        <Field className="min-w-0"><FieldLabel>{text("Tổ chức / chủ sở hữu", "Organization / owner")}</FieldLabel>
          <Choice label={text("Tổ chức / chủ sở hữu", "Organization / owner")} value={organization} onChange={(value) => { setOrganization(value); setRepo("all"); }} items={[{ value: "all", label: text("Mọi tổ chức / chủ sở hữu", "All organizations / owners") }, ...organizations.map((value) => ({ value, label: value }))]} />
        </Field>
        <Field className="min-w-0"><FieldLabel>Repository</FieldLabel>
          <Choice label="Repository" value={repo} onChange={setRepo} items={[{ value: "all", label: text("Mọi repository", "All repositories") }, ...repos.map((value) => ({ value, label: value }))]} />
        </Field>
        <Field className="min-w-0"><FieldLabel>{text("Loại hoạt động", "Activity type")}</FieldLabel>
          <Choice label={text("Loại hoạt động", "Activity type")} value={kind} onChange={setKind} items={[{ value: "all", label: text("Mọi hoạt động", "All activity") }, ...Object.entries(labels).map(([value, label]) => ({ value, label }))]} />
        </Field>
        <Field className="sm:col-span-2"><FieldLabel htmlFor="github-activity-search">{text("Tìm hoạt động", "Search activity")}</FieldLabel>
          <div className="relative"><Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" /><Input id="github-activity-search" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text("Tìm repository, commit hoặc tiêu đề PR…", "Search repository, commit or PR title…")} /></div>
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-xs text-muted-foreground" aria-live="polite">
        <span>{rows.length} {text("hoạt động", "activities")} · {new Set(rows.map((event) => event.repo)).size} repositories</span>
        {hasFilters && <Button size="sm" variant="ghost" onClick={() => { setAccount("all"); setOrganization("all"); setRepo("all"); setKind("all"); setQuery(""); }}>{text("Xóa bộ lọc", "Clear filters")}</Button>}
      </div>
      {rows.length === 0 ? <NoResults /> : <div className="min-w-0 space-y-6">
        {snapshot.days.map((day, index) => {
          const events = rows.filter((event) => event.date === day);
          const repositories = [...new Set(events.map((event) => event.repo))];
          return <section key={day} aria-label={dateLabel(day)} className="min-w-0">
            <h3 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
              {index === 0 ? text("Hôm nay", "Today") : index === 1 ? text("Hôm qua", "Yesterday") : dateLabel(day)}
              {index < 2 && <span className="text-xs font-normal text-muted-foreground">{dateLabel(day)}</span>}
              <Badge variant="outline">{events.length}</Badge>
            </h3>
            {events.length === 0 && <p className="text-xs text-muted-foreground">{text("Không có hoạt động phù hợp trong ngày này.", "No matching activity on this day.")}</p>}
            <div className="space-y-3">{repositories.map((repository) => <div key={repository} className="min-w-0 overflow-hidden rounded-xl border">
              <h4 className="flex items-start gap-2 border-b bg-muted/30 px-3 py-2 text-xs font-semibold"><GitBranch className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 break-all">{repository}</span></h4>
              <ul className="divide-y">{events.filter((event) => event.repo === repository).map((event) => {
                const { icon: Icon, color } = eventStyles[event.kind];
                return <li key={event.id} className="flex min-w-0 gap-3 p-3">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", color)}><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><span className="font-medium">{labels[event.kind]}</span><time className="text-muted-foreground" dateTime={`${event.date}T${event.time}:00+07:00`}>{event.time}</time></div>
                    <a href={event.url} target="_blank" rel="noreferrer" className="block text-sm font-medium hover:underline [overflow-wrap:anywhere]">{event.title}</a>
                    <p className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{detail(event)}</p>
                    <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{event.actor} · {accountName(event.sourceId)}</p>
                  </div>
                </li>;
              })}</ul>
            </div>)}</div>
          </section>;
        })}
      </div>}
    </>
  );
}
