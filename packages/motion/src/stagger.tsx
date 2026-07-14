"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";
import { useInView } from "./use-in-view";

export interface StaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  once?: boolean;
  rootMargin?: string;
  gap?: "sm" | "md";
  trigger?: "mount" | "in-view";
  reducedMotion?: "respect" | "force-reduce" | "allow";
}

export type StaggerItemProps = React.HTMLAttributes<HTMLDivElement>;

const GAP: Record<NonNullable<StaggerProps["gap"]>, string> = {
  sm: "var(--motion-stagger-sm)",
  md: "var(--motion-stagger-md)",
};

/**
 * StaggerItem — one animated child of a Stagger. Renders `.scope-stagger-item`.
 * Stagger injects its `--stagger-index`; only animates inside a Stagger.
 */
export const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  function StaggerItem({ className, children, ...rest }, ref) {
    return (
      <div ref={ref} className={cn("scope-stagger-item", className)} {...rest}>
        {children}
      </div>
    );
  },
);

/**
 * Stagger — reveals children with an incremental delay when scrolled into view.
 * CSS-driven (transition-delay = gap * index); SSR-safe, reduced-motion aware,
 * observer cleaned up on unmount. Auto-wraps non-StaggerItem children.
 * When NOT to use: for a single element use `Reveal`.
 */
export const Stagger = React.forwardRef<HTMLDivElement, StaggerProps>(function Stagger(
  {
    once = true,
    rootMargin = "0px 0px -10% 0px",
    gap = "md",
    trigger = "in-view",
    reducedMotion = "respect",
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const [innerRef, shown] = useInView<HTMLDivElement>({
    once,
    rootMargin,
    enabled: trigger === "in-view",
  });
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  let i = 0;
  const items = React.Children.map(children, (child) => {
    const indexStyle = { ["--stagger-index"]: i++ } as React.CSSProperties;
    if (React.isValidElement(child) && child.type === StaggerItem) {
      const item = child as React.ReactElement<StaggerItemProps>;
      return React.cloneElement(item, {
        style: { ...indexStyle, ...item.props.style },
      });
    }
    return <StaggerItem style={indexStyle}>{child}</StaggerItem>;
  });

  const styleVars = { ["--stagger-gap"]: GAP[gap], ...style } as React.CSSProperties;

  return (
    <div
      ref={innerRef}
      data-motion={shown ? "shown" : "hidden"}
      data-reduced-motion={reducedMotion}
      className={cn("scope-stagger", className)}
      style={styleVars}
      {...rest}
    >
      {items}
    </div>
  );
});
