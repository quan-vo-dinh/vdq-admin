"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { cloneElement, useState, useSyncExternalStore, useRef, useEffect } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import { useTheme } from "next-themes";
import { ProviderTitle } from "./brand-icon";
import { useDeveloper } from "@/app/context/developer-context";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Panel, useDeveloperLocale } from "./shared";
// GitHub-style contribution levels, from no activity to highest activity.
const heatmapTheme = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};
const subscribeHydration = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function GitHubAnalytics() {
  const { data, githubAccount: account } = useDeveloper();
  const { text, language } = useDeveloperLocale();
  const { resolvedTheme } = useTheme();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    clientSnapshot,
    serverSnapshot,
  );
  const calendarRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const container=calendarRef.current?.querySelector<HTMLElement>('.react-activity-calendar__scroll-container');
    if(container)container.scrollLeft=container.scrollWidth;
  },[data.githubCalendar?.length, account]);
  const [selected, setSelected] = useState<string | null>(null);
  const yearRows = (data.githubCalendar ?? data.contributions).filter(
    (r) => account === "all" || r.sourceId === account,
  );
  const cells = Array.from({ length: 365 }, (_, i) => {
    const date = new Date(
      Date.parse(`${data.snapshot}T12:00:00Z`) - (364 - i) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
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
  const selectedRows = yearRows.filter(
    (r) => r.date === selected && (account === "all" || r.sourceId === account),
  );
  return (
    <div className="flex flex-col gap-3 px-6 py-3">
      <Panel
        title={
          <ProviderTitle provider="GitHub">
            {text(
              "Lịch đóng góp · 365 ngày",
              "Contribution calendar · 365 days",
            )}
          </ProviderTitle>
        }
        description={text(
          "Chọn ngày để xem hoạt động đã thu thập theo tài khoản.",
          "Select a day for collected activity by account.",
        )}
        footer={
          <p className="text-xs text-muted-foreground">
            {text(
              "Lịch đóng góp theo GitHub; chi tiết hoạt động theo repository đã chọn.",
              "GitHub contribution calendar; activity details cover selected repositories.",
            )}
          </p>
        }
      >
        <div ref={calendarRef} className="min-w-0">
        <ActivityCalendar
          data={cells}
          className="developer-heatmap"
          blockSize={13}
          blockMargin={4}
          fontSize={14}
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
              "{{count}} contributions trong 365 ngày",
              "{{count}} contributions in 365 days",
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
        </div>
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
              {text("Contributions theo nguồn", "Contributions by source")}
            </DialogDescription>
          </DialogHeader>
          {selectedRows.map((r) => (
            <div key={r.sourceId} className="flex justify-between gap-4">
              <span>{data.sources.find((s) => s.id === r.sourceId)?.name}</span>
              <Badge variant="secondary">
                <NumberTicker value={r.count} />
              </Badge>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
