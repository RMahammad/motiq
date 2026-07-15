"use client";

import * as React from "react";

import { AiAgentWorkspace } from "@/registry/blocks/ai-agent-workspace";

/**
 * Compact catalog adapter (docs/55). Renders the REAL AiAgentWorkspace block in
 * its default populated "running" state with the demo state-preset control bar
 * hidden (showStateControls={false}). Full-width block layout; the block owns
 * its four composed components and inline fictional demo data.
 */

export function AiAgentWorkspaceCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <AiAgentWorkspace defaultPhase="running" showStateControls={false} />
    </div>
  );
}

export default AiAgentWorkspaceCatalogPreview;
