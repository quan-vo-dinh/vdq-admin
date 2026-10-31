"use client";
import { NumberTicker } from "@/components/ui/number-ticker";


import { periodRange } from "@/lib/finance/period";
import { useState } from "react";
import {
  Cell,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ChartColumn, SlidersHorizontal } from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/app/context/finance-context";
import {
  dailySpendingComparison,
  budgetLimit,
  categorySpent,
  type Budget,
} from "@/lib/finance/model";
import { Section } from "./shared";
import { ChartHelp, FinanceChartTooltip, SeriesControl } from "./chart-tools";
import { useFinanceLocale } from "./locale";

export function IncomeSpendingChart() {
  const { data: loaded, period } = useFinance();
  const data = loaded!;
  const { text, money, date, compactMoney, number } = useFinanceLocale();
  const [visible, setVisible] = useState(["spent", "allowance"]);
  const range = periodRange(period);
  const chart = dailySpendingComparison(data, period);
  const spent = chart.reduce((total, day) => total + (day.spent ?? 0), 0);
  const overDays = chart.filter(day => day.difference !== null && day.difference < 0).length;
  const series = [
    { key: "spent", label: text("Chi thực tế"), color: "var(--chart-1)" },
    { key: "allowance", label: text("Mức được phép chi"), color: "var(--muted-foreground)" },
  ];
  return (
    <Section
      className="finance-income-panel"
      title="Chi tiêu từng ngày"
      icon={ChartColumn}
      description={text("Chi thực tế và mức được phép chi · {0} đến {1}", [date(range.from), date(range.to)])}
      action={
        <ChartHelp>
          {text("Mức được phép chi mỗi ngày = tổng hạn mức danh mục của tháng chia số ngày trong tháng. Chi thực tế là chi ròng sau hoàn tiền, không gồm chuyển khoản. Cột đỏ là ngày vượt mức. Ngày chưa tới chưa có chi thực tế.")}
        </ChartHelp>
      }
    >
      <div className="finance-chart-headline">
        <div>
          <p className="text-sm">{text("Tổng chi ròng trong kỳ")}</p>
          <p className="finance-hero-value" data-finance-value data-finance-tone="expense">
            <NumberTicker value={money(spent)} />
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.budgets.length
            ? text("{0} ngày vượt mức chi", [overDays])
            : text("Chưa có hạn mức để so sánh")}
        </p>
      </div>
      <ChartContainer
        config={Object.fromEntries(series.map(s => [s.key, { label: s.label, color: s.color }]))}
        className="finance-income-chart"
      >
        <BarChart accessibilityLayer data={chart} margin={{ left: 0, right: 8, top: 12 }} barGap={2}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="date"
            tickFormatter={(v: string) => typeof period === "string" ? v.slice(8) : `${v.slice(8)}/${v.slice(5, 7)}`}
            axisLine={false} tickLine={false} minTickGap={18} />
          <YAxis tickFormatter={compactMoney} width={55} axisLine={false} tickLine={false} includeHidden />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
            content={
              <FinanceChartTooltip series={series} labelFormatter={v => date(String(v))}
                details={row => [
                  {
                    label: text(row.spent === null ? "Chi thực tế" : "Giao dịch chi / hoàn tiền"),
                    value: row.spent === null ? text("Chưa tới ngày") : number(Number(row.count)),
                  },
                  ...(row.difference === null ? [] : [{
                    label: text(Number(row.difference) < 0 ? "Vượt mức trong ngày" : "Còn trong mức ngày"),
                    value: money(Math.abs(Number(row.difference))),
                    tone: Number(row.difference) < 0 ? "danger" as const : "income" as const,
                  }]),
                ]} />
            } />
          <Bar dataKey="spent" fill={series[0].color} hide={!visible.includes("spent")}
            radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false}>
            {chart.map(day => <Cell key={day.date} fill={day.difference !== null && day.difference < 0 ? "var(--destructive)" : series[0].color} />)}
          </Bar>
          <Bar dataKey="allowance" fill={series[1].color} fillOpacity={0.35}
            hide={!visible.includes("allowance")} radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <div className="finance-chart-legend">
        <SeriesControl series={series} visible={visible} onChange={setVisible} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {text("Mức ngày được chia đều từ hạn mức tháng; phần chưa dùng không tự cộng sang ngày sau.")}
      </p>
    </Section>
  );
}

export function BudgetComparison({
  onEdit,
  onSelectCategory,
}: {
  onEdit: (budget: Budget) => void;
  onSelectCategory: (id: string) => void;
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
  const selectCategory = (id: string) => { setSelected(id); onSelectCategory(id); };
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
            "Cột nhạt là hạn mức, cột đậm là chi ròng. Chọn danh mục để xem toàn bộ lịch sử ở cột bên phải; dùng nút điều chỉnh để sửa hạn mức.",
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
              onClick={(_, index) => {
                const row = rows[index];
                if (row) selectCategory(row.id);
              }}
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
              onClick={() => selectCategory(row.id)}
            >
              <span className="finance-budget-list-copy">
                <strong>{row.name}</strong>
                <span className="finance-budget-list-values">
                  {text("Đã chi ròng")} <NumberTicker value={money(row.spent)} /> <span aria-hidden="true">/</span> {text("Hạn mức")} <NumberTicker value={money(row.cap)} />
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

export function BudgetTransactionHistory({ categoryId }: { categoryId: string | null }) {
  const { data: loaded } = useFinance();
  const data = loaded!;
  const { text, money, date } = useFinanceLocale();
  const budget = data.budgets.find((item) => item.id === categoryId);
  const history = categoryId ? data.transactions
    .filter((transaction) => transaction.category === categoryId
      && (transaction.kind === "expense" || transaction.kind === "refund"))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)) : [];

  return (
    <Section
      title={text("Giao dịch theo danh mục")}
      description={budget ? text("Toàn bộ giao dịch chi và hoàn tiền · {0}", [text(budget.name)]) : text("Chọn một danh mục trong biểu đồ hoặc danh sách để xem lịch sử.")}
      className="finance-budget-history"
    >
      {budget && history.length > 0 ? <div className="finance-breakdown-list max-h-[420px] overflow-y-auto pr-1">
        {history.map((transaction) => (
          <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{transaction.description}</p>
              <p className="text-xs text-muted-foreground">{text(transaction.kind === "refund" ? "Hoàn tiền" : "Chi tiêu")} · {date(transaction.date)}</p>
            </div>
            <strong className="shrink-0 text-sm tabular-nums" data-finance-tone={transaction.kind === "refund" ? "balance" : "danger"}>
              {transaction.kind === "refund" ? "+" : "−"}<NumberTicker value={money(transaction.amount)} />
            </strong>
          </div>
        ))}
      </div> : <p className="text-sm text-muted-foreground">{budget ? text("Không có giao dịch chi hoặc hoàn tiền.") : text("Chọn một danh mục trong biểu đồ hoặc danh sách để xem lịch sử.")}</p>}
    </Section>
  );
}
