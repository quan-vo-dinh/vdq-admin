"use client";
import Link from "next/link";
import { FlickeringGrid } from "@/components/portfolio/magicui/flickering-grid";
import { usePortfolioData } from "@/components/portfolio/context";
import { useI18n } from "@/components/portfolio/context";
import { Icons } from "@/components/portfolio/icons";
import { buttonVariants } from "@/components/portfolio/ui/button";
import { cn } from "@/lib/portfolio/ui-utils";
import { PortfolioText } from "../annotated-text";

export default function ContactSection() {
  const DATA = usePortfolioData();
  const { dictionary } = useI18n();

  return (
    <div className="border rounded-xl p-10 relative">
      <div className="absolute -top-4 border bg-primary z-10 rounded-xl px-4 py-1 left-1/2 -translate-x-1/2">
        <span className="text-background text-sm font-medium">
          {dictionary.home.contactEyebrow}
        </span>
      </div>
      <div className="absolute inset-0 top-0 left-0 right-0 h-1/2 rounded-xl overflow-hidden">
        <FlickeringGrid
          className="h-full w-full"
          squareSize={2}
          gridGap={2}
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>
      <div className="relative flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
          {dictionary.home.contactTitle}
        </h2>
        <p className="mx-auto max-w-lg text-muted-foreground text-balance">
          <PortfolioText field="copy.home.contactBeforeLink" inline />{" "}
          <Link
            href={DATA.contact.social.LinkedIn.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {dictionary.home.contactLink}
          </Link>{" "}
          <PortfolioText field="copy.home.contactAfterLink" inline />
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link
            href={DATA.contact.social.GitHub.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl gap-2 font-medium bg-background/50 backdrop-blur-sm hover:bg-muted/80 transition-all border border-border shadow-sm px-5 py-2.5 h-auto text-sm",
            )}
          >
            <Icons.github className="size-4" />
            <span>GitHub</span>
          </Link>
          <Link
            href={DATA.contact.social.LinkedIn.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl gap-2 font-medium bg-background/50 backdrop-blur-sm hover:bg-muted/80 transition-all border border-border shadow-sm px-5 py-2.5 h-auto text-sm",
            )}
          >
            <Icons.linkedin className="size-4" />
            <span>LinkedIn</span>
          </Link>
          <Link
            href={DATA.contact.social.Facebook.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl gap-2 font-medium bg-background/50 backdrop-blur-sm hover:bg-muted/80 transition-all border border-border shadow-sm px-5 py-2.5 h-auto text-sm",
            )}
          >
            <Icons.facebook className="size-4" />
            <span>Facebook</span>
          </Link>
          <Link
            href={DATA.contact.social.Instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-xl gap-2 font-medium bg-background/50 backdrop-blur-sm hover:bg-muted/80 transition-all border border-border shadow-sm px-5 py-2.5 h-auto text-sm",
            )}
          >
            <Icons.instagram className="size-4" />
            <span>Instagram</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
