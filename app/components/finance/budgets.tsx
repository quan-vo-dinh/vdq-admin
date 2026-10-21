"use client";

import { FinancePageHeader } from "./page-header";

import { useState } from "react";
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
import { Field, FieldLabel, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useFinance } from "@/app/context/finance-context";
import { budgetLimit, type Budget } from "@/lib/finance/model";
import { BudgetComparison } from "./analysis-charts";
import { BudgetRadar } from "./explore-widgets";
import { BudgetPulse } from "./dashboard-widgets";
import { FinanceBoard } from "./template-layout";
import { Switch } from "@/components/ui/switch";
import { MoneyInput, MonthPicker, Choice } from "./shared";
import { useFinanceLocale } from "./locale";
import { FinanceHeading } from "./heading";

export function BudgetsPage() {
  const { text } = useFinanceLocale();
  const { data, month, setMonth, periodMode, setPeriodMode, action, busy, notify } = useFinance();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Budget>();
  const [limit, setLimit] = useState(0);
  const [scope, setScope] = useState("month");
  const [fixed, setFixed] = useState(false);
  const [view, setView] = useState<"bars" | "radar">("bars");
  return (
    <div className="finance-page finance-budgets">
      <FinancePageHeader>
        <MonthPicker />
      </FinancePageHeader>
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
                  const editMonth=periodMode==="recent-month"?data!.asOf.slice(0,7):month;
                  if(periodMode==="recent-month"){setMonth(editMonth);setPeriodMode("calendar");}
                  setError(""); setScope("month"); setFixed(b.fixed);
                  setEditing(b);
                  setLimit(budgetLimit(b, editMonth));
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
            if (!open && !busy) setEditing(undefined);
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
                {text("Mặc định áp dụng cho tháng chưa có hạn mức riêng. Điều chỉnh từng tháng không thay đổi tháng khác.")}
              </DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  let budgetId = editing.resourceId;
                  if (scope === "default") {
                    await action("budgets",budgetId?"PATCH":"POST",{id:budgetId??editing.categoryId,expectedRevision:editing.revision,category_id:editing.categoryId,name:editing.name,default_limit:limit,fixed});
                  } else {
                    if (!budgetId) {const result = await action("budgets","POST",{id:editing.categoryId,category_id:editing.categoryId,name:editing.name,default_limit:editing.limit,fixed:editing.fixed});budgetId=result.id;setEditing({...editing,resourceId:budgetId,revision:result.revision});}
                    const row = editing.monthRows?.find(r=>r.month===month+"-01");
                    await action("budget_months",row?"PATCH":"POST",{id:row?.id??(budgetId!.slice(0,24)+month.replace("-","").padEnd(12,"0")),expectedRevision:row?.revision,budget_id:budgetId,month:month+"-01",limit_amount:limit});
                  }
                } catch(e) {setError(e instanceof Error?e.message:'Không lưu được.');return;}
                notify("Đã cập nhật hạn mức.");
                setEditing(undefined);
              }}
            >
              {error && <p role="alert">{error}</p>}
              <FieldGroup>
                <Choice label={text("Phạm vi hạn mức")} value={scope} onChange={v=>{if(!busy){setScope(v);setLimit(v==="default"?editing.limit:budgetLimit(editing,month));}}} options={[{value:"month",label: `${text("Tháng")} ${month}`},{value:"default",label:text("Mặc định")}]} />
                <MoneyInput
                  id="budget-limit"
                  label="Hạn mức (VND)"
                  value={limit}
                  onChange={setLimit}
                  sliderMax={10_000_000}
                />
                {scope === "default" && <Field orientation="horizontal"><Switch id="budget-fixed" checked={fixed} disabled={busy} onCheckedChange={setFixed}/><FieldLabel htmlFor="budget-fixed">{text("Chi phí cố định")}</FieldLabel></Field>}
                <FieldDescription>{text("Hạn mức mặc định")}: {editing.limit.toLocaleString("vi-VN")} ₫</FieldDescription>
              </FieldGroup>
              {scope === "month" && editing.monthRows?.some(r=>r.month===month+"-01") && <Button type="button" variant="outline" disabled={busy} onClick={async()=>{
                const row=editing.monthRows!.find(r=>r.month===month+"-01")!;
                try {await action("budget_months","DELETE",{id:row.id,expectedRevision:row.revision});notify("Đã dùng lại hạn mức mặc định cho tháng.");setEditing(undefined);} catch(e){setError(e instanceof Error?e.message:"Không lưu được.");}
              }}>{text("Bỏ hạn mức riêng, dùng mặc định")}</Button>}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
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
