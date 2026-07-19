"use client";

import * as React from "react";

import { LiveOperationsDashboard } from "@/registry/blocks/live-operations-dashboard";

/**
 * Compact catalog adapter (docs/55). Renders the REAL LiveOperationsDashboard
 * block in its default populated "live" state — KPIs, faceted service table,
 * and status all read richly. Full-width block layout; no extra external
 * controls. Provider-neutral fictional telemetry data.
 */

export function LiveOperationsDashboardCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[980px]">
      <LiveOperationsDashboard />
    </div>
  );
}

export default LiveOperationsDashboardCatalogPreview;
