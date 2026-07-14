"use client";
import * as React from "react";
import { cn } from "@scope/tokens/cn";
import { useInView } from "./use-in-view";

/** Typed semantic motion intents (docs/27, ADR-0015). */
export type MotionIntent =
  | "introduce"
  | "emphasize"
  | "confirm"
  | "dismiss"
  | "transition"
  | "reorder"
  | "expand"
  | "collapse"
  | "notify"
  | "progress"
  | "replace"
  | "focus"
  | "deemphasize";

export type ScenePreset = "product-introduction" | "feature-emphasis" | "confirmation";
export type MotionIntensity = "none" | "reduced" | "standard" | "expressive";
export type StepRole =
  | "heading"
  | "supporting-content"
  | "product-preview"
  | "primary-action"
  | "secondary-action"
  | "detail";

export interface MotionStepProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: StepRole;
  intent?: MotionIntent;
}

/**
 * MotionStep — one participant in a MotionScene. Its animated state is coordinated by the
 * parent scene (which injects `--scene-index`); it declares *what it is* (`role`) and *how it
 * should move* (`intent`) rather than raw timing.
 */
export const MotionStep = React.forwardRef<HTMLDivElement, MotionStepProps>(function MotionStep(
  { role, intent = "introduce", className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      data-role={role}
      data-intent={intent}
      className={cn("scope-motion-step", className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface MotionSceneProps extends React.HTMLAttributes<HTMLDivElement> {
  preset?: ScenePreset;
  intensity?: MotionIntensity;
  trigger?: "mount" | "in-view";
  once?: boolean;
  gap?: "sm" | "md" | "lg";
  reducedMotion?: "respect" | "force-reduce" | "allow";
  onSequenceComplete?: () => void;
}

const GAP: Record<NonNullable<MotionSceneProps["gap"]>, string> = {
  sm: "60ms",
  md: "90ms",
  lg: "130ms",
};
const DURATION: Record<MotionIntensity, string> = {
  none: "0ms",
  reduced: "220ms",
  standard: "320ms",
  expressive: "440ms",
};

/**
 * MotionScene — coordinates its MotionStep children as a single choreographed sequence
 * (heading → copy → preview → actions) instead of each child inventing its own timing.
 * The moat primitive (docs/27, ADR-0015). CSS-driven; SSR-safe (renders final/hidden state,
 * animates after hydrate); reduced-motion aware; observer cleaned up on unmount.
 * To replay, remount via a React `key`.
 */
export const MotionScene = React.forwardRef<HTMLDivElement, MotionSceneProps>(function MotionScene(
  {
    preset,
    intensity = "standard",
    trigger = "in-view",
    once = true,
    gap = "md",
    reducedMotion = "respect",
    onSequenceComplete,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const [innerRef, shown] = useInView<HTMLDivElement>({ once, enabled: trigger === "in-view" });
  React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

  let count = 0;
  const steps = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const el = child as React.ReactElement<{ style?: React.CSSProperties }>;
    const idx = count++;
    return React.cloneElement(el, {
      style: { ["--scene-index"]: idx, ...el.props.style } as React.CSSProperties,
    });
  });
  const total = count;

  React.useEffect(() => {
    if (!shown || !onSequenceComplete || intensity === "none") return;
    const durMs = parseInt(DURATION[intensity], 10);
    const gapMs = parseInt(GAP[gap], 10);
    const t = window.setTimeout(onSequenceComplete, durMs + gapMs * Math.max(total - 1, 0) + 40);
    return () => window.clearTimeout(t);
  }, [shown, onSequenceComplete, intensity, gap, total]);

  const styleVars = {
    ["--scene-gap"]: GAP[gap],
    ["--scene-duration"]: DURATION[intensity],
    ...style,
  } as React.CSSProperties;

  return (
    <div
      ref={innerRef}
      data-motion={shown ? "shown" : "hidden"}
      data-intensity={intensity}
      data-reduced-motion={reducedMotion}
      data-preset={preset}
      className={cn("scope-motion-scene", className)}
      style={styleVars}
      {...rest}
    >
      {steps}
    </div>
  );
});
