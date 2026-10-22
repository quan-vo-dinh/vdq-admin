"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { useLanguage } from "@/app/context/language-context";

/** Animates presentation only; calculations and accessible text keep the exact value. */
export function NumberTicker({ value }: { value: string | number }) {
  const { language } = useLanguage();
  const locale = language === "vi" ? "vi-VN" : "en-GB";
  const label = typeof value === "number" ? new Intl.NumberFormat(locale).format(value) : value;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.textContent = label;
    // Only animate a single numeric value, never dates, ratios or identifiers.
    const matches = [...label.matchAll(/[−-]?\d+(?:[.,]\d+)*/g)];
    if (matches.length !== 1) return;
    const match = matches[0][0];
    const normalized = match.replace("−", "-");
    const target = Number(locale === "vi-VN"
      ? normalized.replaceAll(".", "").replace(",", ".")
      : normalized.replaceAll(",", ""));
    if (!Number.isFinite(target) || target === 0) return;
    const decimals = match.split(locale === "vi-VN" ? "," : ".")[1]?.length ?? 0;
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let controls: ReturnType<typeof animate> | undefined;
    const finish = () => { controls?.stop(); element.textContent = label; };
    const onPreferenceChange = () => { if (preference.matches) finish(); };
    preference.addEventListener("change", onPreferenceChange);
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      if (preference.matches) return;
      controls = animate(0, target, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate: current => { element.textContent = label.replace(match, formatter.format(current)); },
        onComplete: () => { element.textContent = label; },
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      preference.removeEventListener("change", onPreferenceChange);
      finish();
    };
  }, [label, locale]);

  return (
    <span data-number-ticker className="inline-grid tabular-nums" aria-label={label}>
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">{label}</span>
      <span ref={ref} className="col-start-1 row-start-1" aria-hidden="true">{label}</span>
    </span>
  );
}
