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
  const { month, action, busy, notify } = useFinance();
  const [error, setError] = useState("");
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
          <DialogContent size="sm" data-readable-feature data-finance-typography closeLabel={text("Đóng")}>
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
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  let budgetId = editing.resourceId;
                  if (!budgetId) {const result = await action('budgets','POST',{id:editing.categoryId,category_id:editing.categoryId,name:editing.name,default_limit:0,fixed:editing.fixed});budgetId=result.id;setEditing({...editing,resourceId:budgetId});}
                  const row = editing.monthRows?.find(r=>r.month===month+'-01');
                  await action('budget_months',row?'PATCH':'POST',{id:row?.id??(budgetId!.slice(0,24)+month.replace('-','').padEnd(12,'0')),expectedRevision:row?.revision,budget_id:budgetId,month:month+'-01',limit_amount:limit});
                } catch(e) {setError(e instanceof Error?e.message:'Không lưu được.');return;}
                notify("Đã cập nhật hạn mức.");
                setEditing(undefined);
              }}
            >
              {error && <p role="alert">{error}</p>}
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
                <Button type="submit" disabled={busy}>{text("Lưu hạn mức")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
