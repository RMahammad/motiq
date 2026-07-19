import * as React from "react";
import { Reveal } from "@scope/motion";
import { cn } from "@scope/tokens/cn";

export interface CTASectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Slot for CTA buttons/links (consumer-provided). */
  actions?: React.ReactNode;
  align?: "start" | "center";
  headingLevel?: 2 | 3;
  animate?: boolean;
}

/**
 * CTASection — a call-to-action band. **Server-safe** (wraps content in Reveal, a client leaf,
 * when `animate`). Content is prop/slot-driven (no baked copy). docs/09, docs/12.
 */
export const CTASection = React.forwardRef<HTMLElement, CTASectionProps>(function CTASection(
  { title, subtitle, actions, align = "center", headingLevel = 2, animate = true, className, children, ...rest },
  ref,
) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const content = (
    <div className="scope-cta__inner">
      <Heading className="scope-cta__title">{title}</Heading>
      {subtitle != null ? <p className="scope-cta__subtitle">{subtitle}</p> : null}
      {actions != null ? <div className="scope-cta__actions">{actions}</div> : null}
      {children}
    </div>
  );
  return (
    <section ref={ref} data-align={align} className={cn("scope-cta", className)} {...rest}>
      {animate ? (
        <Reveal trigger="in-view" direction="up" distance="md">
          {content}
        </Reveal>
      ) : (
        content
      )}
    </section>
  );
});
