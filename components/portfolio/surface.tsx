"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import "./portfolio.css";

const Theme = createContext<{ theme: string; setTheme: (value: string) => void }>({
  theme: "dark",
  setTheme: () => {},
});

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
    return localStorage.getItem("portfolio-surface-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function PortfolioSurface({ children, lang }: { children: React.ReactNode; lang?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark");
  function setTheme(value: string) {
    try {
      localStorage.setItem("portfolio-surface-theme", value);
    } catch {}
    window.dispatchEvent(new Event("portfolio-surface-theme"));
  }
  return (
    <Theme value={{ theme, setTheme }}>
      <div className={cn("portfolio-surface", theme)} lang={lang} style={{ colorScheme: theme }}>
        {children}
      </div>
    </Theme>
  );
}

export function useTheme() {
  return useContext(Theme);
}
