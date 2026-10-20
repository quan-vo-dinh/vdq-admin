"use client";
import { useContext, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, NotebookPen, NotebookText, Plus } from "lucide-react";
import { NotesContext } from "@/app/context/notes-context";
import { plainDocument, noteText } from "@/lib/notes/model";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Panel, Message, useTodayLocale } from "./shared";
export function QuickNote() {
  const { text } = useTodayLocale();
  const { addNote } = useContext(NotesContext);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const createId = useRef("");
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  return <Panel icon={<NotebookPen className="size-4" />} title={text("Ghi nhanh kẻo quên", "Catch that thought")} description={text("Não có RAM, nhưng chưa chắc có autosave.", "Your brain has RAM. Autosave? Debatable.")}>
    <form className="space-y-3" onSubmit={async event => {
      event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(false); setSaved(false);
      try { createId.current ||= crypto.randomUUID(); await addNote({ id: createId.current, title: title.trim(), content: plainDocument(content.trim()), color: "primary", datef: new Date().toISOString(), deleted: false }); createId.current = ""; setTitle(""); setContent(""); setSaved(true); }
      catch { setError(true); } finally { lock.current = false; setBusy(false); }
    }}>
      <label htmlFor="quick-note-title" className="sr-only">{text("Tiêu đề ghi chú", "Note title")}</label>
      <Input id="quick-note-title" value={title} onChange={event => { setTitle(event.target.value); setSaved(false); }} maxLength={120} placeholder={text("Ý tưởng vừa lóe lên…", "That idea you just had…")} disabled={busy} required />
      <label htmlFor="quick-note-content" className="sr-only">{text("Nội dung ghi chú", "Note content")}</label>
      <Textarea id="quick-note-content" className="min-h-28 resize-y" value={content} onChange={event => { setContent(event.target.value); setSaved(false); }} placeholder={text("Viết vài dòng, lát nữa tính tiếp.", "A few lines now. Figure the rest out later.")} maxLength={10000} disabled={busy} />
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{text("Lưu vào Ghi chú", "Saves to Notes")}</span><Button type="submit" disabled={busy || !title.trim()}>{busy ? <>{text("Đang lưu…", "Saving…")}</> : <><Plus />{text("Lưu ghi chú", "Save note")}</>}</Button></div>
      {error && <Message error>{text("Chưa lưu được. Nội dung vẫn ở đây, thử lại nhé.", "Could not save. Your draft is still here; please retry.")}</Message>}
      {saved && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Check className="size-4" />{text("Đã cất vào Ghi chú.", "Saved to Notes.")}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">{text("Ghi chú được lưu vào cơ sở dữ liệu sau khi xác nhận thành công.", "Notes are saved to the database after confirmation.")}</p>
    </form>
  </Panel>;
}
export function RecentNotes() {
  const { text, date } = useTodayLocale();
  const { notes, error, loading } = useContext(NotesContext);
  const recent = notes.filter(note => !note.deleted).sort((a, b) => Date.parse(b.updatedAt ?? b.datef ?? "") - Date.parse(a.updatedAt ?? a.datef ?? "")).slice(0, 4);
  return <Panel icon={<NotebookText className="size-4" />} title={text("Tiếp tục đang dở", "Pick up where you left off")} description={text("Những ghi chú vừa được chạm tới.", "Your most recently edited notes.")} action={<Link href="/apps/notes" aria-label={text("Mở ghi chú", "Open notes")} className="text-muted-foreground hover:text-foreground"><ArrowUpRight className="size-4" /></Link>}>
    {loading ? <Message>{text("Đang mở ghi chú…", "Opening notes…")}</Message> : error ? <Message error>{text("Chưa tải được ghi chú. Mở trang Ghi chú để thử lại.", "Could not load notes. Open Notes to retry.")}</Message> : !recent.length ? <Message>{text("Chưa có ghi chú nào. Bắt đầu bằng một ý tưởng nhé.", "No notes yet. Start with a thought.")}</Message> : <div className="grid gap-3 sm:grid-cols-2">{recent.map(note => <Link key={note.id} href={`/apps/notes?note=${note.id}`} className="group min-w-0 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"><div className="mb-2 flex items-start justify-between gap-3"><p className="line-clamp-1 font-medium">{note.title}</p><ArrowUpRight className="size-4 shrink-0 text-muted-foreground" /></div><p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{noteText(note.content) || text("Mở ra viết tiếp…", "Open and keep writing…")}</p><p className="mt-3 text-xs text-muted-foreground">{(note.updatedAt || note.datef) && date(note.updatedAt ?? note.datef!, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</p></Link>)}</div>}
  </Panel>;
}
