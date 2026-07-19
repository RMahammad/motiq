"use client";

import * as React from "react";

import { resolveComposition, type ContentPlacement } from "@/lib/motiq";

/**
 * Side-by-side (copy-left / graphic-right) is kept on desktop AND tablet so they
 * read alike. Only true PHONES (≤639px) — where a half-width copy column is too
 * cramped — switch to a full-bleed hero: full-width copy over the graphic. SSR +
 * first client render assume desktop so hydration matches.
 */
export function useHeroPlacement(desktop: ContentPlacement): ContentPlacement {
  const [phone, setPhone] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setPhone(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  if (!phone) return desktop;
  return desktop === "center" ? "center" : "top";
}

export interface HeroCopy {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  copy: React.ReactNode;
  primary: string;
  secondary: string;
}

function ContentBlock({
  copy,
  align,
  max = "max-w-[15ch]",
  hero = false,
}: {
  copy: HeroCopy;
  align: string;
  max?: string;
  hero?: boolean;
}) {
  // `hero` = full-width phone layout: big title, larger type, roomy buttons.
  // Otherwise a fluid half-width column (side-by-side on tablet/desktop).
  const titleSize = hero
    ? "text-[clamp(1.7rem,7.5vw,2.4rem)]"
    : "text-[clamp(1.05rem,3.2vw,2.6rem)]";
  const bodySize = hero ? "text-[15px]" : "text-[clamp(11.5px,1.5vw,14.5px)]";
  const btn = hero ? "px-5 py-2.5 text-[15px]" : "px-3 py-1.5 text-[clamp(12px,1.3vw,14px)] sm:px-4 sm:py-2";
  return (
    <div className={`flex min-w-0 flex-col ${hero ? "gap-4 px-6 py-7" : "gap-2.5 px-3.5 py-5 sm:gap-4 sm:px-10 sm:py-8"} ${align}`}>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-2.5 py-1 text-[12px] text-[var(--color-muted)] backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {copy.eyebrow}
      </span>
      <h2 className={`${hero ? "max-w-[16ch]" : max} ${titleSize} font-semibold leading-[1.08] tracking-tight text-[var(--color-fg)]`}>
        {copy.title}
      </h2>
      <p className={`max-w-[34ch] ${bodySize} leading-relaxed text-[var(--color-muted)]`}>{copy.copy}</p>
      <div className={`mt-1 flex flex-wrap items-center gap-3`}>
        <button
          type="button"
          className={`rounded-lg bg-[var(--color-accent)] ${btn} font-medium text-[var(--color-accent-fg,#fff)] shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5`}
        >
          {copy.primary}
        </button>
        <button
          type="button"
          className={`rounded-lg border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_65%,transparent)] ${btn} font-medium text-[var(--color-fg)] backdrop-blur hover:border-[var(--color-accent)]`}
        >
          {copy.secondary}
        </button>
      </div>
    </div>
  );
}

/**
 * The foreground of a background hero preview — a genuine 50/50 composition: the
 * copy fills one half of the frame and the live background fills the other. Pass
 * the SAME `placement` you gave the background's `contentPlacement` (both from
 * `useHeroPlacement`) so the quiet region and the copy line up, and both stack
 * together on mobile. Render this inside the background's `children` slot.
 */
export function HeroContent({
  placement,
  copy,
  showSafe = false,
  minH = "min-h-[440px]",
}: {
  placement: ContentPlacement;
  copy: HeroCopy;
  showSafe?: boolean;
  minH?: string;
}) {
  const safe = resolveComposition({ contentPlacement: placement }).safe;
  const overlay = showSafe ? (
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 rounded-xl border-2 border-dashed border-[var(--color-accent)]"
      style={{
        left: `${safe.x * 100}%`,
        top: `${safe.y * 100}%`,
        width: `${safe.w * 100}%`,
        height: `${safe.h * 100}%`,
        background: "color-mix(in oklab, var(--color-accent) 6%, transparent)",
      }}
    >
      <span className="absolute -top-2.5 left-3 bg-[var(--color-bg)] px-1.5 text-[11px] font-medium text-[var(--color-accent)]">
        safe area
      </span>
    </div>
  ) : null;

  let body: React.ReactNode;
  if (placement === "top" || placement === "bottom") {
    const top = placement === "top";
    body = (
      <div className={`flex ${minH} flex-col ${top ? "justify-start pt-3" : "justify-end pb-3"}`}>
        <ContentBlock copy={copy} align="items-start" hero />
      </div>
    );
  } else if (placement === "center") {
    body = (
      <div className={`flex ${minH} items-center justify-center`}>
        <ContentBlock copy={copy} align="items-center text-center" max="max-w-[18ch]" />
      </div>
    );
  } else {
    const right = placement === "right";
    // Side-by-side at EVERY width — copy in one half, the live graphic in the
    // other — so tablet/mobile mirror the desktop composition instead of stacking.
    body = (
      <div className={`grid ${minH} grid-cols-2 items-center`}>
        {right ? <div aria-hidden /> : null}
        <ContentBlock copy={copy} align={right ? "items-end text-right" : "items-start"} />
        {right ? null : <div aria-hidden /> }
      </div>
    );
  }

  return (
    <div className="relative z-10">
      {overlay}
      {body}
    </div>
  );
}

/**
 * Compact caption for a catalog card (docs/55 §7). The card's meta panel already
 * carries the name + description, so the preview stays field-forward: one badge
 * and one short headline over the live background. Pass the SAME `placement` from
 * `useHeroPlacement` you gave the background's `contentPlacement`, so the copy
 * sits in the quiet region — left-centered on desktop, top on mobile with the
 * field vivid below. No paragraph, no CTAs, no controls.
 */
export function CatalogCaption({
  eyebrow,
  title,
  placement,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  placement: ContentPlacement;
}) {
  const stacked = placement === "top" || placement === "bottom";
  const centered = placement === "center";
  // A soft scrim keeps the caption legible while the field stays vivid across the
  // whole card (so subtle textures don't have to be voided behind the copy).
  const scrim = centered
    ? "radial-gradient(60% 60% at 50% 45%, color-mix(in oklab, var(--color-bg) 78%, transparent), transparent 75%)"
    : stacked
      ? "linear-gradient(180deg, color-mix(in oklab, var(--color-bg) 85%, transparent) 0%, color-mix(in oklab, var(--color-bg) 55%, transparent) 45%, transparent 78%)"
      : "linear-gradient(90deg, color-mix(in oklab, var(--color-bg) 88%, transparent) 0%, color-mix(in oklab, var(--color-bg) 58%, transparent) 42%, transparent 72%)";
  return (
    <div
      className={`relative z-10 flex h-full min-h-[360px] w-full ${
        centered ? "items-center justify-center" : stacked ? "items-start pt-7" : "items-center"
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: scrim }} />
      <div className={`relative flex max-w-full flex-col gap-3 px-7 sm:px-9 ${centered ? "items-center text-center" : "items-start"}`}>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-3 py-1 text-[11.5px] text-[var(--color-muted)] backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {eyebrow}
        </span>
        <h3 className="max-w-[14ch] text-[clamp(1.3rem,2.6vw,1.95rem)] font-semibold leading-[1.1] tracking-tight text-[var(--color-fg)]">
          {title}
        </h3>
      </div>
    </div>
  );
}
