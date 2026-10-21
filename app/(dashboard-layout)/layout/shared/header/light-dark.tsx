import { Button } from "@/components/ui/button";
import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { usePersonal } from "@/app/context/personal-context";
import { transitionTheme } from "@/lib/personal/theme-transition";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/app/context/language-context";

const subscribe=()=>()=>{};
const LightDark = () => {
  const { t } = useLanguage();
  const { prefs, preferences, saving } = usePersonal();
  const isMounted=useSyncExternalStore(subscribe,()=>true,()=>false);

  const { resolvedTheme: activeMode, setTheme } = useTheme();
  const switching = useRef(false);
  const toggleTheme = async () => {
    if (switching.current || saving) return;
    switching.current = true;
    try {
      await preferences({ theme: activeMode === "light" ? "dark" : "light" }, async nextTheme => {
        await transitionTheme(nextTheme, theme => flushSync(() => setTheme(theme)));
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
          disabled={saving || !prefs.data} onClick={toggleTheme}
          aria-label={t("Toggle theme")}
        >
          <Moon className="size-5" />
        </Button>
      ) : (
        // Dark Mode Button
        <Button
          variant="ghost"
          className=" h-10 w-10  hover:bg-primary/5  rounded-full cursor-pointer"
          disabled={saving || !prefs.data} onClick={toggleTheme}
          aria-label={t("Toggle theme")}
        >
          <Sun className="size-5" />
        </Button>
      )}
    </div>
  );
};

export default LightDark;
