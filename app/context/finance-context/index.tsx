"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import useSWR from "swr";
import { getFetcher } from "@/app/api/global-fetcher";
import type { FinanceData } from "@/lib/finance/model";

import type { FinanceMessage } from "@/lib/finance/i18n";

type FinanceContextValue = {
  data: FinanceData | undefined;
  error: Error | undefined;
  month: string;
  setMonth: (month: string) => void;
  update: (transform: (data: FinanceData) => FinanceData) => void;
  reload: () => void;
  notice: string | FinanceMessage;
  notify: (message: string | FinanceMessage) => void;
};
const FinanceContext = createContext<FinanceContextValue | null>(null);
export function FinanceProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData: FinanceData;
}) {
  const {
    data: initial,
    error,
    mutate,
  } = useSWR<FinanceData, Error>("/api/finance", getFetcher, {
    revalidateOnFocus: false,
    fallbackData: initialData,
  });
  const [edited, setEdited] = useState<FinanceData>();
  const [month, setMonth] = useState("2026-10");
  const [notice, notify] = useState<string | FinanceMessage>("");
  const data = edited ?? initial;
  function update(transform: (value: FinanceData) => FinanceData) {
    setEdited((previous) => {
      const current = previous ?? initial;
      return current ? transform(current) : current;
    });
  }
  return (
    <FinanceContext.Provider
      value={{
        data,
        error,
        month,
        setMonth,
        update,
        notice,
        notify,
        reload: () => {
          void mutate();
        },
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("FinanceProvider is required");
  return context;
}
