"use client";
import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { RefreshCw, Download, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeveloper } from "@/app/context/developer-context";
import { Choice, Status, downloadText, useDeveloperLocale } from "./shared";
import { ProviderTitle } from "./brand-icon";
import { reportText, SNAPSHOT } from "@/lib/developer/model";
import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import { cn } from "@/lib/utils";
function QuickTools() {
  const path = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const { data, days, setDays, reload, isValidating } = useDeveloper();
  const { text, language } = useDeveloperLocale();
  const [panel, setPanel] = useState<string | null | undefined>(undefined);
  const activePanel = panel ?? query.get("panel");
  const content = reportText(data, days, language);
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex gap-1" aria-label="Developer">
          <Button
            size="sm"
            variant={path === "/developer" ? "secondary" : "ghost"}
            render={<Link href="/developer" />}
            nativeButton={false}
          >
            {text("Tổng quan", "Overview")}
          </Button>
          <Button
            size="sm"
            variant={path === "/developer/ai" ? "secondary" : "ghost"}
            render={<Link href="/developer/ai" />}
            nativeButton={false}
          >
            AI Usage
          </Button>
        </nav>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={text("Tải lại mẫu", "Reload demo")}
          disabled={isValidating}
          onClick={reload}
        >
          <RefreshCw
            className={cn(
              isValidating && "animate-spin motion-reduce:animate-none",
            )}
          />
        </Button>
        <Choice
          label={text("Khoảng thời gian", "Date range")}
          value={String(days)}
          onChange={(v) => setDays(Number(v))}
          items={[
            { value: "1", label: text("Hôm nay", "Today") },
            { value: "7", label: text("7 ngày", "7 days") },
            { value: "30", label: text("30 ngày", "30 days") },
          ]}
        />
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={text("Nguồn dữ liệu", "Data sources")}
          onClick={() => setPanel("sources")}
        >
          <Database />
        </Button>
        <Button size="sm" onClick={() => setPanel("reports")}>
          <FileText data-icon="inline-start" />
          {text("Báo cáo", "Report")}
        </Button>
      </div>
      <Dialog
        open={activePanel === "reports" || activePanel === "sources"}
        onOpenChange={(open) => {
          if (!open) {
            setPanel(null);
            const next = new URLSearchParams(query.toString());
            next.delete("panel");
            router.replace(`${path}${next.size ? `?${next}` : ""}`, {
              scroll: false,
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activePanel === "reports"
                ? text("Báo cáo hoạt động", "Activity report")
                : text("Nguồn dữ liệu", "Data sources")}
            </DialogTitle>
            <DialogDescription>
              {text(
                "Dữ liệu mẫu · 16/10/2026, 09:00 GMT+7",
                "Demo snapshot · 16 October 2026, 09:00 GMT+7",
              )}
            </DialogDescription>
          </DialogHeader>
          {activePanel === "reports" ? (
            <>
              <p className="whitespace-pre-wrap text-sm leading-6">{content}</p>
              <DialogFooter>
                <Button
                  onClick={() =>
                    downloadText(
                      content,
                      `developer-report-${SNAPSHOT}-${days}d.txt`,
                    )
                  }
                >
                  <Download data-icon="inline-start" />
                  {text("Tải báo cáo .txt", "Download report .txt")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {data.sources.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <ProviderTitle provider={s.provider}>
                      {s.name}
                    </ProviderTitle>
                    <Status status={s.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.observedAt?.slice(0, 16).replace("T", " ")} GMT+7 ·{" "}
                    {s.detail}
                  </p>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                {text(
                  "Chưa kết nối tài khoản thật. Claude chat chưa có dữ liệu; nguồn Claude Code là minh họa. Token, quota và chi phí là các đại lượng riêng.",
                  "No live accounts connected. Claude chat is unavailable; Claude Code is illustrative. Tokens, quota and costs are distinct metrics.",
                )}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function DeveloperShell({ children }: { children: ReactNode }) {
  const { error } = useDeveloper();
  const { text } = useDeveloperLocale();
  return (
    <div className="developer-workspace flex min-w-0 flex-col gap-4">
      <div className="-mb-3 flex flex-wrap items-center justify-between gap-4 pb-1">
        <PersonalizedIntro compact />
        <Suspense fallback={<Skeleton className="h-8 w-64" />}>
          <QuickTools />
        </Suspense>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {text(
              "Không tải được dữ liệu. Đang dùng dữ liệu dự phòng; thử tải lại.",
              "Data request failed. Showing fallback data; try reloading.",
            )}
          </AlertDescription>
        </Alert>
      )}
      {children}

    </div>
  );
}
