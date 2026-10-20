"use client";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { getFetcher } from "@/app/api/global-fetcher";
import type { Priority } from "@/lib/today/model";
function useTodayData() {
  const { data, error, isLoading, mutate } = useSWR<Priority[]>("/api/today", getFetcher);
  const pendingId = useRef("");
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  async function change(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
    if (locked.current) throw new Error("busy");
    locked.current = true; setBusy(true);
    try {
      if (method === "POST") { pendingId.current ||= crypto.randomUUID(); body = { ...body, id: pendingId.current }; }
      else body = { ...body, expectedRevision: data?.find(item => item.id === body.id)?.revision };
      const response = await fetch("/api/today", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.code ?? "unavailable");
      if (method === "POST") pendingId.current = "";
      await mutate(result, { revalidate: false });
    } finally { locked.current = false; setBusy(false); }
  }
  return { items: data ?? [], error, isLoading, busy, change, reload: () => mutate() };
}
const TodayContext = createContext<ReturnType<typeof useTodayData> | null>(null);
export function TodayProvider({ children }: { children: ReactNode }) {
  const value = useTodayData();
  return <TodayContext.Provider value={value}>{children}</TodayContext.Provider>;
}
export function useToday() {
  const value = useContext(TodayContext);
  if (!value) throw new Error("TodayProvider required");
  return value;
}
