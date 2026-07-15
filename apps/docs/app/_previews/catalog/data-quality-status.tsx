"use client";

import * as React from "react";

import {
  DataQualityStatus,
  type QualityCheck,
  type DataQualityMetrics,
} from "@/registry/data/data-quality-status";

/**
 * Compact catalog adapter (docs/55 §7). One settled quality report — headline
 * metrics + a trimmed check list including the honest "Unknown" state — with no
 * scenario switch and no re-run control (no onRetry → no footer button).
 * Deterministic static timestamps so server + first client render match.
 */

const NOW = 1_700_000_000_000;

const CHECKS: QualityCheck[] = [
  { id: "nulls", label: "No null emails", state: "pass", summary: "0 nulls in 12,400 rows" },
  { id: "fmt", label: "Email format valid", state: "pass", summary: "All rows match RFC 5322" },
  {
    id: "dupes",
    label: "Unique customer IDs",
    state: "warning",
    summary: "3 duplicate keys found",
    affectedRecords: 3,
  },
  { id: "geo", label: "Region codes verified", state: "unknown", summary: "Reference table unavailable" },
];

const METRICS: DataQualityMetrics = {
  freshness: { label: "18m behind", caption: "vs. source stream" },
  completeness: { score: 0.994, caption: "37 of 37 columns" },
  accuracy: { score: 0.981, caption: "rule set v4" },
};

export function DataQualityStatusCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[520px]">
      <DataQualityStatus
        label="Customer accounts"
        source="Warehouse · public.customers"
        metrics={METRICS}
        checks={CHECKS}
        lastChecked={NOW - 5 * 60_000}
        totalRecords={12400}
        now={NOW}
      />
    </div>
  );
}

export default DataQualityStatusCatalogPreview;
