"use client";

import type { ComponentProps, ReactNode } from "react";
import { Info, MousePointer2 } from "lucide-react";
import { ChartTooltipContent } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFinanceLocale } from "./locale";
import type { FinanceTone } from "./appearance";

export type FinanceSeries = {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
};
export type ChartDetail = {
  label: string;
  value: ReactNode;
  tone?: FinanceTone;
};

export function SeriesControl({
  series,
  visible,
  onChange,
}: {
  series: FinanceSeries[];
  visible: string[];
  onChange: (keys: string[]) => void;
}) {
  const { text } = useFinanceLocale();
  return (
    <ToggleGroup
      multiple
      variant="default"
      size="sm"
      aria-label={text("Chuỗi dữ liệu hiển thị")}
      className="max-w-full flex-wrap"
      value={visible}
      onValueChange={(values) => {
        if (values.length) onChange(values.map(String));
      }}
    >
      {series.map((s) => (
        <ToggleGroupItem key={s.key} value={s.key}>
          <span
            aria-hidden="true"
            className="finance-series-mark"
            data-dashed={s.dashed}
            style={{ color: s.color }}
          />
          {s.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function ChartHelp({ children }: { children: string }) {
  const { text } = useFinanceLocale();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={text("Cách đọc biểu đồ")}
          />
        }
      >
        <Info />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

export function ChartHint({ children }: { children?: ReactNode }) {
  const { text } = useFinanceLocale();
  return (
    <p className="finance-chart-hint">
      <MousePointer2 aria-hidden="true" />
      {children ?? text("Di chuột hoặc chạm vào biểu đồ để đọc từng mốc.")}
    </p>
  );
}

type TooltipProps = ComponentProps<typeof ChartTooltipContent>;
export function FinanceChartTooltip({
  series,
  details,
  ...props
}: TooltipProps & {
  series: FinanceSeries[];
  details?: (row: Record<string, unknown>) => ChartDetail[];
}) {
  const { money } = useFinanceLocale();
  const raw: unknown = props.payload?.[0]?.payload;
  const extra =
    details && raw && typeof raw === "object"
      ? details(raw as Record<string, unknown>)
      : [];
  const shown = props.payload?.filter((p) => p.type !== "none") ?? [];
  return (
    <ChartTooltipContent
      {...props}
      formatter={(value, name, item, index) => {
        const config = series.find(
          (s) => s.key === String(item.dataKey ?? name),
        );
        return (
          <div className="finance-tooltip-group">
            <div className="finance-tooltip-row">
              <span className="flex items-center gap-2">
                <i
                  className="finance-series-mark"
                  style={{ color: config?.color ?? item.color }}
                />
                {config?.label ?? name}
              </span>
              <strong className="tabular-nums">{money(Number(value))}</strong>
            </div>
            {index === shown.length - 1 && extra.length > 0 && (
              <>
                <Separator />
                {extra.map((r) => (
                  <div className="finance-tooltip-row" key={r.label}>
                    <span className="text-muted-foreground">{r.label}</span>
                    <strong
                      data-finance-value
                      data-finance-tone={r.tone}
                      className="tabular-nums"
                    >
                      {r.value}
                    </strong>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      }}
    />
  );
}
