"use client";

import * as React from "react";

import {
  DataContourSurface,
  type ContourPoint,
} from "@/registry/backgrounds/data-contour-surface";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

/** Full-field pressure points (mixed signs across x and y) so the surface reads
 *  as one continuous landscape; the composition mask carves the left copy half. */
const POINTS: ContourPoint[] = [
  { x: 0.14, y: 0.24, value: 0.9, radius: 0.22 },
  { x: 0.4, y: 0.72, value: -0.55, radius: 0.2 },
  { x: 0.58, y: 0.2, value: 0.5, radius: 0.18 },
  { x: 0.82, y: 0.5, value: 1.0, radius: 0.24 },
  { x: 0.66, y: 0.82, value: 0.42, radius: 0.18 },
  { x: 0.92, y: 0.8, value: -0.45, radius: 0.18 },
];

/**
 * Compact catalog adapter (docs/55 §7). Field-forward: one short caption, the
 * live contour surface filling the rest — left-centered on desktop, top on mobile
 * with the surface vivid below. No controls — the detail page owns the playground.
 */
export function DataContourSurfaceCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <DataContourSurface
      points={POINTS}
      thresholds={[-0.35, 0.35, 0.7]}
      activeRegion={{ x: 0.62, y: 0.28, w: 0.3, h: 0.44 }}
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
