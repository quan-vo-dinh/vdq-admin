"use client";
import { useRef, useState } from "react";
import useSWR from "swr";
import {
  getFetcher,
  putFetcher,
  deleteFetcher,
} from "@/app/api/global-fetcher";
import type { SavedSavingsPlan, SavingsPlan } from "@/lib/finance/projection";
export function useSavingsPlan() {
  const { data, error, isLoading, mutate } = useSWR<{
    saved: SavedSavingsPlan | null;
  }>("/api/finance/projection", getFetcher, { revalidateOnFocus: false });
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  async function change(plan: SavingsPlan | null) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const body = {
        id: data?.saved?.id ?? crypto.randomUUID(),
        expectedRevision: data?.saved?.revision ?? 0,
        ...(plan && { plan }),
      };
      const next = plan
        ? await putFetcher("/api/finance/projection", body)
        : await deleteFetcher("/api/finance/projection", body);
      await mutate(next, { revalidate: false });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    saved: data?.saved ?? null,
    error,
    isLoading,
    busy,
    save: (plan: SavingsPlan) => change(plan),
    remove: () => change(null),
    reload: () => mutate(),
  };
}
