"use client";
import Notelist from "./notes-list";
export default function NotesSidebar({ onSelect }: { onSelect?: () => void }) {
  return <div className="h-full w-80 min-w-0 border-e border-border p-4"><Notelist onSelect={onSelect} /></div>;
}
