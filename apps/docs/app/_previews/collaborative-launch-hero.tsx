"use client";

import * as React from "react";

import {
  CollaborativeLaunchHero,
  COLLAB_HERO_PHASES,
  type CollabHeroPhase,
} from "@/registry/blocks/collaborative-launch-hero";
import { ControlBar, ControlSegmented, ControlHint } from "../_components/preview-controls";

/* Live block preview — the real CollaborativeLaunchHero at full hero width. A
 * small external segmented switcher drives its controlled `phase` across the
 * seven review states so you can watch the collaboration surface change while
 * the marketing hero stays put. The block owns its fictional demo data. */

const PHASE_LABELS: Record<CollabHeroPhase, string> = {
  "review-open": "Open",
  commenting: "Commenting",
  "changes-requested": "Changes",
  "approval-pending": "Pending",
  approved: "Approved",
  rejected: "Rejected",
  resolved: "Resolved",
};

const PHASE_HINT: Record<CollabHeroPhase, string> = {
  "review-open": "Reviewers are looking now.",
  commenting: "An open thread is in progress.",
  "changes-requested": "One change was requested.",
  "approval-pending": "The decision is waiting on you.",
  approved: "Every reviewer signed off.",
  rejected: "The launch was sent back.",
  resolved: "Discussion resolved; approved.",
};

export function CollaborativeLaunchHeroPreview() {
  const [phase, setPhase] = React.useState<CollabHeroPhase>("approval-pending");

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
      <ControlBar label="Review phase">
        <ControlSegmented
          label="Review phase"
          value={phase}
          onChange={setPhase}
          options={COLLAB_HERO_PHASES.map((p) => ({ value: p, label: PHASE_LABELS[p] }))}
        />
        <ControlHint live>{PHASE_HINT[phase]}</ControlHint>
      </ControlBar>

      <CollaborativeLaunchHero phase={phase} onPhaseChange={setPhase} />
    </div>
  );
}

export default CollaborativeLaunchHeroPreview;
