"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import {expenseGroups} from "@/lib/finance/reconciliation";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  ChartPie,
  ScanLine,
  CalendarClock,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { vi, enGB } from "date-fns/locale";
import { format } from "date-fns";
import { useFinance } from "@/app/context/finance-context";
import { budgetLimit, categorySpent, sum } from "@/lib/finance/model";
import { useFinanceLocale } from "./locale";
import { Section, FinanceIcon, FinanceBadge, NoResults } from "./shared";
import { categoryIcon } from "./appearance";
import { FinanceNotes } from "./controls";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProgressRing } from "./dashboard-widgets";
import { FinanceLink } from "./shared";
import { GoalCover } from "./goal-visuals";
import { FinanceHeading } from "./heading";

const palette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
  "var(--primary)",
];

export function GoalSpotlight() {
  const { data } = useFinance();
  const { text, money, goalName, date } = useFinanceLocale();
  if (!data?.goals.length) return null;
  return (
    <Section
      title="Mục tiêu tiết kiệm"
      description="Số tiền đã dành cho từng mục tiêu"
      icon={ChartPie}
    >
      <Carousel
        opts={{ align: "start" }}
        aria-label={text("Các mục tiêu tiết kiệm")}
        className="finance-goal-carousel"
      >
        <CarouselContent>
          {data.goals.map((g) => (
            <CarouselItem key={g.id} className="sm:basis-1/2">
              <div className="finance-spotlight-item">
                <div className="flex items-center justify-between gap-3">
                  {g.priority === "high" ? <FinanceBadge tone="goal">{text("Ưu tiên cao")}</FinanceBadge> : <span />}
                  <span className="text-sm text-muted-foreground">
                    {date(g.deadline, { month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="finance-spotlight-body">
                  <div className="finance-spotlight-art"><GoalCover visual={g.visual} image={g.image} alt={goalName(g)} showIcon={false} /></div>
                  <div className="finance-spotlight-copy">
                    <FinanceHeading>{goalName(g)}</FinanceHeading>
                    <div className="finance-spotlight-progress">
                      <ProgressRing value={g.target ? (g.allocated / g.target) * 100 : 0} label={goalName(g)} small />
                      <div><strong className="tabular-nums"><NumberTicker value={money(g.allocated)} /></strong><p className="text-sm text-muted-foreground">{text("trên mục tiêu")} <NumberTicker value={money(g.target)} /></p></div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {text("Dự kiến góp / tháng")}
                  </span>
                  <strong><NumberTicker value={money(g.monthly)} /></strong>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-4 flex items-center justify-between gap-3">
          <FinanceLink href="/finance/goals">
            {text("Quản lý mục tiêu")}
          </FinanceLink>
          <div className="flex gap-2">
            <CarouselPrevious
              className="static m-0 translate-none"
              aria-label={text("Mục tiêu trước")}
            />
            <CarouselNext
              className="static m-0 translate-none"
              aria-label={text("Mục tiêu sau")}
            />
          </div>
        </div>
      </Carousel>
    </Section>
  );
}

export function SpendingExplorer() {
  const { data: loaded, period } = useFinance();
  const data = loaded!;
  const { text, money, compactMoney, number } = useFinanceLocale();
  const [selected, setSelected] = useState<string | null>(null);
  // Activity preserves this state even when tab registration effects are cleaned up.
  const [view, setView] = useState<"chart" | "details">("chart");
  const rows = expenseGroups(data.transactions,period).map((g,i)=>({id:g.code,name:text(({food:"Ăn uống",transport:"Di chuyển",other:"Chi phí phát sinh"})[g.code]),net:g.amount,fill:palette[i%palette.length]})).sort((a,b)=>b.net-a.net);
  const positive = rows.filter((r) => r.net > 0);
  const total = sum(positive, (r) => r.net);
  const current = rows.find((r) => r.id === selected);
  return (
    <Section
      title="Tiền được dùng vào đâu"
      description="Chi tiêu theo danh mục"
      icon={ChartPie}
    >
      <Tabs
        value={view}
        onValueChange={(value) => {
          if (value === "chart" || value === "details") setView(value);
        }}
      >
        <TabsList aria-label={text("Góc nhìn chi tiêu")}>
          <TabsTrigger value="chart">{text("Cơ cấu")}</TabsTrigger>
          <TabsTrigger value="details">{text("Chi tiết")}</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          {total > 0 ? (
            <div className="finance-allocation-chart">
              <ChartContainer
                config={Object.fromEntries(
                  rows.map((r) => [r.id, { label: r.name, color: r.fill }]),
                )}
                className="finance-donut-chart"
                aria-label={text("Cơ cấu chi tiêu theo danh mục")}
              >
                <PieChart accessibilityLayer>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(v) => money(Number(v))}
                      />
                    }
                  />
                  <Pie
                    data={positive}
                    dataKey="net"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="90%"
                    paddingAngle={3}
                    cornerRadius={4}
                    stroke="var(--background)"
                    isAnimationActive={false}
                    onClick={(_, i) => setSelected(positive[i].id)}
                  >
                    {positive.map((r) => (
                      <Cell
                        key={r.id}
                        fill={r.fill}
                        opacity={!selected || r.id === selected ? 1 : 0.3}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="finance-donut-label">
                <span>{current?.name ?? text("Tổng chi ròng dương")}</span>
                <strong><NumberTicker value={compactMoney(current?.net ?? total)} /></strong>
              </div>
            </div>
          ) : (
            <NoResults />
          )}
          <div className="flex flex-col gap-1">
            {positive.slice(0, 4).map((r) => (
              <Button
                key={r.id}
                variant="ghost"
                className="w-full justify-between"
                aria-pressed={selected === r.id}
                onClick={() => setSelected(selected === r.id ? null : r.id)}
              >
                <span className="flex items-center gap-2">
                  <i
                    className="finance-chart-key"
                    style={{ background: r.fill }}
                  />
                  {r.name}
                </span>
                <span className="tabular-nums">
                  <NumberTicker value={number(r.net / total, {
                    style: "percent",
                    maximumFractionDigits: 0,
                  })} />
                </span>
              </Button>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="details">
          <div className="flex flex-col gap-4 pt-4">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <FinanceIcon icon={categoryIcon(r.id)} size="sm" />
                  {r.name}
                </span>
                <strong className="tabular-nums"><NumberTicker value={money(r.net)} /></strong>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <p className="finance-chart-hint">
        {text(
          "Biểu đồ chỉ gồm chi ròng dương. Danh mục hoàn tiền ròng nằm trong Chi tiết.",
        )}
      </p>
    </Section>
  );
}

export function BudgetRadar() {
  const { data: loaded, period } = useFinance();
  const { text, money, number } = useFinanceLocale();
  const rows = loaded!.budgets
    .filter((b) => budgetLimit(b, period) > 0)
    .map((b) => ({
      name: text(b.name),
      cap: budgetLimit(b, period),
      spent: categorySpent(loaded!.transactions, b.id, period),
      limit: 100,
      used: Math.max(
        0,
        (categorySpent(loaded!.transactions, b.id, period) /
          budgetLimit(b, period)) *
          100,
      ),
    }));
  const max = Math.max(100, ...rows.map((r) => Math.ceil(r.used / 25) * 25));
  return (
    <Section
      title="Nhịp sử dụng từng danh mục"
      description="Tỷ lệ đã chi trên hạn mức"
      icon={ScanLine}
    >
      {rows.length >= 3 ? (
        <ChartContainer
          config={{
            used: { label: text("Đã sử dụng"), color: "var(--chart-2)" },
            limit: { label: text("Hạn mức"), color: "var(--muted-foreground)" },
          }}
          className="finance-radar-chart"
        >
          <RadarChart data={rows} outerRadius="62%" accessibilityLayer>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 14 }} />
            <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => (
                    <div className="flex w-full flex-col gap-1">
                      <span>
                        {text(
                          item.dataKey === "used" ? "Đã sử dụng" : "Hạn mức",
                        )}
                        :{" "}
                        <strong>
                          <NumberTicker value={number(Number(value), { maximumFractionDigits: 0 })} />%
                        </strong>
                      </span>
                      {item.dataKey === "used" && (
                        <span>
                          <NumberTicker value={money(item.payload.spent)} /> /{" "}
                          <NumberTicker value={money(item.payload.cap)} />
                        </span>
                      )}
                    </div>
                  )}
                />
              }
            />
            <Radar
              dataKey="limit"
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              fill="transparent"
              isAnimationActive={false}
            />
            <Radar
              dataKey="used"
              stroke="var(--chart-2)"
              fill="var(--chart-2)"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </RadarChart>
        </ChartContainer>
      ) : (
        <NoResults
          title="Cần ít nhất ba danh mục có hạn mức"
          description="Đặt hạn mức để so sánh cùng thang phần trăm."
        />
      )}
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        <span className="flex items-center gap-2">
          <i
            className="finance-series-mark"
            style={{ color: "var(--chart-2)" }}
          />
          {text("Đã sử dụng")}
        </span>
        <span className="flex items-center gap-2">
          <i className="finance-series-mark" data-dashed="true" />
          {text("Hạn mức")} · 100%
        </span>
      </div>
      <FinanceNotes
        items={[
          {
            title: "Đọc radar thế nào?",
            body: "Vượt đường 100% là vượt hạn mức. Radar bỏ danh mục chưa có hạn mức và hiển thị chi ròng âm ở 0%.",
          },
        ]}
      />
    </Section>
  );
}

type ForecastRow = {
  date: string;
  balance: number;
  income: number;
  expense: number;
};
export function CashFlowCalendar({
  rows,
  reserve,
}: {
  rows: ForecastRow[];
  reserve: number;
}) {
  const { text, money, date, language } = useFinanceLocale();
  const [selected, setSelected] = useState<string | null>(null);
  const current =
    rows.find((r) => r.date === selected) ??
    rows.find((r) => r.income > 0) ??
    rows[0];
  const first = new Date(`${rows[0].date}T12:00:00`),
    last = new Date(`${rows.at(-1)!.date}T12:00:00`);
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return (
    <Section
      title="Lịch dòng tiền"
      description="Chọn ngày để xem thu, chi và số dư mô phỏng"
      icon={CalendarClock}
    >
      <div className="finance-calendar-detail">
        <Calendar
          mode="single"
          required
          selected={new Date(`${current.date}T12:00:00`)}
          defaultMonth={first}
          startMonth={first}
          endMonth={last}
          locale={language === "vi" ? vi : enGB}
          disabled={{ before: first, after: last }}
          onSelect={(d) => {
            if (d) setSelected(format(d, "yyyy-MM-dd"));
          }}
          modifiers={{
            salary: (d) =>
              (byDate.get(format(d, "yyyy-MM-dd"))?.income ?? 0) > 0,
            shortfall: (d) => {
              const r = byDate.get(format(d, "yyyy-MM-dd"));
              return !!r && r.balance < reserve;
            },
          }}
          modifiersClassNames={{
            salary: "finance-calendar-income",
            shortfall: "finance-calendar-warning",
          }}
        />
        <div className="flex flex-1 flex-col gap-3">
          <FinanceBadge tone="goal">{text("Giả định")}</FinanceBadge>
          <strong>
            {date(current.date, { day: "numeric", month: "long" })}
          </strong>
          <Separator />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <ArrowDownLeft className="size-4" />
              {text("Thu nhập")}
            </span>
            <strong><NumberTicker value={money(current.income)} /></strong>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <ArrowUpRight className="size-4" />
              {text("Chi tiêu")}
            </span>
            <strong><NumberTicker value={money(current.expense)} /></strong>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            {text("Số dư cuối ngày")}
          </p>
          <strong
            className="text-xl tabular-nums"
            data-finance-value
            data-finance-tone={current.balance < reserve ? "danger" : "balance"}
          >
            <NumberTicker value={money(current.balance)} />
          </strong>
        </div>
      </div>
      <p className="finance-chart-hint">
        {text(
          "Chấm tròn: ngày nhận thu nhập. Ngày gạch chân: dưới mức muốn giữ. Thu chi là giả định từ mô hình dự báo.",
        )}
      </p>
    </Section>
  );
}
