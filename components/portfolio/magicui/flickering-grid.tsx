"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from "react";

import { cn } from "@/lib/portfolio/ui-utils";

interface FlickeringGridProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  flickerChance?: number;
  gridGap?: number;
  height?: number;
  maxDpr?: number;
  maxFps?: number;
  maxOpacity?: number;
  squareSize?: number;
  width?: number;
}

type GridParams = {
  cols: number;
  dpr: number;
  rows: number;
  squares: Float32Array;
};

export function getEffectivePixelRatio(
  devicePixelRatio: number,
  maxDpr: number,
) {
  return Math.max(1, Math.min(devicePixelRatio || 1, maxDpr));
}

export const FlickeringGrid = ({
  color,
  flickerChance = 0.3,
  gridGap = 6,
  height,
  maxDpr = Number.POSITIVE_INFINITY,
  maxFps = 60,
  maxOpacity = 0.3,
  squareSize = 4,
  width,
  className,
  ...props
}: FlickeringGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [canvasStyle, setCanvasStyle] = useState<CSSProperties>({});
  const [resolvedColor, setResolvedColor] = useState("rgb(0, 0, 0)");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () =>
      setPrefersReducedMotion(mediaQuery.matches);
    const updatePageVisibility = () =>
      setIsPageVisible(document.visibilityState === "visible");

    updateMotionPreference();
    updatePageVisibility();
    const frame = window.requestAnimationFrame(() => setHasMounted(true));
    mediaQuery.addEventListener("change", updateMotionPreference);
    document.addEventListener("visibilitychange", updatePageVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      mediaQuery.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", updatePageVisibility);
    };
  }, []);

  const resolveColor = useCallback((colorValue: string | undefined) => {
    const container = containerRef.current;
    if (typeof document === "undefined" || !container) {
      return "rgb(0, 0, 0)";
    }

    const colorToResolve = colorValue || "var(--foreground)";

    if (!colorToResolve.startsWith("var(")) {
      return colorToResolve;
    }

    const tempElement = document.createElement("div");
    tempElement.style.color = colorToResolve;
    tempElement.style.position = "absolute";
    tempElement.style.visibility = "hidden";
    // Resolve CSS variables inside this grid's theme scope. The dashboard's
    // document theme can differ from the independently themed portfolio.
    container.appendChild(tempElement);
    const computedColor = window.getComputedStyle(tempElement).color;
    tempElement.remove();

    return computedColor || "rgb(0, 0, 0)";
  }, []);

  useEffect(() => {
    const updateColor = () => setResolvedColor(resolveColor(color));
    const observer = new MutationObserver(updateColor);

    updateColor();
    // Listen to the local surface as well as outer themes, without observing
    // child mutations from the temporary color probe or the animated canvas.
    let ancestor: HTMLElement | null = containerRef.current;
    while (ancestor) {
      observer.observe(ancestor, {
        attributeFilter: ["class", "style"],
        attributes: true,
      });
      ancestor = ancestor.parentElement;
    }

    return () => observer.disconnect();
  }, [color, resolveColor]);

  const rgbaColor = useMemo(() => {
    if (typeof document === "undefined") {
      return "rgba(0, 0, 0,";
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");

    if (!context) {
      return "rgba(0, 0, 0,";
    }

    context.fillStyle = resolvedColor;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = Array.from(
      context.getImageData(0, 0, 1, 1).data,
    );

    return `rgba(${red}, ${green}, ${blue},`;
  }, [resolvedColor]);

  const setupCanvas = useCallback(
    (
      canvas: HTMLCanvasElement,
      nextWidth: number,
      nextHeight: number,
    ): GridParams => {
      const dpr = getEffectivePixelRatio(window.devicePixelRatio, maxDpr);
      const cssWidth = Math.max(1, Math.floor(nextWidth));
      const cssHeight = Math.max(1, Math.floor(nextHeight));

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      setCanvasStyle({ height: cssHeight, width: cssWidth });

      const cols = Math.max(1, Math.floor(cssWidth / (squareSize + gridGap)));
      const rows = Math.max(1, Math.floor(cssHeight / (squareSize + gridGap)));
      const squares = new Float32Array(cols * rows);

      for (let index = 0; index < squares.length; index += 1) {
        squares[index] = Math.random() * maxOpacity;
      }

      return { cols, dpr, rows, squares };
    },
    [gridGap, maxDpr, maxOpacity, squareSize],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let index = 0; index < squares.length; index += 1) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[index] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  const drawGrid = useCallback(
    (context: CanvasRenderingContext2D, params: GridParams) => {
      const { cols, dpr, rows, squares } = params;

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      for (let column = 0; column < cols; column += 1) {
        for (let row = 0; row < rows; row += 1) {
          const opacity = squares[column * rows + row];
          context.fillStyle = `${rgbaColor}${opacity})`;
          context.fillRect(
            column * (squareSize + gridGap) * dpr,
            row * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }
    },
    [gridGap, rgbaColor, squareSize],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let animationFrameId: number | undefined;
    let gridParams: GridParams | undefined;
    let lastFrameTime = 0;
    const frameInterval = 1000 / Math.max(1, maxFps);

    const updateCanvasSize = () => {
      gridParams = setupCanvas(
        canvas,
        width ?? container.clientWidth,
        height ?? container.clientHeight,
      );
      drawGrid(context, gridParams);
    };

    const animate = (time: number) => {
      if (!isInView || !gridParams) {
        return;
      }

      if (lastFrameTime === 0 || time - lastFrameTime >= frameInterval) {
        const deltaTime =
          lastFrameTime === 0
            ? frameInterval / 1000
            : Math.min((time - lastFrameTime) / 1000, 0.25);

        lastFrameTime = time;
        updateSquares(gridParams.squares, deltaTime);
        drawGrid(context, gridParams);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    if (hasMounted && isInView && isPageVisible && !prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();
    };
  }, [
    drawGrid,
    hasMounted,
    height,
    isInView,
    isPageVisible,
    maxFps,
    prefersReducedMotion,
    setupCanvas,
    updateSquares,
    width,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={canvasStyle}
      />
    </div>
  );
};
