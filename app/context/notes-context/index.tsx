"use client";
import { createContext, useState, type ReactNode } from "react";
import useSWR from "swr";
import type { NotesType, NoteUpdate } from "@/app/(dashboard-layout)/types/apps/notes";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/app/api/global-fetcher";

interface NotesContextType {
  notes: NotesType[];
  loading: boolean;
  error: Error | null;
  selectedNoteId: string | null;
  selectNote: (id: string) => void;
  addNote: (note: NotesType) => Promise<void>;
  updateNote: (id: string, update: NoteUpdate, expectedRevision?: number) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}
const missingProvider = async () => { throw new Error("NotesProvider missing"); };
export const NotesContext = createContext<NotesContextType>({ notes: [], loading: true, error: null, selectedNoteId: null, selectNote: () => {}, addNote: missingProvider, updateNote: missingProvider, deleteNote: missingProvider });
export function NotesProvider({ children, initialNoteId = null }: { children: ReactNode; initialNoteId?: string | null }) {
  const { data, isLoading, error, mutate } = useSWR<{ data: NotesType[]; item?: NotesType }, Error>("/api/notes", getFetcher, { revalidateOnFocus: true });
  const [selected, selectNote] = useState(initialNoteId);
  const notes = [...(data?.data ?? [])].sort((a, b) => (Date.parse(b.datef ?? "") || 0) - (Date.parse(a.datef ?? "") || 0) || b.id.localeCompare(a.id));
  const selectedNoteId = notes.some(note => note.id === selected) ? selected : notes[0]?.id ?? null;
  return <NotesContext.Provider value={{ notes, loading: isLoading, error: error ?? null, selectedNoteId, selectNote,
    addNote: async note => {
      const result = await mutate(() => postFetcher("/api/notes", note), { revalidate: false });
      const added = result?.item;
      if (added) selectNote(added.id);
    },
    updateNote: async (id, update, expectedRevision) => { await mutate(() => putFetcher("/api/notes", { id, ...update, expectedRevision: expectedRevision ?? notes.find(n => n.id === id)?.revision }), { revalidate: false }); },
    deleteNote: async id => { await mutate(() => deleteFetcher("/api/notes", { id, expectedRevision: notes.find(n => n.id === id)?.revision }), { revalidate: false }); },
  }}>{children}</NotesContext.Provider>;
}
