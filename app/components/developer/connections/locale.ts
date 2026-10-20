"use client";
import { useDeveloperLocale } from "../shared";
import type { Copy } from "@/lib/developer/connections/types";
export function useConnectionsLocale() {
  const locale = useDeveloperLocale();
  return { ...locale, copy: (value: Copy) => locale.text(value[0], value[1]) };
}
