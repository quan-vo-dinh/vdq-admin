"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import useSWR from "swr";
import { getFetcher } from "@/app/api/global-fetcher";
import type { DeveloperData } from "@/lib/developer/model";
const Context = createContext<{
  data: DeveloperData;
  error: Error | undefined;
  isValidating: boolean;
  reload: () => void;
  days: number;
  setDays: (n: number) => void;
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
  const {
    data = initialData,
    error,
    isValidating,
    mutate,
  } = useSWR<DeveloperData, Error>("/api/developer", getFetcher, {
    fallbackData: initialData,
    revalidateOnFocus: false,
  });
  const [days, setDays] = useState(30);
  const [readIds, setReadIds] = useState(
    initialData.notifications.filter((n) => n.read).map((n) => n.id),
  );
  const sessionData = {
    ...data,
    notifications: data.notifications.map((n) => ({
      ...n,
      read: readIds.includes(n.id),
    })),
  };
  return (
    <Context.Provider
      value={{
        data: sessionData,
        error,
        isValidating,
        reload: () => {
          void mutate();
        },
        days,
        setDays,
        readIds,
        toggleRead: (id) =>
          setReadIds((ids) =>
            ids.includes(id) ? ids.filter((n) => n !== id) : [...ids, id],
          ),
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
