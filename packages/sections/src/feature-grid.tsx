import * as React from "react";
import { BentoGrid, BentoGridItem } from "@scope/react";
import { cn } from "@scope/tokens/cn";

export interface Feature {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}

export interface FeatureGridProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  features: Feature[];
  columns?: number;
  headingLevel?: 2 | 3;
  align?: "start" | "center";
}

/**
 * FeatureGrid — a marketing "features" section: an optional heading block over a responsive
 * BentoGrid of features. **Server-safe** (composes client leaves). Content is prop-driven
 * (no baked copy). Skill: animated-section-authoring. docs/09, docs/12.
 */
export const FeatureGrid = React.forwardRef<HTMLElement, FeatureGridProps>(function FeatureGrid(
  { eyebrow, title, subtitle, features, columns = 3, headingLevel = 2, align = "start", className, children, ...rest },
  ref,
) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <section ref={ref} data-align={align} className={cn("scope-feature-grid", className)} {...rest}>
      {eyebrow != null || title != null || subtitle != null ? (
        <div className="scope-feature-grid__head">
          {eyebrow != null ? <p className="scope-feature-grid__eyebrow">{eyebrow}</p> : null}
          {title != null ? <Heading className="scope-feature-grid__title">{title}</Heading> : null}
          {subtitle != null ? <p className="scope-feature-grid__subtitle">{subtitle}</p> : null}
        </div>
      ) : null}
      <BentoGrid columns={columns}>
        {features.map((f, i) => (
          <BentoGridItem
            key={i}
            icon={f.icon}
            title={f.title}
            description={f.description}
            headingLevel={headingLevel === 2 ? 3 : 4}
            revealOnView
          />
        ))}
      </BentoGrid>
      {children}
    </section>
  );
});
