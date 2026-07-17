"use client";

import * as React from "react";

import {
  DeploymentControlHero,
  type DeployHeroPhase,
} from "@/registry/blocks/deployment-control-hero";
import { ControlBar, ControlSegmented, ControlHint } from "../_components/preview-controls";

/* -------------------------------------------------------------------------
 * DEMO ONLY — an editable deployment-control hero for the imaginary product
 * "Orbit Deploy" (repo orbit/checkout-web). Every environment, release id,
 * host, header, and timing is fictional and provider-neutral; there is NO real
 * backend and NO deployment ever happens. A small external segmented control
 * drives the block across its six phases so the surface can be read in each
 * state. The big control surface lives inside the hero, not out here.
 * ---------------------------------------------------------------------- */

const PHASES: ReadonlyArray<{ value: DeployHeroPhase; label: string }> = [
  { value: "ready", label: "Ready" },
  { value: "deploying", label: "Deploying" },
  { value: "validating", label: "Validating" },
  { value: "failed", label: "Failed" },
  { value: "retrying", label: "Retrying" },
  { value: "completed", label: "Completed" },
];

const HINTS: Record<DeployHeroPhase, string> = {
  ready: "Build queued — nothing has shipped yet.",
  deploying: "Build and test passed; the release is uploading.",
  validating: "Release accepted — traffic is being shifted and checked.",
  failed: "Deploy stage failed a health check; verify was cancelled.",
  retrying: "A fresh attempt is in flight after the failure.",
  completed: "All four stages passed and traffic is at 100%.",
};

export function DeploymentControlHeroPreview() {
  const [phase, setPhase] = React.useState<DeployHeroPhase>("deploying");

  return (
    <div className="w-full max-w-[1180px]">
      <DeploymentControlHero phase={phase} onPhaseChange={setPhase} />

      <ControlBar className="mt-3" label="Deployment phase">
        <ControlSegmented
          label="Deployment phase"
          options={PHASES}
          value={phase}
          onChange={setPhase}
        />
        <ControlHint live>{HINTS[phase]}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default DeploymentControlHeroPreview;
