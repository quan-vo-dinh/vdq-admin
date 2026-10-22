"use client";

import { FinancePageHeader } from "./page-header";

import {
  Wallet,
  PiggyBank,
  Landmark,
  ReceiptText,
} from "lucide-react";
import { BudgetNotice } from "./budget-notice";
import { useFinance } from "@/app/context/finance-context";
import { overview, categorySpent, budgetLimit } from "@/lib/finance/model";
import { MonthPicker } from "./shared";
import { SpendingExplorer, GoalSpotlight } from "./explore-widgets";
import { FinanceNotes } from "./controls";
import { IncomeSpendingChart } from "./analysis-charts";
import { FinanceBoard, FinanceSummary } from "./template-layout";
import { useFinanceLocale } from "./locale";
import StyleDivider from "@/app/components/shared/StyleDivider";

export function OverviewPage() {
  const { text, money } = useFinanceLocale();
  const { data: loaded, period } = useFinance();
  const data = loaded!;
  const totals = overview(data);
  const over = data.budgets.filter(
    (b) =>
      categorySpent(data.transactions, b.id, period) > budgetLimit(b, period),
  );
  return (
    <div className="finance-page finance-overview">
      <FinancePageHeader>
        <MonthPicker />
      </FinancePageHeader>
      <FinanceBoard>
        {over.length > 0 && (
          <BudgetNotice
            noticeId={JSON.stringify([
              period,
              ...over.map((budget) => [
                budget.id,
                categorySpent(data.transactions, budget.id, period) - budgetLimit(budget, period),
              ]),
            ])}
            title={text("{0} danh mục cần xem lại", [over.length])}
            description={over
                .slice(0, 2)
                .map((b) =>
                  text("{0} vượt {1}", [
                    text(b.name),
                    money(
                      categorySpent(data.transactions, b.id, period) -
                        budgetLimit(b, period),
                    ),
                  ]),
                )
                .join(" · ")}
          />
        )}
        <div className="finance-overview-main col-span-12">
          <IncomeSpendingChart />
          <FinanceSummary
            title={text("Nguồn tiền hiện tại")}
            icon={Landmark}
            items={[
              {
                label: text("Số dư ngân hàng tính từ sổ"),
                value: totals.balanceKnown?money(totals.balance):"Chưa đủ dữ liệu",
                icon: Wallet,
                tone: "balance",
                detail: text("Tổng số dư trên {0} tài khoản", [
                  data.accounts.length,
                ]),
              },
              {
                label: text("Đã dành cho mục tiêu"),
                value: money(totals.allocated),
                icon: PiggyBank,
                tone: "goal",
                detail: text("{0}% số dư đã dành cho mục tiêu", [
                  totals.balance
                    ? Math.round((totals.allocated / totals.balance) * 100)
                    : 0,
                ]),
                progress: totals.balanceKnown && totals.balance
                  ? (totals.allocated / totals.balance) * 100
                  : 0,
              },
              {
                label: text("Khoản chi sắp đến"),
                value: money(totals.committed),
                icon: ReceiptText,
                tone: "warning",
                detail: text("{0} khoản cần chi đã ghi nhận", [
                  data.bills.length,
                ]),
                progress: totals.balanceKnown && totals.balance
                  ? (totals.committed / totals.balance) * 100
                  : 0,
              },
              {
                label: text("Tiền chưa phân bổ"),
                value: totals.balanceKnown?money(totals.available):"Chưa đủ dữ liệu",
                icon: Landmark,
                tone: totals.available < 0 ? "danger" : "balance",
                detail:
                  !totals.balanceKnown ? "Cần mốc đầu kỳ và dữ liệu đầy đủ từng nơi giữ tiền" : totals.available < 0
                    ? text("Cần giảm phân bổ hoặc khoản đã cam kết")
                    : text("Có thể dùng sau mục tiêu và khoản sắp đến"),
                progress: totals.balanceKnown && totals.balance
                  ? (totals.available / totals.balance) * 100
                  : 0,
              },
            ]}
          />
        </div>
        <StyleDivider wrapperClassName="col-span-12" />
        <div className="finance-overview-focus col-span-12">
          <SpendingExplorer />
          <GoalSpotlight />
        </div>
      </FinanceBoard>
      <FinanceNotes
        items={[
          {
            title: "Tiền chưa phân bổ là gì?",
            body: "Số dư trừ tiền dành cho mục tiêu và khoản sắp đến đã khai báo. Chưa trừ chi phí tương lai chưa nhập.",
          },
        ]}
      />
    </div>
  );
}
