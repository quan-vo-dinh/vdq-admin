"use client";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { ChartPie, Landmark } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { useFinance } from "@/app/context/finance-context";
import {
  overview,
  sum,
  monthlyTotals,
  accountBalance,
  budgetLimit,
  categorySpent,
} from "@/lib/finance/model";
import { Section, FinanceIcon } from "./shared";
import { useFinanceLocale } from "./locale";

export function ProgressRing({
  value,
  label,
  small = false,
}: {
  value: number;
  label: string;
  small?: boolean;
}) {
  const { number } = useFinanceLocale();
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div
      className="finance-progress-ring"
      data-small={small}
      role="img"
      aria-label={`${label}: ${number(value, { maximumFractionDigits: 0 })}%`}
    >
      <ChartContainer
        config={{ progress: { label, color: "var(--chart-2)" } }}
        className="finance-radial-chart"
        aria-hidden="true"
      >
        <RadialBarChart
          data={[{ progress: percent }]}
          startAngle={90}
          endAngle={-270}
          innerRadius="80%"
          outerRadius="100%"
          barSize={7}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="progress"
            fill="var(--chart-2)"
            background={{ fill: "var(--muted)" }}
            cornerRadius={8}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ChartContainer>
      <span>
        <strong>
          {number(value, { maximumFractionDigits: 0 })}
          <small>%</small>
        </strong>
        {!small && <span>{label}</span>}
      </span>
    </div>
  );
}

export function AccountSummary() {
  const { data: loaded } = useFinance();
  const data = loaded!;
  const { text, money } = useFinanceLocale();
  return (
    <Section
      title={text("Nơi giữ tiền")}
      icon={Landmark}
      description={text("Số dư hiện tại · tất cả tài khoản")}
    >
      <div className="finance-breakdown-list">
        {data.accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 py-3">
            <FinanceIcon icon={Landmark} size="sm" />
            <span className="flex-1 text-sm">{text(a.name)}</span>
            <strong
              className="text-sm tabular-nums"
              data-finance-value
              data-finance-tone={
                accountBalance(a, data.transactions) < 0 ? "danger" : "balance"
              }
            >
              {money(accountBalance(a, data.transactions))}
            </strong>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex justify-between pt-3 text-sm text-muted-foreground">
        <span>{text("Tổng số dư")}</span>
        <strong className="text-foreground">
          {money(overview(data).balance)}
        </strong>
      </div>
    </Section>
  );
}

export function BudgetPulse() {
  const { data: loaded, period } = useFinance();
  const data = loaded!;
  const { text, money, number } = useFinanceLocale();
  const limit = sum(data.budgets, (b) => budgetLimit(b, period));
  const spent = monthlyTotals(data.transactions, period).expenses;
  const over = data.budgets.filter(
    (b) =>
      categorySpent(data.transactions, b.id, period) > budgetLimit(b, period),
  ).length;
  const remaining = limit - spent;
  const fixed = sum(
    data.budgets.filter((b) => b.fixed),
    (b) => budgetLimit(b, period),
  );
  const withinLimit = Math.max(0, data.budgets.length - over);
  return (
    <Section
      title={text("Bức tranh ngân sách")}
      icon={ChartPie}
      description={text("Hạn mức và phần đã sử dụng trong kỳ")}
    >
      <div className="finance-budget-pulse">
        <ProgressRing
          value={limit ? (spent / limit) * 100 : 0}
          label={text("đã sử dụng")}
        />
        <div className="finance-budget-pulse-main">
          <div>
            <p className="finance-kicker">
              {remaining < 0 ? text("Vượt hạn mức") : text("Còn trong hạn mức")}
            </p>
            <p
              className="text-2xl font-semibold tabular-nums"
              data-finance-value
              data-finance-tone={spent > limit ? "danger" : "balance"}
            >
              {money(Math.abs(remaining))}
            </p>
          </div>
          <div className="finance-budget-pulse-stats">
            <div>
              <span>{text(typeof period === "string" ? "Hạn mức tháng" : "Hạn mức trong kỳ")}</span>
              <strong>{money(limit)}</strong>
            </div>
            <div>
              <span>{text("Đã chi ròng")}</span>
              <strong>{money(spent)}</strong>
            </div>
            <div>
              <span>{text("Danh mục trong hạn")}</span>
              <strong data-finance-value data-finance-tone={over ? "warning" : "income"}>
                {number(withinLimit)}/{number(data.budgets.length)}
              </strong>
            </div>
            <div>
              <span>{text("Chi phí cố định")}</span>
              <strong>{money(fixed)}</strong>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
