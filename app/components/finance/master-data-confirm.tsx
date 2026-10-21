"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFinanceLocale } from "./locale";

export function MasterDataConfirm({name, busy, onClose, onConfirm}: {name: string; busy: boolean; onClose: () => void; onConfirm: () => Promise<void>}) {
  const {text} = useFinanceLocale();
  const [error, setError] = useState("");
  return <Dialog open onOpenChange={open => {if (!open && !busy) onClose();}}>
    <DialogContent size="sm" showCloseButton={!busy} closeLabel={text("Đóng")}>
      <DialogHeader><DialogTitle>{text("Xóa dữ liệu?")}</DialogTitle><DialogDescription>{name}. {text("Thao tác này không thể hoàn tác. Dữ liệu đang được sử dụng sẽ không được xóa.")}</DialogDescription></DialogHeader>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>{text("Hủy")}</Button><Button variant="destructive" disabled={busy} onClick={async () => {setError(""); try {await onConfirm(); onClose();} catch(e) {setError(e instanceof Error ? e.message : text("Không lưu được."));}}}>{text("Xóa")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
