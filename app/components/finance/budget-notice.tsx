"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from "@/components/ui/toast";
import { useFinanceLocale } from "./locale";

type BudgetNoticeProps = {
  noticeId: string;
  title: string;
  description: string;
};

function BudgetNoticeContent({ noticeId, title, description }: BudgetNoticeProps) {
  const { text } = useFinanceLocale();
  const router = useRouter();
  const { add, close, toasts } = useToastManager();
  const actionLabel = text("Xem ngân sách");

  useEffect(() => {
    const key = `finance-budget-notice:${noticeId}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // Closing still works when browser storage is unavailable.
    }
    let active = true;
    const id = add({
      id: noticeId,
      title,
      description,
      timeout: 0,
      priority: "low",
      actionProps: {
        children: actionLabel,
        onClick: () => {
          close(id);
          router.push("/finance/budgets");
        },
      },
      onClose: () => {
        if (!active) return;
        try {
          sessionStorage.setItem(key, "dismissed");
        } catch {
          // Persistence is optional; dismissing the current toast is enough.
        }
      },
    });
    return () => {
      active = false;
      close(id);
    };
  }, [noticeId, title, description, actionLabel, add, close, router]);

  return (
    <ToastPortal>
      <ToastViewport>
        {toasts.map((item) => (
          <Toast key={item.id} toast={item} className="finance-budget-toast" data-finance-typography>
            <ToastContent className="items-start">
              <span className="finance-budget-alert-icon" aria-hidden="true">
                <CircleAlert />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <ToastTitle />
                <ToastDescription />
                <ToastAction className="mt-2 self-start" />
              </div>
              <ToastClose aria-label={text("Đóng thông báo")} />
            </ToastContent>
          </Toast>
        ))}
      </ToastViewport>
    </ToastPortal>
  );
}

export function BudgetNotice(props: BudgetNoticeProps) {
  return (
    <ToastProvider timeout={0} limit={1}>
      <BudgetNoticeContent {...props} />
    </ToastProvider>
  );
}
