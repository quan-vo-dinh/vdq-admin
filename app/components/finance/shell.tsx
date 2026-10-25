"use client";
import { useFinanceLocale } from "./locale";
import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname } from "@/lib/platform/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFinance } from "@/app/context/finance-context";
import { ApiError } from "@/app/api/global-fetcher";
import { FinancePageHeader } from "./page-header";
import { cn } from "@/lib/utils";

const links = [
  { slug: "", label: "Tổng quan" },
  { slug: "/transactions", label: "Giao dịch" },
  { slug: "/budgets", label: "Ngân sách" },
  { slug: "/goals", label: "Mục tiêu" },
  { slug: "/cash-flow", label: "Dòng tiền" },
];
function FinanceDocumentTitle() {
  const { text } = useFinanceLocale();
  const path = usePathname();
  useEffect(() => {
    const current = links.find(({ slug }) => path === `/finance${slug}`);
    document.title = `${text("Tài chính cá nhân")} | ${text(current?.label ?? "Tổng quan")}`;
  }, [path, text]);
  return null;
}
export { FinanceLoading } from "./loading";
export function FinanceShell({ children, className }: { children: ReactNode; className?: string }) {
  const { text, formatMessage } = useFinanceLocale();
  const { data, error, reload, notice, notify } = useFinance();
  return (
    <div className={cn("finance-workspace", className)}>
      <Suspense fallback={null}><FinanceDocumentTitle /></Suspense>
      {!data && <FinancePageHeader />}
      {notice && (
        <Alert>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span role="status">{formatMessage(notice)}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={text("Đóng thông báo")}
              onClick={() => notify("")}
            >
              <X />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {error && <Alert variant="destructive"><AlertDescription>{error instanceof ApiError && error.code === 'money_outside_ui_range' ? 'Tổng tiền vượt phạm vi biểu đồ hỗ trợ (tổng trị tuyệt đối tối đa khoảng 2,25 triệu tỷ VND). Dữ liệu DB được giữ nguyên.' : 'Không tải được dữ liệu mới. Hãy thử tải lại.'} <Button variant="outline" size="sm" onClick={reload}>Tải lại</Button></AlertDescription></Alert>}
      {children}
    </div>
  );
}
