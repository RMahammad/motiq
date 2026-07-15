"use client";

import * as React from "react";

import { ToolCallActivity, type ToolCall } from "@/registry/ai/tool-call-activity";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ToolCallActivity in one
 * representative live state — two completed calls compressed, one running, one
 * awaiting approval — with no Add/Complete/Fail/Reset controls and static
 * timestamps. The detail page keeps the full interactive rig.
 */

const T0 = 1_720_000_000_000;

const CALLS: ToolCall[] = [
  {
    id: "c1",
    name: "Searching project documentation",
    category: "search",
    status: "completed",
    startedAt: T0,
    durationMs: 1840,
    output: { matches: 12, top: "docs/caching.md#swr" },
  },
  {
    id: "c2",
    name: "Reading a configuration file",
    category: "read",
    status: "completed",
    startedAt: T0 + 1900,
    durationMs: 640,
    output: { lines: 84, exports: ["default"] },
  },
  {
    id: "c3",
    name: "Generating a migration plan",
    category: "code",
    status: "running",
    startedAt: T0 + 2600,
    progress: 0.62,
  },
  {
    id: "c4",
    name: "Deploying to the staging environment",
    category: "approval",
    status: "waiting_approval",
    startedAt: T0 + 3200,
  },
];

export function ToolCallActivityCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <ToolCallActivity calls={CALLS} title="Agent activity" compactCompleted showDurations />
    </div>
  );
}

export default ToolCallActivityCatalogPreview;
