"use client";
import * as React from "react";
import { Reveal } from "@scope/motion";
import { cn } from "@scope/tokens/cn";

export interface PricingCta {
  label: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export interface PricingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  planName: string;
  price: string;
  /** e.g. "/mo". Rendered next to the price, de-emphasized. */
  period?: string;
  description?: string;
  features?: React.ReactNode[];
  cta?: PricingCta;
  /** Visually promote this plan (accent border + badge slot). */
  featured?: boolean;
  /** Optional highlight text shown as a badge (e.g. "Most popular"). */
  badge?: string;
  /** Wrap in a <Reveal> so the card animates in when scrolled into view. */
  revealOnView?: boolean;
}

/**
 * PricingCard — a themeable, accessible pricing plan card (paid tier).
 * Content is prop-driven; visuals come from semantic tokens (docs/10). Composes the
 * Reveal primitive for optional entrance. Contract: docs/09-component-api-standard.md.
 */
export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  function PricingCard(
    {
      planName,
      price,
      period,
      description,
      features = [],
      cta,
      featured = false,
      badge,
      revealOnView = false,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const headingId = React.useId();

    const card = (
      <div
        ref={ref}
        role="group"
        data-featured={featured || undefined}
        data-slot="pricing-card"
        className={cn("scope-pricing-card", className)}
        aria-labelledby={headingId}
        {...rest}
      >
        {badge ? (
          <span data-slot="badge" className="scope-pricing-card__badge">
            {badge}
          </span>
        ) : null}
        <h3 id={headingId} data-slot="plan" className="scope-pricing-card__plan">
          {planName}
        </h3>
        <p data-slot="price" className="scope-pricing-card__price">
          <span className="scope-pricing-card__amount">{price}</span>
          {period ? <span className="scope-pricing-card__period">{period}</span> : null}
        </p>
        {description ? (
          <p data-slot="description" className="scope-pricing-card__desc">
            {description}
          </p>
        ) : null}
        {features.length > 0 ? (
          <ul data-slot="features" className="scope-pricing-card__features">
            {features.map((f, i) => (
              <li key={i} className="scope-pricing-card__feature">
                {f}
              </li>
            ))}
          </ul>
        ) : null}
        {children}
        {cta ? (
          cta.href ? (
            <a
              data-slot="cta"
              className="scope-pricing-card__cta"
              href={cta.href}
              onClick={cta.onClick}
            >
              {cta.label}
            </a>
          ) : (
            <button
              data-slot="cta"
              className="scope-pricing-card__cta"
              type="button"
              onClick={cta.onClick}
            >
              {cta.label}
            </button>
          )
        ) : null}
      </div>
    );

    return revealOnView ? <Reveal trigger="in-view">{card}</Reveal> : card;
  },
);
