"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";

import type { PreviewSize, StageFamily } from "../../lib/catalog";

/**
 * Catalog discovery stage (docs/55). Sizes by `previewSize`, tints by `stageFamily`,
 * bounds height so grid rows never stretch into empty space, and honestly crops tall
 * workflow content with a soft bottom fade. Non-interactive by default (discovery,
 * not a mini-app) — the detail page owns the full interactive stage + controls.
 *
 * Card chrome, typography, radius and status tokens stay shared across families;
 * only the interior surface tone varies, from a small controlled palette.
 */

/**
 * Height strategy (docs/57 §empty-space): stages FIT their content between a min
 * floor (visual weight, row rhythm) and a max cap (honest crop for tall workflows),
 * instead of a fixed height. This kills the oversized empty regions that appeared
 * when a compact preview sat inside a tall fixed box. Bounds follow the docs/56
 * preview-size ranges.
 */
const SIZE: Record<PreviewSize, { min: number; max: number; pad: string }> = {
  // `min` is only a floor for genuinely tiny content (a lone button/icon); a normal
  // preview sizes to content + padding and stays under it, so no empty band appears.
  // `max` crops tall workflows honestly (Kanban, timelines, long threads).
  small: { min: 200, max: 300, pad: "p-5" },
  standard: { min: 220, max: 380, pad: "p-5 sm:p-6" },
  wide: { min: 260, max: 460, pad: "p-5 sm:p-6" },
  full: { min: 320, max: 520, pad: "p-6" },
  mobile: { min: 480, max: 580, pad: "p-6" },
  ambient: { min: 360, max: 380, pad: "p-0" },
};

/**
 * Alignment policy (docs/57 §alignment): functional product previews — workflows,
 * forms, lists, tables, security, messaging, commerce, files — read top-down, so
 * their content must start near the top of the card, never floated in the middle.
 * Only intentionally centered surfaces (headline text, decorative creative cards,
 * ambient backgrounds) center vertically.
 */
const CENTER_FAMILIES = new Set<StageFamily>(["editorial", "creative"]);

// Family surface tone: an interior background + a faint accent hue. Theme-aware via tokens.
const FAMILY: Record<StageFamily, React.CSSProperties> = {
  ai: {
    background:
      "radial-gradient(120% 120% at 50% -10%, color-mix(in oklab, var(--color-accent) 9%, var(--color-surface)) 0%, var(--color-surface) 60%)",
  },
  console: {
    background:
      "linear-gradient(180deg, color-mix(in oklab, var(--color-fg) 4%, var(--color-surface)), var(--color-surface))",
  },
  collab: {
    background:
      "radial-gradient(130% 120% at 20% -10%, color-mix(in oklab, var(--color-accent) 7%, var(--color-surface)) 0%, var(--color-surface) 55%)",
  },
  data: { background: "var(--color-surface)" },
  mobile: {
    background:
      "radial-gradient(120% 120% at 50% 0%, color-mix(in oklab, var(--color-accent) 8%, var(--color-bg-secondary)), var(--color-bg-secondary))",
  },
  commerce: {
    background:
      "linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 5%, var(--color-surface)), var(--color-bg-secondary))",
  },
  security: {
    background:
      "radial-gradient(120% 120% at 50% -10%, color-mix(in oklab, var(--color-success) 7%, var(--color-surface)) 0%, var(--color-surface) 60%)",
  },
  productivity: { background: "var(--color-bg-secondary)" },
  creative: { background: "var(--color-surface)" },
  editorial: {
    background:
      "radial-gradient(130% 130% at 50% 0%, color-mix(in oklab, var(--color-accent) 10%, var(--color-surface)) 0%, var(--color-surface) 62%)",
  },
  neutral: { background: "var(--color-bg-secondary)" },
};

/** iOS-style status bar for the phone frame: clock · dynamic island · radios. */
function MobileStatusBar() {
  return (
    <div className="relative z-10 flex shrink-0 items-center justify-between px-5 pb-1 pt-2.5 text-[var(--color-fg)]" aria-hidden>
      <span className="text-[11px] font-semibold tabular-nums tracking-tight">9:41</span>
      {/* dynamic island */}
      <span className="absolute left-1/2 top-2 h-[18px] w-[54px] -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_72%,var(--color-bg))]" />
      <span className="flex items-center gap-1.5 text-[var(--color-fg)]">
        {/* signal */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <rect x="0" y="7.5" width="2.6" height="3.5" rx="0.6" />
          <rect x="4" y="5" width="2.6" height="6" rx="0.6" />
          <rect x="8" y="2.5" width="2.6" height="8.5" rx="0.6" />
          <rect x="12" y="0" width="2.6" height="11" rx="0.6" opacity="0.4" />
        </svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M1 3.4a9 9 0 0 1 13 0M3.4 6a5.5 5.5 0 0 1 8.2 0" />
          <circle cx="7.5" cy="9" r="0.9" fill="currentColor" stroke="none" />
        </svg>
        {/* battery */}
        <span className="flex items-center gap-0.5">
          <span className="relative h-[11px] w-[22px] rounded-[3px] border border-[color-mix(in_oklab,var(--color-fg)_45%,transparent)] p-[1.5px]">
            <span className="block h-full w-[70%] rounded-[1px] bg-current" />
          </span>
          <span className="h-[4px] w-[1.5px] rounded-r bg-[color-mix(in_oklab,var(--color-fg)_45%,transparent)]" />
        </span>
      </span>
    </div>
  );
}

export function CatalogStage({
  children,
  size,
  family,
  ambient = false,
  mobileFrame = false,
}: {
  children: React.ReactNode;
  size: PreviewSize;
  family: StageFamily;
  ambient?: boolean;
  mobileFrame?: boolean;
}) {
  const s = SIZE[size];
  // Center only intentionally-centered surfaces; everything functional is top-anchored.
  const topAnchored = !(ambient || CENTER_FAMILIES.has(family));

  // Show the crop fade ONLY when content genuinely overflows its box — never over
  // the empty padding of a short top-anchored preview (that reads as a fade into
  // nothing). Measured on mount + resize.
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  React.useEffect(() => {
    if (!topAnchored) return;
    const el = boxRef.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight - el.clientHeight > 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [topAnchored]);
  const showCropFade = topAnchored && overflowing;

  const inner = (
    <MotionConfig reducedMotion="user">
      <div
        // Discovery surface, not a mini-app: `inert` makes the preview fully
        // non-interactive AND unfocusable, so a component that moves focus on
        // mount (e.g. an open sheet/dialog) can never scroll the page to itself.
        inert
        className="pointer-events-none relative flex w-full select-none justify-center"
      >
        {children}
      </div>
    </MotionConfig>
  );

  if (mobileFrame) {
    // A realistic phone "screenshot": bezel + dynamic-island status bar, and an
    // app-content region the preview FILLS (flex-1, h-full) — so nothing floats in
    // a void and sticky bottom bars sit at the true screen bottom, never clipped.
    return (
      <div
        data-stage="catalog"
        style={{ ...FAMILY[family], height: s.max }}
        className="relative isolate flex items-center justify-center overflow-hidden p-4 sm:p-5"
      >
        {/* Device frame on ≥sm; full-bleed on an already-mobile viewport (docs/55 §26). */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-none border-0 bg-[var(--color-bg)] shadow-none sm:h-full sm:w-[300px] sm:max-w-[88%] sm:rounded-[2.7rem] sm:border-[8px] sm:border-[color-mix(in_oklab,var(--color-fg)_18%,var(--color-bg-secondary))] sm:shadow-[var(--shadow-lg,var(--shadow-md))] sm:ring-1 sm:ring-inset sm:ring-[color-mix(in_oklab,var(--color-fg)_10%,transparent)]">
          <MobileStatusBar />
          <div inert className="pointer-events-none relative min-h-0 w-full flex-1 overflow-hidden">
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
            {/* Soft bottom fade — a gentle cue for any content taller than the screen. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-6"
              style={{ background: "linear-gradient(180deg, transparent, color-mix(in oklab, var(--color-bg) 78%, transparent))" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (ambient) {
    // Full-bleed backdrop — fixed height so the background fills edge-to-edge.
    return (
      <div
        data-stage="catalog"
        style={{ ...FAMILY[family], height: s.max }}
        className="relative flex items-stretch justify-center overflow-hidden p-0"
      >
        <div inert className="pointer-events-none relative flex w-full select-none">
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={boxRef}
      data-stage="catalog"
      style={{ ...FAMILY[family], minHeight: s.min, maxHeight: s.max }}
      className={`relative isolate flex flex-col overflow-hidden ${
        topAnchored ? "justify-start" : "justify-center"
      } ${s.pad}`}
    >
      {inner}
      {/* Soft top light — coherent across families, not a hard grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 80% at 50% -10%, transparent 62%, color-mix(in oklab, var(--color-fg) 4%, transparent) 100%)",
        }}
      />
      {/* Honest crop fade only when tall workflow content actually overflows. */}
      {showCropFade ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: "linear-gradient(180deg, transparent, var(--color-surface) 92%)" }}
        />
      ) : null}
    </div>
  );
}
