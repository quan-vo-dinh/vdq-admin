import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/app/context/language-context";

const LightDark = () => {
  const { t } = useLanguage();
  const { theme: activeMode, setTheme: setActiveMode } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleTheme = async () => {
    const toggleMode = () => {
      setActiveMode(activeMode === "light" ? "dark" : "light");
    };

    if (!(document as any).startViewTransition) {
      toggleMode();
      return;
    }

    const transition = (document as any).startViewTransition(() => {
      toggleMode();
    });

    await transition.ready;

    document.documentElement.animate(
      {
        clipPath: ["inset(0 0 100% 0)", "inset(0)"],
      },
      {
        duration: 800,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
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
          onClick={toggleTheme}
          aria-label={t("Toggle theme")}
        >
          <Moon className="size-5" />
        </Button>
      ) : (
        // Dark Mode Button
        <Button
          variant="ghost"
          className=" h-10 w-10  hover:bg-primary/5  rounded-full cursor-pointer"
          onClick={toggleTheme}
          aria-label={t("Toggle theme")}
        >
          <Sun className="size-5" />
        </Button>
      )}
    </div>
  );
};

export default LightDark;
