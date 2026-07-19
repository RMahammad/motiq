"use client";

import * as React from "react";

import { AiAgentWorkspace } from "@/registry/blocks/ai-agent-workspace";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview renders the AI Agent Workspace block with its built-in
 * fictional demo data. There is no model and nothing is executed — the block
 * only renders the phase + data it is given and reports user intent (approve /
 * reject / retry / cancel / stop) back through callbacks. Use the "Workspace
 * state" controls in the block header to render every required state: Idle,
 * Running, Waiting for approval, Completed, Failed, and Cancelled.
 * ---------------------------------------------------------------------- */

export function AiAgentWorkspacePreview() {
  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <AiAgentWorkspace defaultPhase="running" />
    </div>
  );
}

export default AiAgentWorkspacePreview;
