"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarClock,
  ChartNoAxesCombined,
  Save,
  Trash2,
  Wallet,
  PiggyBank,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberTicker } from "@/components/ui/number-ticker";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
import { useFinance } from "@/app/context/finance-context";
import { useSavingsPlan } from "@/app/context/finance-context/use-savings-plan";
import { overview, type FinanceData } from "@/lib/finance/model";
import {
  addMonths,
  cycleFor,
  emptySavingsPlan,
  lastDay,
  monthDistance,
  payrollMonths,
  planAmount,
  projectedGoals,
  projectionRows,
  savingsPlanFingerprint,
  validateSavingsPlan,
  validDate,
  type SalaryCycle,
  type SavingsPlan,
} from "@/lib/finance/projection";
import { Section, Metric, SelectField, PlanBadge } from "./shared";
import { FinanceBoard } from "./template-layout";
import { FinancePageHeader } from "./page-header";
import { FinanceChartTooltip } from "./chart-tools";
import { useFinanceLocale } from "./locale";

export function CashFlowPage() {
  const { data } = useFinance();
  const storage = useSavingsPlan();
  return (
    <div className="finance-page finance-cash-flow">
      <FinancePageHeader />
      {storage.isLoading ? (
        <Section title="Kế hoạch tích lũy">
          <Skeleton className="h-72 w-full" />
        </Section>
      ) : (
        <SavingsPlanner
          key="salary-cycle-v2"
          data={data!}
          storage={storage}
          initial={
            storage.saved
              ? validateSavingsPlan(storage.saved.plan)
              : emptySavingsPlan(data!.asOf)
          }
        />
      )}
    </div>
  );
}
function SavingsPlanner({
  data,
  storage,
  initial,
}: {
  data: FinanceData;
  storage: ReturnType<typeof useSavingsPlan>;
  initial: SavingsPlan;
}) {
  const { money, compactMoney, date, text } = useFinanceLocale();
  const [plan, setPlan] = useState(initial),
    [failure, setFailure] = useState(""),
    [deleting, setDeleting] = useState(false);
  const [bulkIncome, setBulkIncome] = useState(""),
    [bulkSpending, setBulkSpending] = useState("");
  const [bulkFrom, setBulkFrom] = useState(initial.startDate),
    [bulkTo, setBulkTo] = useState(initial.endDate);
  const totals = overview(data);
  const periodValid =
    validDate(plan.startDate) &&
    validDate(plan.endDate) &&
    plan.endDate >= lastDay(plan.startDate.slice(0, 7)) &&
    monthDistance(plan.startDate, plan.endDate) <= 119;
  const safeStart = validDate(plan.startDate) ? plan.startDate : data.asOf;
  const safePlan = {
    ...plan,
    startDate: safeStart,
    endDate: periodValid ? plan.endDate : lastDay(safeStart.slice(0, 7)),
  };
  const currentValid = totals.balanceKnown && safePlan.startDate >= data.asOf;
  const balance = currentValid ? totals.tracked : null;
  const projection = projectionRows(safePlan, balance),
    targets = projectedGoals(safePlan, balance, data.goals);
  const required = targets.at(-1)?.required ?? 0;
  const count = payrollMonths(safePlan.startDate, safePlan.endDate).length;
  const dirty =
    savingsPlanFingerprint(plan) !== savingsPlanFingerprint(initial);
  let valid = periodValid;
  try {
    validateSavingsPlan(plan);
  } catch {
    valid = false;
  }
  const fullDate = useCallback(
    (value: string) =>
      date(value, { day: "2-digit", month: "2-digit", year: "numeric" }),
    [date],
  );
  const editCycle = useCallback(
    (month: string, field: keyof SalaryCycle, value: string) =>
      setPlan((previous) => {
        const cycle = { ...cycleFor(previous, month), [field]: value };
        try {
          const income = planAmount(cycle.income),
            spending = planAmount(cycle.spending);
          if (income !== null && spending !== null && spending > income)
            cycle.savingDate = lastDay(month);
        } catch {
          /* Invalid drafts stay editable. */
        }
        return { ...previous, cycles: { ...previous.cycles, [month]: cycle } };
      }),
    [],
  );
  const tableRows = projection.rows.map((row) => ({
    ...row,
    milestones: targets
      .filter((goal) => goal.reachedDate === row.eventDate)
      .map((goal) => goal.name)
      .join(", "),
  }));
  const columns = useMemo<ColumnDef<(typeof tableRows)[number]>[]>(
    () => [
      {
        id: "payday",
        header: text("Ngày nhận lương"),
        cell: ({ row }) => (
          <div className="min-w-44">
            <strong>{fullDate(row.original.payDate)}</strong>
            <p className="mt-1 text-xs text-muted-foreground">
              {text("Giữ tiền chi cho")}
              <br />
              {fullDate(row.original.expenseFrom)} –{" "}
              {fullDate(row.original.expenseTo)}
            </p>
            {row.original.legacyNet && (
              <p className="mt-1 text-xs text-muted-foreground">
                {text("Ước tính cũ chưa tách")}:{" "}
                {money(Number(row.original.legacyNet))}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "income",
        header: text("Lương thực nhận (VND)"),
        cell: ({ row }) => (
          <Input
            type="number"
            min="0"
            max="1000000000000"
            step="1"
            className="min-w-36"
            value={row.original.income}
            placeholder={text("Chưa ước tính")}
            aria-label={`${text("Lương thực nhận")} ${fullDate(row.original.payDate)}`}
            aria-invalid={row.original.invalid || undefined}
            onChange={(event) =>
              editCycle(row.original.month, "income", event.target.value)
            }
          />
        ),
      },
      {
        id: "spending",
        header: text("Giữ chi tháng sau (VND)"),
        cell: ({ row }) => (
          <Input
            type="number"
            min="0"
            max="1000000000000"
            step="1"
            className="min-w-36"
            value={row.original.spending}
            placeholder={text("Chưa ước tính")}
            aria-label={`${text("Giữ chi tháng sau")} ${fullDate(row.original.expenseFrom)} – ${fullDate(row.original.expenseTo)}`}
            onChange={(event) =>
              editCycle(row.original.month, "spending", event.target.value)
            }
          />
        ),
      },
      {
        id: "surplus",
        header: text("Còn lại để tiết kiệm"),
        cell: ({ row }) => (
          <div className="min-w-28">
            {row.original.surplus === null ? (
              text("Chưa đủ ước tính")
            ) : (
              <NumberTicker value={money(row.original.surplus)} />
            )}
            {row.original.surplus !== null && row.original.surplus < 0 && (
              <p className="mt-1 text-xs text-destructive">
                {text("Cần bù từ tiền tích lũy")}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "savingDate",
        header: text("Ngày trích tiết kiệm"),
        cell: ({ row }) => (
          <div className="min-w-40">
            <Input
              type="date"
              min={row.original.payDate}
              value={
                row.original.surplus !== null && row.original.surplus < 0
                  ? row.original.eventDate
                  : row.original.savingDate
              }
              disabled={
                row.original.surplus !== null && row.original.surplus < 0
              }
              aria-label={`${text("Ngày trích tiết kiệm từ kỳ lương")} ${fullDate(row.original.payDate)}`}
              onChange={(event) =>
                editCycle(row.original.month, "savingDate", event.target.value)
              }
            />
            {!row.original.inHorizon && (
              <p className="mt-1 text-xs text-muted-foreground">
                {text("Sau ngày kết thúc kế hoạch")}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "balance",
        header: text("Tiết kiệm tích lũy tại ngày trích"),
        cell: ({ row }) => (
          <div className="min-w-36">
            {!row.original.inHorizon ? (
              "—"
            ) : row.original.balance === null ? (
              text("Chưa đủ ước tính")
            ) : (
              <NumberTicker value={money(row.original.balance)} />
            )}
            {row.original.inHorizon && row.original.milestones && (
              <p className="mt-1 text-xs text-muted-foreground">
                {row.original.milestones}
              </p>
            )}
          </div>
        ),
      },
    ],
    [editCycle, fullDate, money, text],
  );
  const legacy = Object.values(plan.cycles).some((cycle) => !!cycle.legacyNet);
  const endTimestamp = Date.parse(safePlan.endDate + "T00:00:00Z");
  function changePeriod(startDate: string, months: number) {
    const endDate = validDate(startDate)
      ? lastDay(addMonths(startDate.slice(0, 7), months - 1))
      : plan.endDate;
    setPlan((previous) => ({ ...previous, startDate, endDate }));
    if (validDate(startDate)) {
      setBulkFrom(startDate);
      setBulkTo(endDate);
    }
  }
  function toggleGoal(id: string) {
    setPlan((previous) => ({
      ...previous,
      goalIds: previous.goalIds.includes(id)
        ? previous.goalIds.filter((value) => value !== id)
        : [...previous.goalIds, id],
    }));
  }
  function moveGoal(id: string, offset: number) {
    setPlan((previous) => {
      const ids = [...previous.goalIds],
        index = ids.indexOf(id),
        next = index + offset;
      if (index < 0 || next < 0 || next >= ids.length) return previous;
      [ids[index], ids[next]] = [ids[next], ids[index]];
      return { ...previous, goalIds: ids };
    });
  }
  function reset(next: SavingsPlan) {
    setPlan(next);
    setBulkFrom(next.startDate);
    setBulkTo(next.endDate);
    setFailure("");
  }
  return (
    <FinanceBoard>
      <div className="col-span-12 flex flex-wrap items-start justify-between gap-4 bg-card p-5">
        <div>
          <h2 className="text-xl font-semibold">
            {text("Kế hoạch tiết kiệm theo kỳ lương")}
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {text(
              "Lương nhận cuối tháng → giữ tiền chi cho tháng kế tiếp → phần còn lại mới là tiết kiệm. Mỗi kỳ có thể có lương và mức chi khác nhau.",
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanBadge />
          <Button
            size="sm"
            disabled={storage.busy || !!storage.error || !valid || !dirty}
            onClick={async () => {
              try {
                setFailure("");
                await storage.save(validateSavingsPlan(plan));
              } catch {
                setFailure(
                  "Chưa lưu được kế hoạch. Bản nháp được giữ; nếu có xung đột, hãy tải lại kế hoạch đã lưu.",
                );
              }
            }}
          >
            <Save />
            {text(storage.busy ? "Đang lưu…" : "Lưu kế hoạch")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!storage.saved || storage.busy}
            onClick={() => setDeleting(true)}
          >
            <Trash2 />
            {text("Xóa kế hoạch")}
          </Button>
        </div>
        <p className="basis-full text-xs text-muted-foreground">
          {text(
            dirty
              ? "Có thay đổi chưa lưu."
              : storage.saved
                ? "Đã lưu kế hoạch theo tài khoản. Không tạo giao dịch lương hay chuyển tiền thực tế."
                : "Chưa có kế hoạch đã lưu. Nhập các kỳ lương rồi bấm Lưu kế hoạch.",
          )}
        </p>
      </div>
      {(storage.error || failure) && (
        <Alert variant="destructive" className="col-span-12">
          <AlertDescription>
            {text(
              failure ||
                "Không tải được kế hoạch đã lưu. Bạn vẫn có thể dự tính thử; chức năng lưu tạm thời chưa khả dụng.",
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const next = await storage.reload();
                  reset(next?.saved?.plan ?? emptySavingsPlan(data.asOf));
                } catch {
                  setFailure(
                    "Không tải lại được kế hoạch. Bản nháp vẫn được giữ.",
                  );
                }
              }}
            >
              {text("Bỏ bản nháp và tải lại")}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {!valid && (
        <Alert variant="destructive" className="col-span-12">
          <AlertDescription>
            {text(
              "Kiểm tra ngày hợp lệ, ngày trích không trước ngày nhận lương, và số tiền VND nguyên không âm. Khoảng dự tính phải có ít nhất một kỳ lương, tối đa 10 năm.",
            )}
          </AlertDescription>
        </Alert>
      )}
      {legacy && (
        <Alert className="col-span-12">
          <AlertDescription>
            {text(
              "Các khoản dư từ kế hoạch cũ được giữ để tham khảo, chưa được coi là lương hay tiết kiệm theo ngày. Hãy nhập lương thực nhận và tiền chi tháng sau để tính lại.",
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="col-span-12 grid gap-px bg-border lg:grid-cols-2">
        <Section
          title="Khoảng thời gian cụ thể"
          icon={CalendarClock}
          description="Các kỳ nhận lương được đặt vào ngày cuối cùng của từng tháng, kể cả tháng 2 và năm nhuận."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="projection-start">
                {text("Bắt đầu dự tính từ ngày")}
              </FieldLabel>
              <Input
                id="projection-start"
                type="date"
                value={plan.startDate}
                onChange={(event) =>
                  changePeriod(event.target.value, count || 6)
                }
              />
            </Field>
            <SelectField
              id="projection-duration"
              label="Số kỳ lương"
              value={String(count)}
              onChange={(value) => changePeriod(safeStart, Number(value))}
              options={[...new Set([3, 6, 12, 24, 36, 60, 120, count])]
                .filter((value) => value > 0)
                .sort((a, b) => a - b)
                .map((value) => ({
                  value: String(value),
                  label: text("{0} kỳ lương", [value]),
                }))}
            />
            <Field>
              <FieldLabel htmlFor="projection-end">
                {text("Dự tính đến hết ngày")}
              </FieldLabel>
              <Input
                id="projection-end"
                type="date"
                min={lastDay(safeStart.slice(0, 7))}
                max={lastDay(addMonths(safeStart.slice(0, 7), 119))}
                value={plan.endDate}
                onChange={(event) => {
                  setPlan({ ...plan, endDate: event.target.value });
                  setBulkTo(event.target.value);
                }}
              />
            </Field>
            <p className="self-end text-sm text-muted-foreground">
              {text("Kỳ lương đầu tiên")}:{" "}
              <strong>{fullDate(lastDay(safeStart.slice(0, 7)))}</strong>
              <br />
              {text("Mốc kết thúc")}: {fullDate(safePlan.endDate)}
            </p>
          </div>
        </Section>
        <Section
          title="Tiền đang có trước kỳ lương"
          icon={Wallet}
          description="Chỉ phần không phải giữ cho chi tiêu mới được tính vào tiền tiết kiệm ban đầu."
        >
          <SelectField
            id="projection-base"
            label="Nguồn tiền ban đầu"
            value={plan.baseMode}
            onChange={(value) =>
              setPlan({ ...plan, baseMode: value as SavingsPlan["baseMode"] })
            }
            options={[
              {
                value: "none",
                label: text("Bắt đầu từ 0 · chỉ tính tiền tiết kiệm từ lương"),
              },
              {
                value: "current",
                label: text("Lấy tiền hiện tại trong phạm vi theo dõi"),
              },
              { value: "manual", label: text("Tự nhập tổng tiền đang có") },
            ]}
          />
          {plan.baseMode === "manual" && (
            <Field className="mt-3">
              <FieldLabel htmlFor="projection-capital">
                {text("Tổng tiền đang có (VND)")}
              </FieldLabel>
              <Input
                id="projection-capital"
                type="number"
                min="0"
                step="1"
                value={plan.manualBase}
                onChange={(event) =>
                  setPlan({ ...plan, manualBase: event.target.value })
                }
              />
            </Field>
          )}
          {plan.baseMode !== "none" && (
            <Field className="mt-3">
              <FieldLabel htmlFor="projection-reserve">
                {text("Trong số tiền trên, cần giữ để chi tiêu (VND)")}
              </FieldLabel>
              <Input
                id="projection-reserve"
                type="number"
                min="0"
                step="1"
                value={plan.openingReserve}
                placeholder={text("Nhập 0 nếu không cần giữ lại")}
                onChange={(event) =>
                  setPlan({ ...plan, openingReserve: event.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                {text(
                  "Phần này chỉ tách khỏi vốn ban đầu, không trừ thêm lần nữa ở các kỳ lương.",
                )}
              </p>
            </Field>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            {text(
              "Vốn ban đầu phải là tiền đã có trước những kỳ lương đang dự tính. Không nhập lại khoản lương đã nằm trong số dư. Tiền dành cho Goals đã thuộc số dư, không cộng thêm lần nữa.",
            )}
          </p>
          {plan.baseMode === "current" && (
            <p className="mt-2 text-sm">
              {text("Số dư theo sổ tại ngày")} {fullDate(data.asOf)}:{" "}
              {totals.balanceKnown ? (
                <NumberTicker value={money(totals.tracked)} />
              ) : (
                text("Chưa đủ dữ liệu")
              )}
            </p>
          )}
          {plan.baseMode === "current" && !currentValid && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {text(
                "Chỉ dùng số dư đã xác nhận để lập kế hoạch từ ngày hiện tại trở đi. Hoặc tự nhập vốn tại thời điểm bắt đầu.",
              )}
            </p>
          )}
        </Section>
      </div>
      <div className="finance-metrics finance-metrics-three">
        <Metric
          label="Tiền tiết kiệm ban đầu"
          value={
            projection.initial === null
              ? text("Chưa đủ dữ liệu")
              : money(projection.initial)
          }
          detail={text("Sau khi tách tiền cần giữ để chi tiêu")}
          icon={Wallet}
          negative={projection.initial !== null && projection.initial < 0}
        />
        <Metric
          label="Tiết kiệm dự kiến đến ngày kết thúc"
          value={
            projection.end === null
              ? text("Chưa đủ ước tính")
              : money(projection.end)
          }
          detail={fullDate(safePlan.endDate)}
          icon={PiggyBank}
          negative={projection.end !== null && projection.end < 0}
        />
        <Metric
          label="Mục tiêu đã chọn"
          value={money(required)}
          detail={text("{0} mục tiêu · cùng một nguồn tiết kiệm", [
            targets.length,
          ])}
          icon={CalendarClock}
        />
      </div>
      <div className="col-span-12">
        <Section
          title="Tiền tiết kiệm tăng vào ngày nào?"
          icon={ChartNoAxesCombined}
          description="Đường bậc thang tăng đúng ngày trích tiết kiệm, không tăng dần trước ngày nhận lương."
        >
          <ChartContainer
            config={{
              surplus: {
                label: text("Trích tiết kiệm / bù ngân sách"),
                color: "var(--chart-2)",
              },
              balance: {
                label: text("Tiết kiệm tích lũy"),
                color: "var(--chart-3)",
              },
            }}
            className="h-80 w-full"
          >
            <ComposedChart
              accessibilityLayer
              data={projection.chart}
              margin={{ left: 8, right: 16, top: 12, bottom: 4 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                type="number"
                scale="time"
                dataKey="timestamp"
                domain={[
                  Date.parse(safePlan.startDate + "T00:00:00Z"),
                  endTimestamp,
                ]}
                tickFormatter={(value) =>
                  fullDate(new Date(Number(value)).toISOString().slice(0, 10))
                }
                minTickGap={36}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                width={70}
                tickFormatter={compactMoney}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip
                content={
                  <FinanceChartTooltip
                    series={[
                      {
                        key: "surplus",
                        label: text("Trích tiết kiệm / bù ngân sách"),
                        color: "var(--chart-2)",
                      },
                      {
                        key: "balance",
                        label: text("Tiết kiệm tích lũy"),
                        color: "var(--chart-3)",
                      },
                    ]}
                    labelFormatter={(value) =>
                      fullDate(
                        new Date(Number(value)).toISOString().slice(0, 10),
                      )
                    }
                  />
                }
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              {required > 0 && (
                <ReferenceLine
                  y={required}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{
                    value: text("Tổng mục tiêu"),
                    position: "insideTopRight",
                    fill: "var(--muted-foreground)",
                    fontSize: 12,
                  }}
                />
              )}
              <Bar
                dataKey="surplus"
                fill="var(--chart-2)"
                maxBarSize={24}
                isAnimationActive={false}
              />
              <Line
                type="stepAfter"
                dataKey="balance"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={count <= 12}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
          {projection.missingDate && (
            <p className="mt-3 text-sm text-muted-foreground">
              {text("Thiếu ước tính từ ngày")}{" "}
              <strong>{fullDate(projection.missingDate)}</strong>.{" "}
              {text(
                "Nhập rõ lương và tiền giữ chi tháng sau; nhập 0 nếu khoản đó bằng 0.",
              )}
            </p>
          )}
        </Section>
      </div>
      <div className="col-span-12">
        <Section
          title="Chi tiết từng kỳ nhận lương"
          description="Tiết kiệm dự kiến = lương thực nhận − tiền giữ cho tháng kế tiếp. Giữ tiền chi tiêu chưa phải là giao dịch chi thực tế."
        >
          <div className="mb-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Field>
              <FieldLabel htmlFor="projection-fill-from">
                {text("Ngày lương từ")}
              </FieldLabel>
              <Input
                id="projection-fill-from"
                type="date"
                value={bulkFrom}
                onChange={(event) => setBulkFrom(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="projection-fill-to">
                {text("Đến ngày")}
              </FieldLabel>
              <Input
                id="projection-fill-to"
                type="date"
                value={bulkTo}
                onChange={(event) => setBulkTo(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="projection-fill-income">
                {text("Lương thực nhận (VND)")}
              </FieldLabel>
              <Input
                id="projection-fill-income"
                type="number"
                min="0"
                step="1"
                value={bulkIncome}
                onChange={(event) => setBulkIncome(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="projection-fill-spending">
                {text("Giữ chi tháng sau (VND)")}
              </FieldLabel>
              <Input
                id="projection-fill-spending"
                type="number"
                min="0"
                step="1"
                value={bulkSpending}
                onChange={(event) => setBulkSpending(event.target.value)}
              />
            </Field>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const income = planAmount(bulkIncome),
                    spending = planAmount(bulkSpending);
                  if (
                    !validDate(bulkFrom) ||
                    !validDate(bulkTo) ||
                    bulkFrom < safePlan.startDate ||
                    bulkTo > safePlan.endDate ||
                    bulkFrom > bulkTo ||
                    income === null ||
                    spending === null ||
                    income < 0 ||
                    spending < 0
                  )
                    throw new Error();
                  const months = payrollMonths(bulkFrom, bulkTo);
                  if (!months.length) throw new Error();
                  const cycles = { ...plan.cycles };
                  for (const month of months) {
                    const prior = cycleFor(plan, month);
                    cycles[month] = {
                      ...prior,
                      income: bulkIncome,
                      spending: bulkSpending,
                      savingDate:
                        spending > income ? lastDay(month) : prior.savingDate,
                    };
                  }
                  setPlan({ ...plan, cycles });
                  setFailure("");
                } catch {
                  setFailure(
                    "Chọn khoảng ngày có ít nhất một kỳ lương trong kế hoạch và nhập số tiền VND nguyên không âm.",
                  );
                }
              }}
            >
              {text("Áp dụng cho các kỳ lương")}
            </Button>
          </div>
          <FeatureDataTable
            label={text("Lương, chi tháng sau và tiết kiệm theo ngày")}
            data={tableRows}
            columns={columns}
            empty={<p>{text("Chọn khoảng ngày có kỳ lương để bắt đầu.")}</p>}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            {text(
              "Có thể sửa riêng mỗi kỳ sau khi áp dụng hàng loạt. Ngày trích mặc định là ngày nhận lương; bạn có thể chọn ngày muộn hơn. Nếu tiền chi lớn hơn lương, phần thiếu được bù từ tiền tích lũy ngay ngày nhận lương.",
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {text(
              "Tiền giữ cho tháng sau đã được tách khỏi khoản tiết kiệm, không tiếp tục trừ lại khi sang tháng mới. Khoản trích sau ngày kết thúc chưa được tính vào tổng của kế hoạch.",
            )}
          </p>
        </Section>
      </div>
      <div className="col-span-12">
        <Section
          title="Ngày dự kiến đủ tiền cho mục tiêu"
          description="Chọn và sắp thứ tự mục tiêu. Mốc sau phải đủ tiền cho cả mục tiêu đó và những mục tiêu đứng trước."
        >
          {!data.goals.length && (
            <p className="text-sm text-muted-foreground">
              {text("Tạo mục tiêu ở trang Mục tiêu tiết kiệm để so sánh.")}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            {data.goals.map((goal) => (
              <label
                key={goal.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={plan.goalIds.includes(goal.id)}
                  onCheckedChange={() => toggleGoal(goal.id)}
                />
                {goal.name}
              </label>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {targets.map((goal, index) => (
              <div key={goal.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">
                    {index + 1}. {goal.name}
                  </h3>
                  <div className="flex gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      disabled={index === 0}
                      aria-label={text("Tăng ưu tiên {0}", [goal.name])}
                      onClick={() => moveGoal(goal.id, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      disabled={index === targets.length - 1}
                      aria-label={text("Giảm ưu tiên {0}", [goal.name])}
                      onClick={() => moveGoal(goal.id, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  {text("Giá trị mục tiêu")}:{" "}
                  <NumberTicker value={money(goal.target)} />
                </p>
                <p className="text-sm text-muted-foreground">
                  {text("Tổng tiết kiệm cần đạt")}:{" "}
                  <NumberTicker value={money(goal.required)} />
                </p>
                <p className="mt-3 font-semibold">
                  {goal.reachedDate
                    ? fullDate(goal.reachedDate)
                    : text(
                        projection.missingDate || projection.initial === null
                          ? "Chưa thể kết luận · thiếu ước tính"
                          : "Chưa đạt trong khoảng đã nhập",
                      )}
                </p>
                {goal.reached === "initial" && (
                  <p className="text-xs text-muted-foreground">
                    {text("Đủ từ tiền tiết kiệm ban đầu")}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {text("Hạn mục tiêu")}: {fullDate(goal.deadline)}
                  {goal.reachedDate
                    ? ` · ${text(goal.reachedDate > goal.deadline ? "Sau hạn mục tiêu" : "Đúng hoặc trước hạn mục tiêu")}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {text(
              "Đây là ngày lần đầu đủ tiền tiết kiệm theo giả định, chưa phải khoản chi mua mục tiêu. Mức góp/tháng trong Goals không tự cộng thêm vào kế hoạch này.",
            )}
          </p>
        </Section>
      </div>
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text("Xóa kế hoạch dòng tiền?")}</DialogTitle>
            <DialogDescription>
              {text(
                "Chỉ xóa các ước tính đã lưu. Giao dịch, số dư và các mục tiêu tiết kiệm được giữ nguyên.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={storage.busy}
              onClick={() => setDeleting(false)}
            >
              {text("Hủy")}
            </Button>
            <Button
              variant="destructive"
              disabled={storage.busy}
              onClick={async () => {
                try {
                  await storage.remove();
                  reset(emptySavingsPlan(data.asOf));
                  setDeleting(false);
                } catch {
                  setFailure("Không xóa được kế hoạch. Bản nháp vẫn được giữ.");
                  setDeleting(false);
                }
              }}
            >
              {text("Xóa kế hoạch")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FinanceBoard>
  );
}
