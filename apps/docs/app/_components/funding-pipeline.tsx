"use client";

import * as React from "react";

import DeploymentPipeline, { type Stage } from "@/registry/developer-tools/deployment-pipeline";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/**
 * FundingPipeline — the sponsor-page hero visual: the real Deployment Pipeline
 * component driven through Motiq's funding workflow, so the animation
 * communicates state (support becoming a release) rather than decorating.
 *
 * Community support → Component design → Accessibility testing → Documentation
 * → Release. The driver advances one stage at a time and settles on the
 * completed run — a single pass, not an endless loop, so the component's
 * polite live region announces a finite story instead of spamming screen
 * readers. Reduced motion renders the completed run statically; the timer
 * pauses offscreen and in background tabs (the pipeline component additionally
 * pauses its own per-stage animation the same way).
 */

interface StageSpec {
  id: string;
  name: string;
  durationMs: number;
  logs?: string[];
}

const SPECS: StageSpec[] = [
  {
    id: "support",
    name: "Community support",
    durationMs: 4200,
    logs: ["Sponsorship received via Ko-fi", "Funds allocated to catalog work"],
  },
  {
    id: "design",
    name: "Component design",
    durationMs: 8600,
    logs: ["API proposal reviewed", "Motion states specced against real workflow data"],
  },
  {
    id: "a11y",
    name: "Accessibility testing",
    durationMs: 6400,
    logs: ["Keyboard + screen-reader pass", "Reduced-motion behavior verified"],
  },
  {
    id: "docs",
    name: "Documentation",
    durationMs: 5200,
    logs: ["Live preview wired", "API reference + usage guide written"],
  },
  {
    id: "release",
    name: "Release",
    durationMs: 3100,
    logs: ["Registry item published", "Available to everyone, free"],
  },
];

/** step ∈ [0, SPECS.length]: stages < step are passed, stage `step` runs. */
function stagesAt(step: number, withLogs: boolean): Stage[] {
  return SPECS.map((spec, i) => ({
    id: spec.id,
    name: spec.name,
    status: i < step ? "passed" : i === step ? "running" : "queued",
    durationMs: i < step ? spec.durationMs : undefined,
    logs: withLogs ? spec.logs : undefined,
  }));
}

const STEP_MS = 2400;

export function FundingPipeline({
  compact = false,
  className,
}: {
  /** Homepage variant: no expandable logs, tighter chrome. */
  compact?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const visible = useVisibilityPause(wrapRef, { threshold: 0.2 });

  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (reduce || !visible || step >= SPECS.length) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [step, reduce, visible]);

  // Reduced motion: the completed run, statically — the workflow still reads.
  const stages = stagesAt(reduce ? SPECS.length : step, !compact);

  return (
    <div ref={wrapRef} className={className}>
      <DeploymentPipeline
        stages={stages}
        label="How sponsorship becomes a release"
        className={compact ? "p-4 shadow-[var(--shadow-sm)] sm:p-4 [&_li>div:last-child]:pb-2.5" : undefined}
      />
    </div>
  );
}
