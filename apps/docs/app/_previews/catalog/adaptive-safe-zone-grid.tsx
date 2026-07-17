"use client";

import * as React from "react";

import { AdaptiveSafeZoneGrid } from "@/registry/backgrounds/adaptive-safe-zone-grid";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

/**
 * Compact catalog adapter (docs/55 §7). Field-forward: one short caption, the
 * live grid filling the rest — left-centered on desktop, top on mobile with the
 * grid vivid below. No controls — the detail page owns the playground.
 */
export function AdaptiveSafeZoneGridCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <AdaptiveSafeZoneGrid contentPlacement={placement} intensity={1.5} density={1.35} safeAreaStrength={0.42} className="h-full w-full">
      <CatalogCaption eyebrow="Content-aware grid" title="A grid that yields to your words." placement={placement} />
    </AdaptiveSafeZoneGrid>
  );
}

export default AdaptiveSafeZoneGridCatalogPreview;
