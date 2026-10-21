"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityPoint } from "@/lib/today/activity";
import { useTodayLocale } from "@/app/components/today/shared";
import { TrendingUp } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "../../shared/dashboard-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function useAnimatedNumber(target: number, duration = 450) {
  const [display, setDisplay] = useState(0);
  const currentRef = useRef(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = currentRef.current;
    const diff = target - from;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + diff * eased);
      currentRef.current = next;
      setDisplay(next);
      if (progress < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { currentRef.current = target; setDisplay(target); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return display;
}

function AnimatedValue({ value }: { value: number }) {
  const animated = useAnimatedNumber(value);
  return <>{animated.toLocaleString()}</>;
}

type TooltipItem = { name?: string; value?: number; color?: string; dataKey?: string; type?: string };
type ConfigEntry = { label?: string; color?: string };

function AnimatedTooltipContent({ active, payload, label, hideLabel = false, config }: {
  active?: boolean; payload?: TooltipItem[]; label?: string;
  hideLabel?: boolean; config?: Record<string, ConfigEntry>;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((item) => item.type !== "none" && item.value !== undefined);
  if (!items.length) return null;
  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      {!hideLabel && label && <div className="font-medium">{label}</div>}
      <div className="grid gap-1.5">
        {items.map((item, index) => (
          <div key={index} className="flex w-full items-center gap-2">
            <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{config?.[item.dataKey ?? ""]?.label ?? item.name}</span>
            <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
              <AnimatedValue value={item.value as number} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TotalSales({ chartData, period, onPeriodChange }: {
  chartData: ActivityPoint[];
  period: number;
  onPeriodChange: (days: number) => void;
}) {
  const { text, date } = useTodayLocale();
  const chartConfig = {
    completed: { label: text("Đã hoàn thành", "Completed"), color: "var(--color-primary)" },
    planned: { label: text("Đã lên kế hoạch", "Planned"), color: "color-mix(in srgb, var(--primary) 60%, transparent)" },
  } satisfies ChartConfig;
  const planned = chartData.reduce((total, point) => total + point.planned, 0);
  const completed = chartData.reduce((total, point) => total + point.completed, 0);
  const max = Math.max(3, ...chartData.map(point => point.planned));
  const visibleLabels = new Set(chartData.filter((_, i) => i % Math.max(1, Math.ceil(period / 7)) === 0 || i === chartData.length - 1).map(point => point.date));

  return (
    <DashboardCard className="flex flex-col gap-0!">
      {/* Header */}
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={16} className="text-muted-foreground" />
          {text("Nhịp làm việc của bin", "bin’s work rhythm")}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 flex flex-col gap-6">
        {/* Stats row + period selector */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="text-base font-normal text-foreground leading-6">{text("Việc ưu tiên đã hoàn thành", "Completed priorities")}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-semibold tracking-[-0.3px] text-foreground leading-8">
                {completed}/{planned}
              </span>
              <span className="text-sm font-medium text-chart-2">{planned ? `${Math.round(completed / planned * 100)}%` : "—"}</span>
              <span className="text-sm font-normal text-muted-foreground">{text(`trong ${period} ngày`, `in ${period} days`)}</span>
            </div>
          </div>

          <Select value={String(period)} onValueChange={(v) => v && onPeriodChange(Number(v))}>
            <SelectTrigger className="h-auto! w-fit text-sm font-medium text-foreground border-border shadow-[0px_1px_2px_rgba(0,0,0,0.05)] cursor-pointer gap-1.5 px-3">
              <SelectValue>{text(`${period} ngày gần đây`, `Last ${period} days`)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {[7, 30, 90].map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="cursor-pointer">
                  {text(`${opt} ngày gần đây`, `Last ${opt} days`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[215px]! w-full">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 4, bottom: 0, left: -10 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              tick={{ fontSize: 14, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => (visibleLabels.has(v) ? date(`${v}T12:00:00+07:00`, { day: "2-digit", month: "2-digit" }) : "")}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fontSize: 14, fill: "var(--muted-foreground)" }}
              ticks={Array.from({ length: max + 1 }, (_, i) => i)}
              domain={[0, max]}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={{
                stroke: "var(--border)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={<AnimatedTooltipContent config={chartConfig} />}
            />
            {/* Completed priorities — original solid line */}
            <Line
              dataKey="completed"
              type="linear"
              stroke="var(--color-primary)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 0 }}
              isAnimationActive
              animationBegin={0}
              animationDuration={700}
              animationEasing="ease-out"
            />
            {/* Planned priorities — original dashed line */}
            <Line
              dataKey="planned"
              type="linear"
              stroke="color-mix(in srgb, var(--primary) 60%, transparent)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: "color-mix(in srgb, var(--primary) 60%, transparent)", strokeWidth: 0 }}
              isAnimationActive
              animationBegin={120}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </LineChart>
        </ChartContainer>
        <p className="text-xs leading-relaxed text-muted-foreground">{text("Theo ngày được xếp việc và trạng thái hiện tại. Ngày chưa có việc hiển thị 0.", "By assigned day and current status. Days without priorities show zero.")}</p>
      </CardContent>
    </DashboardCard>
  );
}
