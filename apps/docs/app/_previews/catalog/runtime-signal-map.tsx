"use client";

import * as React from "react";

import { RuntimeSignalMap } from "@/registry/backgrounds/runtime-signal-map";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

/**
 * Compact catalog adapter (docs/55 §7). Map-forward: one short caption, the live
 * topology and a single active request filling the rest — left-centered on
 * desktop, top on mobile with the map vivid below. No controls.
 */
export function RuntimeSignalMapCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <RuntimeSignalMap contentPlacement={placement} intensity={1.3} density={1.2} className="h-full w-full">
      <CatalogCaption eyebrow="Signals live" title="Requests, drawn across your services." placement={placement} />
    </RuntimeSignalMap>
  );
}

export default RuntimeSignalMapCatalogPreview;
