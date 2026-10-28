"use client";

import { usePathname } from "next/navigation";
import { Dock, DockIcon } from "@/components/portfolio/magicui/dock";
import { LanguageSwitcher } from "@/components/portfolio/language-switcher";
import { Separator } from "@/components/portfolio/ui/separator";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@/components/portfolio/ui/tooltip";
import { usePortfolioData } from "@/components/portfolio/context";
import { useI18n } from "@/components/portfolio/context";
import { cn } from "@/lib/portfolio/ui-utils";

export default function Navbar() {
  const DATA = usePortfolioData();
  const pathname = usePathname();
  const { dictionary, locale } = useI18n();
  const hasSocials = Object.values(DATA.contact.social).some(
    (social) => social.navbar,
  );
  const navigationLabels: Record<string, string> = {
    "/portfolio": dictionary.common.home,
    "https://vodinhquan.dev/blog": dictionary.common.blog,
    "https://vodinhquan.dev/moments": dictionary.common.moments,
    "/apps/portfolio": "Portfolio CMS",
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30">
      <Dock className="z-50 pointer-events-auto relative h-14 p-2 w-fit mx-auto flex gap-2 border bg-card/90 backdrop-blur-3xl shadow-[0_0_10px_3px] shadow-primary/5">
        {DATA.navbar.map((item) => {
          const isExternal = item.href.startsWith("http");
          const isActive =
            item.href === "/portfolio"
              ? pathname === "/portfolio"
              : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <a
                  href={item.href}
                  aria-label={navigationLabels[item.href] ?? item.label}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                >
                  <DockIcon
                    className={cn(
                      "rounded-3xl cursor-pointer size-full p-0 backdrop-blur-3xl border transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted border-border",
                    )}
                  >
                    <item.icon className="size-full rounded-sm overflow-hidden object-contain" />
                  </DockIcon>
                </a>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
              >
                <p>{navigationLabels[item.href] ?? item.label}</p>
                <TooltipArrow className="fill-primary" />
              </TooltipContent>
            </Tooltip>
          );
        })}
        {hasSocials && (
          <>
            <Separator
              orientation="vertical"
              className="h-2/3 m-auto w-px bg-border"
            />
            {Object.entries(DATA.contact.social)
              .filter(([, social]) => social.navbar)
              .map(([name, social], index) => {
                const isExternal = social.url.startsWith("http");
                const IconComponent = social.icon;
                return (
                  <Tooltip key={`social-${name}-${index}`}>
                    <TooltipTrigger asChild>
                      <a
                        href={social.url}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                      >
                        <DockIcon className="rounded-3xl cursor-pointer size-full bg-background p-0 text-muted-foreground hover:text-foreground hover:bg-muted backdrop-blur-3xl border border-border transition-colors">
                          <IconComponent className="size-full rounded-sm overflow-hidden object-contain" />
                        </DockIcon>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={8}
                      className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
                    >
                      <p>{name}</p>
                      <TooltipArrow className="fill-primary" />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
          </>
        )}
        <Separator
          orientation="vertical"
          className="h-2/3 m-auto w-px bg-border"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <DockIcon className="rounded-3xl cursor-pointer size-full bg-background p-0 text-muted-foreground hover:text-foreground hover:bg-muted backdrop-blur-3xl border border-border transition-colors">
              <LanguageSwitcher className="size-full bg-transparent border-none p-0 hover:bg-transparent" />
            </DockIcon>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            <p>
              {locale === "vi"
                ? dictionary.common.switchToEnglish
                : dictionary.common.switchToVietnamese}
            </p>
            <TooltipArrow className="fill-primary" />
          </TooltipContent>
        </Tooltip>
      </Dock>
    </div>
  );
}
