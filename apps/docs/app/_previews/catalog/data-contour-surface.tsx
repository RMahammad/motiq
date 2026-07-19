"use client";

import * as React from "react";

import { DataContourSurface } from "@/registry/backgrounds/data-contour-surface";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

/**
 * Compact catalog adapter (docs/55 §7). Field-forward: one short caption, the
 * live contour surface filling the rest — left-centered on desktop, top on mobile
 * with the surface vivid below. No controls — the detail page owns the playground.
 * Passes no `points` so the shipped demo field renders with its live-metric chips.
 */
export function DataContourSurfaceCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <DataContourSurface
      contentPlacement={placement}
      intensity={1.3}
      density={1.2}
      className="h-full w-full"
    >
      <CatalogCaption eyebrow="Live metrics" title="Contours drawn from your data." placement={placement} />
    </DataContourSurface>
  );
}

export default DataContourSurfaceCatalogPreview;
