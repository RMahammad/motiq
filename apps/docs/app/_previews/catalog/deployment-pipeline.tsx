"use client";

import * as React from "react";

import { DeploymentPipeline, type Stage } from "@/registry/developer-tools/deployment-pipeline";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL DeploymentPipeline in
 * one representative mid-run state — two stages passed, one running, one queued
 * — trimmed to 4 stages with logs collapsed and no Replay/Inject-failure
 * controls and no preview timer. The detail page keeps the full run engine.
 */

const STAGES: Stage[] = [
  {
    id: "install",
    name: "Install dependencies",
    status: "passed",
    durationMs: 8400,
    logs: ["$ pnpm install --frozen-lockfile", "Packages: +412", "Done in 8.4s"],
  },
  {
    id: "build",
    name: "Build",
    status: "passed",
    durationMs: 22600,
    logs: ["$ next build", " ✓ Compiled successfully", " ✓ Generating static pages (24/24)"],
  },
  {
    id: "test",
    name: "Test",
    status: "running",
    logs: ["$ vitest run", " ✓ src/lib/format.test.ts (6 tests) 41ms", " ✓ src/ui/button.test.tsx (9 tests) 88ms"],
  },
  {
    id: "deploy",
    name: "Deploy to production",
    status: "queued",
  },
];

export function DeploymentPipelineCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <DeploymentPipeline stages={STAGES} label="Production deploy pipeline" />
    </div>
  );
}

export default DeploymentPipelineCatalogPreview;
