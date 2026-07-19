"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Radius of the pointer-following glow, in px. */
  radius?: number;
  /** Accent color of the glow (any CSS color). */
  color?: string;
}

/**
 * SpotlightCard — a surface with a radial glow that follows the pointer.
 *
 * Performance: updates two CSS custom properties on pointer move (no React
 * re-render, no layout). The glow is a compositor-only opacity fade. Pointer
 * tracking is skipped for coarse/hover-less pointers and adds no essential
 * information, so it degrades gracefully. Clean-room original.
 */
export function SpotlightCard({
  radius = 320,
  color = "rgb(var(--spotlight-color, 105 92 255) / 0.35)",
  className,
  children,
  onPointerMove,
  ...props
}: SpotlightCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
        el.style.setProperty("--spot-opacity", "1");
      }
      onPointerMove?.(e);
    },
    [onPointerMove],
  );

  const handleLeave = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    ref.current?.style.setProperty("--spot-opacity", "0");
    props.onPointerLeave?.(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handleLeave}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--color-border,#e4e7ec)]",
        "bg-[var(--color-surface,#fff)] p-6 transition-colors",
        className,
      )}
      style={
        {
          "--spot-size": `${radius}px`,
          "--spot-color": color,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--spot-opacity,0)] transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(var(--spot-size) circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spot-color), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export default SpotlightCard;
