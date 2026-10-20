"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Bike,
  Smartphone,
  House,
  FlaskConical,
  RotateCcw,
  GitCompareArrows,
  ChartNoAxesCombined,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useFinance } from "@/app/context/finance-context";
import { overview, purchaseScenario } from "@/lib/finance/model";
import { PageIntro, Section, MoneyInput, PlanBadge } from "./shared";
import { NumberTicker } from "./number-ticker";
import { RangeField } from "./controls";
import { FinanceChartTooltip, SeriesControl } from "./chart-tools";
import { FinanceBoard } from "./template-layout";
import StyleDivider from "@/app/components/shared/StyleDivider";
import { useFinanceLocale } from "./locale";
import ScenarioTabs from "@/components/shadcn-dashboard/tabs/tabs-05";

const presets = {
  bike: {
    name: "Mua xe",
    title: "Mua chiếc xe đầu tiên",
    description: "Xem tiền còn lại khi cân nhắc mua xe và chi phí đi lại mỗi tháng.",
    icon: Bike,
    initial: 34_000_000,
    cost: 400_000,
    goal: "bike",
  },
  phone: {
    name: "Đổi điện thoại",
    title: "Đổi điện thoại",
    description: "So sánh số tiền còn lại nếu nâng cấp thiết bị theo ngân sách của bạn.",
    icon: Smartphone,
    initial: 15_000_000,
    cost: 0,
    goal: "phone",
  },
  move: {
    name: "Ra ở riêng",
    title: "Ra ở riêng",
    description: "Ước tính phần tiền còn lại khi chuẩn bị khoản cọc và chi phí sinh hoạt mới.",
    icon: House,
    initial: 10_000_000,
    cost: 3_500_000,
    goal: "move",
  },
};
type Preset = keyof typeof presets;

function Simulator({ presetKey }: { presetKey: Preset }) {
  const { text, money, compactMoney } = useFinanceLocale();
  const { data: loaded } = useFinance();
  const data = loaded!,
    total = overview(data),
    preset = presets[presetKey];
  const ownGoal = data.goals.find((g) => g.id === preset.goal)?.allocated ?? 0;
  const [initial, setInitial] = useState(preset.initial);
  const [cost, setCost] = useState(preset.cost);
  const [source, setSource] = useState(Math.max(0, total.available + ownGoal));
  const [surplus, setSurplus] = useState(2_000_000);
  const [reserve, setReserve] = useState(2_000_000);
  const [delay, setDelay] = useState(3);
  const [visible, setVisible] = useState(["keep", "now", "later"]);
  const immediate = purchaseScenario(
    source,
    initial,
    0,
    cost,
    surplus,
    reserve,
    0,
  );
  const delayed = purchaseScenario(
    source,
    initial,
    0,
    cost,
    surplus,
    reserve,
    delay,
  );
  const chart = Array.from({ length: 13 }, (_, i) => ({
    month: `T${i}`,
    keep: source + surplus * i,
    now: immediate.after + (surplus - cost) * i,
    later:
      source + surplus * i - (i >= delay ? initial + cost * (i - delay) : 0),
  }));
  const series = [
    {
      key: "keep",
      label: text("Chưa thực hiện"),
      color: "var(--chart-3)",
      dashed: true,
    },
    { key: "now", label: text("Làm ngay"), color: "var(--chart-1)" },
    {
      key: "later",
      label: text("Đợi {0} tháng", [delay]),
      color: "var(--chart-2)",
    },
  ];
  const warning = immediate.aboveReserve < 0 || immediate.monthlyAfter < 0;
  return (
    <FinanceBoard>
      <div className="finance-simulator-main">
        <Section
          title="Kế hoạch của bạn"
          description="Tổng chi ban đầu gồm giá mua, phí hoặc tiền cọc."
          icon={preset.icon}
          action={<PlanBadge />}
        >
          <FieldGroup>
            <MoneyInput
              id="sim-initial"
              label="Tổng chi ban đầu (VND)"
              value={initial}
              onChange={setInitial}
              sliderMax={60_000_000}
            />
            <MoneyInput
              id="sim-source"
              label="Nguồn tiền cân nhắc (VND)"
              value={source}
              onChange={setSource}
              description="Mẫu: tiền chưa phân bổ và quỹ liên quan. Giữ riêng các quỹ khác."
            />
            <MoneyInput
              id="sim-monthly"
              label="Chi phí tăng thêm / tháng (VND)"
              value={cost}
              onChange={setCost}
              sliderMax={10_000_000}
            />
            <MoneyInput
              id="sim-surplus"
              label="Tiền dư hiện tại / tháng (VND)"
              value={surplus}
              onChange={setSurplus}
              sliderMax={15_000_000}
              description="Sau sinh hoạt và kế hoạch góp cho các quỹ khác."
            />
            <MoneyInput
              id="sim-reserve"
              label="Muốn giữ lại (VND)"
              value={reserve}
              onChange={setReserve}
            />
            <RangeField
              id="sim-delay"
              label="Chờ thêm"
              value={delay}
              onChange={setDelay}
              min={1}
              max={12}
              unit="tháng"
            />
          </FieldGroup>
        </Section>
        <div className="finance-simulator-results flex min-w-0 flex-col gap-4">
          <Section
            title="Làm ngay hay chờ thêm?"
            description="Tiền còn lại ngay sau khi thực hiện."
            icon={GitCompareArrows}
          >
            <div className="finance-decision-cards">
              {[
                { label: text("Làm ngay"), value: immediate.after },
                { label: text("Đợi {0} tháng", [delay]), value: delayed.after },
              ].map((item) => (
                <div key={item.label} className="finance-decision-card">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p
                    className="text-2xl font-semibold tabular-nums"
                    data-finance-value
                    data-finance-tone={
                      item.value < reserve ? "danger" : "balance"
                    }
                  >
                    <NumberTicker value={money(item.value)} />
                  </p>
                </div>
              ))}
            </div>
            <Alert
              className="mt-4"
              variant={warning ? "destructive" : "default"}
            >
              <AlertTitle>
                {immediate.monthlyAfter < 0
                  ? text("Chi phí mới vượt tiền dư mỗi tháng")
                  : immediate.aboveReserve < 0
                    ? text("Làm ngay sẽ dưới mức muốn giữ")
                    : text("Trong nguồn tiền dự kiến")}
              </AlertTitle>
              <AlertDescription>
                {text("Tiền dư sau quyết định: {0} / tháng.", [
                  money(immediate.monthlyAfter),
                ])}
              </AlertDescription>
            </Alert>
          </Section>
          <StyleDivider wrapperClassName="col-span-12" />
          <Section
            title="So sánh trong 12 tháng"
            description="Giữ nguyên giá và mức tích lũy đã nhập."
            icon={ChartNoAxesCombined}
          >
            <SeriesControl
              series={series}
              visible={visible}
              onChange={setVisible}
            />
            <ChartContainer
              config={Object.fromEntries(
                series.map((s) => [s.key, { label: s.label, color: s.color }]),
              )}
              className="finance-simulator-chart"
            >
              <LineChart
                accessibilityLayer
                data={chart}
                margin={{ left: 0, right: 10, top: 12 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={20}
                />
                <YAxis
                  tickFormatter={compactMoney}
                  width={55}
                  axisLine={false}
                  tickLine={false}
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
                      labelFormatter={(v) =>
                        text("Tháng thứ {0}", [String(v).slice(1)])
                      }
                    />
                  }
                />
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type={s.key === "later" ? "stepAfter" : "linear"}
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray={s.dashed ? "4 4" : undefined}
                    hide={!visible.includes(s.key)}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </Section>
        </div>
      </div>
    </FinanceBoard>
  );
}

export function SimulatorPage() {
  const { text } = useFinanceLocale();
  const [preset, setPreset] = useState<Preset>("bike");
  const [revision, setRevision] = useState(0);
  const current = presets[preset];
  return (
    <div className="finance-page finance-simulator">
      <PageIntro
        icon={FlaskConical}
        eyebrow="Mô phỏng"
        title={text(current.title)}
        description={text(current.description)}
      >
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ScenarioTabs
            value={preset}
            onValueChange={(value) => setPreset(value as Preset)}
            ariaLabel={text("Tình huống mô phỏng")}
            tabs={Object.entries(presets).map(([value, item]) => ({
              value,
              label: text(item.name),
              icon: item.icon,
            }))}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevision((v) => v + 1)}
          >
            <RotateCcw data-icon="inline-start" />
            {text("Đặt lại mẫu")}
          </Button>
        </div>
      </PageIntro>
      <Simulator key={`${preset}-${revision}`} presetKey={preset} />
    </div>
  );
}
