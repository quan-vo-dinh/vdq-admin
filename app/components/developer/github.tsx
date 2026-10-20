"use client";
import { cloneElement, useState, useSyncExternalStore } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { useTheme } from "next-themes";
import { ProviderTitle } from "./brand-icon";
import { useDeveloper } from "@/app/context/developer-context";
import { selectContributions } from "@/lib/developer/model";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Panel, Choice, useDeveloperLocale } from "./shared";
// GitHub-style contribution levels, from no activity to highest activity.
const heatmapTheme = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};
const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function GitHubAnalytics() {
  const { data, days } = useDeveloper();
  const { text, number, language } = useDeveloperLocale();
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribeHydration, clientSnapshot, serverSnapshot);
  const [account, setAccount] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const yearRows = data.contributions.filter(
    (r) => account === "all" || r.sourceId === account,
  );
  const rows = selectContributions(data, days, account);
  const count = rows.reduce((n, d) => n + d.count, 0);
  const cells = Array.from({ length: 289 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    const count = yearRows
      .filter((r) => r.date === date)
      .reduce((n, r) => n + r.count, 0);
    return {
      date,
      count,
      level:
        count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : count < 45 ? 3 : 4,
    };
  });
  const selectedRows = yearRows.filter((r) => r.date === selected);
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Choice
          label={text("Tài khoản GitHub", "GitHub account")}
          value={account}
          onChange={setAccount}
          items={[
            { value: "all", label: text("Gộp hai tài khoản", "Both accounts") },
            ...data.sources
              .filter((s) => s.provider === "GitHub")
              .map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <Badge variant="outline">
          {number(count)} contributions / {days} {text("ngày", "days")}
        </Badge>
      </div>
      <Panel
        title={
          <ProviderTitle provider="GitHub">
            {text("Lịch đóng góp · 2026", "Contribution calendar · 2026")}
          </ProviderTitle>
        }
        description={text(
          "Năm 2026 đến 16/10 · chọn ngày để xem từng tài khoản.",
          "2026 through October 16 · select a day for account details.",
        )}
        footer={
          <p className="text-xs text-muted-foreground">
            {text(
              "Gộp theo ngày, chưa khử trùng giữa hai danh tính; Work thiếu dữ liệu private.",
              "Summed by day without cross-account deduplication; Work private coverage is partial.",
            )}
          </p>
        }
      >
        <ActivityCalendar
          data={cells}
          className="developer-heatmap"
          blockSize={13}
          blockMargin={4}
          fontSize={12}
          weekStart={1}
          showWeekdayLabels={["mon", "wed", "fri"]}
          colorScheme={hydrated && resolvedTheme === "dark" ? "dark" : "light"}
          theme={heatmapTheme}
          labels={{
            months:
              language === "vi"
                ? Array.from({ length: 12 }, (_, i) => `Th${i + 1}`)
                : [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
            weekdays:
              language === "vi"
                ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]
                : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            totalCount: text(
              "{{count}} contributions quan sát trong năm {{year}}",
              "{{count}} observed contributions in {{year}}",
            ),
            legend: { less: text("Ít", "Less"), more: text("Nhiều", "More") },
          }}
          renderBlock={(block, activity) =>
            cloneElement(block, {
              role: "button",
              tabIndex: 0,
              "aria-label": `${activity.date}: ${activity.count} contributions`,
              onClick: () => setSelected(activity.date),
              onKeyDown: (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(activity.date);
                }
              },
              children: (
                <title>{`${activity.date}: ${activity.count} contributions`}</title>
              ),
            })
          }
        />
      </Panel>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{selected}</DialogTitle>
            <DialogDescription>
              {text(
                "Contributions theo nguồn",
                "Contributions by source",
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRows.map((r) => (
            <div key={r.sourceId} className="flex justify-between gap-4">
              <span>{data.sources.find((s) => s.id === r.sourceId)?.name}</span>
              <Badge variant="secondary">{r.count}</Badge>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
