"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { Layers3 } from "lucide-react";
import PieChart03 from "@/components/shadcn-dashboard/pie-chart/pie-chart-03";
import { useDeveloper } from "@/app/context/developer-context";
import { selectSessions, tokens } from "@/lib/developer/model";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "./brand-icon";
import { useDeveloperLocale } from "./shared";

export function UsageAllowances() {
  const { data, days } = useDeveloper();
  const { text, number } = useDeveloperLocale();
  const sessions = selectSessions(data, days);
  const total = tokens(sessions);
  const composition = (["input", "output", "cache"] as const).map((key, index) => {
    const value = sessions.reduce((sum, session) => sum + session[key], 0);
    return {
      key, label: key === "cache" ? "Cache" : key === "input" ? "Input" : "Output",
      remaining: total ? Math.round(value / total * 1000) / 10 : 0,
      color: `var(--chart-${index + 1})`,
      detail: `${number(value)} tokens`,
    };
  });
  return <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
    {data.sources.filter(s => s.subscription).map(source => {
      const subscription = source.subscription!;
      const brand = source.provider === "Codex" ? "codex" : "claude";
      const color = brand === "codex" ? "#3B82F6" : "#D97757";
      const weeklyColor = `color-mix(in srgb, ${color} 65%, var(--foreground))`;
      const rings = [
        { key: "fiveHour", label: text("Còn · 5h", "Left · 5h"), remaining: subscription.fiveHourRemaining, color },
        { key: "week", label: text("Tuần", "Week"), remaining: subscription.weeklyRemaining, color: weeklyColor },
      ];
      const name = source.id === "codex-personal" ? "Codex · Personal" : source.id === "codex-work" ? "Codex · Work" : "Claude Code";
      return <div key={source.id} className="flex min-w-0 flex-col items-center justify-center gap-1 bg-background p-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant="outline">{subscription.plan}</Badge>
        </div>
        <PieChart03 size={80} rings={rings} icon={<BrandIcon brand={brand} />} title={`${name} · ${subscription.plan}`} />
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
          {rings.map(ring => <span key={ring.key} className="flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ background: ring.color }} />
            {ring.label}: <strong><NumberTicker value={ring.remaining} />%</strong>
          </span>)}
        </div>
      </div>;
    })}
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 bg-background p-3">
      <span className="text-sm font-medium">{text("Phân bổ token", "Token breakdown")}</span>
      <PieChart03 size={80} rings={composition} icon={<Layers3 className="size-6 text-primary" />} title={text("Phân bổ token", "Token breakdown")} />
      <span className="text-xs tabular-nums"><strong><NumberTicker value={number(total)} /></strong> tokens · <NumberTicker value={sessions.length} /> {text("phiên", "sessions")}</span>
      <span className="sr-only">{days} {text("ngày", "days")}</span>
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {composition.map(ring => <span key={ring.key} className="flex items-center gap-1"><span className="size-2 rounded-full" style={{ background: ring.color }} />{ring.label}</span>)}
      </div>
    </div>
  </div>;
}
