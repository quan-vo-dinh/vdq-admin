"use client";

import { cn } from "@/lib/portfolio/ui-utils";
import {
  motion,
  type HTMLMotionProps,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";

interface DockProps {
  className?: string;
  children: ReactNode;
  magnification?: number;
  distance?: number;
}

interface DockIconProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 100;
const BASE_SIZE = 40;
const BASE_ICON_SIZE = 20;
const ICON_SIZE_RATIO = 0.5;
const SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

interface DockContextValue {
  mouseX: MotionValue<number>;
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextValue | null>(null);

const Dock = ({
  className,
  children,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
}: DockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <DockContext.Provider value={{ mouseX, magnification, distance }}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "mx-auto flex h-full w-max items-end justify-center overflow-visible rounded-full border",
          className,
        )}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
};

const DockIcon = forwardRef<HTMLDivElement, DockIconProps>(
  ({ className, children, style, ...props }, forwardedRef) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const context = useContext(DockContext);

    if (!context) {
      throw new Error("DockIcon must be used within a Dock component");
    }

    const { mouseX, magnification, distance } = context;

    const distanceCalc = useTransform(mouseX, (val: number) => {
      const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
      return val - bounds.x - bounds.width / 2;
    });

    const containerSize = useSpring(
      useTransform(
        distanceCalc,
        [-distance, 0, distance],
        [BASE_SIZE, magnification, BASE_SIZE],
      ),
      SPRING,
    );
    const iconSize = useSpring(
      useTransform(
        distanceCalc,
        [-distance, 0, distance],
        [BASE_ICON_SIZE, magnification * ICON_SIZE_RATIO, BASE_ICON_SIZE],
      ),
      SPRING,
    );

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        ref.current = node;

        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef],
    );

    return (
      <motion.div
        ref={setRef}
        style={{ ...style, width: containerSize, height: containerSize }}
        className={cn(
          "relative flex aspect-square shrink-0 items-center justify-center rounded-full",
          className,
        )}
        {...props}
      >
        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center"
        >
          {children}
        </motion.div>
      </motion.div>
    );
  },
);

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon };
export type { DockProps, DockIconProps };
