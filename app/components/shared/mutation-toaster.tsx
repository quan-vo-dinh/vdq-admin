"use client";

import { useEffect } from "react";
import { useLanguage } from "@/app/context/language-context";
import { Toaster, toast } from "@/components/ui/toast";
import { MUTATION_FEEDBACK_EVENT, mutationMessage, type MutationFeedback } from "@/lib/api/mutation-feedback";

/** Mounted above route content so completion notices survive navigation/dialog close. */
export function MutationToaster() {
  const { language } = useLanguage();
  useEffect(() => {
    function onFeedback(event: Event) {
      const detail = (event as CustomEvent<MutationFeedback>).detail;
      toast.add({
        title: mutationMessage(detail, language),
        type: detail.ok ? "success" : "error",
        timeout: detail.ok ? 4000 : 7000,
      });
    }
    window.addEventListener(MUTATION_FEEDBACK_EVENT, onFeedback);
    return () => window.removeEventListener(MUTATION_FEEDBACK_EVENT, onFeedback);
  }, [language]);
  return <Toaster limit={3} />;
}
