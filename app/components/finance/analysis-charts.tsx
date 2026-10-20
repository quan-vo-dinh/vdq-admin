"use client";

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
import { Section, Choice, SelectField } from "./shared";
import { ChartHelp, FinanceChartTooltip, SeriesControl } from "./chart-tools";
import { useFinanceLocale } from "./locale";

export function IncomeSpendingChart() {
  const { data: loaded, month } = useFinance();
  const data = loaded!;
  const { text, money, date, compactMoney, number } = useFinanceLocale();
  const [mode, setMode] = useState("cumulative");
  const [visible, setVisible] = useState(["income", "expenses"]);
  const days =
    month === data.asOf.slice(0, 7)
      ? Number(data.asOf.slice(8))
      : new Date(
          Number(month.slice(0, 4)),
          Number(month.slice(5)),
          0,
        ).getDate();
  const chart = Array.from({ length: days }, (_, i) => {
    const day = `${month}-${String(i + 1).padStart(2, "0")}`;
    const daily = data.transactions.filter((t) => t.date === day);
    const stats = monthlyTotals(
      mode === "daily" ? daily : data.transactions.filter((t) => t.date <= day),
      month,
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
      title="Nhịp thu chi trong tháng"
      icon={ChartLine}
      description={text("Dữ liệu ghi nhận · {0} đến {1}", [
        date(`${month}-01`),
        date(`${month}-${days}`),
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
              monthlyTotals(data.transactions, month).net < 0
                ? "danger"
                : "balance"
            }
          >
            {money(monthlyTotals(data.transactions, month).net)}
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
            tickFormatter={(v: string) => v.slice(8)}
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
  const { data: loaded, month } = useFinance();
  const data = loaded!;
  const { text, money, compactMoney } = useFinanceLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const rows = data.budgets
    .map((b) => ({
      id: b.id,
      name: text(b.name),
      cap: budgetLimit(b, month),
      spent: categorySpent(data.transactions, b.id, month),
    }))
    .sort((a, b) => b.spent - a.spent);
  const current = rows.find((r) => r.id === selected) ?? rows[0];
  const series = [
    { key: "cap", label: text("Hạn mức"), color: "var(--border)" },
    { key: "spent", label: text("Đã chi ròng"), color: "var(--chart-2)" },
  ];
  return (
    <Section
      title="Hạn mức và thực tế"
      icon={SlidersHorizontal}
      description="So sánh từng danh mục, nhận diện phần vượt"
      action={
        <ChartHelp>
          {text(
            "Thanh mờ là hạn mức, thanh đậm là chi ròng. Chọn thanh hoặc tên danh mục để xem phần còn lại và điều chỉnh hạn mức.",
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
        <BarChart
          accessibilityLayer
          layout="vertical"
          data={rows}
          margin={{ left: 0, right: 12 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="4 4" />
          <XAxis
            type="number"
            tickFormatter={compactMoney}
            includeHidden
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={115}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
          />
          <ReferenceLine x={0} stroke="var(--border)" />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            content={<FinanceChartTooltip series={series} />}
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              radius={[0, 3, 3, 0]}
              onClick={(_, index) => setSelected(rows[index].id)}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <SelectField
        id="budget-category"
        label="Chọn danh mục ngân sách"
        value={current?.id ?? ""}
        onChange={setSelected}
        options={rows.map((r) => ({ value: r.id, label: r.name }))}
      />
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
            {text("Điều chỉnh hạn mức")}
          </Button>
        </div>
      )}
    </Section>
  );
}
