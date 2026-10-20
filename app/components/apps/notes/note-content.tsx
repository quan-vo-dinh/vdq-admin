"use client";
import { useContext, useState } from "react";
import styles from "./note-editor.module.css";
import { cn } from "@/lib/utils";
import { Save } from "lucide-react";
import { NotesContext } from "@/app/context/notes-context";
import { useLanguage } from "@/app/context/language-context";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { noteDateTime, noteTimestamp, noteText, plainDocument } from "@/lib/notes/model";
import { NoteFields, type NoteDraft } from "./note-fields";

export default function NoteContent() {
  const { notes, selectedNoteId, updateNote, loading, error } = useContext(NotesContext);
  const { language } = useLanguage();
  const text = (vi: string, en: string) => language === "vi" ? vi : en;
  // Drafts stay available when switching between notes in this workspace.
  const [drafts, setDrafts] = useState<Record<string, NoteDraft & { expectedRevision?: number }>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const note = notes.find(n => n.id === selectedNoteId);
  if (loading) return <div className="p-6"><Skeleton className="h-72" /></div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{text("Không tải được ghi chú. Hãy thử tải lại trang.", "Could not load notes. Please reload.")}</AlertDescription></Alert>;
  if (!note) return <Empty><EmptyHeader><EmptyTitle>{text("Thêm ghi chú đầu tiên của bạn", "Add your first note")}</EmptyTitle></EmptyHeader></Empty>;
  const initial: NoteDraft & { expectedRevision?: number } = { title: note.title ?? "", color: note.color ?? "primary", content: note.content ?? plainDocument(note.title), localTime: noteDateTime(note.datef), expectedRevision: note.revision };
  const draft = drafts[note.id] ?? initial;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const onChange = (patch: Partial<NoteDraft>) => { setDrafts(previous => ({ ...previous, [note.id]: { ...(previous[note.id] ?? initial), ...patch } })); setSaved(null); };
  const save = async () => {
    setSaving(true); setSaveError("");
    try {
      const { localTime, expectedRevision, ...update } = draft;
      await updateNote(note.id, { ...update, datef: noteTimestamp(localTime) }, expectedRevision);
      setDrafts(previous => { const next = { ...previous }; delete next[note.id]; return next; });
      setSaved(note.id);
    } catch { setSaveError(text("Chưa lưu được ghi chú. Nội dung vẫn được giữ. Nếu có xung đột, sao chép bản nháp và tải lại.", "Could not save. Draft retained. On conflict, copy your draft and reload.")); }
    finally { setSaving(false); }
  };
  const formatTime = (value?: string) => value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "—";
  return <div className={cn(styles.noteContent, "gap-4 p-4 sm:p-6")}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>{text("Tạo", "Created")}: {formatTime(note.createdAt ?? note.datef)} · {text("Cập nhật", "Updated")}: {formatTime(note.updatedAt ?? note.datef)}</span>
      <span role="status">{saving ? text("Đang lưu…", "Saving…") : dirty ? text("Chưa lưu", "Unsaved") : saved === note.id ? text("Đã lưu", "Saved") : ""}</span>
    </div>
    {saveError && <Alert variant="destructive"><AlertDescription>{saveError}</AlertDescription></Alert>}
    <NoteFields fill key={note.id} draft={draft} onChange={onChange} prefix="edit-note" />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{noteText(draft.content).trim().split(/\s+/).filter(Boolean).length} {text("từ", "words")}</span>
      <Button disabled={saving || !dirty || !draft.title?.trim() || !draft.localTime} onClick={save}><Save data-icon="inline-start" />{text("Lưu thay đổi", "Save changes")}</Button>
    </div>
  </div>;
}
