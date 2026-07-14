import * as React from "react";
import { cn } from "@scope/tokens/cn";

export interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Seconds per full loop. */
  speed?: number;
  reverse?: boolean;
  /** Pause the scroll on hover/focus (default true). */
  pauseOnHover?: boolean;
}

/**
 * Marquee — seamless infinite horizontal scroll (e.g. a logo cloud). **Server-safe** (no hooks):
 * duplicates children with the copy `aria-hidden`. Pure CSS animation; **pauses on hover and
 * focus-within, and stops entirely under reduced motion** (renders static). For strict WCAG on
 * long-running motion, also provide a visible pause control in your layout. docs/12.
 */
export const Marquee = React.forwardRef<HTMLDivElement, MarqueeProps>(function Marquee(
  { speed = 20, reverse = false, pauseOnHover = true, className, style, children, ...rest },
  ref,
) {
  const styleVars = { "--marquee-duration": `${speed}s`, ...style } as React.CSSProperties;
  return (
    <div
      ref={ref}
      data-reverse={reverse || undefined}
      data-pause-hover={pauseOnHover || undefined}
      className={cn("scope-marquee", className)}
      style={styleVars}
      {...rest}
    >
      <div className="scope-marquee__track">
        <div className="scope-marquee__group">{children}</div>
        <div className="scope-marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
});
