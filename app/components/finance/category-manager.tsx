"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Tags, Plus } from "lucide-react";
import { useFinance } from "@/app/context/finance-context";
import type { FinanceData } from "@/lib/finance/model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { FeatureDataTable } from "@/app/components/tables/feature-data-table";
import { categoryCodePattern } from "@/lib/finance/csv";
import { categoryHasHistory, isDefaultCategory } from "@/lib/finance/master-data";
import { Choice, SelectField, NoResults } from "./shared";
import { MasterDataConfirm } from "./master-data-confirm";
import { useFinanceLocale } from "./locale";

type Category = NonNullable<FinanceData["categories"]>[number];
type Draft = {id: string; name: string; code: string; kind: string; revision?: number; locked: boolean};
export function CategoryManager() {
  const { data, action, busy, notify } = useFinance();
  const { text } = useFinanceLocale();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Category>();
  if (!data) return <Button size="sm" variant="outline" disabled><Tags data-icon="inline-start" />{text("Danh mục")}</Button>;
  const rows = (data.categories ?? []).filter(c => (status === "all" || (status === "archived" ? !!c.archived_at : !c.archived_at)) && `${c.name} ${c.code}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  function edit(c?: Category) {
    setError("");
    setDraft(c ? {id:c.id,name:c.name,code:c.code,kind:c.kind,revision:c.revision,locked:isDefaultCategory(c.code) || categoryHasHistory(data!,c.code)} : {id:crypto.randomUUID(),name:"",code:"",kind:"expense",locked:false});
  }
  async function archive(c: Category) {
    setError("");
    try {await action("categories","PATCH",{id:c.id,expectedRevision:c.revision,archived_at:c.archived_at ? null : new Date().toISOString()}); notify(c.archived_at ? "Đã khôi phục danh mục." : "Đã lưu trữ danh mục.");}
    catch(e) {setError(e instanceof Error ? e.message : "Không lưu được.");}
  }
  const columns: ColumnDef<Category>[] = [
    {accessorKey:"name",header:text("Tên danh mục")},
    {accessorKey:"code",header:text("Mã danh mục")},
    {id:"kind",header:text("Loại danh mục"),cell:({row})=>text(row.original.kind === "income" ? "Thu nhập" : "Chi tiêu")},
    {id:"status",header:text("Trạng thái"),cell:({row})=><Badge variant="outline">{text(row.original.archived_at ? "Đã lưu trữ" : "Đang sử dụng")}</Badge>},
    {id:"actions",header:text("Thao tác"),cell:({row:{original:c}})=> {
      const used = categoryHasHistory(data,c.code), builtin = isDefaultCategory(c.code);
      return <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" disabled={busy} onClick={()=>edit(c)}>{text("Sửa")}</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={()=>archive(c)}>{text(c.archived_at ? "Khôi phục" : "Lưu trữ")}</Button>
        <Button size="sm" variant="outline" disabled={busy || used || builtin} title={text(builtin ? "Danh mục mặc định chỉ có thể lưu trữ." : used ? "Đã có lịch sử; hãy dùng lưu trữ." : "Xóa danh mục chưa sử dụng")} onClick={()=>setDeleting(c)}>{text("Xóa")}</Button>
      </div>;
    }},
  ];
  return <>
    <Button size="sm" variant="outline" onClick={()=>{setError("");setOpen(true);}}><Tags data-icon="inline-start" />{text("Danh mục")}</Button>
    <Dialog open={open} onOpenChange={v=>{if(!busy)setOpen(v);}}>
      <DialogContent size="xl" data-readable-feature data-finance-typography className="max-h-[90dvh] overflow-y-auto" closeLabel={text("Đóng")}>
        <DialogHeader><DialogTitle>{text("Quản lý danh mục")}</DialogTitle><DialogDescription>{text("Đổi tên, lưu trữ hoặc khôi phục danh mục. Lịch sử giao dịch luôn được giữ lại.")}</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-end gap-3">
          <Field className="min-w-40 flex-1"><FieldLabel htmlFor="category-search">{text("Tìm danh mục")}</FieldLabel><Input id="category-search" value={query} onChange={e=>setQuery(e.target.value)} /></Field>
          <SelectField id="category-status" label={text("Trạng thái")} value={status} onChange={setStatus} options={[{value:"active",label:text("Đang sử dụng")},{value:"archived",label:text("Đã lưu trữ")},{value:"all",label:text("Tất cả")}]} />
          <Button disabled={busy} onClick={()=>edit()}><Plus data-icon="inline-start" />{text("Thêm danh mục")}</Button>
        </div>
        {error && !draft && <Alert variant="destructive"><AlertDescription>{text(error)}</AlertDescription></Alert>}
        <FeatureDataTable label={text("Danh sách danh mục")} data={rows} columns={columns} empty={<NoResults />} />
        <p className="text-sm text-muted-foreground">{text("Danh mục mặc định hoặc đã có lịch sử chỉ có thể lưu trữ. Mã và loại được khóa khi đã sử dụng; tên vẫn sửa được.")}</p>
      </DialogContent>
    </Dialog>
    {draft && <Dialog open onOpenChange={v=>{if(!v&&!busy){setDraft(undefined);setError("");}}}>
      <DialogContent size="md" closeLabel={text("Đóng")}>
        <DialogHeader><DialogTitle>{text(draft.revision ? "Sửa danh mục" : "Thêm danh mục")}</DialogTitle><DialogDescription>{text("Danh mục dùng cho giao dịch và CSV. Danh mục chi tiêu mới có ngân sách ban đầu bằng 0.")}</DialogDescription></DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={async e=> {
          e.preventDefault(); setError("");
          if(!categoryCodePattern.test(draft.code)||draft.code === "transfer") {setError("Mã danh mục cần 1–40 ký tự: chữ thường, số, _ hoặc -; bắt đầu bằng chữ, không dùng transfer.");return;}
          if(data.categories?.some(c=>c.id!==draft.id && c.code===draft.code)) {setError("Mã danh mục đã tồn tại, kể cả danh mục đã lưu trữ.");return;}
          try {await action("categories",draft.revision?"PATCH":"POST",{id:draft.id,expectedRevision:draft.revision,name:draft.name.trim(),...(!draft.locked && {code:draft.code,kind:draft.kind})});notify(draft.revision?"Đã cập nhật danh mục.":"Đã thêm danh mục.");setDraft(undefined);}
          catch(e) {setError(e instanceof Error?e.message:"Không lưu được.");}
        }}>
          <FieldGroup>
            <Field><FieldLabel htmlFor="category-name">{text("Tên danh mục")}</FieldLabel><Input id="category-name" required maxLength={80} disabled={busy} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} /></Field>
            <Field data-invalid={!!error}><FieldLabel htmlFor="category-code">{text("Mã danh mục")}</FieldLabel><Input id="category-code" required maxLength={40} disabled={busy||draft.locked} value={draft.code} aria-invalid={!!error} onChange={e=>setDraft({...draft,code:e.target.value})} placeholder="suc_khoe" /><FieldDescription>{text(draft.locked ? "Mã và loại được khóa để bảo vệ danh mục mặc định hoặc lịch sử." : "Dùng mã này trong cột category của CSV. Ví dụ: suc_khoe, thuong.")}</FieldDescription>{error&&<FieldError>{text(error)}</FieldError>}</Field>
            <Field><FieldLabel>{text("Loại danh mục")}</FieldLabel>{draft.locked ? <p>{text(draft.kind==="income"?"Thu nhập":"Chi tiêu")}</p> : <Choice label={text("Loại danh mục")} value={draft.kind} onChange={kind=>{if(!busy)setDraft({...draft,kind});}} options={[{value:"expense",label:text("Chi tiêu")},{value:"income",label:text("Thu nhập")}]} />}</Field>
          </FieldGroup>
          <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={()=>{setDraft(undefined);setError("");}}>{text("Hủy")}</Button><Button type="submit" disabled={busy||!draft.name.trim()}>{text("Lưu")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>}
    {deleting && <MasterDataConfirm name={deleting.name} busy={busy} onClose={()=>setDeleting(undefined)} onConfirm={async()=>{await action("categories","DELETE",{id:deleting.id,expectedRevision:deleting.revision});notify("Đã xóa danh mục.");}} />}
  </>;
}
