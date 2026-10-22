"use client";
import { NumberTicker } from "@/components/ui/number-ticker";

import { useContext, useId, useState } from "react";
import { Search, Trash2, CalendarDays, X } from "lucide-react";
import { NotesContext } from "@/app/context/notes-context";
import { useLanguage } from "@/app/context/language-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { noteDay, noteDateTime, noteText } from "@/lib/notes/model";
import { cn } from "@/lib/utils";
import type { NotesType } from "@/app/(dashboard-layout)/types/apps/notes";

export default function Notelist({ onSelect }: { onSelect?: () => void }) {
  const { notes, loading, selectedNoteId, selectNote, deleteNote } = useContext(NotesContext);
  const { language } = useLanguage();
  const text = (vi: string, en: string) => language === "vi" ? vi : en;
  const filterId = useId();
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("all");
  const [date, setDate] = useState("");
  const [today, setToday] = useState("");
  const [deleting, setDeleting] = useState<NotesType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const filtered = notes.filter(note => {
    const day = noteDay(note.datef);
    const start = today ? new Date(Date.parse(`${today}T00:00:00Z`) - 6 * 86400000).toISOString().slice(0, 10) : "";
    return !note.deleted && (!date || day === date) && (date || range === "all" || (range === "today" ? day === today : day >= start && day <= today)) && `${note.title} ${noteText(note.content)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  });
  const groups = Map.groupBy(filtered, note => noteDay(note.datef));
  const dayLabel = (day: string) => day ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(`${day}T12:00:00+07:00`)) : text("Chưa có ngày", "Undated");
  return <div className="flex h-full min-h-0 flex-col gap-4">
    <div className="flex shrink-0 flex-col gap-3">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label={text("Tìm ghi chú", "Search notes")} placeholder={text("Tìm tiêu đề, nội dung…", "Search title, content…")} className="pl-9" value={query} onChange={e => setQuery(e.target.value)} /></div>
      <ToggleGroup variant="outline" value={[date ? "" : range]} onValueChange={value => { if (value[0]) { setRange(value[0]); setDate(""); setToday(noteDay(new Date().toISOString())); } }} aria-label={text("Khoảng ngày", "Date range")}>
        <ToggleGroupItem value="all">{text("Tất cả", "All")}</ToggleGroupItem><ToggleGroupItem value="today">{text("Hôm nay", "Today")}</ToggleGroupItem><ToggleGroupItem value="week">{text("7 ngày", "7 days")}</ToggleGroupItem>
      </ToggleGroup>
      <Field><FieldLabel htmlFor={filterId} className="flex items-center gap-2"><CalendarDays className="size-3" />{text("Theo ngày", "By date")}</FieldLabel><div className="flex items-center gap-1"><Input id={filterId} type="date" value={date} onInput={e => setDate(e.currentTarget.value)} />{date && <Button variant="ghost" size="icon-sm" aria-label={text("Xóa lọc ngày", "Clear date filter")} onClick={() => { setDate(""); setRange("all"); }}><X /></Button>}</div></Field>
      <span className="text-xs text-muted-foreground"><NumberTicker value={filtered.length} /> {text("ghi chú", "notes")}</span>
    </div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
      {loading ? <Skeleton className="h-40" /> : filtered.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{text("Không có ghi chú phù hợp", "No matching notes")}</p> : [...groups].map(([day, entries]) => <section key={day} className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{dayLabel(day)}</h3>
        {entries.map(note => <div key={note.id} className={cn("flex min-w-0 items-start gap-1 rounded-md border border-border p-3", selectedNoteId === note.id && "bg-accent")} style={{ borderInlineStartWidth: 3, borderInlineStartColor: `var(--${note.color ?? "primary"})` }}>
          <button type="button" className="flex min-w-0 flex-1 flex-col gap-1 text-left" aria-pressed={selectedNoteId === note.id} onClick={() => { selectNote(note.id); onSelect?.(); }}>
            <span className="w-full truncate text-sm font-medium">{note.title}</span>
            <span className="line-clamp-2 text-xs text-muted-foreground">{noteText(note.content) || text("Chưa có nội dung", "No content yet")}</span>
            <time dateTime={note.datef} className="text-xs text-muted-foreground">{noteDateTime(note.datef).slice(11)} · GMT+7</time>
          </button>
          <Button variant="ghost" size="icon-sm" aria-label={`${text("Xóa", "Delete")} ${note.title}`} onClick={() => { setDeleting(note); setError(""); }}><Trash2 /></Button>
        </div>)}
      </section>)}
    </div>
    <Dialog open={!!deleting} onOpenChange={open => { if (!open && !busy) setDeleting(null); }}><DialogContent size="sm"><DialogHeader><DialogTitle>{text("Xóa ghi chú?", "Delete note?")}</DialogTitle><DialogDescription>{deleting?.title}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>{text("Hủy", "Cancel")}</Button><Button variant="destructive" disabled={busy} onClick={async () => { if (!deleting) return; setBusy(true); try { await deleteNote(deleting.id); setDeleting(null); } catch { setError(text("Chưa xóa được ghi chú. Hãy thử lại.", "Could not delete. Please try again.")); setDeleting(null); } finally { setBusy(false); } }}>{text("Xóa", "Delete")}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
