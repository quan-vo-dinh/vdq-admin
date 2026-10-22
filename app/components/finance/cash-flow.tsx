"use client";
import { NumberTicker } from "@/components/ui/number-ticker";


import { FinancePageHeader } from "./page-header";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  CalendarClock,
  Wallet,
  ArrowDownToLine,
  SlidersHorizontal,
  ChartNoAxesCombined,
} from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { FieldGroup } from "@/components/ui/field";
import { useFinance } from "@/app/context/finance-context";
import { overview, forecast } from "@/lib/finance/model";
import {
  Metric,
  Section,
  MoneyInput,
  Choice,
  PlanBadge,
} from "./shared";
import { CashFlowCalendar } from "./explore-widgets";
import { RangeField } from "./controls";
import { FinanceChartTooltip } from "./chart-tools";
import { FinanceBoard } from "./template-layout";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { useFinanceLocale } from "./locale";
import { FinanceHeading } from "./heading";

export function CashFlowPage() {
  const { text, money, compactMoney, date } = useFinanceLocale();
  const { data: loaded } = useFinance();
  const data = loaded!,
    totals = overview(data);
  const [income, setIncome] = useState(12_000_000);
  const [expenses, setExpenses] = useState(6_000_000);
  const [salaryDay, setSalaryDay] = useState(25);
  const [reserve, setReserve] = useState(totals.allocated);
  const [days, setDays] = useState("60");
  // Keep the selection while Next.js hides and restores this route with Activity.
  const [view, setView] = useState<"chart" | "calendar">("chart");
  const chart = forecast(
    data.asOf,
    totals.tracked,
    Number(days),
    { income, expenses, salaryDay, reserve, shock: 0 },
    data.bills,
  );
  const end = chart.at(-1)!,
    low = chart.reduce((a, b) => (a.balance <= b.balance ? a : b)),
    shortage = chart.find((r) => r.balance < reserve);
  const series = [
    { key: "balance", label: text("Số dư dự kiến"), color: "var(--chart-3)" },
  ];
  return (
    <div className="finance-page finance-cash-flow">
      <FinancePageHeader>
        <Choice
          label="Khoảng dự báo"
          value={days}
          onChange={setDays}
          options={[
            { value: "30", label: "30 ngày" },
            { value: "60", label: "60 ngày" },
            { value: "90", label: "90 ngày" },
          ]}
        />
      </FinancePageHeader>
      <FinanceBoard>
        <div className="finance-metrics finance-metrics-three">
          <Metric
            label="Số dư bắt đầu"
            value={totals.balanceKnown?money(totals.tracked):"Chưa đủ dữ liệu"}
            detail={totals.balanceKnown?"Số dư theo sổ, gồm tiền dành cho mục tiêu":"Số khởi đầu tạm tính; thiếu mốc đầu kỳ"}
            icon={Wallet}
          />
          <Metric
            label={text("Dự kiến sau {0} ngày", [days])}
            value={money(end.balance)}
            detail="Theo giả định đang nhập"
            icon={CalendarClock}
            negative={end.balance < 0}
          />
          <Metric
            label="Điểm thấp nhất"
            value={money(low.balance)}
            detail={date(low.date)}
            icon={ArrowDownToLine}
            negative={low.balance < reserve}
          />
        </div>
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="finance-forecast-main">
          <div className="flex min-w-0 flex-col gap-4">
            <Tabs
              value={view}
              onValueChange={(value) => {
                if (value === "chart" || value === "calendar") setView(value);
              }}
              className="finance-chart-tabs"
            >
              <TabsList aria-label={text("Góc nhìn dòng tiền")}>
                <TabsTrigger value="chart">{text("Biểu đồ")}</TabsTrigger>
                <TabsTrigger value="calendar">{text("Lịch")}</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <Section
                  title="Số dư dự kiến"
                  description="Nét đứt là mức bạn muốn giữ lại."
                  icon={ChartNoAxesCombined}
                  action={<PlanBadge />}
                >
                  <ChartContainer
                    config={{
                      balance: {
                        label: series[0].label,
                        color: series[0].color,
                      },
                    }}
                    className="finance-forecast-chart"
                  >
                    <AreaChart
                      accessibilityLayer
                      data={chart}
                      margin={{ left: 0, right: 10, top: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        minTickGap={38}
                        tickFormatter={(d) =>
                          `${String(d).slice(8)}/${String(d).slice(5, 7)}`
                        }
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={55}
                        tickFormatter={compactMoney}
                        domain={["auto", "auto"]}
                      />
                      <ReferenceLine
                        y={reserve}
                        ifOverflow="extendDomain"
                        stroke="var(--muted-foreground)"
                        strokeDasharray="4 4"
                      />
                      <ChartTooltip
                        content={
                          <FinanceChartTooltip
                            series={series}
                            labelFormatter={(v) => date(String(v))}
                          />
                        }
                      />
                      <Area
                        type="linear"
                        dataKey="balance"
                        stroke="var(--chart-3)"
                        fill="var(--chart-3)"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ChartContainer>
                </Section>
              </TabsContent>
              <TabsContent value="calendar">
                <CashFlowCalendar rows={chart} reserve={reserve} />
              </TabsContent>
            </Tabs>
            <Alert variant={shortage ? "destructive" : "default"}>
              <AlertTitle>
                {shortage
                  ? text("Dưới mức giữ lại từ {0}", [date(shortage.date)])
                  : text("Chưa chạm mức giữ lại")}
              </AlertTitle>
              <AlertDescription>
                {text("Dự báo chưa bao gồm khoản thu chi chưa nhập.")}
              </AlertDescription>
            </Alert>
          </div>
          <Section
            title="Giả định của bạn"
            description="Chỉnh thông số để xem thay đổi."
            icon={SlidersHorizontal}
          >
            <FieldGroup>
              <MoneyInput
                id="flow-income"
                label="Thu nhập / tháng (VND)"
                value={income}
                onChange={setIncome}
                sliderMax={30_000_000}
              />
              <MoneyInput
                id="flow-expenses"
                label="Chi phí khác / tháng (VND)"
                value={expenses}
                onChange={setExpenses}
                sliderMax={20_000_000}
                description="Chưa gồm các khoản sắp đến bên dưới."
              />
              <MoneyInput
                id="flow-reserve"
                label="Số dư muốn giữ (VND)"
                value={reserve}
                onChange={setReserve}
                sliderMax={40_000_000}
              />
              <RangeField
                id="salary-day"
                label="Ngày nhận thu nhập"
                value={salaryDay}
                onChange={setSalaryDay}
                min={1}
                max={28}
              />
            </FieldGroup>
            <Accordion className="mt-4">
              <AccordionItem value="bills">
                <AccordionTrigger>
                  <FinanceHeading as="span">
                    {text("Khoản chi sắp đến")} · <NumberTicker value={data.bills.length} />
                  </FinanceHeading>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    {data.bills.map((b) => (
                      <div
                        key={b.id}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span>
                          {text(b.name)}
                          <span className="block text-muted-foreground">
                            {date(b.date)}
                          </span>
                        </span>
                        <strong className="tabular-nums">
                          <NumberTicker value={money(b.amount)} />
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {text("Trừ một lần vào đúng ngày đã khai báo.")}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>
        </div>
      </FinanceBoard>
    </div>
  );
}
