"use client";

import * as React from "react";

import {
  DataQualityStatus,
  type QualityCheck,
  type DataQualityMetrics,
} from "@/registry/data/data-quality-status";

/* -------------------------------------------------------------------------- *
 * Fictional data-quality report for a made-up "Customer accounts" dataset. The
 * surrounding app owns every fact: the metrics, each check's verdict, the
 * affected counts, and the "last checked" time. Controls let you re-run a
 * simulated validation and inject a failure — the component only presents what
 * the app hands it, and shows "Unknown" for anything not measured.
 * -------------------------------------------------------------------------- */

// Deterministic base timestamp → server HTML matches the first client render.
const BASE_TS = 1_700_000_000_000;

const HEALTHY_CHECKS: QualityCheck[] = [
  { id: "nulls", label: "No null emails", state: "pass", summary: "0 nulls in 12,400 rows" },
  { id: "fmt", label: "Email format valid", state: "pass", summary: "All rows match RFC 5322" },
  {
    id: "dupes",
    label: "Unique customer IDs",
    state: "warning",
    summary: "3 duplicate keys found",
    affectedRecords: 3,
    issues: [
      { id: "d1", message: "Duplicate id CUS-1042", records: 2, location: "column: customer_id" },
      { id: "d2", message: "Duplicate id CUS-8890", records: 1, location: "column: customer_id" },
    ],
  },
  { id: "geo", label: "Region codes verified", state: "unknown", summary: "Reference table unavailable" },
];

const FAILING_CHECKS: QualityCheck[] = [
  HEALTHY_CHECKS[0],
  HEALTHY_CHECKS[1],
  HEALTHY_CHECKS[2],
  {
    id: "range",
    label: "Order totals within range",
    state: "failure",
    summary: "Negative totals detected",
    affectedRecords: 18,
    issues: [
      { id: "r1", message: "18 orders with a negative total", records: 18, location: "column: total_cents" },
      { id: "r2", message: "Lowest value −$412.00 (row 9,204)", location: "column: total_cents" },
    ],
  },
  HEALTHY_CHECKS[3],
];

// Accuracy is intentionally supplied only sometimes → the tile shows "Unknown"
// honestly when the app has no measurement.
const HEALTHY_METRICS: DataQualityMetrics = {
  freshness: { label: "18m behind", caption: "vs. source stream" },
  completeness: { score: 0.994, caption: "37 of 37 columns" },
  accuracy: { score: 0.981, caption: "rule set v4" },
};

const UNVERIFIED_METRICS: DataQualityMetrics = {
  freshness: { label: "18m behind", caption: "vs. source stream" },
  completeness: { score: 0.994, caption: "37 of 37 columns" },
  // accuracy omitted → "Unknown"
};

type Scenario = "healthy" | "failing" | "unverified";

export function DataQualityStatusPreview() {
  const [scenario, setScenario] = React.useState<Scenario>("healthy");
  const [validating, setValidating] = React.useState(false);
  const [lastChecked, setLastChecked] = React.useState<number>(BASE_TS - 5 * 60_000);
  const [now, setNow] = React.useState<number | undefined>(undefined);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Relative "last checked" becomes live only on the client (no hydration drift).
  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const checks = scenario === "failing" ? FAILING_CHECKS : HEALTHY_CHECKS;
  const metrics = scenario === "unverified" ? UNVERIFIED_METRICS : HEALTHY_METRICS;

  // Simulated re-validation — the app owns the (fake) run; the component only
  // reflects `validating` + the fresh timestamp when it settles.
  const runValidation = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setValidating(true);
    timer.current = setTimeout(() => {
      setValidating(false);
      setLastChecked(Date.now());
    }, 1400);
  }, []);

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-4">
      <div className="flex flex-col items-center">
        <DataQualityStatus
          label="Customer accounts"
          source="Warehouse · public.customers"
          metrics={metrics}
          checks={checks}
          lastChecked={lastChecked}
          totalRecords={12400}
          now={now}
          validating={validating}
          onRetry={runValidation}
        />
      </div>

      {/* working controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
        <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Scenario</span>
        <Ctrl onClick={() => setScenario("healthy")} pressed={scenario === "healthy"}>Healthy</Ctrl>
        <Ctrl onClick={() => setScenario("failing")} pressed={scenario === "failing"}>Failing check</Ctrl>
        <Ctrl onClick={() => setScenario("unverified")} pressed={scenario === "unverified"}>Accuracy unknown</Ctrl>
        <span className="mx-1 h-4 w-px bg-[var(--color-border)]" aria-hidden />
        <Ctrl onClick={runValidation}>Re-run validation</Ctrl>
      </div>
      <p className="text-[12px] text-[var(--color-muted)]">
        Fictional demo data — the surrounding app supplies every metric and verdict; the component only presents them and
        shows &ldquo;Unknown&rdquo; for anything not measured.
      </p>
    </div>
  );
}

function Ctrl({ children, onClick, pressed }: { children: React.ReactNode; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] ${
        pressed
          ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
      }`}
    >
      {children}
    </button>
  );
}

export default DataQualityStatusPreview;
