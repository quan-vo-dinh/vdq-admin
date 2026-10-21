"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "@/lib/platform/navigation";
import { Menu } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NotesProvider } from "@/app/context/notes-context";
import { useLanguage } from "@/app/context/language-context";
import { HeadingText } from "@/app/components/shared/heading-text";
import NotesSidebar from "./notes-sidebar";
import NoteContent from "./note-content";
import AddNotes from "./add-notes";

function NotesWorkspace() {
  const params = useSearchParams();
  const initialNoteId = params.get("note");
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const text = (vi: string, en: string) => language === "vi" ? vi : en;
  return <NotesProvider key={initialNoteId} initialNoteId={initialNoteId}>
    <Card className="notes-workspace overflow-hidden py-0!">
      <div className="flex h-[calc(100dvh-260px)] min-h-[560px] min-w-0">
        <div className="hidden h-full shrink-0 lg:block"><NotesSidebar /></div>
        <Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="w-80 p-0 sm:max-w-80"><SheetHeader className="sr-only"><SheetTitle>{text("Danh sách ghi chú", "Notes list")}</SheetTitle></SheetHeader><NotesSidebar onSelect={() => setOpen(false)} /></SheetContent></Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2"><Button variant="ghost" size="icon-sm" aria-label={text("Mở danh sách ghi chú", "Open notes list")} className="lg:hidden" onClick={() => setOpen(true)}><Menu /></Button><h2 className="text-base font-medium"><HeadingText>{text("Ghi chú theo ngày", "Daily notes")}</HeadingText></h2></div>
            <AddNotes />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto"><NoteContent /></div>
        </div>
      </div>
    </Card>
  </NotesProvider>;
}

export default function NotesApp() { return <Suspense fallback={<p>…</p>}><NotesWorkspace /></Suspense>; }
