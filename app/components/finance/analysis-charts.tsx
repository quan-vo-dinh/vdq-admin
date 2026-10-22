"use client";

import { periodDays, periodRange } from "@/lib/finance/period";
import { useState } from "react";
import {
  Line,
  ComposedChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ChartLine, SlidersHorizontal } from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/app/context/finance-context";
import {
  monthlyTotals,
  budgetLimit,
  categorySpent,
  type Budget,
} from "@/lib/finance/model";
import { Section, Choice } from "./shared";
import { ChartHelp, FinanceChartTooltip, SeriesControl } from "./chart-tools";
import { useFinanceLocale } from "./locale";

export function IncomeSpendingChart() {
  const { data: loaded, period } = useFinance();
  const data = loaded!;
  const { text, money, date, compactMoney, number } = useFinanceLocale();
  const [mode, setMode] = useState("cumulative");
  const [visible, setVisible] = useState(["income", "expenses"]);
  const range=periodRange(period);
  const days=periodDays(period,data.asOf);
  const chart = days.map(day => {
    const daily = data.transactions.filter((t) => t.date === day);
    const stats = monthlyTotals(
      mode === "daily" ? daily : data.transactions.filter((t) => t.date <= day),
      period,
    );
    return {
      date: day,
      income: stats.income,
      expenses: stats.expenses,
      net: stats.net,
      count: daily.length,
    };
  });
  const series = [
    { key: "income", label: text("Thu nhập"), color: "var(--chart-2)" },
    {
      key: "expenses",
      label: text("Chi tiêu ròng"),
      color: "var(--chart-1)",
      dashed: true,
    },
  ];
  return (
    <Section
      className="finance-income-panel"
      title="Nhịp thu chi trong kỳ"
      icon={ChartLine}
      description={text("Dữ liệu ghi nhận · {0} đến {1}", [
        date(range.from),
        date(days.at(-1) ?? range.to),
      ])}
      action={
        <ChartHelp>
          {text(
            "Lũy kế cộng dồn từ đầu kỳ. Theo ngày chỉ tính giao dịch tại ngày đó; hoàn tiền có thể làm chi ròng âm. Bấm chú giải để ẩn hoặc hiện chuỗi.",
          )}
        </ChartHelp>
      }
    >
      <div className="finance-chart-headline">
        <div>
          <p className="text-sm">{text("Chênh lệch trong kỳ")}</p>
          <p
            className="finance-hero-value"
            data-finance-value
            data-finance-tone={
              monthlyTotals(data.transactions, period).net < 0
                ? "danger"
                : "balance"
            }
          >
            {money(monthlyTotals(data.transactions, period).net)}
          </p>
        </div>
        <Choice
          label="Cách xem thu chi"
          value={mode}
          onChange={setMode}
          options={[
            { value: "cumulative", label: "Lũy kế" },
            { value: "daily", label: "Theo ngày" },
          ]}
        />
      </div>
      <ChartContainer
        config={Object.fromEntries(
          series.map((s) => [s.key, { label: s.label, color: s.color }]),
        )}
        className="finance-income-chart"
      >
        <ComposedChart
          accessibilityLayer
          data={chart}
          margin={{ left: 0, right: 8, top: 12 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => typeof period === "string" ? v.slice(8) : `${v.slice(8)}/${v.slice(5,7)}`}
            axisLine={false}
            tickLine={false}
            minTickGap={25}
          />
          <YAxis
            tickFormatter={compactMoney}
            width={55}
            axisLine={false}
            tickLine={false}
            includeHidden
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            cursor={{
              stroke: "var(--muted-foreground)",
              strokeDasharray: "4 4",
            }}
            content={
              <FinanceChartTooltip
                series={series}
                labelFormatter={(v) => date(String(v))}
                details={(r) => [
                  {
                    label: text(
                      mode === "daily"
                        ? "Chênh lệch trong ngày"
                        : "Chênh lệch lũy kế",
                    ),
                    value: money(Number(r.net)),
                    tone: Number(r.net) < 0 ? "danger" : "income",
                  },
                  {
                    label: text("Giao dịch tại ngày này"),
                    value: number(Number(r.count)),
                  },
                ]}
              />
            }
          />
          {series.map((s) =>
            mode === "daily" ? (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                hide={!visible.includes(s.key)}
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            ) : (
              <Line
                key={s.key}
                dataKey={s.key}
                type="linear"
                stroke={s.color}
                dot={false}
                strokeDasharray={s.dashed ? "4 4" : undefined}
                strokeWidth={1.5}
                activeDot={{
                  r: 4,
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
                hide={!visible.includes(s.key)}
                isAnimationActive={false}
              />
            ),
          )}
        </ComposedChart>
      </ChartContainer>
      <div className="finance-chart-legend">
        <SeriesControl
          series={series}
          visible={visible}
          onChange={setVisible}
        />
      </div>
    </Section>
  );
}

export function BudgetComparison({
  onEdit,
}: {
  onEdit: (budget: Budget) => void;
}) {
  const { data: loaded, period } = useFinance();
  const data = loaded!;
  const { text, money, compactMoney } = useFinanceLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const rows = data.budgets
    .map((b) => ({
      id: b.id,
      name: text(b.name),
      cap: budgetLimit(b, period),
      spent: categorySpent(data.transactions, b.id, period),
    }))
    .sort((a, b) => b.spent - a.spent);
  const current = rows.find((r) => r.id === selected) ?? rows[0];
  const series = [
    { key: "cap", label: text("Hạn mức"), color: "var(--muted-foreground)" },
    { key: "spent", label: text("Đã chi ròng"), color: "var(--chart-2)" },
  ];
  return (
    <Section
      title="Hạn mức và thực tế"
      icon={SlidersHorizontal}
      description={typeof period === "string" ? "So sánh từng danh mục, nhận diện phần vượt" : "Hạn mức được phân bổ theo số ngày của từng tháng trong khoảng đã chọn."}
      action={
        <ChartHelp>
          {text(
            "Cột nhạt là hạn mức, cột đậm là chi ròng. Chọn cột hoặc dòng danh mục bên dưới để xem phần còn lại và điều chỉnh hạn mức.",
          )}
        </ChartHelp>
      }
    >
      <ChartContainer
        config={{
          cap: { label: series[0].label, color: series[0].color },
          spent: { label: series[1].label, color: series[1].color },
        }}
        className="finance-budget-chart"
      >
        <BarChart accessibilityLayer data={rows} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={66}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="number"
            tickFormatter={(value) => value < 1_000_000 ? money(value) : compactMoney(value)}
            width={88}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            content={<FinanceChartTooltip series={series} />}
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              onClick={(_, index) => setSelected(rows[index].id)}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <div className="finance-budget-legend" aria-label={text("Chú giải biểu đồ")}>
        {series.map((item) => <span key={item.key}><i style={{ backgroundColor: item.color }} />{item.label}</span>)}
      </div>
      <div className="finance-budget-list" aria-label={text("Danh sách ngân sách")}>
        {rows.map((row) => {
          const remaining = row.cap - row.spent;
          const ratio = row.cap > 0 ? Math.min(100, Math.max(0, (row.spent / row.cap) * 100)) : 0;
          return (
            <button
              key={row.id}
              type="button"
              className="finance-budget-list-row"
              data-selected={current?.id === row.id}
              aria-pressed={current?.id === row.id}
              onClick={() => setSelected(row.id)}
            >
              <span className="finance-budget-list-copy">
                <strong>{row.name}</strong>
                <span className="finance-budget-list-values">
                  {text("Đã chi ròng")} {money(row.spent)} <span aria-hidden="true">/</span> {text("Hạn mức")} {money(row.cap)}
                </span>
                <span className="finance-budget-list-meter" aria-hidden="true">
                  <span style={{ width: `${ratio}%` }} />
                </span>
              </span>
              <strong className="finance-budget-list-status" data-finance-tone={remaining < 0 ? "danger" : "balance"}>
                {remaining < 0 ? text("Vượt {0}", [money(-remaining)]) : text("Còn {0}", [money(remaining)])}
              </strong>
            </button>
          );
        })}
      </div>
      {current && (
        <div className="finance-chart-selection" aria-live="polite">
          <div>
            <p className="finance-kicker">{current.name}</p>
            <strong
              data-finance-value
              data-finance-tone={
                current.cap < current.spent ? "danger" : "balance"
              }
            >
              {current.cap < current.spent
                ? text("Vượt {0}", [money(current.spent - current.cap)])
                : text("Còn {0}", [money(current.cap - current.spent)])}
            </strong>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const b = data.budgets.find((b) => b.id === current.id);
              if (b) onEdit(b);
            }}
          >
            {text(typeof period === "string" ? "Điều chỉnh hạn mức" : "Điều chỉnh theo tháng lịch")}
          </Button>
        </div>
      )}
    </Section>
  );
}
