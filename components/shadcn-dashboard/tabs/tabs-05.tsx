"use client";

import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TabsUnderline({
  value,
  onValueChange,
  tabs,
  ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tabs: { value: string; label: string; icon: LucideIcon }[];
  ariaLabel: string;
}) {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 400, damping: 30 };
  return (
    <Tabs value={value} onValueChange={onValueChange} className="finance-scenario-tabs">
      <TabsList variant="line" aria-label={ariaLabel} onMouseLeave={() => setHovered(null)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger key={tab.value} value={tab.value} className="finance-scenario-tab after:hidden" onMouseEnter={() => setHovered(tab.value)}>
              {hovered === tab.value && (
                <motion.span layoutId={id + "-hover"} className="finance-scenario-hover" transition={transition} />
              )}
              <Icon />
              <span>{tab.label}</span>
              {value === tab.value && (
                <motion.span layoutId={id + "-indicator"} className="finance-scenario-indicator" initial={false} transition={transition} />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
