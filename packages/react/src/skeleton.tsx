import * as React from "react";
import { cn } from "@scope/tokens/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  variant?: "text" | "rect" | "circle";
  radius?: number | string;
}

/**
 * Skeleton — a loading placeholder with a shimmer. **Server-safe** (no hooks). Decorative:
 * marked `aria-hidden` (put `aria-busy`/a status message on the surrounding region instead).
 * Shimmer stops under reduced motion (renders a solid block). docs/12.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { width, height, variant = "rect", radius, className, style, ...rest },
  ref,
) {
  const styleVars = {
    ...(width != null ? { width } : {}),
    ...(height != null ? { height } : {}),
    ...(radius != null ? { borderRadius: radius } : {}),
    ...style,
  } as React.CSSProperties;
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-variant={variant}
      className={cn("scope-skeleton", className)}
      style={styleVars}
      {...rest}
    />
  );
});
