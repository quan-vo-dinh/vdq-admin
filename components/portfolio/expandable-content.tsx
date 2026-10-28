"use client";

import { ChevronDownIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/portfolio/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/portfolio/ui/collapsible";
import { cn } from "@/lib/portfolio/ui-utils";

type ExpandableContentProps = {
  preview: ReactNode;
  children: ReactNode;
  showMoreLabel: string;
  showLessLabel: string;
};

export function ExpandableContent({
  preview,
  children,
  showMoreLabel,
  showLessLabel,
}: ExpandableContentProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const transition = {
    duration: reduceMotion ? 0 : 0.35,
    ease: "easeInOut" as const,
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : "7.5rem" }}
        transition={transition}
        className="relative overflow-hidden"
      >
        {preview}
        <CollapsibleContent forceMount aria-hidden={!open} inert={!open}>
          {children}
        </CollapsibleContent>
        <motion.div
          initial={false}
          animate={{ opacity: open ? 0 : 1 }}
          transition={transition}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/60 to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,transparent,black)]"
          aria-hidden
        />
      </motion.div>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="link" className="min-h-11 gap-1 px-0">
          {open ? showLessLabel : showMoreLabel}
          <ChevronDownIcon
            className={cn(
              "size-4 motion-safe:transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
