"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
import type { PortfolioDocument } from "@/lib/portfolio/model";
import { iconRegistry } from "./icon-registry";
const Context = createContext<{
  document: PortfolioDocument;
  locale: "vi" | "en";
  preview: boolean;
} | null>(null);
const Theme = createContext<{
  theme: string;
  setTheme: (theme: string) => void;
}>({ theme: "dark", setTheme: () => {} });
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("portfolio-surface-theme", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("portfolio-surface-theme", callback);
  };
}
function readTheme() {
  try {
    return localStorage.getItem("portfolio-surface-theme") === "light"
      ? "light"
      : "dark";
  } catch {
    return "dark";
  }
}
export function PortfolioProvider({
  document,
  locale,
  preview = false,
  children,
}: {
  document: PortfolioDocument;
  locale: "vi" | "en";
  preview?: boolean;
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark");
  const setTheme = (value: string) => {
    try {
      localStorage.setItem("portfolio-surface-theme", value);
    } catch {}
    window.dispatchEvent(new Event("portfolio-surface-theme"));
  };
  return (
    <Context value={{ document, locale, preview }}>
      <Theme value={{ theme, setTheme }}>
        <div
          className={`portfolio-surface ${theme === "dark" ? "dark" : "light"}`}
          lang={locale}
          style={{ colorScheme: theme }}
        >
          {children}
        </div>
      </Theme>
    </Context>
  );
}
function usePortfolio() {
  const c = useContext(Context);
  if (!c) throw new Error("Missing portfolio context");
  return c;
}
export function useTheme() {
  return useContext(Theme);
}
export function usePortfolioText() {
  const { document, locale, preview } = usePortfolio();
  return { resume: document.locales[locale], preview };
}
export function useI18n() {
  const { document, locale } = usePortfolio();
  return { locale, dictionary: document.locales[locale].copy };
}
export function usePortfolioData() {
  const { document, locale, preview } = usePortfolio();
  const d = document.locales[locale];
  const media = (s: string) =>
    s.startsWith("media:")
      ? `/api/portfolio/${preview ? "media" : "public/media"}/${s.slice(6)}`
      : s;
  return {
    ...d,
    avatarUrl: media(d.avatarUrl),
    skills: d.skills.map((s) => ({ ...s, icon: iconRegistry[s.icon] })),
    navbar: d.navbar.map((s) => ({ ...s, icon: iconRegistry[s.icon] })),
    work: d.work.map((s) => ({
      ...s,
      logoUrl: media(s.logoUrl),
      end: s.end || undefined,
    })),
    education: d.education.map((s) => ({ ...s, logoUrl: media(s.logoUrl) })),
    certifications: d.certifications.map((s) => ({
      ...s,
      logoUrl: media(s.logoUrl),
    })),
    projects: d.projects.map((s) => ({
      ...s,
      image: media(s.image),
      links: s.links.map((l) => ({
        ...l,
        icon: (() => {
          const Icon = iconRegistry[l.icon];
          return <Icon />;
        })(),
      })),
    })),
    contact: {
      ...d.contact,
      social: Object.fromEntries(
        d.contact.social.map((s) => [
          s.id,
          { ...s, icon: iconRegistry[s.icon] },
        ]),
      ),
    },
  };
}
export function useSections() {
  return usePortfolio().document.sections;
}
