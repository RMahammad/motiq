"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: "sm" | "md" | "lg";
  duration?: "instant" | "fast" | "normal" | "slow";
  delay?: "none" | "sm" | "md";
  trigger?: "mount" | "in-view";
  once?: boolean;
  viewportMargin?: string;
  reducedMotion?: "respect" | "force-reduce" | "allow";
  onVisibilityChange?: (visible: boolean) => void;
}

const DIST: Record<NonNullable<RevealProps["distance"]>, string> = {
  sm: "var(--motion-distance-sm)",
  md: "var(--motion-distance-md)",
  lg: "var(--motion-distance-lg)",
};

/**
 * Reveal — CSS + IntersectionObserver entrance primitive. SSR-safe (renders final
 * state markup; animates after hydrate), reduced-motion aware, ref-forwarded.
 * Contract: docs/09-component-api-standard.md. When NOT to use: for spring/layout/
 * gesture behavior, escalate to a Motion-backed primitive (docs/06).
 */
export const Reveal = React.forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  {
    direction = "up",
    distance = "md",
    duration = "normal",
    delay = "none",
    trigger = "in-view",
    once = true,
    viewportMargin = "0px 0px -10% 0px",
    reducedMotion = "respect",
    onVisibilityChange,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);
  const [shown, setShown] = React.useState(trigger === "mount");

  React.useEffect(() => {
    if (trigger !== "in-view") {
      setShown(true);
      return;
    }
    const el = innerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setShown(true);
          onVisibilityChange?.(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
          onVisibilityChange?.(false);
        }
      },
      { rootMargin: viewportMargin },
    );
    io.observe(el);
    return () => io.disconnect(); // cleanup: no leaked observer
  }, [trigger, once, viewportMargin, onVisibilityChange]);

  const sign = direction === "down" || direction === "right" ? "" : "-";
  const offset = direction === "none" ? "0px" : `${sign}${DIST[distance]}`;

  const styleVars = {
    "--reveal-offset": offset,
    "--reveal-duration": `var(--motion-duration-${duration})`,
    "--reveal-delay": delay === "none" ? "0ms" : `var(--motion-duration-${delay})`,
    ...style,
  } as React.CSSProperties;

  return (
    <div
      ref={innerRef}
      data-motion={shown ? "shown" : "hidden"}
      data-reduced-motion={reducedMotion}
      className={cn("scope-reveal", className)}
      style={styleVars}
      {...rest}
    >
      {children}
    </div>
  );
});
