"use client";
import { Suspense, useState, type ReactNode } from "react";
import Link from "@/lib/platform/link";
import { usePathname, useSearchParams, useRouter } from "@/lib/platform/navigation";
import { RefreshCw, Download, Database, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useDeveloper } from "@/app/context/developer-context";
import { Choice, downloadText, useDeveloperLocale } from "./shared";
import { DeveloperConnections } from "./connections";
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
          <Button size="sm" variant={path === "/developer/feed" ? "secondary" : "ghost"} render={<Link href="/developer/feed" />} nativeButton={false}>Developer Feed</Button>
        </nav>
        {path !== "/developer/feed" && <>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label={text("Tải lại", "Reload")}
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
          size="sm"
          variant={path === "/developer/connections" ? "secondary" : "outline"}
          render={<Link href="/developer/connections" />}
          nativeButton={false}
        >
          <Database data-icon="inline-start" />
          {text("Kết nối", "Connections")}
        </Button>
        <Button size="sm" onClick={() => setPanel("reports")}>
          <FileText data-icon="inline-start" />
          {text("Báo cáo", "Report")}
        </Button>
        </>}
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
        <DialogContent size={activePanel === "sources" ? "xl" : "lg"} className="max-h-[85vh] overflow-y-auto"
          closeLabel={text("Đóng", "Close")}>
          <DialogHeader>
            <DialogTitle>
              {activePanel === "reports"
                ? text("Báo cáo hoạt động", "Activity report")
                : text("Nguồn dữ liệu", "Data sources")}
            </DialogTitle>
            <DialogDescription>
              {text(
                activePanel === "sources" ? "Quản lý thiết lập và quyền truy cập từng nguồn." : "16/10/2026, 09:00 GMT+7",
                activePanel === "sources" ? "Manage setup and access for each source." : "16 October 2026, 09:00 GMT+7",
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
            <DeveloperConnections />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function DeveloperHeader() {
  return (
    <div className="-mb-3 flex flex-wrap items-center justify-between gap-4 pb-1">
      <PersonalizedIntro compact />
      <QuickTools />
    </div>
  );
}
export function DeveloperShell({ children }: { children: ReactNode }) {
  const { error } = useDeveloper();
  const { text } = useDeveloperLocale();
  return (
    <div className="developer-workspace flex min-w-0 flex-col gap-4">
      <Suspense fallback={null}>
        <DeveloperHeader />
      </Suspense>
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
