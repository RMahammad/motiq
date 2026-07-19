"use client";
import * as React from "react";
import { MotionScene, MotionStep, type MotionIntensity } from "@scope/motion";
import { cn } from "@scope/tokens/cn";

export interface ProductIntroductionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Small overline above the headline (kicker). Optional. */
  eyebrow?: React.ReactNode;
  /** The product headline. Rendered as an `h1` (or `h2`, see `headingLevel`). Required. */
  title: React.ReactNode;
  /** Supporting sentence beneath the headline. Optional. */
  subtitle?: React.ReactNode;
  /** Product preview slot — image, video, or any component. Enables the two-column layout. */
  media?: React.ReactNode;
  /** Primary call-to-action node (e.g. a button/link). Optional. */
  primaryAction?: React.ReactNode;
  /** Secondary call-to-action node. Optional. */
  secondaryAction?: React.ReactNode;
  /** Text/stack alignment when there is no media. Ignored in the two-column media layout. */
  align?: "start" | "center";
  /** Heading level for the title — `1` for a page hero, `2` for a nested section. */
  headingLevel?: 1 | 2;
  /** Choreography intensity forwarded to the underlying scene. */
  intensity?: MotionIntensity;
  /** When the scene plays. */
  trigger?: "mount" | "in-view";
  /** Reduced-motion policy forwarded to the underlying scene. */
  reducedMotion?: "respect" | "force-reduce" | "allow";
}

/**
 * ProductIntroduction — a premium **recipe**: a drop-in, choreographed product hero built on the
 * {@link MotionScene} moat. You supply content through slots (`eyebrow`, `title`, `subtitle`,
 * `media`, `primaryAction`, `secondaryAction`); the recipe assigns each a semantic role/intent and
 * plays them as one coordinated scene (eyebrow → heading → subtitle → preview → actions).
 *
 * - **Server-safe shell** composing a single client leaf (`MotionScene`); no baked copy.
 * - **Accessible:** the title is a real heading (`h1`/`h2`); slots keep their own semantics.
 * - **Reduced-motion & SSR** behavior inherited from `MotionScene` (renders final state, animates
 *   after hydrate; honors `prefers-reduced-motion`).
 * - **Responsive:** two-column on wide viewports when `media` is present, stacked on mobile.
 *
 * Requires `@scope/recipes/styles.css` (and `@scope/motion/styles.css`).
 */
export const ProductIntroduction = React.forwardRef<HTMLElement, ProductIntroductionProps>(
  function ProductIntroduction(
    {
      eyebrow,
      title,
      subtitle,
      media,
      primaryAction,
      secondaryAction,
      align = "start",
      headingLevel = 1,
      intensity = "standard",
      trigger = "in-view",
      reducedMotion = "respect",
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const Heading = (headingLevel === 2 ? "h2" : "h1") as "h1" | "h2";
    const hasActions = primaryAction != null || secondaryAction != null;
    const hasMedia = media != null;

    return (
      <section
        ref={ref}
        data-align={align}
        data-has-media={hasMedia ? "" : undefined}
        className={cn("scope-recipe-intro", className)}
        {...rest}
      >
        <MotionScene
          className="scope-recipe-intro__scene"
          preset="product-introduction"
          trigger={trigger}
          intensity={intensity}
          reducedMotion={reducedMotion}
          gap="md"
        >
          {eyebrow != null ? (
            <MotionStep role="detail" intent="deemphasize" className="scope-recipe-intro__eyebrow">
              {eyebrow}
            </MotionStep>
          ) : null}
          <MotionStep role="heading" className="scope-recipe-intro__title">
            <Heading>{title}</Heading>
          </MotionStep>
          {subtitle != null ? (
            <MotionStep
              role="supporting-content"
              intent="deemphasize"
              className="scope-recipe-intro__subtitle"
            >
              <p>{subtitle}</p>
            </MotionStep>
          ) : null}
          {hasMedia ? (
            <MotionStep
              role="product-preview"
              intent="introduce"
              className="scope-recipe-intro__media"
            >
              {media}
            </MotionStep>
          ) : null}
          {hasActions ? (
            <MotionStep
              role="primary-action"
              intent="emphasize"
              className="scope-recipe-intro__actions"
            >
              {primaryAction}
              {secondaryAction}
            </MotionStep>
          ) : null}
          {children}
        </MotionScene>
      </section>
    );
  },
);
