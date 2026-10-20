"use client";
import { useLanguage } from "@/app/context/language-context";
export function useLearningLocale() {
  const { language } = useLanguage();
  return {
    language,
    t: (vi: string, en: string) => (language === "vi" ? vi : en),
  };
}
