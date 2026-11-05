"use client";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useDeveloper } from "@/app/context/developer-context";
import { useDeveloperLocale } from "./shared";
import {
  usageRows,
  usageTotal,
  quotaState,
} from "@/lib/developer/codex/analytics";
import { Badge } from "@/components/ui/badge";
export function CodexTrend({
  source = "all",
  days: range,
}: {
  source?: string;
  days?: number;
}) {
  const { data, days } = useDeveloper(),
    { text, language } = useDeveloperLocale();
  const fullNumber = (value:number) => new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-GB").format(value);
  const observed = usageRows(data, range ?? days, source);
  const accounts = (data.codexAccounts ?? []).map((account,index)=>({id:account.id,name:account.name,key:`account${index}`,color:["#3B82F6","#D97757","#10B981","#8B5CF6"][index % 4]})).filter(account=>source === "all" || account.id === source);
  const dates = [...new Set(observed.map(row=>row.date))].sort();
  const values = new Map(observed.map(row=>[`${row.sourceId}:${row.date}`,row.tokens]));
  const rows = dates.map(date=>({date,...Object.fromEntries(accounts.map(account=>[account.key,values.get(`${account.id}:${date}`)??null]))}));
  const config = Object.fromEntries(accounts.map(account=>[account.key,{label:account.name,color:account.color}]));
  if (!observed.length)
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        {text(
          "Chưa có usage trong khoảng ngày này.",
          "No usage in this date range.",
        )}
      </div>
    );
  return (
    <ChartContainer
      config={config}
      className="developer-chart h-64 w-full"
      style={{height:215}}
    >
      <LineChart
        accessibilityLayer
        data={rows}
        margin={{ top: 8, right: 4, bottom: 0, left: -10 }}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} tickLine={false} axisLine={false} minTickGap={25} tickMargin={10} />
        <YAxis tickFormatter={(v) => fullNumber(Number(v))} width={105} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {accounts.map(account=><Line
          key={account.id}
          name={account.key}
          isAnimationActive={false}
          connectNulls
          type="linear"
          dataKey={account.key}
          stroke={account.color}
          strokeWidth={1.5}
          dot={observed.filter(row=>row.sourceId===account.id).length === 1}
        />)}
      </LineChart>
    </ChartContainer>
  );
}
export function CodexQuota({ source = "all" }: { source?: string }) {
  const { data } = useDeveloper(),
    { text, language } = useDeveloperLocale();
  const accounts = (data.codexAccounts ?? []).filter(
    (a) => source === "all" || a.id === source,
  );
  const time = (value: string) =>
    new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  if (!accounts.length)
    return (
      <p className="p-4 text-sm text-muted-foreground">
        {text(
          "Thêm tài khoản Codex trong Kết nối.",
          "Add a Codex account in Connections.",
        )}
      </p>
    );
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="min-w-0 space-y-3 rounded-xl border p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{account.name}</span>
            <Badge variant="outline">{account.plan ?? "—"}</Badge>
          </div>
          {account.quotaStatus !== "ok" && (
            <p className="text-xs text-muted-foreground">
              {text("Lần lấy quota gần nhất", "Latest quota request")}:{" "}
              {account.quotaStatus}
            </p>
          )}
          {account.paused && (
            <p className="text-xs text-muted-foreground">
              {text("Đã tạm dừng", "Paused")}
            </p>
          )}
          {account.quotaWindows.length ? (
            account.quotaWindows.map((window) => {
              const state = quotaState(window, account.quotaObservedAt);
              return (
                <div
                  key={`${window.bucket}:${window.kind}`}
                  className="space-y-1"
                >
                  <p className="text-xs text-muted-foreground">
                    {window.bucket} · {window.kind} ·{" "}
                    {window.windowDurationMins} {text("phút", "min")}
                  </p>
                  <div className="flex justify-between gap-2 text-sm">
                    <span>
                      {window.usedPercent}% {text("đã dùng", "used")}
                    </span>
                    <strong>
                      {state.remaining}% {text("còn lại", "left")}
                    </strong>
                  </div>
                  <meter
                    min={0}
                    max={100}
                    value={window.usedPercent}
                    className="h-2 w-full"
                    aria-label={`${window.bucket} ${window.kind}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {text("Reset", "Resets")}:{" "}
                    {window.resetsAt ? time(window.resetsAt) : "—"}
                  </p>
                  {(state.stale || state.expired) && (
                    <p className="text-xs text-muted-foreground">
                      {state.expired
                        ? text(
                            "Đã qua giờ reset; chờ số liệu mới.",
                            "Reset time passed; awaiting a new observation.",
                          )
                        : text(
                            "Số liệu chưa được cập nhật gần đây.",
                            "Observation is stale.",
                          )}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              {text("Chưa có quota", "Quota unavailable")} ·{" "}
              {account.quotaStatus}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {text("Quan sát quota", "Quota observed")}:{" "}
            {account.quotaObservedAt ? time(account.quotaObservedAt) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}
export function CodexPeriod({ source = "all" }: { source?: string }) {
  const { data, days } = useDeveloper(),
    { text, number } = useDeveloperLocale();
  const rows = usageRows(data, days, source),
    total = usageTotal(rows);
  return (
    <div className="flex flex-wrap gap-4 rounded-xl border p-4">
      <div>
        <p className="text-xs text-muted-foreground">
          {text("Tổng token trong kỳ", "Tokens in period")}
        </p>
        <p className="text-2xl font-semibold">
          {total === null ? "—" : number(total)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {text("Ngày có dữ liệu", "Days with data")}
        </p>
        <p className="text-2xl font-semibold">
          {new Set(rows.map((r) => r.date)).size} / {days}
        </p>
      </div>
      <p className="basis-full text-xs text-muted-foreground">
        {text(
          "Ngày theo bucket do Codex cung cấp. Ngày thiếu dữ liệu không được coi là 0 token.",
          "Dates follow Codex buckets. Missing days are not treated as zero tokens.",
        )}
      </p>
    </div>
  );
}
