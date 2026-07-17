"use client";

import * as React from "react";

import { AgentOperationsHero, type AgentHeroPhase } from "@/registry/blocks/agent-operations-hero";
import { ControlBar, ControlSegmented, ControlHint } from "../_components/preview-controls";

/* -------------------------------------------------------------------------
 * DEMO ONLY. This preview renders the Agent Operations Hero block with its
 * built-in fictional demo data. There is no model and nothing is executed — the
 * block only renders the phase it is given and reports user intent (submit /
 * approve / reject / retry / cancel / stop) back through callbacks. A small
 * external segmented control drives every required state so a reviewer can see
 * all six without hunting for controls inside the hero itself.
 * ---------------------------------------------------------------------- */

const PHASES: { value: AgentHeroPhase; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "running", label: "Running" },
  { value: "tool-active", label: "Tool" },
  { value: "waiting", label: "Approval" },
  { value: "completed", label: "Done" },
  { value: "failed", label: "Failed" },
];

const HINT: Record<AgentHeroPhase, string> = {
  idle: "Queued — the agent has not started.",
  running: "The agent is drafting a grounded answer.",
  "tool-active": "A tool call is executing right now.",
  waiting: "Paused for a human approval before publishing.",
  completed: "Approved and published — run complete.",
  failed: "A step failed; retry is available.",
};

export function AgentOperationsHeroPreview() {
  const [phase, setPhase] = React.useState<AgentHeroPhase>("running");

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
      <ControlBar label="Workflow state">
        <span className="text-[12.5px] font-medium text-[var(--color-muted)]">State</span>
        <ControlSegmented
          label="Workflow state"
          value={phase}
          onChange={setPhase}
          options={PHASES}
        />
        <ControlHint live>{HINT[phase]}</ControlHint>
      </ControlBar>

      <AgentOperationsHero phase={phase} onPhaseChange={setPhase} />
    </div>
  );
}

export default AgentOperationsHeroPreview;
