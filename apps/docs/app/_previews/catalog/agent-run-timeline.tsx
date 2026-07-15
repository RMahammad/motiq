"use client";

import * as React from "react";

import { AgentRunTimeline, type AgentRun } from "@/registry/ai/agent-run-timeline";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL AgentRunTimeline in one
 * representative in-flight state — two completed steps, one active — trimmed to
 * 4 steps, with no Start/Complete/Fail/Approve/Reset controls and static
 * timestamps. The detail page keeps the full interactive rig.
 */

const T0 = 1_720_000_000_000;

const RUN: AgentRun = {
  title: "Apply database migration · v15",
  status: "running",
  startedAt: T0,
  currentStepId: "s3",
  steps: [
    {
      id: "s1",
      title: "Inspect repository",
      description: "Scan the working tree and detect the project layout.",
      status: "completed",
      startedAt: T0,
      endedAt: T0 + 1_800,
      durationMs: 1_800,
      toolCall: { name: "repo.scan" },
      summary: "214 files scanned across 4 packages.",
    },
    {
      id: "s2",
      title: "Read configuration",
      description: "Load the database and environment configuration.",
      status: "completed",
      startedAt: T0 + 1_900,
      endedAt: T0 + 2_500,
      durationMs: 600,
      toolCall: { name: "config.read" },
    },
    {
      id: "s3",
      title: "Generate migration proposal",
      description: "Draft an ordered, reversible migration plan.",
      status: "active",
      startedAt: T0 + 2_600,
      attempts: 1,
      toolCall: { name: "migrate.plan" },
    },
    {
      id: "s4",
      title: "Run validation",
      description: "Dry-run the plan against a shadow database.",
      status: "pending",
      toolCall: { name: "validate.run" },
    },
  ],
};

export function AgentRunTimelineCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <AgentRunTimeline run={RUN} compactCompleted followActive={false} />
    </div>
  );
}

export default AgentRunTimelineCatalogPreview;
