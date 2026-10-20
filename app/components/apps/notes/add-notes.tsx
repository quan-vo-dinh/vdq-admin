"use client";
import { useContext, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NotesContext } from "@/app/context/notes-context";
import { useLanguage } from "@/app/context/language-context";
import { noteDateTime, noteTimestamp, plainDocument } from "@/lib/notes/model";
import { NoteFields, type NoteDraft } from "./note-fields";

export default function AddNotes() {
  const { addNote } = useContext(NotesContext);
  const { language } = useLanguage();
  const text = (vi: string, en: string) => language === "vi" ? vi : en;
  const createId = useRef("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<NoteDraft>({ title: "", color: "primary", content: plainDocument(), localTime: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setSaving(true); setError("");
    try {
      const { localTime, ...note } = draft;
      await addNote({ ...note, id: createId.current, deleted: false, datef: noteTimestamp(localTime) });
      setOpen(false);
    } catch { setError(text("Chưa tạo được ghi chú. Kiểm tra ngày giờ và thử lại.", "Could not create note. Check the date and time and try again.")); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
    <Button onClick={() => { createId.current = crypto.randomUUID(); setDraft({ title: "", color: "primary", content: plainDocument(), localTime: noteDateTime(new Date().toISOString()) }); setError(""); setOpen(true); }}><Plus data-icon="inline-start" />{text("Thêm ghi chú", "Add note")}</Button>
    <DialogContent size="lg" className="max-h-[90dvh] overflow-y-auto ">
      <DialogHeader><DialogTitle>{text("Ghi chú mới", "New note")}</DialogTitle><DialogDescription>{text("Chọn ngày giờ và viết nội dung của bạn.", "Choose a date and time and write your note.")}</DialogDescription></DialogHeader>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <NoteFields draft={draft} onChange={patch => setDraft(previous => ({ ...previous, ...patch }))} prefix="new-note" />
      <DialogFooter><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>{text("Hủy", "Cancel")}</Button><Button disabled={saving || !draft.title?.trim() || !draft.localTime} onClick={save}>{saving ? text("Đang lưu…", "Saving…") : text("Tạo ghi chú", "Create note")}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
