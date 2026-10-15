"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/app/context/language-context";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <Button
      variant="ghost"
      className="h-10 gap-1.5 rounded-full px-2"
      aria-label={t("Switch language")}
      title={t("Switch language")}
      onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
    >
      <Languages className="size-4" />
      <span className="text-xs font-semibold">{language.toUpperCase()}</span>
    </Button>
  );
}
