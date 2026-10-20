import type { JSONContent } from "@tiptap/react";

export interface NotesType {
  id: number;
  background?: string;
  color?: string;
  title?: string;
  content?: JSONContent;
  datef?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted: boolean;
}
export type NoteUpdate = Pick<NotesType, "title" | "content" | "datef" | "color">;
