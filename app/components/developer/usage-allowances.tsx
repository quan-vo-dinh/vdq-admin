"use client";
import { useDeveloper } from "@/app/context/developer-context";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "./brand-icon";
import { useDeveloperLocale } from "./shared";
import { quotaState } from "@/lib/developer/codex/analytics";
import { cn } from "@/lib/utils";

export function UsageAllowances() {
  const { data } = useDeveloper();
  const { text, language } = useDeveloperLocale();
  const number = (value: number) =>
    new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-GB", {
      maximumFractionDigits: 2,
    }).format(value);
  const time = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleString(language === "vi" ? "vi-VN" : "en-GB", {
          timeZone: "Asia/Ho_Chi_Minh",
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const accounts = data.codexAccounts ?? [];
  return (
    <div className="divide-y divide-border">
      {!accounts.length && (
        <p className="p-4 text-sm text-muted-foreground">
          {text("Chưa có tài khoản Codex.", "No Codex accounts connected.")}
        </p>
      )}
      {accounts.map((account) => {
        const online = (account.onlineDeviceCount ?? 0) > 0;
        const status = account.paused
          ? text("Tạm dừng", "Paused")
          : !account.deviceCount
            ? text("Chưa ghép Mac", "No Mac paired")
            : online
              ? text("Mac online", "Mac online")
              : text("Mac offline", "Mac offline");
        return (
          <section
            key={account.id}
            className="space-y-3 p-4"
            aria-label={account.name}
          >
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <BrandIcon brand="codex" />
                  {account.name}
                  <Badge variant="outline">
                    {account.plan
                      ? account.plan[0].toUpperCase() + account.plan.slice(1)
                      : "—"}
                  </Badge>
                </h3>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {account.identityLabel ?? "—"}
                </p>
              </div>
              <Badge variant="secondary">{status}</Badge>
            </header>
            <div className="grid grid-cols-2 gap-4">
              {account.quotaWindows.map((window) => {
                const state = quotaState(window, account.quotaObservedAt);
                const duration =
                  window.windowDurationMins === 10080
                    ? text("Hàng tuần", "Weekly")
                    : window.windowDurationMins % 60 === 0
                      ? `${number(window.windowDurationMins / 60)} ${text("giờ", "hours")}`
                      : `${number(window.windowDurationMins)} ${text("phút", "minutes")}`;
                const stale = state.stale || state.expired;
                return (
                  <div
                    key={`${window.bucket}:${window.kind}`}
                    className="min-w-0 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                      <span className="font-medium">
                        {duration}
                        {window.bucket !== "codex" && ` · ${window.bucket}`}
                      </span>
                      <span>
                        <strong>{number(window.usedPercent)}%</strong>{" "}
                        {text("đã dùng", "used")} ·{" "}
                        <strong>
                          {state.expired ? "—" : `${number(state.remaining)}%`}
                        </strong>{" "}
                        {text("còn lại", "remaining")}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={state.expired ? undefined : state.remaining}
                      aria-label={`${account.name} · ${duration} · ${text("còn lại", "remaining")}`}
                      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", stale && "opacity-60")}
                    >
                      {!state.expired && <div className="h-full rounded-full transition-[width,background-color]" style={{width:`${state.remaining}%`,backgroundColor:`hsl(${state.remaining * 1.2} 75% 42%)`}} />}
                    </div>
                    <div className="flex flex-wrap justify-between gap-1 text-xs text-muted-foreground">
                      <span>
                        {text("Đặt lại", "Resets")}: {time(window.resetsAt)}
                      </span>
                      {stale && (
                        <span>
                          {state.expired
                            ? text(
                                "Đã qua giờ reset · chờ cập nhật",
                                "Reset passed · awaiting update",
                              )
                            : text("Số liệu cũ", "Stale observation")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {!account.quotaWindows.length && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  {text(
                    "Chưa nhận được hạn mức từ Codex.",
                    "No quota received from Codex.",
                  )}
                </p>
              )}
            </div>
            {(account.usageStatus !== "ok" || account.quotaStatus !== "ok") && (
              <p className="text-xs text-muted-foreground">
                {text("Trạng thái nguồn", "Source status")}: Usage{" "}
                {account.usageStatus} · Quota {account.quotaStatus}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
