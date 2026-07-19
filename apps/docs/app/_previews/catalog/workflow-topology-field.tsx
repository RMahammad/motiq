"use client";

import * as React from "react";

import { WorkflowTopologyField } from "@/registry/backgrounds/workflow-topology-field";
import { CatalogCaption, useHeroPlacement } from "../../_components/hero-frame";

/**
 * Compact catalog adapter (docs/55 §7). Field-forward: one short caption, the
 * live topology filling the rest — left-centered on desktop, top on mobile with
 * the field vivid below. No controls — the detail page owns the playground.
 */
export function WorkflowTopologyFieldCatalogPreview() {
  const placement = useHeroPlacement("left");
  return (
    <WorkflowTopologyField contentPlacement={placement} intensity={1.4} density={1.25} safeAreaStrength={0.42} className="h-full w-full">
      <CatalogCaption eyebrow="Live workflow" title="Your orchestration, drawn as it runs." placement={placement} />
    </WorkflowTopologyField>
  );
}

export default WorkflowTopologyFieldCatalogPreview;
