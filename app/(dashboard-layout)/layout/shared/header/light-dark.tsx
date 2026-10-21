import { Button } from "@/components/ui/button";
import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { usePersonal } from "@/app/context/personal-context";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/app/context/language-context";

const subscribe=()=>()=>{};
const LightDark = () => {
  const { t } = useLanguage();
  const { theme: activeMode, preferences, saving } = usePersonal();
  const isMounted=useSyncExternalStore(subscribe,()=>true,()=>false);

  const { setTheme } = useTheme();
  const switching = useRef(false);
  const toggleTheme = async () => {
    if (switching.current || saving) return;
    switching.current = true;
    try {
      await preferences({ theme: activeMode === "light" ? "dark" : "light" }, async nextTheme => {
        const apply = () => flushSync(() => setTheme(nextTheme));
        if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          apply();
          return;
        }
        // Persist first; capture old/new DOM only around the actual theme update.
        const transition = document.startViewTransition(apply);
        try {
          await transition.ready;
          await document.documentElement.animate(
            { clipPath: ["inset(0 0 100% 0)", "inset(0)"] },
            { duration: 800, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
          ).finished;
        } catch {
          // Hidden documents, navigation and unsupported pseudo-elements can skip.
          transition.skipTransition();
        }
        await transition.finished.catch(() => {});
      });
    } finally {
      switching.current = false;
    }
  };

  if (!isMounted) {
    // Render nothing on the server to avoid hydration mismatch
    return null;
  }

  return (
    <div>
      {/* Theme Toggle */}
      {activeMode === "light" ? (
        <Button
          variant="ghost"
          className=" h-10 w-10  hover:bg-primary/5  rounded-full cursor-pointer"
          disabled={saving} onClick={toggleTheme}
          aria-label={t("Toggle theme")}
        >
          <Moon className="size-5" />
        </Button>
      ) : (
        // Dark Mode Button
        <Button
          variant="ghost"
          className=" h-10 w-10  hover:bg-primary/5  rounded-full cursor-pointer"
          disabled={saving} onClick={toggleTheme}
          aria-label={t("Toggle theme")}
        >
          <Sun className="size-5" />
        </Button>
      )}
    </div>
  );
};

export default LightDark;
