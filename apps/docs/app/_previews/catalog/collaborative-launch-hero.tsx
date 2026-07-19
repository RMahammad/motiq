"use client";

import * as React from "react";

import { CollaborativeLaunchHero } from "@/registry/blocks/collaborative-launch-hero";

/**
 * Compact catalog adapter (docs/55). Renders the REAL CollaborativeLaunchHero
 * block in its strongest single state — "approval-pending", where one decision
 * is clearly waiting on the viewer — with no demo controls. Full-bleed so the
 * catalog card shows the hero + live collaboration surface together.
 */

export function CollaborativeLaunchHeroCatalogPreview() {
  return <CollaborativeLaunchHero phase="approval-pending" className="h-full w-full" />;
}

export default CollaborativeLaunchHeroCatalogPreview;
