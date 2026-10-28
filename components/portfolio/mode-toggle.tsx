"use client";

import { Button } from "@/components/portfolio/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

import { useTheme } from "@/components/portfolio/context";
import { useI18n } from "@/components/portfolio/context";
import { cn } from "@/lib/portfolio/ui-utils";

type ModeToggleProps = ComponentPropsWithoutRef<typeof Button>;

export const ModeToggle = forwardRef<HTMLButtonElement, ModeToggleProps>(
  ({ className, onClick, ...props }, ref) => {
    const { theme, setTheme } = useTheme();
    const { dictionary } = useI18n();

    return (
      <Button
        ref={ref}
        type="button"
        variant="link"
        size="icon"
        className={cn(className)}
        aria-label={
          theme === "dark"
            ? dictionary.common.switchToLight
            : dictionary.common.switchToDark
        }
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented) {
            setTheme(theme === "dark" ? "light" : "dark");
          }
        }}
        {...props}
      >
        {theme === "dark" ? (
          <SunIcon className="h-full w-full" />
        ) : (
          <MoonIcon className="h-full w-full" />
        )}
      </Button>
    );
  },
);

ModeToggle.displayName = "ModeToggle";
