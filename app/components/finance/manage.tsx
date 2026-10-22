"use client";
import {useState} from "react";
import type {ColumnDef} from "@tanstack/react-table";
import {useFinance} from "@/app/context/finance-context";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Field, FieldGroup, FieldLabel, FieldDescription} from "@/components/ui/field";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {FeatureDataTable} from "@/app/components/tables/feature-data-table";
import type {Account, FinanceData} from "@/lib/finance/model";
import {accountHasHistory} from "@/lib/finance/master-data";
import {todayKey} from "@/lib/learning/model";
import {Choice, SelectField, NoResults} from "./shared";
import {MasterDataConfirm} from "./master-data-confirm";
import {useFinanceLocale} from "./locale";

type Resource = "accounts" | "bills" | "settings";
type Bill = FinanceData["bills"][number];
export function FinanceManage(){
 const {data,action,busy,notify}=useFinance();
 const {text,money}=useFinanceLocale();
 const [open,setOpen]=useState(false);
 const [resource,setResource]=useState<Resource>("accounts");
 const [id,setId]=useState(()=>crypto.randomUUID()),[expected,setExpected]=useState<number>();
 const [name,setName]=useState(""),[amount,setAmount]=useState("0"),[note,setNote]=useState(""),[date,setDate]=useState(()=>todayKey()),[error,setError]=useState("");
 const [openingOn,setOpeningOn]=useState(""),[openingExcluded,setOpeningExcluded]=useState("0");
 const [query,setQuery]=useState(""),[status,setStatus]=useState("active");
 const [deleting,setDeleting]=useState<{resource:"accounts"|"bills";id:string;name:string;revision?:number}>();
 function reset(next:Resource){setResource(next);setId(crypto.randomUUID());setExpected(undefined);setName("");setAmount("0");setNote("");setOpeningOn("");setOpeningExcluded("0");setDate(next==="settings"?data!.startsOn:todayKey());setError("");}
 if(!data)return null;
 function edit(a:Account|Bill){setId(a.id);setExpected(a.revision);setName(a.name);setError("");if("opening" in a){setAmount(String(a.opening));setNote(a.note);setOpeningOn(a.openingOn??"");setOpeningExcluded(String(a.openingExcluded??0));}else{setAmount(String(a.amount));setDate(a.date);}}
 async function archive(a:Account){setError("");try{await action("accounts","PATCH",{id:a.id,expectedRevision:a.revision,archived_at:a.archivedAt?null:new Date().toISOString()});if(id===a.id)reset(resource);notify(a.archivedAt?"Đã khôi phục tài khoản.":"Đã lưu trữ tài khoản.");}catch(e){setError(e instanceof Error?e.message:"Không lưu được.");}}
 const accountColumns:ColumnDef<Account>[]=[
  {accessorKey:"name",header:text("Tên")},
  {id:"opening",header:text("Số dư đầu kỳ"),cell:({row})=>money(row.original.opening)},
  {id:"status",header:text("Trạng thái"),cell:({row})=><Badge variant="outline">{text(row.original.archivedAt?"Đã lưu trữ":"Đang sử dụng")}</Badge>},
  {id:"actions",header:text("Thao tác"),cell:({row:{original:a}})=><div className="flex flex-wrap gap-2">
   <Button size="sm" variant="ghost" disabled={busy} onClick={()=>edit(a)}>{text("Sửa")}</Button>
   <Button size="sm" variant="outline" disabled={busy} onClick={()=>archive(a)}>{text(a.archivedAt?"Khôi phục":"Lưu trữ")}</Button>
   <Button size="sm" variant="outline" disabled={busy||accountHasHistory(data,a.id)} title={text(accountHasHistory(data,a.id)?"Đã có lịch sử; hãy dùng lưu trữ.":"Xóa tài khoản chưa sử dụng")} onClick={()=>setDeleting({resource:"accounts",...a})}>{text("Xóa")}</Button>
  </div>},
 ];
 const billColumns:ColumnDef<Bill>[]=[
  {accessorKey:"name",header:text("Tên")}, {accessorKey:"date",header:text("Ngày đến hạn")},
  {id:"amount",header:text("Số tiền"),cell:({row})=>money(row.original.amount)},
  {id:"actions",header:text("Thao tác"),cell:({row:{original:b}})=><div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" disabled={busy} onClick={()=>edit(b)}>{text("Sửa")}</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>setDeleting({resource:"bills",...b})}>{text("Xóa")}</Button></div>},
 ];
 const matches=(a:{name:string})=>a.name.toLocaleLowerCase().includes(query.toLocaleLowerCase());
 return <>
  <Button size="sm" variant="outline" onClick={()=>{reset(resource);setOpen(true);}}>{text("Tài khoản & khoản dự kiến")}</Button>
  <Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}><DialogContent size="xl" data-readable-feature data-finance-typography className="max-h-[90dvh] overflow-y-auto" closeLabel={text("Đóng")}>
   <DialogHeader><DialogTitle>{text("Thiết lập tài chính")}</DialogTitle><DialogDescription>{text("Quản lý tài khoản, khoản dự kiến và ngày đầu kỳ. Lưu trữ giữ nguyên lịch sử giao dịch.")}</DialogDescription></DialogHeader>
   <Choice label={text("Nhóm thiết lập")} value={resource} onChange={v=>{if(!busy){reset(v as Resource);setQuery("");}}} options={[{value:"accounts",label:text("Tài khoản")},{value:"bills",label:text("Khoản dự kiến")},{value:"settings",label:text("Ngày đầu kỳ")}]} />
   {error&&<Alert variant="destructive"><AlertDescription>{text(error)}</AlertDescription></Alert>}
   <form className="flex flex-col gap-3" onSubmit={async e=>{
    e.preventDefault();setError("");
    if(resource!=="settings"&&(!name.trim()||!Number.isSafeInteger(Number(amount))||(resource==="bills"&&Number(amount)<=0))){setError("Nhập tên và số tiền VND nguyên hợp lệ.");return;}
    try{await action(resource,resource==="settings"||expected?"PATCH":"POST",resource==="settings"?{id:data.settings!.id,expectedRevision:data.settings!.revision,starts_on:date}:resource==="accounts"?{id,expectedRevision:expected,name:name.trim(),opening:amount,note,opening_on:openingOn||null,opening_excluded:openingExcluded}:{id,expectedRevision:expected,name:name.trim(),amount,due_on:date});reset(resource);notify("Đã lưu thiết lập tài chính.");}catch(e){setError(e instanceof Error?e.message:"Không lưu được.");}
   }}>
    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
     {resource!=="settings"&&<>
      <Field><FieldLabel htmlFor="finance-manage-name">{text("Tên")}</FieldLabel><Input id="finance-manage-name" required maxLength={80} disabled={busy} value={name} onChange={e=>setName(e.target.value)}/></Field>
      <Field><FieldLabel htmlFor="finance-manage-amount">{text(resource==="accounts"?"Số dư đầu kỳ":"Số tiền dự kiến")}</FieldLabel><Input id="finance-manage-amount" required type="number" step="1" min={resource==="bills"?1:undefined} disabled={busy} value={amount} onChange={e=>setAmount(e.target.value)}/>{resource==="accounts"&&<FieldDescription>{text("Số dư đầu kỳ có thể âm. Thay đổi số này sẽ điều chỉnh số dư và báo cáo hiện có.")}</FieldDescription>}</Field>
     </>}
     {resource==="accounts"&&<><Field><FieldLabel htmlFor="finance-opening-on">Ngày hiệu lực số dư đầu kỳ</FieldLabel><Input id="finance-opening-on" type="date" max={data.asOf} value={openingOn} onChange={e=>setOpeningOn(e.target.value)}/><FieldDescription>Số dư ngay trước 00:00 ngày này theo giờ Việt Nam. Để trống nếu chưa có chứng cứ; không mặc định bằng ngày bắt đầu báo cáo.</FieldDescription></Field><Field><FieldLabel htmlFor="finance-opening-excluded">Trong số dư đầu kỳ, tiền ngoài phạm vi</FieldLabel><Input id="finance-opening-excluded" type="number" min="0" step="1" value={openingExcluded} onChange={e=>setOpeningExcluded(e.target.value)}/></Field></>}
     {resource==="accounts"?<Field><FieldLabel htmlFor="finance-manage-note">{text("Ghi chú")}</FieldLabel><Input id="finance-manage-note" maxLength={500} disabled={busy} value={note} onChange={e=>setNote(e.target.value)}/></Field>:<Field><FieldLabel htmlFor="finance-manage-date">{text(resource==="settings"?"Ngày đầu kỳ":"Ngày đến hạn")}</FieldLabel><Input id="finance-manage-date" type="date" required disabled={busy} value={date} onChange={e=>setDate(e.target.value)}/></Field>}
    </FieldGroup>
    <div className="flex flex-wrap gap-2"><Button disabled={busy} type="submit">{text(resource==="settings"?"Lưu":expected?"Lưu thay đổi":"Thêm mới")}</Button>{expected&&<Button type="button" variant="outline" disabled={busy} onClick={()=>reset(resource)}>{text("Hủy chỉnh sửa")}</Button>}</div>
   </form>
   {resource!=="settings"&&<>
    <div className="flex flex-wrap items-end gap-3"><Field className="min-w-40 flex-1"><FieldLabel htmlFor="finance-manage-search">{text("Tìm kiếm")}</FieldLabel><Input id="finance-manage-search" value={query} onChange={e=>setQuery(e.target.value)}/></Field>{resource==="accounts"&&<SelectField id="account-status" label={text("Trạng thái")} value={status} onChange={setStatus} options={[{value:"active",label:text("Đang sử dụng")},{value:"archived",label:text("Đã lưu trữ")},{value:"all",label:text("Tất cả")}]} />}</div>
    {resource==="accounts"?<FeatureDataTable label={text("Danh sách tài khoản")} data={data.accounts.filter(a=>matches(a)&&(status==="all"||(status==="archived"?!!a.archivedAt:!a.archivedAt)))} columns={accountColumns} empty={<NoResults/>}/>:<FeatureDataTable label={text("Danh sách khoản dự kiến")} data={data.bills.filter(matches)} columns={billColumns} empty={<NoResults/>}/>}
   </>}
  </DialogContent></Dialog>
  {deleting&&<MasterDataConfirm name={deleting.name} busy={busy} onClose={()=>setDeleting(undefined)} onConfirm={async()=>{await action(deleting.resource,"DELETE",{id:deleting.id,expectedRevision:deleting.revision});if(id===deleting.id)reset(resource);notify("Đã xóa dữ liệu.");}}/>}
 </>;
}
