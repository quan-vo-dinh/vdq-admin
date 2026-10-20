"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { useFinanceLocale } from "./locale";

/** Only presentation animates; assistive technology always gets the exact value. */
export function NumberTicker({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const { locale } = useFinanceLocale();
  const previous = useRef({ value, locale });
  useEffect(() => {
    const old = previous.current;
    previous.current = { value, locale };
    const match = value.match(/-?[\d.,]+/);
    if (!ref.current) return;
    ref.current.textContent = value;
    if (!match || reducedMotion || old.value === value || old.locale !== locale)
      return;
    const parse = (s: string) =>
      Number(
        locale === "vi-VN"
          ? s.replaceAll(".", "").replace(",", ".")
          : s.replaceAll(",", ""),
      );
    const from = parse(old.value.match(/-?[\d.,]+/)?.[0] ?? "0");
    const to = parse(match[0]);
    if (!Number.isFinite(from) || !Number.isFinite(to)) return;
    const decimals =
      match[0].split(locale === "vi-VN" ? "," : ".")[1]?.length ?? 0;
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const controls = animate(from, to, {
      duration: 0.45,
      onUpdate: (v) => {
        if (ref.current)
          ref.current.textContent = value.replace(
            match[0],
            formatter.format(v),
          );
      },
      onComplete: () => {
        if (ref.current) ref.current.textContent = value;
      },
    });
    return () => controls.stop();
  }, [value, locale, reducedMotion]);
  return (
    <span aria-label={value}>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
    </span>
  );
}
