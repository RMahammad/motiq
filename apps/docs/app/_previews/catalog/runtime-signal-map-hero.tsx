"use client";

import * as React from "react";

import { RuntimeSignalMap } from "@/registry/backgrounds/runtime-signal-map";
import { HeroContent, useHeroPlacement, type HeroCopy } from "../../_components/hero-frame";

const COPY: HeroCopy = {
  eyebrow: "Signals live",
  title: "Every request, drawn across your services.",
  copy: "One request flows edge to database. Degraded and failed routes stay readable.",
  primary: "Open dashboard",
  secondary: "View services",
};

/**
 * Hero adapter — the clean "sell" composition: copy on one side, the live signal
 * map on the other, in a strict content-safe layout. No dev controls, no
 * safe-area overlay, no diagnostic toggles. Stacks copy-over-map on mobile.
 */
export function RuntimeSignalMapHeroPreview() {
  const placement = useHeroPlacement("left");
  return (
    <RuntimeSignalMap contentPlacement={placement} className="h-full w-full">
      <HeroContent placement={placement} copy={COPY} minH="min-h-[600px] lg:min-h-[460px]" />
    </RuntimeSignalMap>
  );
}

export default RuntimeSignalMapHeroPreview;
