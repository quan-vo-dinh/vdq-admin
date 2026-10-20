"use client";
import styles from "./note-editor.module.css";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { NoteUpdate } from "@/app/(dashboard-layout)/types/apps/notes";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLanguage } from "@/app/context/language-context";
import { noteColors, plainDocument } from "@/lib/notes/model";
import { RichNoteEditor } from "./rich-note-editor";

export type NoteDraft = NoteUpdate & { localTime: string };
export function NoteFields({ draft, onChange, prefix, fill = false }: { draft: NoteDraft; onChange: (patch: Partial<NoteDraft>) => void; prefix: string; fill?: boolean }) {
  const { language } = useLanguage();
  const text = (vi: string, en: string) => language === "vi" ? vi : en;
  return <FieldGroup className={cn("gap-4", fill && styles.fields)}>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_15rem]">
      <Field><FieldLabel htmlFor={`${prefix}-title`}>{text("Tiêu đề", "Title")}</FieldLabel><Input id={`${prefix}-title`} maxLength={200} value={draft.title ?? ""} placeholder={text("Đặt tên cho ghi chú…", "Give your note a title…")} onChange={e => onChange({ title: e.target.value })} /></Field>
      <Field><FieldLabel htmlFor={`${prefix}-time`}>{text("Ngày & giờ · GMT+7", "Date & time · GMT+7")}</FieldLabel><Input id={`${prefix}-time`} type="datetime-local" value={draft.localTime} onInput={e => onChange({ localTime: e.currentTarget.value })} /></Field>
    </div>
    <Field className={fill ? styles.contentField : undefined}><FieldLabel>{text("Nội dung", "Content")}</FieldLabel><RichNoteEditor content={draft.content ?? plainDocument()} onChange={content => onChange({ content })} /></Field>
    <Field><FieldLabel>{text("Màu ghi chú", "Note color")}</FieldLabel>
      <ToggleGroup value={[draft.color ?? "primary"]} onValueChange={values => { if (values[0]) onChange({ color: values[0] }); }} aria-label={text("Màu ghi chú", "Note color")}>
        {noteColors.map((color, index) => <ToggleGroupItem key={color} value={color} aria-label={`${text("Màu", "Color")} ${index + 1}`} className="rounded-full" style={{ background: `var(--${color})`, color: color === "primary" ? "var(--primary-foreground)" : "var(--foreground)" }}><Check className={draft.color === color ? "visible" : "invisible"} /></ToggleGroupItem>)}
      </ToggleGroup>
    </Field>
  </FieldGroup>;
}
