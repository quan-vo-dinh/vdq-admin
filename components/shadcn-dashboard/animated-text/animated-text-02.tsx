"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const AnimatedTextGradientMotion = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.span
      data-animated-gradient-text
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage:
          "linear-gradient(110deg, var(--info-foreground), var(--foreground), var(--success-foreground), var(--info-foreground))",
        backgroundSize: "200% 100%",
        backgroundPosition: "0% 50%",
      }}
      initial={false}
      animate={
        reducedMotion
          ? undefined
          : { backgroundPosition: ["0% 50%", "100% 50%"] }
      }
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
};

export default AnimatedTextGradientMotion;
