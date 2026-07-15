"use client";

import * as React from "react";

import { DataRefreshState } from "@/registry/data/data-refresh-state";

/**
 * Compact catalog adapter (docs/55 §7). One settled "Updated" panel — the rich
 * success state with the record count readout, source, and last-updated info —
 * no Start/Fail/Offline/Pause controls and no mode switch. Deterministic static
 * timestamps so server + first client render match.
 */

const NOW = 1_700_000_000_000;

export function DataRefreshStateCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <DataRefreshState
        mode="panel"
        state="success"
        label="Growth overview"
        source="Warehouse · replica-2"
        lastUpdated={NOW - 5 * 60_000}
        updatedCount={200}
        totalCount={200}
        now={NOW}
      />
    </div>
  );
}

export default DataRefreshStateCatalogPreview;
