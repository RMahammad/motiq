"use client";

import * as React from "react";

import { LiveDataCommandHero } from "@/registry/blocks/live-data-command-hero";

/**
 * Compact catalog adapter (docs/55). Renders the REAL LiveDataCommandHero block
 * in its default populated "live" state — outcome copy + CTAs beside three
 * morphing KPIs, the refresh state, a watchlist, and a streaming feed. No extra
 * external controls. Provider-neutral fictional telemetry data.
 */

export function LiveDataCommandHeroCatalogPreview() {
  return <LiveDataCommandHero className="h-full w-full" />;
}

export default LiveDataCommandHeroCatalogPreview;
