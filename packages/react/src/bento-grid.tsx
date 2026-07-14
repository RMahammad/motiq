import * as React from "react";
import { Reveal } from "@scope/motion";
import { cn } from "@scope/tokens/cn";

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Base column count on desktop (collapses to 1 on small screens). */
  columns?: number;
}

/**
 * BentoGrid — responsive grid container for BentoGridItems. **Server-safe** (no hooks).
 * Collapses to a single column on small screens.
 */
export const BentoGrid = React.forwardRef<HTMLDivElement, BentoGridProps>(function BentoGrid(
  { columns = 3, className, style, children, ...rest },
  ref,
) {
  const styleVars = { ["--bento-cols"]: columns, ...style } as React.CSSProperties;
  return (
    <div ref={ref} className={cn("scope-bento", className)} style={styleVars} {...rest}>
      {children}
    </div>
  );
});

export interface BentoGridItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  media?: React.ReactNode;
  /** Heading level for the item title. */
  headingLevel?: 2 | 3 | 4;
  /** Reveal the item on scroll into view. */
  revealOnView?: boolean;
}

/**
 * BentoGridItem — a content cell that can span columns/rows. **Server-safe** (composes Reveal
 * as a client leaf when `revealOnView`). Content is prop/slot-driven. docs/09.
 */
export const BentoGridItem = React.forwardRef<HTMLDivElement, BentoGridItemProps>(
  function BentoGridItem(
    {
      colSpan = 1,
      rowSpan = 1,
      title,
      description,
      icon,
      media,
      headingLevel = 3,
      revealOnView = false,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
    const item = (
      <div
        ref={ref}
        data-slot="bento-item"
        data-col-span={colSpan}
        data-row-span={rowSpan}
        className={cn("scope-bento-item", className)}
        {...rest}
      >
        {icon != null ? (
          <div data-slot="icon" className="scope-bento-item__icon">
            {icon}
          </div>
        ) : null}
        {title != null ? (
          <Heading data-slot="title" className="scope-bento-item__title">
            {title}
          </Heading>
        ) : null}
        {description != null ? (
          <p data-slot="description" className="scope-bento-item__desc">
            {description}
          </p>
        ) : null}
        {children}
        {media != null ? (
          <div data-slot="media" className="scope-bento-item__media">
            {media}
          </div>
        ) : null}
      </div>
    );
    return revealOnView ? <Reveal trigger="in-view">{item}</Reveal> : item;
  },
);
