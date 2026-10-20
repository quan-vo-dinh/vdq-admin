"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useSWR from "swr";
import {
  deleteFetcher,
  getFetcher,
  patchFetcher,
  postFetcher,
  putFetcher,
} from "@/app/api/global-fetcher";
import {
  defaultSettings,
  type CalendarData,
  type CalendarEvent,
  type CalendarSettings,
  type EventInput,
} from "@/lib/calendar/types";

function useCalendarData() {
  const { data, error, isLoading, mutate } = useSWR<CalendarData>(
    "/api/calendar",
    getFetcher,
  );
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  async function change(operation: () => Promise<CalendarData>) {
    if (locked.current)
      throw new Error("A calendar change is already in progress");
    locked.current = true;
    setBusy(true);
    try {
      await mutate(operation(), { revalidate: false, throwOnError: true });
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return {
    events: data?.events ?? [],
    settingsRevision: data?.settingsRevision,
    settings: data?.settings ?? defaultSettings,
    error: error as Error | undefined,
    isLoading,
    busy,
    reload: () => mutate(),
    addEvent: (event: EventInput, id: string) =>
      change(() => postFetcher("/api/calendar", { ...event, id })),
    updateEvent: (event: CalendarEvent) =>
      change(() => putFetcher("/api/calendar", { ...event, expectedRevision: event.revision })),
    deleteEvent: (id: string, expectedRevision?: number) =>
      change(() => deleteFetcher("/api/calendar", { id, expectedRevision: expectedRevision ?? data?.events.find(e => e.id === id)?.revision })),
    saveSettings: (settings: CalendarSettings, expectedRevision?: number) =>
      change(() => patchFetcher("/api/calendar", { ...settings, expectedRevision })),
  };
}
const CalendarContext = createContext<ReturnType<
  typeof useCalendarData
> | null>(null);
export function CalendarProvider({ children }: { children: ReactNode }) {
  const value = useCalendarData();
  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
export function useCalendar() {
  const value = useContext(CalendarContext);
  if (!value) throw new Error("CalendarProvider is required");
  return value;
}
