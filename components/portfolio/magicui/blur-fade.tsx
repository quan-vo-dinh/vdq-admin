import type { CSSProperties, ReactNode } from "react";

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}

type BlurFadeStyle = CSSProperties & {
  "--blur-fade-blur": string;
  "--blur-fade-y": string;
};

const BlurFade = ({
  children,
  className,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  blur = "6px",
}: BlurFadeProps) => {
  const style: BlurFadeStyle = {
    "--blur-fade-blur": blur,
    "--blur-fade-y": `${-yOffset}px`,
    animationDelay: `${0.04 + delay}s`,
    animationDuration: `${duration}s`,
  };

  return (
    <div
      className={["blur-fade", className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
};

export default BlurFade;
