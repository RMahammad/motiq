"use client";

import * as React from "react";

import { EventPropagationMatrix } from "@/registry/backgrounds/event-propagation-matrix";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

/**
 * Compact catalog adapter (docs/55 §7). Field-forward: one short caption, the
 * live matrix filling the rest — left-centered on desktop, top on mobile with the
 * matrix vivid below. No controls — the detail page owns the playground.
 */
export function EventPropagationMatrixCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <EventPropagationMatrix contentPlacement={placement} intensity={1.5} density={1.35} safeAreaStrength={0.42} className="h-full w-full">
      <CatalogCaption eyebrow="Event stream" title="Every webhook, propagated and audited." placement={placement} />
    </EventPropagationMatrix>
  );
}

export default EventPropagationMatrixCatalogPreview;
