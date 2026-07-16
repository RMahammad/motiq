"use client";

import * as React from "react";

import {
  DataRefreshState,
  type RefreshState,
  type RefreshMode,
} from "@/registry/data/data-refresh-state";
import { ControlBar, ControlButton, ControlToggle, ControlSegmented } from "../_components/preview-controls";

/* -------------------------------------------------------------------------- *
 * Analytics dashboard shell. A small fictional metrics strip is driven by the
 * refresh state: values freshen when a refresh completes, dim while stale, and
 * hold while offline. All data is illustrative demo data. The app owns the
 * (simulated) fetch + progress — the component never fakes it.
 * -------------------------------------------------------------------------- */

interface Metric {
  key: string;
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

// Deterministic initial snapshot → server HTML matches the first client render.
const BASE_TS = 1_700_000_000_000;
const INITIAL_METRICS: Metric[] = [
  { key: "rev", label: "Revenue", value: "$48.2k", delta: "+6.4%", up: true },
  { key: "active", label: "Active users", value: "1,204", delta: "+3.1%", up: true },
  { key: "conv", label: "Conversion", value: "3.8%", delta: "-0.2%", up: false },
  { key: "latency", label: "p95 latency", value: "218ms", delta: "-12ms", up: true },
];

// Alternate snapshots cycled through on each successful refresh (demo only).
const SNAPSHOTS: Metric[][] = [
  INITIAL_METRICS,
  [
    { key: "rev", label: "Revenue", value: "$49.7k", delta: "+9.1%", up: true },
    { key: "active", label: "Active users", value: "1,271", delta: "+5.6%", up: true },
    { key: "conv", label: "Conversion", value: "4.1%", delta: "+0.3%", up: true },
    { key: "latency", label: "p95 latency", value: "204ms", delta: "-14ms", up: true },
  ],
  [
    { key: "rev", label: "Revenue", value: "$47.1k", delta: "-2.3%", up: false },
    { key: "active", label: "Active users", value: "1,188", delta: "-1.3%", up: false },
    { key: "conv", label: "Conversion", value: "3.6%", delta: "-0.2%", up: false },
    { key: "latency", label: "p95 latency", value: "233ms", delta: "+15ms", up: false },
  ],
];

const INTERVAL_OPTIONS = [15000, 30000, 60000, 300000];

export function DataRefreshStatePreview() {
  const [state, setState] = React.useState<RefreshState>("idle");
  const [mode, setMode] = React.useState<RefreshMode>("panel");
  const [metrics, setMetrics] = React.useState<Metric[]>(INITIAL_METRICS);
  const [lastUpdated, setLastUpdated] = React.useState<number>(BASE_TS);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [updatedCount, setUpdatedCount] = React.useState<number>(200);
  const [automatic, setAutomatic] = React.useState<boolean>(true);
  const [interval, setInterval] = React.useState<number>(30000);
  const [now, setNow] = React.useState<number | undefined>(undefined);
  const snap = React.useRef(0);
  const timers = React.useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // Relative timestamps become live only on the client (avoids hydration drift).
  React.useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);

  const after = (ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  /* --- simulated refresh the app owns ----------------------------------- */
  const startRefresh = React.useCallback(() => {
    clearTimers();
    setState("checking");
    setProgress(null);
    setUpdatedCount(0);
    after(650, () => {
      setState("refreshing");
      setProgress(0.12);
      setUpdatedCount(30);
    });
    after(1300, () => {
      setProgress(0.55);
      setUpdatedCount(120);
    });
    after(2000, () => {
      setProgress(0.86);
      setUpdatedCount(184);
    });
    after(2500, () => {
      snap.current = (snap.current + 1) % SNAPSHOTS.length;
      setMetrics(SNAPSHOTS[snap.current]);
      setUpdatedCount(200);
      setProgress(1);
      setLastUpdated(Date.now());
      setState("success");
      after(2600, () => setState((s) => (s === "success" ? "idle" : s)));
    });
  }, [clearTimers]);

  const setPartial = () => {
    clearTimers();
    snap.current = (snap.current + 1) % SNAPSHOTS.length;
    setMetrics(SNAPSHOTS[snap.current]);
    setUpdatedCount(142);
    setProgress(0.71);
    setLastUpdated(Date.now());
    setState("partially_updated");
  };
  const complete = () => {
    clearTimers();
    setUpdatedCount(200);
    setProgress(1);
    setLastUpdated(Date.now());
    setState("success");
    after(2600, () => setState((s) => (s === "success" ? "idle" : s)));
  };
  const fail = () => {
    clearTimers();
    setState("error");
  };
  const goOffline = () => {
    clearTimers();
    setState("offline");
  };
  const markStale = () => {
    clearTimers();
    setState("stale");
  };
  const pauseAuto = () => {
    clearTimers();
    setAutomatic(true);
    setState("paused");
  };
  const resumeAuto = () => {
    setState("idle");
  };
  const retry = () => startRefresh();
  const reset = () => {
    clearTimers();
    snap.current = 0;
    setMetrics(INITIAL_METRICS);
    setLastUpdated(BASE_TS);
    setUpdatedCount(200);
    setProgress(null);
    setAutomatic(true);
    setState("idle");
  };

  const dimmed = state === "stale" || state === "offline" || state === "error";

  return (
    <div className="flex w-full max-w-[880px] flex-col gap-4">
      {/* dashboard header */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--color-fg)]">Growth overview</h3>
            <p className="text-[12px] text-[var(--color-muted)]">Fictional analytics workspace · demo data</p>
          </div>
          {/* compact refresh state lives in the dashboard toolbar */}
          <DataRefreshState
            mode="compact"
            state={state}
            label="Growth overview"
            lastUpdated={lastUpdated}
            progress={progress}
            now={now}
            onRefresh={startRefresh}
            onCancel={reset}
            onRetry={retry}
            onResume={resumeAuto}
          />
        </div>

        {/* metrics strip */}
        <div
          className="grid grid-cols-2 gap-px bg-[var(--color-border)] sm:grid-cols-4"
          style={{ opacity: dimmed ? 0.55 : 1, transition: "opacity 200ms ease" }}
          aria-hidden={false}
        >
          {metrics.map((m) => (
            <div key={m.key} className="bg-[var(--color-surface)] px-4 py-3">
              <p className="text-[11.5px] uppercase tracking-wide text-[var(--color-muted)]">{m.label}</p>
              <p className="mt-1 text-[19px] font-semibold tabular-nums text-[var(--color-fg)]">{m.value}</p>
              <p
                className="mt-0.5 text-[12px] font-medium tabular-nums"
                style={{ color: m.up ? "var(--color-success)" : "var(--color-warning)" }}
              >
                {m.up ? "▲" : "▼"} {m.delta}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* the component under test — dominates its own panel */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
        <DataRefreshState
          mode={mode}
          state={state}
          label="Growth overview"
          source="Warehouse · replica-2"
          lastUpdated={lastUpdated}
          nextRefresh={now != null ? now + interval : undefined}
          progress={progress}
          updatedCount={updatedCount}
          totalCount={200}
          staleness="18m behind live"
          connection="Reconnecting to warehouse…"
          errorSummary="Query gateway timed out after 30s."
          automatic={automatic}
          interval={interval}
          intervalOptions={INTERVAL_OPTIONS}
          now={now}
          onRefresh={startRefresh}
          onCancel={reset}
          onRetry={retry}
          onPause={pauseAuto}
          onResume={resumeAuto}
          onIntervalChange={setInterval}
          onDismiss={() => setState("idle")}
          onViewDetails={() => {}}
        />

        {/* mode switch */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Mode</span>
          <ControlSegmented
            label="Display mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "panel", label: "Panel" },
              { value: "inline", label: "Inline" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </div>
      </div>

      {/* working controls */}
      <ControlBar>
        <ControlButton onClick={startRefresh}>Start refresh</ControlButton>
        <ControlButton onClick={setPartial}>Set partial</ControlButton>
        <ControlButton onClick={complete}>Complete</ControlButton>
        <ControlButton onClick={fail}>Fail</ControlButton>
        <ControlButton onClick={goOffline}>Go offline</ControlButton>
        <ControlButton onClick={markStale}>Mark stale</ControlButton>
        <ControlToggle pressed={state === "paused"} onClick={pauseAuto}>Pause auto refresh</ControlToggle>
        <ControlButton onClick={retry}>Retry</ControlButton>
        <ControlButton onClick={reset}>Reset</ControlButton>
      </ControlBar>
      <p className="text-[12px] text-[var(--color-muted)]">
        Demo data — the surrounding app simulates the fetch and reports progress; the component only presents state.
      </p>
    </div>
  );
}

