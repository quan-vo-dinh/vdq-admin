"use client";

import { useState } from "react";
import Image from "next/image";
import { normalizeImageSrc } from "@/lib/portfolio/ui-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/portfolio/ui/accordion";
import { usePortfolioData } from "@/components/portfolio/context";
import { useI18n } from "@/components/portfolio/context";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/portfolio/ui-utils";
import { PortfolioText } from "../annotated-text";

const logoFrameClassName =
  "size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden bg-background flex-none";

function LogoImage({
  src,
  alt,
  logoClassName,
}: {
  src: string;
  alt: string;
  logoClassName?: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <div className={cn(logoFrameClassName, "bg-muted")} />;
  }

  return (
    <div className={logoFrameClassName}>
      <Image
        unoptimized
        src={normalizeImageSrc(src)}
        alt={alt}
        width={40}
        height={40}
        className={cn("size-full rounded-full object-contain", logoClassName)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}

export default function WorkSection() {
  const { dictionary } = useI18n();
  const data = usePortfolioData();

  return (
    <Accordion type="single" collapsible className="w-full grid gap-6">
      {data.work.map((work) => (
        <AccordionItem
          key={work.id}
          value={work.company}
          className="w-full border-b-0 grid gap-2"
        >
          <AccordionTrigger className="hover:no-underline p-0 cursor-pointer transition-colors rounded-none group [&>svg]:hidden">
            <div className="flex items-center gap-x-3 justify-between w-full text-left">
              <div className="flex items-center gap-x-3 flex-1 min-w-0">
                <LogoImage
                  src={work.logoUrl}
                  alt={work.company}
                  logoClassName={work.logoClassName}
                />
                <div className="flex-1 min-w-0 gap-0.5 flex flex-col">
                  <div className="font-semibold leading-none flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{work.company}</span>
                    {work.companyContext ? (
                      <span className="text-[11px] font-normal leading-none text-muted-foreground">
                        {work.companyContext}
                      </span>
                    ) : null}
                    <span className="relative inline-flex items-center w-3.5 h-3.5">
                      <ChevronRight
                        className={cn(
                          "absolute h-3.5 w-3.5 shrink-0 text-muted-foreground stroke-2 transition-all duration-300 ease-out",
                          "translate-x-0 opacity-0",
                          "group-hover:translate-x-1 group-hover:opacity-100",
                          "group-data-[state=open]:opacity-0 group-data-[state=open]:translate-x-0",
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "absolute h-3.5 w-3.5 shrink-0 text-muted-foreground stroke-2 transition-all duration-200",
                          "opacity-0 rotate-0",
                          "group-data-[state=open]:opacity-100 group-data-[state=open]:rotate-180",
                        )}
                      />
                    </span>
                  </div>
                  <div className="font-sans text-sm text-muted-foreground">
                    {work.title}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground text-right flex-none">
                <span>
                  {work.start} - {work.end ?? dictionary.common.present}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 ml-13 text-xs sm:text-sm text-muted-foreground whitespace-pre-line">
            <PortfolioText field="work.description" itemId={work.id} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
