"use client";

import * as React from "react";

import { LiveOperationsDashboard } from "@/registry/blocks/live-operations-dashboard";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a composed operations dashboard block. Every service, region,
 * metric, and timestamp is fictional and provider-neutral; there is NO real
 * telemetry backend here. The block owns a small scripted state machine and
 * only feeds the four presentation-only data-motion components.
 * ---------------------------------------------------------------------- */

export function LiveOperationsDashboardPreview() {
  return (
    <div className="w-full max-w-[1080px]">
      <LiveOperationsDashboard />
    </div>
  );
}

export default LiveOperationsDashboardPreview;
