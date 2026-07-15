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
        // Constrain interactivity — this is a discovery surface, not a mini-app.
        className="pointer-events-none relative flex w-full select-none justify-center"
        aria-hidden={false}
      >
        {children}
      </div>
    </MotionConfig>
  );

  if (mobileFrame) {
    // Properly sized phone stage; component fills the device, not floating in a void.
    return (
      <div
        data-stage="catalog"
        style={{ ...FAMILY[family], height: s.max }}
        className="relative flex items-center justify-center overflow-hidden"
      >
        {/* Device frame on ≥sm; full-bleed on an already-mobile viewport (docs/55 §26). */}
        <div className="relative h-full w-full overflow-hidden rounded-none border-0 bg-transparent shadow-none sm:h-[92%] sm:w-[268px] sm:max-w-[80%] sm:rounded-[2rem] sm:border-[6px] sm:border-[color-mix(in_oklab,var(--color-fg)_22%,transparent)] sm:bg-[var(--color-bg)] sm:shadow-[var(--shadow-md)]">
          <div className="absolute left-1/2 top-2 z-10 hidden h-1.5 w-16 -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_22%,transparent)] sm:block" />
          <div className="pointer-events-none flex h-full w-full items-start justify-center overflow-hidden pt-2 sm:pt-7">
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
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
        <div className="pointer-events-none relative flex w-full select-none">
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
      className={`relative flex flex-col overflow-hidden ${
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
