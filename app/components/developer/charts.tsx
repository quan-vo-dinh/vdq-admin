"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarRadiusAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  trend,
  type Session,
  type Source,
  type Contribution,
} from "@/lib/developer/model";
import { NoResults, useDeveloperLocale } from "./shared";
import { BrandIcon } from "./brand-icon";

function CodexTooltipIcon() {
  return <BrandIcon brand="codex" className="size-5" />;
}
function ClaudeTooltipIcon() {
  return <BrandIcon brand="claude" className="size-5" />;
}
const config = {
  Codex: { label: "Codex", color: "#3B82F6", icon: CodexTooltipIcon },
  Claude: { label: "Claude Code", color: "#D97757", icon: ClaudeTooltipIcon },
  input: { label: "Input", color: "var(--chart-1)" },
  output: { label: "Output", color: "var(--chart-2)" },
  cache: { label: "Cache", color: "var(--chart-3)" },
};
export function UsageTrend({ rows, salesStyle = false }: { rows: Session[]; salesStyle?: boolean }) {
  const { text } = useDeveloperLocale();
  if (!rows.length) return <NoResults />;
  return (
    <ChartContainer
      config={config}
      className="developer-chart h-64 w-full"
      style={salesStyle ? { height: 215 } : undefined}
      aria-label={text(
        "Token theo ngày và nhà cung cấp",
        "Daily tokens by provider",
      )}
    >
      <LineChart
        accessibilityLayer
        data={trend(rows)}
        margin={salesStyle ? { top: 8, right: 4, bottom: 0, left: -10 } : { left: 5, right: 12 }}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray={salesStyle ? "4 4" : undefined} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => String(v).slice(5)}
          tickLine={false}
          axisLine={false}
          minTickGap={25}
          tickMargin={10}
        />
        <YAxis
          tickFormatter={(v) => `${Number(v) / 1000}k`}
          width={salesStyle ? 60 : 45}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip cursor={salesStyle ? { stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" } : undefined} content={<ChartTooltipContent />} />
        {!salesStyle && <ChartLegend content={<ChartLegendContent />} />}
        <Line
          isAnimationActive={false}
          type={salesStyle ? "linear" : "monotone"}
          dataKey="Codex"
          stroke="var(--color-Codex)"
          strokeWidth={salesStyle ? 1.5 : 2}
          dot={false}
        />
        <Line
          isAnimationActive={false}
          type={salesStyle ? "linear" : "monotone"}
          strokeDasharray={salesStyle ? "4 4" : undefined}
          dataKey="Claude"
          stroke="var(--color-Claude)"
          strokeWidth={salesStyle ? 1.5 : 2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
export function TokenComposition({ rows }: { rows: Session[] }) {
  const { text, number } = useDeveloperLocale();
  if (!rows.length) return <NoResults />;
  const data = (["input", "output", "cache"] as const).map((key) => ({
    name: key,
    value: rows.reduce((sum, s) => sum + s[key], 0),
    fill: `var(--color-${key})`,
  }));
  return (
    <div>
      <ChartContainer
        config={config}
        className="developer-donut mx-auto h-56 w-full"
        aria-label={text("Phân bổ token", "Token composition")}
      >
        <PieChart accessibilityLayer>
          <Pie
            isAnimationActive={false}
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
          />
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.name}>
            {config[d.name as keyof typeof config].label}: <NumberTicker value={number(d.value)} />
          </span>
        ))}
      </div>
    </div>
  );
}
export function QuotaRing({ source }: { source: Source }) {
  const { text } = useDeveloperLocale();
  if (source.quota === null)
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        {text("Chưa có dữ liệu quota", "Quota unavailable")}
      </div>
    );
  return (
    <div className="relative mx-auto size-32">
      <ChartContainer
        config={{
          usage: { label: text("Đã dùng", "Used"), color: "var(--chart-1)" },
        }}
        className="developer-quota-chart size-32"
        aria-label={`${source.name}: $<NumberTicker value={source.quota ?? "—"} />%`}
      >
        <RadialBarChart
          data={[{ usage: source.quota, fill: "var(--color-usage)" }]}
          innerRadius="75%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="usage"
            background
            cornerRadius={8}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums">
        <NumberTicker value={source.quota ?? "—"} />%
      </div>
    </div>
  );
}
export function ActivityRadar({ rows }: { rows: Contribution[] }) {
  const { text } = useDeveloperLocale();
  const data = (["commits", "prs", "issues", "reviews"] as const).map(
    (key) => ({
      type: key,
      personal: rows
        .filter((r) => r.sourceId === "github-personal")
        .reduce((n, r) => n + r[key], 0),
      work: rows
        .filter((r) => r.sourceId === "github-work")
        .reduce((n, r) => n + r[key], 0),
    }),
  );
  return (
    <ChartContainer
      config={{
        personal: {
          label: text("Cá nhân", "Personal"),
          color: "var(--chart-1)",
        },
        work: { label: text("Công việc", "Work"), color: "var(--chart-2)" },
      }}
      className="developer-chart h-64 w-full"
    >
      <RadarChart accessibilityLayer data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="type" />
        <PolarRadiusAxis tick={false} />
        <Radar
          isAnimationActive={false}
          dataKey="personal"
          stroke="var(--color-personal)"
          fill="var(--color-personal)"
          fillOpacity={0.18}
        />
        <Radar
          isAnimationActive={false}
          dataKey="work"
          stroke="var(--color-work)"
          fill="var(--color-work)"
          fillOpacity={0.12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  );
}
