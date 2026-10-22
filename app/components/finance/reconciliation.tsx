"use client";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Scale, Wallet } from "lucide-react";
import { useFinance } from "@/app/context/finance-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
import { accountPosition, overview, sum, type Account } from "@/lib/finance/model";
import { inFinancePeriod } from "@/lib/finance/period";
import { expenseGroups, financeIssues, reconcileAccount, transactionGroups, spendingBasis } from "@/lib/finance/reconciliation";
import { Section, SelectField, NoResults } from "./shared";
import { useFinanceLocale } from "./locale";

export function BalanceEvidenceNotice() {
  const {data}=useFinance();
  if (!data) return null;
  const issues=financeIssues(data);
  return <Alert><AlertDescription>
    Số dư tính từ sổ cần số dư đầu kỳ có ngày hiệu lực và giao dịch đầy đủ cho từng nơi giữ tiền.
    {!!issues.missingBaselines && ` Còn ${issues.missingBaselines} tài khoản chưa có mốc đầu kỳ.`}
    {!!issues.beforeBaseline && ` Có ${issues.beforeBaseline} giao dịch trước mốc đầu kỳ; chúng vẫn có trong báo cáo nhưng không cộng lại vào số dư.`}
    {!!issues.duplicateCandidates && ` Có ${issues.duplicateCandidates} dòng nghi trùng cần kiểm tra.`}
    {!!issues.missingReferences && ` Có ${issues.missingReferences} dòng CSV chưa lưu mã tham chiếu.`}
    {!!issues.suspiciousTransfers && ` Có ${issues.suspiciousTransfers} dòng mang danh mục chuyển nội bộ nhưng chưa được lưu đúng loại chuyển khoản.`}
    {" "}Mốc ngân hàng đã xác nhận chỉ có giá trị tại thời điểm ghi nhận. Chưa có dữ liệu ACB, MoMo hoặc tiền mặt thì tổng sổ chưa đại diện toàn bộ tiền đang giữ.
  </AlertDescription></Alert>;
}

export function ReconciliationPanel() {
  const {data:loaded,period,action,busy,notify}=useFinance();
  const {money}=useFinanceLocale();
  const [open,setOpen]=useState(false),[resource,setResource]=useState("checkpoints");
  const [account,setAccount]=useState(""),[time,setTime]=useState(""),[amount,setAmount]=useState("");
  const [evidence,setEvidence]=useState(""),[kind,setKind]=useState("exclude"),[error,setError]=useState("");
  const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
  const data=loaded!;
  const totals=overview(data);
  const groups=transactionGroups(data.transactions,period);
  const spending=spendingBasis(data.transactions,period);
  const transfers=data.transactions.filter(t=>t.kind==="transfer"&&inFinancePeriod(t.date,period));
  const columns:ColumnDef<Account>[]=[
    {accessorKey:"name",header:"Nơi giữ tiền"},
    {id:"baseline",header:"Mốc đầu kỳ",cell:({row:{original:a}})=>a.openingOn?`${a.openingOn} · ${money(a.opening)}`:"Chưa xác nhận"},
    {id:"ledger",header:"Số dư tính từ sổ",cell:({row:{original:a}})=>{
      if(!a.openingOn)return "Chưa đủ dữ liệu";
      const {balance:bank,excluded:outside}=accountPosition(data,a);
      return <span>{money(bank)}<br/><small className="text-muted-foreground">Trong phạm vi: {money(bank-outside)}</small></span>;
    }},
    {id:"observed",header:"Mốc xác nhận gần nhất",cell:({row:{original:a}})=>{
      const c=(data.checkpoints??[]).filter(c=>c.account===a.id).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt))[0];
      if(!c)return "Chưa có";
      const r=reconcileAccount(data,a,c.observedAt,c.amount);
      return <span>{money(c.amount)}<br/><small>{new Date(c.observedAt).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</small><br/><small>{r.difference===null?`Chưa thể đối soát${r.ambiguous?`: ${r.ambiguous} dòng thiếu giờ`:" (thiếu mốc đầu kỳ)"}`:`Chênh xác nhận − sổ: ${money(r.difference)}`}</small></span>;
    }},
  ];
  return <>
    <Section title="Số dư & đối soát" icon={Scale} description={`Sổ tính đến hết ${data.asOf}, theo giờ Việt Nam. Không tự điều chỉnh khi có chênh lệch.`} action={<Button variant="outline" onClick={()=>{setOpen(true);setError("");}}>Ghi mốc / tiền ngoài phạm vi</Button>}>
      <BalanceEvidenceNotice/>
      <div className="grid gap-3 py-4 sm:grid-cols-3">
        {[{name:"Tiền trong phạm vi theo sổ",value:totals.tracked},{name:"Tiền ngoài phạm vi",value:totals.excluded},{name:"Khả dụng sau phân bổ",value:totals.available}].map(item=><div key={item.name} className="rounded-lg border p-3"><div className="text-sm text-muted-foreground">{item.name}</div><strong className="text-lg tabular-nums">{totals.balanceKnown?money(item.value):"Chưa đủ dữ liệu"}</strong></div>)}
      </div>
      <FeatureDataTable label="Đối soát từng tài khoản" data={data.accounts} columns={columns} empty={<NoResults/>}/>
      <p className="mt-3 text-sm text-muted-foreground">Khả dụng sau phân bổ = tiền trong phạm vi − mục tiêu đã dành − khoản dự kiến đã khai báo. Đây là kế hoạch; không trừ các khoản này lần nữa vào số dư ngân hàng.</p>
    </Section>
    <Section title="Ba nhóm chi phí trong kỳ" icon={Wallet} description="Tất cả danh mục chi tiết được gom về Ăn uống, Di chuyển hoặc Chi phí phát sinh. Hoàn hỗ trợ làm giảm thu nhập; chuyển nội bộ không tạo thu chi.">
      <div className="grid gap-3 sm:grid-cols-3">{expenseGroups(data.transactions,period).map(g=><div key={g.code} className="rounded-lg border p-3"><p>{({food:"Ăn uống",transport:"Di chuyển",other:"Chi phí phát sinh"})[g.code]}</p><strong className="tabular-nums">{money(g.amount)}</strong></div>)}</div>
      <p className="mt-3 text-sm text-muted-foreground">Chi theo quy ước ngân sách: {money(spending.budget)}. Chi làm giảm tài sản tiền: {money(spending.assetExpense)}. Chênh {money(spending.difference)} do tiền mặt đã tính ngân sách tại ATM nhưng chưa ghi nhận sử dụng. Thiếu giao dịch tiền mặt thì chưa thể khẳng định tiền này vẫn còn giữ.</p>
      <p className="mt-3 text-sm">Chuyển nội bộ trong kỳ: {transfers.length} giao dịch, {money(sum(transfers,t=>t.amount))}. Chỉ thay đổi nơi giữ tiền.</p>
      {groups.length>0&&<div className="mt-4 space-y-2">{groups.map(g=><div key={g.name} className="rounded-lg border p-3 text-sm"><strong>{g.name}</strong><p>{g.count} dòng · Thu gốc {money(g.grossIncome)} · Trả hỗ trợ {money(g.returned)} · Thu giữ lại {money(g.income)}</p><p>Chi ngân sách {money(g.expenses)} · Chi giảm tài sản tiền {money(g.assetExpense)} · Ròng ngân sách {money(g.net)}</p></div>)}</div>}
    </Section>
    <Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}><DialogContent size="xl" className="max-h-[90dvh] overflow-y-auto" data-readable-feature data-finance-typography>
      <DialogHeader><DialogTitle>Mốc số dư & tiền ngoài phạm vi</DialogTitle><DialogDescription>Ghi chứng cứ và thời điểm thực tế. Mốc số dư chỉ dùng so sánh, không tạo thu nhập hay chi phí.</DialogDescription></DialogHeader>
      <SelectField id="reconcile-mode" label="Ghi nhận" value={resource} onChange={v=>{setResource(v);setRequestId(crypto.randomUUID());setError("");}} options={[{value:"checkpoints",label:"Mốc số dư ngân hàng / kiểm đếm tiền mặt"},{value:"scope_events",label:"Thay đổi tiền ngoài phạm vi"}]}/>
      {error&&<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{
        e.preventDefault();setError("");
        const timestamp=`${time.length===16?time+":00":time}+07:00`;
        if(!account||!time||!evidence.trim()||!Number.isSafeInteger(Number(amount))||(resource==="scope_events"&&Number(amount)<=0)){setError("Nhập tài khoản, thời điểm, số VND nguyên và nguồn xác nhận.");return;}
        try{await action(resource,"POST",{id:requestId,account_id:account,amount,evidence:evidence.trim(),...(resource==="checkpoints"?{observed_at:timestamp}:{occurred_at:timestamp,kind})});setRequestId(crypto.randomUUID());setAmount("");setEvidence("");notify("Đã lưu chứng cứ đối soát. Không tạo giao dịch bù số dư.");}catch(e){setError(e instanceof Error?e.message:"Không lưu được.");}
      }}>
        <SelectField id="reconcile-account" label="Tài khoản" value={account} onChange={setAccount} options={data.accounts.filter(a=>!a.archivedAt).map(a=>({value:a.id,label:a.name}))}/>
        <Field><FieldLabel htmlFor="reconcile-time">Thời điểm (giờ Việt Nam)</FieldLabel><Input required id="reconcile-time" type="datetime-local" step="1" value={time} onChange={e=>setTime(e.target.value)}/></Field>
        <Field><FieldLabel htmlFor="reconcile-amount">{resource==="checkpoints"?"Số dư đã xác nhận (VND)":"Số tiền ngoài phạm vi (VND)"}</FieldLabel><Input id="reconcile-amount" required type="number" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></Field>
        {resource==="scope_events"&&<SelectField id="reconcile-scope-kind" label="Cách xử lý" value={kind} onChange={setKind} options={[{value:"exclude",label:"Tách tiền ngoài phạm vi (tiền vẫn ở tài khoản)"},{value:"release",label:"Đưa tiền trở lại phạm vi theo dõi"},{value:"external_outflow",label:"Tiền đã tách được chuyển ra khỏi tài khoản"}]}/>}
        <Field className="sm:col-span-2"><FieldLabel htmlFor="reconcile-evidence">Nguồn xác nhận / ghi chú</FieldLabel><Input id="reconcile-evidence" required maxLength={500} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="Ví dụ: số dư trên sao kê, hoặc kiểm đếm tiền mặt"/></Field>
        {resource==="scope_events"&&<p className="text-sm text-muted-foreground sm:col-span-2">Cần có mốc đầu kỳ. Khi tiền ngoài phạm vi được chuyển đi, cả số dư ngân hàng và phần ngoài phạm vi cùng giảm nên tiền trong phạm vi không giảm lần hai. Không ghi khoản này thêm vào sổ thu chi.</p>}
        <Button type="submit" disabled={busy}>Lưu ghi nhận</Button>
      </form>
      <div className="space-y-2">{(resource==="checkpoints"?data.checkpoints??[]:data.scopeEvents??[]).map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><span>{data.accounts.find(a=>a.id===item.account)?.name} · {"observedAt" in item?item.observedAt:item.occurredAt} · {money(item.amount)}<br/>{item.evidence}</span><Button variant="outline" size="sm" disabled={busy} onClick={async()=>{try{await action(resource,"DELETE",{id:item.id,expectedRevision:item.revision});}catch(e){setError(e instanceof Error?e.message:"Không xóa được.");}}}>Xóa ghi nhận</Button></div>)}</div>
    </DialogContent></Dialog>
  </>;
}

export function ReconciliationDialog(){
 const [open,setOpen]=useState(false);
 return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}>Đối soát số dư</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent size="xl" className="max-h-[90dvh] overflow-y-auto" data-readable-feature data-finance-typography><DialogHeader><DialogTitle>Đối soát số dư</DialogTitle><DialogDescription>Thông tin bổ sung; mốc xác nhận không tự tạo thu chi.</DialogDescription></DialogHeader><ReconciliationPanel/></DialogContent></Dialog></>;
}
