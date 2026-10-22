"use client";
import { useFinanceLocale } from "./locale";
import type { ReactNode } from "react";
import Link from "@/lib/platform/link";
import {
  ArrowUpRight,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { DashboardCard } from "@/app/components/shared/dashboard-card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { NumberTicker } from "./number-ticker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { useFinance } from "@/app/context/finance-context";
import { Progress } from "@/components/ui/progress";
import type { FinanceTone } from "./appearance";
import { ChartContainer } from "@/components/ui/chart";
import { AreaChart, Area } from "recharts";
import { FinanceHeading } from "./heading";

export function FinanceIcon({
  icon: Icon,
  tone = "balance",
  size = "default",
}: {
  icon: LucideIcon;
  tone?: FinanceTone;
  size?: "sm" | "default";
}) {
  return (
    <span
      data-finance-icon
      data-finance-tone={tone}
      data-size={size}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}
export function FinanceBadge({
  children,
  tone = "neutral",
  icon: Icon,
}: {
  children: ReactNode;
  tone?: FinanceTone;
  icon?: LucideIcon;
}) {
  return (
    <Badge variant="outline" data-finance-badge data-finance-tone={tone}>
      {Icon && <Icon data-icon="inline-start" aria-hidden="true" />}
      <span data-finance-value>{children}</span>
    </Badge>
  );
}
export function FinanceProgress({
  tone = "goal",
  ...props
}: React.ComponentProps<typeof Progress> & { tone?: FinanceTone }) {
  return <Progress {...props} data-finance-progress data-finance-tone={tone} />;
}

export function Section({
  title,
  description,
  action,
  children,
  className,
  icon: Icon,
  tone = "balance",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
  tone?: FinanceTone;
}) {
  const { text } = useFinanceLocale();
  return (
    <DashboardCard
      data-finance-surface="panel"
      className={cn("min-w-0", className)}
    >
      <CardHeader className="finance-panel-header">
        <CardTitle className="flex min-w-0 items-center gap-2">
          {Icon && <FinanceIcon icon={Icon} tone={tone} size="sm" />}
          <FinanceHeading>{text(title)}</FinanceHeading>
        </CardTitle>
        {description && <CardDescription>{text(description)}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </DashboardCard>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon: Icon,
  negative,
  series,
  tone = "balance",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  negative?: boolean;
  series?: number[];
  tone?: FinanceTone;
}) {
  const { text } = useFinanceLocale();
  return (
    <DashboardCard
      size="sm"
      data-finance-surface="metric"
      data-finance-tone={negative ? "danger" : tone}
    >
      <CardHeader>
        <CardDescription>{text(label)}</CardDescription>
        <CardAction>
          <FinanceIcon
            icon={Icon}
            tone={negative ? "danger" : tone}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p
          data-finance-value
          className={cn(
            "text-xl font-semibold tracking-tight tabular-nums sm:text-2xl",
            negative && "text-destructive",
          )}
        >
          <NumberTicker value={value} />
        </p>
        <p className="text-sm text-muted-foreground">{text(detail)}</p>
        {series && series.length > 1 && (
          <ChartContainer
            config={{
              value: { label: text(label), color: "var(--foreground)" },
            }}
            className="finance-metric-sparkline"
            aria-hidden="true"
          >
            <AreaChart
              data={series.map((value) => ({ value }))}
              margin={{ top: 3, bottom: 0, left: 0, right: 0 }}
            >
              <Area
                type="stepAfter"
                dataKey="value"
                stroke="var(--foreground)"
                fill="var(--foreground)"
                fillOpacity={0.04}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </DashboardCard>
  );
}
export function FinanceLink({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: "ghost" | "outline";
}) {
  return (
    <Link href={href} className={buttonVariants({ variant, size: "sm" })}>
      {children}
      <ArrowUpRight data-icon="inline-end" />
    </Link>
  );
}
export function MoneyInput({
  id,
  label,
  value,
  onChange,
  description,
  min = 0,
  max = 1_000_000_000,
  sliderMax,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  min?: number;
  max?: number;
  sliderMax?: number;
}) {
  const { text, number } = useFinanceLocale();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{text(label)}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          inputMode="numeric"
          autoComplete="off"
          required
          value={number(value, { maximumFractionDigits: 0 })}
          onChange={(e) => {
            const next = Number(e.target.value.replace(/[^0-9]/g, ""));
            if (Number.isFinite(next))
              onChange(Math.min(max, Math.max(min, Math.round(next))));
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>₫</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {sliderMax !== undefined && (
        <Slider
          aria-label={text(label)}
          value={[value]}
          min={min}
          max={Math.max(sliderMax, value)}
          step={100_000}
          onValueChange={(v) =>
            onChange(
              Math.min(
                max,
                Math.max(min, Math.round(Array.isArray(v) ? v[0] : v)),
              ),
            )
          }
        />
      )}
      {description && <FieldDescription>{text(description)}</FieldDescription>}
    </Field>
  );
}
export function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: LucideIcon }[];
}) {
  const { text } = useFinanceLocale();
  return (
    <ToggleGroup
      aria-label={text(label)}
      className="max-w-full overflow-x-auto"
      variant="outline"
      size="sm"
      value={[value]}
      onValueChange={(values) => {
        if (values[0]) onChange(String(values[0]));
      }}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value}>
          {o.icon && <o.icon data-icon="inline-start" aria-hidden="true" />}
          {text(o.label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const { text } = useFinanceLocale();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{text(label)}</FieldLabel>
      <Select
        items={options.map((o) => ({ ...o, label: text(o.label) }))}
        value={value}
        onValueChange={(v) => {
          if (v !== null) onChange(v);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent data-finance-typography>
          <SelectGroup>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {text(o.label)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}
export function NoResults({
  title = "Chưa có dữ liệu phù hợp",
  description = "Thử đổi kỳ hoặc bỏ bớt bộ lọc để xem thêm.",
}: {
  title?: string;
  description?: string;
}) {
  const { text } = useFinanceLocale();
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle><FinanceHeading as="span">{text(title)}</FinanceHeading></EmptyTitle>
        <EmptyDescription>{text(description)}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
export function AmountRow({
  label,
  amount,
  emphasis = false,
  tone,
  icon: Icon,
}: {
  label: string;
  amount: number;
  emphasis?: boolean;
  tone?: FinanceTone;
  icon?: LucideIcon;
}) {
  const { text, money } = useFinanceLocale();
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2 text-sm",
        emphasis && "font-semibold",
      )}
    >
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
        {text(label)}
      </span>
      <span
        data-finance-value={tone || emphasis ? "" : undefined}
        data-finance-tone={
          amount < 0 && emphasis ? "danger" : (tone ?? "balance")
        }
        className={cn(
          "tabular-nums",
          amount < 0 && emphasis && "text-destructive",
        )}
      >
        {money(amount)}
      </span>
    </div>
  );
}
export function PlanBadge() {
  const { text } = useFinanceLocale();
  return (
    <FinanceBadge tone="goal" icon={FlaskConical}>
      {text("Giả định")}
    </FinanceBadge>
  );
}
export function MonthPicker() {
  const { text, date: formatDate } = useFinanceLocale();
  const { month, setMonth, period, periodMode, setPeriodMode } = useFinance();
  const modes=[{value:"calendar",label:text("Tháng lịch")},{value:"recent-month",label:text("1 tháng gần đây")}];
  const { text, date: formatDate } = useFinanceLocale();
  const { month, setMonth, period, periodMode, setPeriodMode } = useFinance();
  const modes=[{value:"calendar",label:text("Tháng lịch")},{value:"recent-month",label:text("1 tháng gần đây")}];
  const shift = (amount: number) => {
    const date = new Date(`${month}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + amount);
    setMonth(date.toISOString().slice(0, 7));
  };
  return <div role="group" aria-label={text("Kỳ báo cáo")} className="finance-period flex min-w-0 flex-wrap items-center gap-2">
    <Select items={modes} value={periodMode} onValueChange={value=>{if(value==="calendar"||value==="recent-month")setPeriodMode(value);}}>
      <SelectTrigger aria-label={text("Loại kỳ báo cáo")}><SelectValue /></SelectTrigger>
      <SelectContent><SelectGroup>{modes.map(mode=><SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>
    {periodMode==="calendar" ? <>
      <Button variant="outline" size="icon" aria-label={text("Kỳ trước")} disabled={month === '0001-01'} onClick={() => shift(-1)}><ChevronLeft /></Button>
      <Input type="month" aria-label={text("Kỳ báo cáo")} className="w-auto min-w-0" min="0001-01" max="9999-12" value={month}
        onChange={event => { const value = event.target.value; if (/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(value) && value >= '0001-01') setMonth(value); }} />
      <Button variant="outline" size="icon" aria-label={text("Kỳ sau")} disabled={month === '9999-12'} onClick={() => shift(1)}><ChevronRight /></Button>
    </> : typeof period!=="string" && <span className="text-sm text-muted-foreground" role="status">{formatDate(period.from)} – {formatDate(period.to)}</span>}
  </div>;
}
