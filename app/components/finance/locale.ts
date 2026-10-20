"use client";
import { useMemo } from "react";
import { useLanguage } from "@/app/context/language-context";
import { createFinanceLocale } from "@/lib/finance/i18n";

export function useFinanceLocale() {
  const { language } = useLanguage();
  return useMemo(() => createFinanceLocale(language), [language]);
}
