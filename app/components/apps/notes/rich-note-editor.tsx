"use client";
import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Underline, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Code, Link2, Undo2, Redo2, RemoveFormatting } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/app/context/language-context";
import styles from "./note-editor.module.css";
import { cn } from "@/lib/utils";
import { safeNoteLink } from "@/lib/notes/model";

export function RichNoteEditor({ content, onChange }: { content: JSONContent; onChange: (content: JSONContent) => void }) {
  const { language } = useLanguage();
  const text = (vi: string, en: string) => language === "vi" ? vi : en;
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } })],
    content,
    editorProps: { attributes: { class: cn("notes-editor-body", styles.body), role: "textbox", "aria-label": text("Nội dung ghi chú", "Note content"), "aria-multiline": "true" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });
  const state = useEditorState({ editor, selector: ({ editor }) => ({
    bold: editor?.isActive("bold"), italic: editor?.isActive("italic"), underline: editor?.isActive("underline"), strike: editor?.isActive("strike"),
    h1: editor?.isActive("heading", { level: 1 }), h2: editor?.isActive("heading", { level: 2 }),
    bullet: editor?.isActive("bulletList"), ordered: editor?.isActive("orderedList"), quote: editor?.isActive("blockquote"), code: editor?.isActive("codeBlock"), link: editor?.isActive("link"),
  }) });
  if (!editor) return <Skeleton className="h-64 w-full" />;
  const tools = [
    { label: text("Đậm", "Bold"), icon: Bold, active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: text("Nghiêng", "Italic"), icon: Italic, active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: text("Gạch chân", "Underline"), icon: Underline, active: state?.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: text("Gạch ngang", "Strikethrough"), icon: Strikethrough, active: state?.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { label: text("Tiêu đề 1", "Heading 1"), icon: Heading1, active: state?.h1, run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: text("Tiêu đề 2", "Heading 2"), icon: Heading2, active: state?.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: text("Danh sách", "Bullet list"), icon: List, active: state?.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: text("Danh sách đánh số", "Numbered list"), icon: ListOrdered, active: state?.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: text("Trích dẫn", "Quote"), icon: Quote, active: state?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: text("Khối code", "Code block"), icon: Code, active: state?.code, run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: text("Liên kết", "Link"), icon: Link2, active: state?.link, run: () => { setHref(editor.getAttributes("link").href ?? ""); setLinkOpen(true); } },
    { label: text("Bỏ định dạng", "Clear formatting"), icon: RemoveFormatting, run: () => editor.chain().focus().clearNodes().unsetAllMarks().run() },
    { label: text("Hoàn tác", "Undo"), icon: Undo2, run: () => editor.chain().focus().undo().run() },
    { label: text("Làm lại", "Redo"), icon: Redo2, run: () => editor.chain().focus().redo().run() },
  ];
  return <div className={cn(styles.editorFrame, "rounded-md border border-border")}>
    <div role="toolbar" aria-label={text("Định dạng văn bản", "Text formatting")} className={cn(styles.editorToolbar, "flex flex-wrap gap-1 border-b border-border p-2")}>
      {tools.map(tool => <Button key={tool.label} type="button" size="icon-sm" variant={tool.active ? "secondary" : "ghost"} aria-label={tool.label} title={tool.label} aria-pressed={tool.active} onClick={tool.run}><tool.icon /></Button>)}
    </div>
    <EditorContent editor={editor} className={styles.editorSurface} />
    <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
      <DialogContent size="sm" >
        <DialogHeader><DialogTitle>{text("Liên kết", "Link")}</DialogTitle><DialogDescription>{text("Dán địa chỉ https://, http:// hoặc mailto:. Để trống để gỡ liên kết.", "Use https://, http:// or mailto:. Leave empty to remove the link.")}</DialogDescription></DialogHeader>
        <Field><FieldLabel htmlFor="note-link">URL</FieldLabel><Input id="note-link" value={href} onChange={e => setHref(e.target.value)} placeholder="https://" aria-invalid={!!href && !safeNoteLink(href.trim())} /></Field>
        <DialogFooter><Button type="button" disabled={!!href.trim() && !safeNoteLink(href.trim())} onClick={() => {
          const chain = editor.chain().focus().extendMarkRange("link");
          if (href.trim()) chain.setLink({ href: href.trim() }).run(); else chain.unsetLink().run();
          setLinkOpen(false);
        }}>{text("Áp dụng", "Apply")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
