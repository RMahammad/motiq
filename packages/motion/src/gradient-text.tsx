import * as React from "react";
import { cn } from "@scope/tokens/cn";

export interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Start color. If omitted, a token-based default gradient is used. */
  from?: string;
  to?: string;
  via?: string;
  /** Animate the gradient position (CSS only; disabled under reduced motion). */
  animate?: boolean;
}

/**
 * GradientText — text painted with a gradient (background-clip). **Server-safe** (no hooks,
 * no "use client"): usable directly in Server Components. The text remains real, selectable,
 * screen-reader-readable content; forced-colors falls back to system text. docs/10.
 * Wrap in your own heading element for semantics.
 */
export const GradientText = React.forwardRef<HTMLSpanElement, GradientTextProps>(
  function GradientText({ from, to, via, animate = false, className, style, children, ...rest }, ref) {
    const gradient = from
      ? `linear-gradient(90deg, ${from}${via ? `, ${via}` : ""}, ${to ?? from})`
      : undefined;
    const styleVars = {
      ...(gradient ? { ["--gradient"]: gradient } : {}),
      ...style,
    } as React.CSSProperties;
    return (
      <span
        ref={ref}
        data-animate={animate || undefined}
        className={cn("scope-gradient-text", className)}
        style={styleVars}
        {...rest}
      >
        {children}
      </span>
    );
  },
);
