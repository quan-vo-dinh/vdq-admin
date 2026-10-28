"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Bold, Italic, MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { usePortfolioEditor } from "@/app/context/portfolio-context";
import {
  annotationSchema,
  type PortfolioAnnotation,
} from "@/lib/portfolio/model";
import {
  occurrenceAt,
  occurrenceRange,
  formatSelection,
} from "@/lib/portfolio/annotations";
import {
  AnnotatedMarkdown,
  AnnotationCard,
} from "@/components/portfolio/annotated-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TextField, ImageField, useEditorCopy } from "./editor-fields";

type Target = { field: PortfolioAnnotation["field"]; itemId?: string };
type Props = ComponentProps<typeof TextField> & {
  target: Target;
  annotations?: PortfolioAnnotation[];
  onAnnotationsChange?: (annotations: PortfolioAnnotation[]) => void;
};
export function RichTextField({
  target,
  annotations,
  onAnnotationsChange,
  ...props
}: Props) {
  const store = usePortfolioEditor(),
    t = useEditorCopy();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [editing, setEditing] = useState<PortfolioAnnotation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discard, setDiscard] = useState(false),
    [original, setOriginal] = useState("");
  const dialogDirty = !!editing && JSON.stringify(editing) !== original;
  useEffect(() => {
    if (!dialogDirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dialogDirty]);
  const all = annotations ?? store.doc!.locales[store.locale].annotations ?? [];
  const notes = all.filter(
    (a) => a.field === target.field && a.itemId === (target.itemId ?? ""),
  );
  function update(next: PortfolioAnnotation[]) {
    if (onAnnotationsChange) onAnnotationsChange(next);
    else store.updateResume((current) => {
      const updated = { ...current };
      if (next.length) updated.annotations = next;
      else delete updated.annotations;
      return updated;
    });
  }
  function open(note: PortfolioAnnotation) {
    setEditing(structuredClone(note));
    setOriginal(JSON.stringify(note));
    setErrors({});
  }
  function close() {
    if (dialogDirty) setDiscard(true);
    else setEditing(null);
  }
  function format(marker: "**" | "*") {
    const start = textarea.current?.selectionStart ?? selection.start;
    const end = textarea.current?.selectionEnd ?? selection.end;
    const next = formatSelection(props.value, start, end, marker);
    props.onChange(next.text);
    setSelection({ start: next.start, end: next.end });
    requestAnimationFrame(() => {
      textarea.current?.focus();
      textarea.current?.setSelectionRange(next.start, next.end);
    });
  }
  function add() {
    const quote = props.value.slice(selection.start, selection.end);
    const occurrence = occurrenceAt(props.value, quote, selection.start);
    if (!quote.trim() || !occurrence) return;
    open({
      id: crypto.randomUUID(),
      field: target.field,
      itemId: target.itemId ?? "",
      quote,
      occurrence,
      title: quote.replace(/[*_`]/g, "").slice(0, 160),
      body: "",
      image: "",
      href: "",
      appearance: "highlight",
      enabled: true,
    });
  }
  function save() {
    if (!editing) return;
    if (!editing.quote.trim()) {
      setErrors({
        quote: t("Nhập cụm từ cần chú thích.", "Enter the phrase to annotate."),
      });
      return;
    }
    const result = annotationSchema.safeParse(editing);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues)
        next[String(issue.path[0])] = t(
          "Kiểm tra độ dài và định dạng nội dung.",
          "Check the value and length.",
        );
      setErrors(next);
      return;
    }
    const existing = all.some((a) => a.id === editing.id);
    if (!existing && all.length >= 100) {
      setErrors({
        quote: t(
          "Mỗi ngôn ngữ hỗ trợ tối đa 100 chú thích.",
          "Each language supports up to 100 annotations.",
        ),
      });
      return;
    }
    update(
      existing
        ? all.map((a) => (a.id === editing.id ? result.data : a))
        : [...all, result.data],
    );
    setEditing(null);
  }
  function set<K extends keyof PortfolioAnnotation>(
    key: K,
    value: PortfolioAnnotation[K],
  ) {
    setEditing((current) => (current ? { ...current, [key]: value } : null));
  }
  return (
    <>
      <TextField
        {...props}
        multiline
        textareaRef={textarea}
        onTextSelection={(start, end) => setSelection({ start, end })}
        toolbar={
          <div
            className="flex flex-wrap items-center gap-1"
            role="group"
            aria-label={t("Định dạng văn bản", "Text formatting")}
          >
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={store.busy}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format("**")}
              aria-label={t("Đậm", "Bold")}
              title={t("Đậm", "Bold")}
            >
              <Bold />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={store.busy}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => format("*")}
              aria-label={t("Nghiêng", "Italic")}
              title={t("Nghiêng", "Italic")}
            >
              <Italic />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                store.busy ||
                selection.start === selection.end ||
                !props.value.slice(selection.start, selection.end).trim()
              }
              onMouseDown={(e) => e.preventDefault()}
              onClick={add}
            >
              <MessageSquarePlus data-icon="inline-start" />
              {t("Thêm chú thích", "Add tooltip")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t(
                "Bôi đen chữ để định dạng hoặc thêm thẻ hover.",
                "Select text to format it or add a hover card.",
              )}
            </span>
          </div>
        }
        footer={
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/15 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              {t(
                "Xem trước nội dung · rê chuột hoặc nhấn vào chữ được đánh dấu",
                "Content preview · hover or tap marked text",
              )}
            </p>
            <AnnotatedMarkdown
              text={props.value}
              annotations={notes}
              privateMedia
              className="min-h-6 text-sm leading-relaxed"
            />
            {!!notes.length && (
              <div className="flex flex-col gap-2 border-t pt-3">
                {notes.map((note) => {
                  const stale = !occurrenceRange(
                    props.value,
                    note.quote,
                    note.occurrence,
                  );
                  return (
                    <div
                      key={note.id}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {note.quote}
                      </span>
                      {!note.enabled && (
                        <Badge variant="outline">
                          {t("Đang tắt", "Disabled")}
                        </Badge>
                      )}
                      {stale && (
                        <Badge variant="outline">
                          {t("Cần chọn lại chữ", "Text no longer matches")}
                        </Badge>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => open(note)}
                        aria-label={`${t("Sửa chú thích", "Edit tooltip")}: ${note.quote}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          update(all.filter((a) => a.id !== note.id))
                        }
                        aria-label={`${t("Gỡ chú thích", "Remove tooltip")}: ${note.quote}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        }
      />
      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent size="lg" closeLabel={t("Đóng", "Close")}>
          <DialogHeader>
            <DialogTitle>{t("Chú thích văn bản", "Text tooltip")}</DialogTitle>
            <DialogDescription>
              {t(
                "Cấu hình thẻ cho cụm từ trong đoạn này. Ảnh và nội dung chỉ công khai sau khi xuất bản.",
                "Configure a card for this phrase. Its image and content become public only after publishing.",
              )}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <FieldGroup className="grid items-start gap-6 md:grid-cols-2">
              <FieldGroup>
                <TextField
                  label={t("Cụm từ được đánh dấu", "Marked phrase")}
                  value={editing.quote}
                  error={errors.quote}
                  onChange={(value) => set("quote", value)}
                  description={t(
                    "Khớp chính xác chữ hoa/thường trong đoạn văn.",
                    "Matches the exact phrase, including letter case.",
                  )}
                />
                <Field>
                  <FieldLabel htmlFor={`occurrence-${editing.id}`}>
                    {t("Lần xuất hiện", "Occurrence")}
                  </FieldLabel>
                  <Input
                    id={`occurrence-${editing.id}`}
                    type="number"
                    min={1}
                    max={1000}
                    value={editing.occurrence}
                    onChange={(e) => set("occurrence", Number(e.target.value))}
                    aria-invalid={!!errors.occurrence}
                  />
                  <FieldDescription>
                    {t(
                      "Nếu cụm từ lặp lại: 1 là lần đầu, 2 là lần thứ hai…",
                      "If the phrase repeats: 1 is the first, 2 the second…",
                    )}
                  </FieldDescription>
                  {errors.occurrence && (
                    <FieldError>{errors.occurrence}</FieldError>
                  )}
                </Field>
                <TextField
                  label={t("Tiêu đề thẻ", "Card title")}
                  value={editing.title}
                  error={errors.title}
                  onChange={(value) => set("title", value)}
                />
                <TextField
                  label={t("Nội dung chú thích", "Explanation")}
                  value={editing.body}
                  error={errors.body}
                  onChange={(value) => set("body", value)}
                  multiline
                  rows={4}
                />
                <TextField
                  label={t("Liên kết tìm hiểu thêm", "Read more URL")}
                  value={editing.href}
                  error={errors.href}
                  onChange={(value) => set("href", value)}
                  placeholder="https://"
                />
              </FieldGroup>
              <FieldGroup>
                <ImageField
                  label={t("Ảnh thẻ (tùy chọn)", "Card image (optional)")}
                  value={editing.image}
                  onChange={(value) => set("image", value)}
                  variant="cover"
                />
                <Field>
                  <FieldLabel>
                    {t("Cách đánh dấu", "Text appearance")}
                  </FieldLabel>
                  <ToggleGroup
                    value={[editing.appearance]}
                    onValueChange={(values) =>
                      values[0] &&
                      set(
                        "appearance",
                        values[0] as PortfolioAnnotation["appearance"],
                      )
                    }
                    aria-label={t("Cách đánh dấu", "Text appearance")}
                  >
                    <ToggleGroupItem value="highlight">
                      {t("Tô nền", "Highlight")}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="underline">
                      {t("Gạch chân", "Underline")}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor={`enabled-${editing.id}`}>
                    {t("Bật chú thích", "Enable tooltip")}
                  </FieldLabel>
                  <Switch
                    id={`enabled-${editing.id}`}
                    checked={editing.enabled}
                    onCheckedChange={(value) => set("enabled", value)}
                  />
                </Field>
                <div className="rounded-lg border p-4">
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("Rê chuột hoặc nhấn để thử", "Hover or tap to try")}
                  </p>
                  <AnnotationCard annotation={editing} privateMedia>
                    {editing.quote || t("Cụm từ", "Phrase")}
                  </AnnotationCard>
                </div>
                {!occurrenceRange(
                  props.value,
                  editing.quote,
                  editing.occurrence,
                ) && (
                  <FieldDescription>
                    {t(
                      "Chưa tìm thấy cụm từ này. Thẻ sẽ chưa hiển thị trong đoạn văn cho đến khi khớp lại.",
                      "This phrase was not found. The card stays hidden in the text until it matches again.",
                    )}
                  </FieldDescription>
                )}
              </FieldGroup>
            </FieldGroup>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              {t("Hủy", "Cancel")}
            </Button>
            <Button type="button" onClick={save}>
              {t("Áp dụng chú thích", "Apply tooltip")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={discard} onOpenChange={setDiscard}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {t("Bỏ thay đổi chú thích?", "Discard tooltip changes?")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Các thay đổi trong thẻ chưa được áp dụng.",
                "Changes to this card have not been applied.",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDiscard(false)}
            >
              {t("Tiếp tục sửa", "Keep editing")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDiscard(false);
                setEditing(null);
              }}
            >
              {t("Bỏ thay đổi", "Discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
