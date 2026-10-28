import Link from "next/link";
import { LogIn } from "lucide-react";
import { Button } from "./ui/button";
import type { PortfolioDocument } from "@/lib/portfolio/model";
import { PortfolioProvider } from "./context";
import { TooltipProvider } from "./ui/tooltip";
import { BackgroundGrid } from "./background-grid";
import { ModeToggle } from "./mode-toggle";
import Content from "./content";
import { LanguageSwitcher } from "./language-switcher";
import "./portfolio.css";
export function PortfolioRenderer({
  document,
  locale,
  preview = false,
}: {
  document: PortfolioDocument;
  locale: "vi" | "en";
  preview?: boolean;
}) {
  return (
    <PortfolioProvider document={document} locale={locale} preview={preview}>
      <TooltipProvider delayDuration={0}>
        <BackgroundGrid />
        <div role="group" aria-label={locale === "vi" ? "Điều khiển portfolio" : "Portfolio controls"} className="relative z-20 flex justify-end gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
          <Button asChild variant="link" size="icon" className="size-10 rounded-3xl border border-border bg-background p-2.5 text-muted-foreground backdrop-blur-3xl transition-colors hover:bg-muted hover:text-foreground shadow-sm">
            <Link href="/developer" prefetch={false} aria-label={locale === "vi" ? "Đăng nhập dashboard" : "Sign in to dashboard"} title={locale === "vi" ? "Đăng nhập dashboard" : "Sign in to dashboard"}>
              <LogIn className="size-full" aria-hidden />
            </Link>
          </Button>
          <LanguageSwitcher className="size-10 rounded-3xl border border-border bg-background p-2.5 text-muted-foreground backdrop-blur-3xl transition-colors hover:bg-muted hover:text-foreground shadow-sm" />
          <ModeToggle className="size-10 rounded-3xl border border-border bg-background p-2.5 text-muted-foreground backdrop-blur-3xl transition-colors hover:bg-muted hover:text-foreground shadow-sm" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto pt-6 pb-12 sm:pt-6 sm:pb-16 px-3 sm:px-6">
          <Content />
        </div>
      </TooltipProvider>
    </PortfolioProvider>
  );
}
