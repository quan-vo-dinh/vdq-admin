"use client";
import { PersonalizedIntro } from "@/app/components/shared/personalized-intro";
import { useFinanceLocale } from "./locale";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinance } from "@/app/context/finance-context";
import { TransactionEditor } from "./transaction-editor";

const links = [
  { slug: "", label: "Tổng quan" },
  { slug: "/transactions", label: "Giao dịch" },
  { slug: "/budgets", label: "Ngân sách" },
  { slug: "/goals", label: "Mục tiêu" },
  { slug: "/cash-flow", label: "Dòng tiền" },
  { slug: "/simulator", label: "Mô phỏng" },
];
function FinanceBreadcrumb() {
  const { text } = useFinanceLocale();
  const path = usePathname();
  useEffect(() => {
    const current = links.find(({ slug }) => path === `/finance${slug}`);
    document.title = `${text("Tài chính cá nhân")} | ${text(current?.label ?? "Tổng quan")}`;
  }, [path, text]);
  return (
    <Breadcrumb aria-label={text("Vị trí hiện tại")}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/finance" />}>
            {text("Tài chính cá nhân")}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            {text(
              links.find(({ slug }) => path === `/finance${slug}`)?.label ??
                "Tổng quan",
            )}
          </BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Badge variant="outline">{text("Dữ liệu minh họa")} · VND</Badge>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
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
      <div className="pb-4"><PersonalizedIntro /></div>
      <div className="finance-module-header">
        <Suspense fallback={<Skeleton className="h-5 w-56" />}>
          <FinanceBreadcrumb />
        </Suspense>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={text("Bản trải nghiệm")}
                />
              }
            >
              <Info />
            </TooltipTrigger>
            <TooltipContent>
              {text(
                "Dữ liệu minh họa đến 15/10/2026 · Thay đổi chỉ giữ trong phiên, tải lại để đặt lại.",
              )}{" "}
              · VND · GMT+7
            </TooltipContent>
          </Tooltip>
          <Button disabled={!data} size="sm" onClick={() => setAdding(true)}>
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
      {error && !data ? (
        <Alert variant="destructive">
          <AlertDescription>
            {text("Chưa tải được dữ liệu minh họa.")}{" "}
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
