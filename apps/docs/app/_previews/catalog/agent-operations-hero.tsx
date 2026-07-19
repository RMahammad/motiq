"use client";

import * as React from "react";

import { AgentOperationsHero } from "@/registry/blocks/agent-operations-hero";

/**
 * Compact catalog adapter (docs/55). Renders the REAL AgentOperationsHero block
 * in a single strong "tool-active" state — a live tool call mid-flight beside the
 * outcome copy and CTAs — with no controls. The block owns its composed workflow
 * components and inline fictional demo data.
 */

export function AgentOperationsHeroCatalogPreview() {
  return <AgentOperationsHero defaultPhase="tool-active" className="h-full w-full" />;
}

export default AgentOperationsHeroCatalogPreview;
