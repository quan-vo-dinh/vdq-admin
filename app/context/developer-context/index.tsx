"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import useSWR from "swr";
import { toast } from "@/components/ui/toast";
import type { DeveloperData } from "@/lib/developer/model";
import type { LiveSnapshot } from "@/lib/developer/live/types";
export async function developerFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.code ?? "unavailable");
  return body;
}
const Context = createContext<{
  data: DeveloperData;
  activities: LiveSnapshot["activities"];
  syncProgress: NonNullable<LiveSnapshot["sync"]>;
  error: Error | undefined;
  isValidating: boolean;
  reload: () => void;
  days: number;
  setDays: (n: number) => void;
  githubAccount: string;
  setGithubAccount: (id: string) => void;
  readIds: string[];
  toggleRead: (id: string) => void;
} | null>(null);
export function DeveloperProvider({
  initialData,
  children,
}: {
  initialData: DeveloperData;
  children: ReactNode;
}) {
  const { data, error, isValidating, mutate } = useSWR<LiveSnapshot, Error>(
    "/api/developer",
    developerFetch,
    {
      fallbackData: { data: initialData, activities: [], coverage: [] },
      revalidateOnFocus: false,
      refreshInterval: 5000,
    },
  );
  const [githubAccount, setGithubAccount] = useState("all");
  const [days, setDays] = useState(30),
    [syncing, setSyncing] = useState(false);
  const sync = useCallback(
    async (signal?: AbortSignal) => {
      await Promise.resolve();
      if (signal?.aborted) return;
      setSyncing(true);
      try {
        const connections = (await developerFetch(
          "/api/developer/connections",
          { signal },
        )) as { id: string; paused: boolean }[];
        const results = await Promise.allSettled(connections.filter(c => !c.paused).map(async c => {
          let activityDone = false, historyDone = false;
          for (let step = 0; step < 10000 && !signal?.aborted && (!activityDone || !historyDone); step++) {
            if (!historyDone) {
              const result = await developerFetch("/api/developer/sync", {
                method: "POST", body: JSON.stringify({ id: c.id, mode: "history" }), signal,
              });
              historyDone = !!(result.done || result.retryAfter);
            }
            if (!activityDone) {
              const result = await developerFetch("/api/developer/sync", {
                method: "POST", body: JSON.stringify({ id: c.id }), signal,
              });
              activityDone = !!(result.done || result.retryAfter);
            }
          }
        }));
        const failed = results.find(r => r.status === "rejected");
        if (failed?.status === "rejected") throw failed.reason;
      } catch (cause) {
        if (!signal?.aborted)
          toast.add({
            title: cause instanceof Error ? cause.message : "unavailable",
            type: "error",
          });
      } finally {
        setSyncing(false);
        if (!signal?.aborted) await mutate();
      }
    },
    [mutate],
  );
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void sync(controller.signal), 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [sync]);
  useEffect(() => {
    const timer = setInterval(() => { if (!syncing) void sync(); }, 60000);
    return () => clearInterval(timer);
  }, [sync, syncing]);
  const current = data?.data ?? initialData;
  return (
    <Context.Provider
      value={{
        data: current,
        activities: data?.activities ?? [],
        syncProgress: data?.sync ?? [],
        error,
        isValidating: isValidating || syncing,
        days,
        setDays,
        githubAccount,
        setGithubAccount,
        reload: () => {
          if (!syncing) void sync();
        },
        readIds: current.notifications.filter((n) => n.read).map((n) => n.id),
        toggleRead: (id) => {
          void developerFetch("/api/developer/inbox", {
            method: "PATCH",
            body: JSON.stringify({ id }),
          })
            .then(() => mutate())
            .catch((cause) =>
              toast.add({ title: String(cause.message), type: "error" }),
            );
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDeveloper() {
  const value = useContext(Context);
  if (!value) throw new Error("DeveloperProvider missing");
  return value;
}
