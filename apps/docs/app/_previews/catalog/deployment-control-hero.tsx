"use client";

import * as React from "react";

import { DeploymentControlHero } from "@/registry/blocks/deployment-control-hero";

/**
 * Compact catalog adapter (docs/55). Renders the REAL DeploymentControlHero
 * block in one strong state — an in-flight deploy — so the headline, CTAs, and
 * live control surface all read richly at card size. No external controls.
 * Provider-neutral fictional demo data.
 */

export function DeploymentControlHeroCatalogPreview() {
  return <DeploymentControlHero phase="deploying" className="h-full w-full" />;
}

export default DeploymentControlHeroCatalogPreview;
