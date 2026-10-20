"use client";

import { NumberTicker } from "./number-ticker";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import StyleAwareWrapper from "@/app/components/shared/StyleAwareWrapper";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FinanceIcon, FinanceProgress } from "./shared";
import type { FinanceTone } from "./appearance";
import { FinanceHeading } from "./heading";

export function FinanceBoard({ children }: { children: ReactNode }) {
  return (
    <StyleAwareWrapper
      lyraClassName="finance-board grid grid-cols-12 p-px gap-px bg-border"
      defaultClassName="grid grid-cols-12 gap-4"
    >
      {children}
    </StyleAwareWrapper>
  );
}

export function FinanceSummary({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: LucideIcon;
  items: {
    label: string;
    value: string;
    icon: LucideIcon;
    tone?: FinanceTone;
    detail?: string;
    progress?: number;
  }[];
}) {
  return (
    <DashboardCard data-finance-surface="panel" className="finance-summary">
      <CardHeader className="finance-panel-header">
        <CardTitle className="flex items-center gap-2">
          <FinanceIcon icon={Icon} size="sm" />
          <FinanceHeading>{title}</FinanceHeading>
        </CardTitle>
      </CardHeader>
      <CardContent className="finance-summary-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className="finance-summary-cell"
            data-finance-tone={item.tone ?? "neutral"}
          >
            <FinanceIcon icon={item.icon} tone={item.tone} />
            <div>
              <p
                data-finance-value
                data-finance-tone={item.tone}
                className="finance-summary-value"
              >
                <NumberTicker value={item.value} />
              </p>
              <p className="text-sm">{item.label}</p>
              {item.detail && (
                <p className="finance-summary-detail">{item.detail}</p>
              )}
            </div>
            {typeof item.progress === "number" && (
              <FinanceProgress
                value={Math.max(0, Math.min(100, item.progress))}
                tone={item.tone}
                aria-label={`${item.label}: ${Math.round(item.progress)}%`}
              />
            )}
          </div>
        ))}
      </CardContent>
    </DashboardCard>
  );
}
