import type { PortfolioDocument } from "@/lib/portfolio/model";
import { PortfolioProvider } from "./context";
import { TooltipProvider } from "./ui/tooltip";
import { BackgroundGrid } from "./background-grid";
import { ModeToggle } from "./mode-toggle";
import Content from "./content";
import Navbar from "./navbar";
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
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 z-50">
          <ModeToggle className="size-10 rounded-3xl border border-border bg-background p-2.5 text-muted-foreground backdrop-blur-3xl transition-colors hover:bg-muted hover:text-foreground shadow-sm" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto pt-6 pb-20 sm:pt-10 sm:pb-24 px-3 sm:px-6">
          <Content />
        </div>
        <Navbar />
      </TooltipProvider>
    </PortfolioProvider>
  );
}
