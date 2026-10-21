"use client";

import { useState } from "react";
import { Tags } from "lucide-react";
import { useFinance } from "@/app/context/finance-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { categoryCodePattern } from "@/lib/finance/csv";
import { Choice } from "./shared";
import { useFinanceLocale } from "./locale";

export function CategoryManager() {
  const { data, action, busy, notify } = useFinance();
  const { text } = useFinanceLocale();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(() => crypto.randomUUID());
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState("expense");
  const [error, setError] = useState("");

  return <>
    <Button size="sm" variant="outline" disabled={!data} onClick={() => setOpen(true)}>
      <Tags data-icon="inline-start" />{text("Thêm danh mục")}
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md" data-readable-feature data-finance-typography closeLabel={text("Đóng")}>
        <DialogHeader>
          <DialogTitle>{text("Thêm danh mục")}</DialogTitle>
          <DialogDescription>{text("Danh mục dùng cho giao dịch và CSV. Danh mục chi tiêu mới có ngân sách ban đầu bằng 0.")}</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-5" onSubmit={async e => {
          e.preventDefault();
          if (!categoryCodePattern.test(code) || code === "transfer") {
            setError("Mã danh mục cần 1–40 ký tự: chữ thường, số, _ hoặc -; bắt đầu bằng chữ, không dùng transfer."); return;
          }
          if (data?.categories?.some(c => c.code === code)) {
            setError("Mã danh mục đã tồn tại, kể cả danh mục đã lưu trữ."); return;
          }
          try {
            await action("categories", "POST", {id, code, name: name.trim(), kind});
            notify("Đã thêm danh mục.");
            setId(crypto.randomUUID()); setCode(""); setName(""); setError(""); setOpen(false);
          } catch (e) {setError(e instanceof Error ? e.message : "Không lưu được.");}
        }}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="category-name">{text("Tên danh mục")}</FieldLabel>
              <Input id="category-name" required maxLength={80} value={name} onChange={e => setName(e.target.value)} />
            </Field>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="category-code">{text("Mã danh mục")}</FieldLabel>
              <Input id="category-code" required maxLength={40} value={code} aria-invalid={!!error} onChange={e => {setCode(e.target.value); setError("");}} placeholder="suc_khoe" />
              <FieldDescription>{text("Dùng mã này trong cột category của CSV. Ví dụ: suc_khoe, thuong.")}</FieldDescription>
              {error && <FieldError>{text(error)}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>{text("Loại danh mục")}</FieldLabel>
              <Choice label={text("Loại danh mục")} value={kind} onChange={setKind} options={[{value:"expense",label:text("Chi tiêu")},{value:"income",label:text("Thu nhập")}]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{text("Hủy")}</Button>
            <Button type="submit" disabled={busy || !name.trim()}>{text("Thêm danh mục")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
