"use client";

import type { ReactNode } from "react";
import AnimatedTextGradientMotion from "@/components/shadcn-dashboard/animated-text/animated-text-02";
import { cn } from "@/lib/utils";

export function FinanceHeading({
  as: Tag = "h3",
  variant = "section",
  className,
  children,
}: {
  as?: "h2" | "h3" | "span";
  variant?: "page" | "section";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-finance-heading={variant} className={cn("min-w-0", className)}>
      <AnimatedTextGradientMotion>{children}</AnimatedTextGradientMotion>
    </Tag>
  );
}
