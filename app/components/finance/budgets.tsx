"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useFinance } from "@/app/context/finance-context";
import { budgetLimit, type Budget } from "@/lib/finance/model";
import { BudgetComparison } from "./analysis-charts";
import { BudgetRadar } from "./explore-widgets";
import { BudgetPulse } from "./dashboard-widgets";
import { FinanceBoard } from "./template-layout";
import { PageIntro, MoneyInput, MonthPicker } from "./shared";
import { useFinanceLocale } from "./locale";
import { FinanceHeading } from "./heading";

export function BudgetsPage() {
  const { text } = useFinanceLocale();
  const { month, update, notify } = useFinance();
  const [editing, setEditing] = useState<Budget>();
  const [limit, setLimit] = useState(0);
  const [view, setView] = useState<"bars" | "radar">("bars");
  return (
    <div className="finance-page finance-budgets">
      <PageIntro
        icon={Wallet}
        eyebrow="Ngân sách"
        title="Ngân sách tháng"
        description="So mức đã chi với hạn mức của từng danh mục."
      >
        <MonthPicker />
      </PageIntro>
      <FinanceBoard>
        <div className="finance-budget-main">
          <Tabs
            value={view}
            onValueChange={(value) => {
              if (value === "bars" || value === "radar") setView(value);
            }}
            className="finance-chart-tabs"
          >
            <TabsList aria-label={text("Góc nhìn ngân sách")}>
              <TabsTrigger value="bars">{text("So sánh hạn mức")}</TabsTrigger>
              <TabsTrigger value="radar">{text("Radar danh mục")}</TabsTrigger>
            </TabsList>
            <TabsContent value="bars" keepMounted>
              <BudgetComparison
                onEdit={(b) => {
                  setEditing(b);
                  setLimit(budgetLimit(b, month));
                }}
              />
            </TabsContent>
            <TabsContent value="radar" keepMounted>
              <BudgetRadar />
            </TabsContent>
          </Tabs>
          <BudgetPulse />
        </div>
      </FinanceBoard>
      {editing && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined);
          }}
        >
          <DialogContent data-readable-feature data-finance-typography closeLabel={text("Đóng")}>
            <DialogHeader>
              <DialogTitle>
                <FinanceHeading as="span">
                  {text("Ngân sách ·")} {text(editing.name)}
                </FinanceHeading>
              </DialogTitle>
              <DialogDescription>
                {text("Hạn mức cho tháng")} {month.slice(5)}/{month.slice(0, 4)}
                .
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                update((d) => ({
                  ...d,
                  budgets: d.budgets.map((b) =>
                    b.id === editing.id
                      ? {
                          ...b,
                          monthlyLimits: { ...b.monthlyLimits, [month]: limit },
                        }
                      : b,
                  ),
                }));
                notify("Đã cập nhật hạn mức trong phiên.");
                setEditing(undefined);
              }}
            >
              <FieldGroup>
                <MoneyInput
                  id="budget-limit"
                  label="Hạn mức (VND)"
                  value={limit}
                  onChange={setLimit}
                  sliderMax={10_000_000}
                />
              </FieldGroup>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(undefined)}
                >
                  {text("Hủy")}
                </Button>
                <Button type="submit">{text("Lưu hạn mức")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
