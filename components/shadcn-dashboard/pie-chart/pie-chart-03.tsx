"use client";

// Adapted from @shadcn-dashboard/pie-chart-03: concentric percentage rings.
import type { ReactNode } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

type Ring = { key: string; label: string; remaining: number; color: string; detail?: string };
export default function PieChart03({ rings, icon, title, size = 112 }: {
  rings: Ring[];
  icon: ReactNode;
  title: string;
  size?: number;
}) {
  const config = Object.fromEntries(rings.map(r => [r.key, { label: r.label, color: r.color }]));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ChartContainer config={config} className="size-full" style={{ width: size, height: size, aspectRatio: 1 }} aria-label={title}>
        <PieChart accessibilityLayer>
          <ChartTooltip cursor={false} content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const key = payload[0].payload.ringKey;
            const ring = rings.find(r => r.key === key);
            if (!ring) return null;
            return <div className="flex min-w-48 items-center gap-3 rounded-lg border bg-background p-3 text-xs shadow-md">
              {icon}
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{title}</span>
                <span>{ring.label}: <strong>{ring.remaining}%</strong></span>
                {ring.detail && <span>{ring.detail}</span>}
              </div>
            </div>;
          }} />
          {rings.map((ring, index) => (
            <Pie key={ring.key}
              data={[
                { value: ring.remaining, ringKey: ring.key, name: ring.label },
                { value: 100 - ring.remaining, ringKey: ring.key, name: ring.label },
              ]}
              dataKey="value" nameKey="name"
              innerRadius={["76%", "51%", "26%"][index]}
              outerRadius={["96%", "69%", "44%"][index]}
              startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}
            >
              <Cell fill={ring.color} />
              <Cell fill={ring.color} fillOpacity={0.14} />
            </Pie>
          ))}
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{icon}</div>
    </div>
  );
}
