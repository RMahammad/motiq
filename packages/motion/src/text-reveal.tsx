"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";
import { useInView } from "./use-in-view";

export interface TextRevealProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  text: string;
  /** Split unit for the stagger. */
  by?: "word" | "character";
  gap?: "sm" | "md";
  trigger?: "mount" | "in-view";
  once?: boolean;
  reducedMotion?: "respect" | "force-reduce" | "allow";
}

const GAP: Record<NonNullable<TextRevealProps["gap"]>, string> = {
  sm: "var(--motion-stagger-sm)",
  md: "var(--motion-stagger-md)",
};

/**
 * TextReveal — reveals text by word or character with a stagger. **Accessible split:** the full
 * string is exposed to screen readers via a visually-hidden copy while the animated units are
 * `aria-hidden`, so assistive tech never reads fragmented spans. CSS + IntersectionObserver
 * (useInView); SSR-safe, reduced-motion aware. docs/12.
 */
export const TextReveal = React.forwardRef<HTMLSpanElement, TextRevealProps>(function TextReveal(
  { text, by = "word", gap = "sm", trigger = "in-view", once = true, reducedMotion = "respect", className, style, ...rest },
  ref,
) {
  const [innerRef, shown] = useInView<HTMLSpanElement>({ once, enabled: trigger === "in-view" });
  React.useImperativeHandle(ref, () => innerRef.current as HTMLSpanElement);

  const units = by === "character" ? [...text] : text.split(/(\s+)/).filter((s) => s.length > 0);
  const styleVars = { ["--stagger-gap"]: GAP[gap], ...style } as React.CSSProperties;

  return (
    <span
      ref={innerRef}
      data-motion={shown ? "shown" : "hidden"}
      data-reduced-motion={reducedMotion}
      className={cn("scope-text-reveal", className)}
      style={styleVars}
      {...rest}
    >
      <span className="scope-sr-only">{text}</span>
      <span aria-hidden="true">
        {units.map((u, i) => (
          <span
            key={i}
            className="scope-text-reveal__unit"
            style={{ ["--stagger-index"]: i } as React.CSSProperties}
          >
            {u}
          </span>
        ))}
      </span>
    </span>
  );
});
