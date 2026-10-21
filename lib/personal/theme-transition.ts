export type ColorTheme = "light" | "dark";

/** Keep the DOM update inside the snapshot callback, including next-themes state. */
export async function transitionTheme(theme: ColorTheme, setTheme: (theme: ColorTheme) => void) {
  const apply = () => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    setTheme(theme);
  };
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }
  let transition: ViewTransition | undefined;
  try {
    transition = document.startViewTransition(apply);
    await transition.ready;
    await document.documentElement.animate(
      { clipPath: ["inset(0 0 100% 0)", "inset(0)"] },
      { duration: 800, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" },
    ).finished;
  } catch {
    // Snapshot/animation failures must never prevent the saved theme being applied.
    apply();
  } finally {
    transition?.skipTransition();
    await transition?.finished.catch(() => {});
  }
}
