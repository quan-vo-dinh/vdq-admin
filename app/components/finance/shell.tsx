"use client";
import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import { useFinanceLocale } from "./locale";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinance } from "@/app/context/finance-context";
import { ApiError } from "@/app/api/global-fetcher";
import { FinanceManage } from "./manage";
import { TransactionEditor } from "./transaction-editor";

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
export function FinanceLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-12 w-2/3" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
export function FinanceShell({ children }: { children: ReactNode }) {
  const { text, formatMessage } = useFinanceLocale();
  const { data, error, reload, notice, notify } = useFinance();
  const [adding, setAdding] = useState(false);
  return (
    <div className="finance-workspace">
      <Suspense fallback={null}><FinanceDocumentTitle /></Suspense>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-80"><PersonalizedIntro /></div>
        <div className="flex flex-wrap items-center gap-2">
          <FinanceManage />
          <Button disabled={!data || !data.accounts.some(a=>!a.archivedAt)} size="sm" onClick={() => setAdding(true)}>
            <Plus data-icon="inline-start" />
            {text("Ghi giao dịch")}
          </Button>
        </div>
      </div>
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
      {error && !data ? (
        <Alert variant="destructive">
          <AlertDescription>
            {text("Chưa tải được dữ liệu.")}{" "}
            <Button variant="outline" size="sm" onClick={reload}>
              {text("Thử lại")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : !data ? (
        <FinanceLoading />
      ) : (
        children
      )}
      {adding && data && <TransactionEditor onClose={() => setAdding(false)} />}
    </div>
  );
}
