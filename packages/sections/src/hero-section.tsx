import * as React from "react";
import { Stagger, Reveal } from "@scope/motion";
import { cn } from "@scope/tokens/cn";

export interface HeroSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Small over-title label. */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Slot for CTA buttons/links (consumer-provided — no baked copy). */
  actions?: React.ReactNode;
  /** Slot for an image / device mockup / illustration. */
  media?: React.ReactNode;
  align?: "start" | "center";
  /** Heading level for the title (keep one h1 per page). */
  headingLevel?: 1 | 2 | 3;
  /** Toggle the entrance animation (still reduced-motion-safe when on). */
  animate?: boolean;
}

/**
 * HeroSection — a landing hero composed from motion primitives. **Server-safe** (no
 * "use client"; composes client primitives as leaves — the ideal RSC pattern). Content is
 * entirely prop/slot-driven (no hard-coded marketing copy). Semantic <section> + heading,
 * responsive (stacks on mobile, two columns with media on ≥768px), reduced-motion-safe.
 * Skill: animated-section-authoring. Standards: docs/09, docs/12, docs/13.
 */
export const HeroSection = React.forwardRef<HTMLElement, HeroSectionProps>(function HeroSection(
  {
    eyebrow,
    title,
    subtitle,
    actions,
    media,
    align = "start",
    headingLevel = 1,
    animate = true,
    className,
    children,
    ...rest
  },
  ref,
) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";

  const items = [
    eyebrow != null ? (
      <p key="eyebrow" className="scope-hero__eyebrow">
        {eyebrow}
      </p>
    ) : null,
    <Heading key="title" className="scope-hero__title">
      {title}
    </Heading>,
    subtitle != null ? (
      <p key="subtitle" className="scope-hero__subtitle">
        {subtitle}
      </p>
    ) : null,
    actions != null ? (
      <div key="actions" className="scope-hero__actions">
        {actions}
      </div>
    ) : null,
  ].filter(Boolean);

  return (
    <section ref={ref} data-align={align} className={cn("scope-hero", className)} {...rest}>
      {animate ? (
        <Stagger trigger="mount" gap="md" className="scope-hero__content">
          {items}
        </Stagger>
      ) : (
        <div className="scope-hero__content">{items}</div>
      )}
      {children}
      {media != null ? (
        <div className="scope-hero__media">
          {animate ? (
            <Reveal trigger="mount" direction="up" distance="lg">
              {media}
            </Reveal>
          ) : (
            media
          )}
        </div>
      ) : null}
    </section>
  );
});
