"use client";
import { createContext, useState, type ReactNode } from "react";
import useSWR from "swr";
import type { NotesType, NoteUpdate } from "@/app/(dashboard-layout)/types/apps/notes";
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from "@/app/api/global-fetcher";

interface NotesContextType {
  notes: NotesType[];
  loading: boolean;
  error: Error | null;
  selectedNoteId: number;
  selectNote: (id: number) => void;
  addNote: (note: NotesType) => Promise<void>;
  updateNote: (id: number, update: NoteUpdate) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}
const missingProvider = async () => { throw new Error("NotesProvider missing"); };
export const NotesContext = createContext<NotesContextType>({ notes: [], loading: true, error: null, selectedNoteId: 0, selectNote: () => {}, addNote: missingProvider, updateNote: missingProvider, deleteNote: missingProvider });
export function NotesProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, mutate } = useSWR<{ data: NotesType[] }, Error>("/api/notes", getFetcher, { revalidateOnFocus: false });
  const [selected, selectNote] = useState(0);
  const notes = [...(data?.data ?? [])].sort((a, b) => (Date.parse(b.datef ?? "") || 0) - (Date.parse(a.datef ?? "") || 0) || b.id - a.id);
  const selectedNoteId = notes.some(note => note.id === selected) ? selected : notes[0]?.id ?? 0;
  return <NotesContext.Provider value={{ notes, loading: isLoading, error: error ?? null, selectedNoteId, selectNote,
    addNote: async note => {
      const result = await mutate(() => postFetcher("/api/notes", note), { revalidate: false });
      const added = result?.data.reduce<NotesType | undefined>((latest, n) => !latest || n.id > latest.id ? n : latest, undefined);
      if (added) selectNote(added.id);
    },
    updateNote: async (id, update) => { await mutate(() => putFetcher("/api/notes", { id, ...update }), { revalidate: false }); },
    deleteNote: async id => { await mutate(() => deleteFetcher("/api/notes", { id }), { revalidate: false }); },
  }}>{children}</NotesContext.Provider>;
}
