"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spotlight color (any CSS color). */
  spotlightColor?: string;
  /** Spotlight diameter in px. */
  radius?: number;
}

/**
 * SpotlightCard — a card with a radial "spotlight" that follows the pointer on hover.
 * CSS-driven (a `::before` gradient positioned via CSS vars); the pointer handler only writes
 * two custom properties (no re-render). **Mobile fallback:** the spotlight is hidden on
 * `hover: none` devices. Reduced motion removes the fade. docs/13.
 */
export const SpotlightCard = React.forwardRef<HTMLDivElement, SpotlightCardProps>(
  function SpotlightCard(
    { spotlightColor, radius = 200, className, style, children, onMouseMove, ...rest },
    ref,
  ) {
    const innerRef = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

    const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const el = innerRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--spotlight-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spotlight-y", `${e.clientY - r.top}px`);
      }
      onMouseMove?.(e);
    };

    const styleVars = {
      ...(spotlightColor ? { ["--spotlight-color"]: spotlightColor } : {}),
      ["--spotlight-radius"]: `${radius}px`,
      ...style,
    } as React.CSSProperties;

    return (
      <div
        ref={innerRef}
        onMouseMove={handleMove}
        data-slot="spotlight-card"
        className={cn("scope-spotlight-card", className)}
        style={styleVars}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
