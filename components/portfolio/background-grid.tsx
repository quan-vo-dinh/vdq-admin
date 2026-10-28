"use client";

import dynamic from "next/dynamic";

const FlickeringGrid = dynamic(
  () =>
    import("@/components/portfolio/magicui/flickering-grid").then(
      (mod) => mod.FlickeringGrid,
    ),
  { ssr: false },
);

export function BackgroundGrid() {
  return (
    <div className="absolute inset-0 top-0 left-0 right-0 h-[200px] overflow-hidden z-0">
      <FlickeringGrid
        className="h-full w-full"
        squareSize={2}
        gridGap={2}
        style={{
          maskImage: "linear-gradient(to bottom, black, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
        }}
      />
    </div>
  );
}
