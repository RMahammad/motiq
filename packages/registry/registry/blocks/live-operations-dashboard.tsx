"use client";

import * as React from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, statusVars, type StatusTone } from "@/lib/motionkit";

import { KpiNumberMorph } from "@/components/motionkit/kpi-number-morph";
import {
  DataRefreshState,
  type RefreshState,
} from "@/components/motionkit/data-refresh-state";
import {
  FilterResultTransition,
  type ActiveFilter,
  type FilterResultState,
} from "@/components/motionkit/filter-result-transition";
import {
  StreamingDataRows,
  type Column,
  type StreamingTableState,
} from "@/components/motionkit/streaming-data-rows";

/**
 * LiveOperationsDashboard — a composed, app-controlled operations dashboard that
 * wires four presentation-only data-motion components together behind a single
 * small demo state machine: a row of KpiNumberMorph stats with a DataRefreshState
 * control in the header, a FilterResultTransition service grid, and a
 * StreamingDataRows table as the main live feed.
 *
 * IMPORTANT — DEMO ONLY. Nothing here talks to a real monitoring backend. Every
 * service, region, metric, and timestamp is fictional and provider-neutral. The
 * block only feeds the components a scripted set of dataset snapshots in response
 * to its own controls — it is a copy-paste starting point you rewire to your real
 * telemetry.
 *
 * Determinism: no `Date.now()` / `Math.random()` / `new Date()` runs during
 * render, initializers, or module scope. Every snapshot is derived from a fixed
 * baseline with a pure wobble function; timestamps derive from a fixed baseline;
 * the demo only advances inside handlers/timers. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type ServiceCategory = "api" | "web" | "worker" | "data";
export type ServiceStatus = "operational" | "degraded" | "down";

export interface OpsService {
  /** Stable identity — the key to smooth insert / update / resort. */
  id: string;
  name: string;
  region: string;
  category: ServiceCategory;
  status: ServiceStatus;
  /** Requests per minute. */
  rpm: number;
  /** p95 latency in milliseconds. */
  p95: number;
  /** Error rate as a percentage (e.g. 0.42 = 0.42%). */
  errorRate: number;
  /** Active sessions on this service. */
  sessions: number;
}

/** The demo lifecycle the block owns and maps onto the four components. */
type Phase =
  | "loading"
  | "live"
  | "refreshing"
  | "partial"
  | "stale"
  | "error"
  | "recovery";

export interface LiveOperationsDashboardProps {
  /** Baseline services (the app owns this data). Snapshots derive from it. */
  services?: OpsService[];
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Fixed, deterministic demo data                                              */
/* -------------------------------------------------------------------------- */

// A fixed baseline so the server-rendered first paint is deterministic. Handlers
// advance from here — never wall-clock now().
const BASE_TS = 1_700_000_000_000;
const NOW = BASE_TS + 6 * 60 * 1000; // stable reference "now" (6m after baseline)
const REFRESH_INTERVAL = 30_000;

const DEFAULT_SERVICES: OpsService[] = [
  { id: "svc-checkout", name: "Checkout API", region: "us-east-1", category: "api", status: "operational", rpm: 18240, p95: 128, errorRate: 0.34, sessions: 4120 },
  { id: "svc-auth", name: "Auth Service", region: "us-east-1", category: "api", status: "operational", rpm: 9860, p95: 92, errorRate: 0.12, sessions: 6740 },
  { id: "svc-search", name: "Search API", region: "eu-west-1", category: "api", status: "degraded", rpm: 12420, p95: 246, errorRate: 2.10, sessions: 3010 },
  { id: "svc-storefront", name: "Web Storefront", region: "global", category: "web", status: "operational", rpm: 30150, p95: 74, errorRate: 0.08, sessions: 18900 },
  { id: "svc-cdn", name: "CDN Edge", region: "global", category: "web", status: "operational", rpm: 51200, p95: 38, errorRate: 0.02, sessions: 22400 },
  { id: "svc-payments", name: "Payments Worker", region: "us-east-1", category: "worker", status: "operational", rpm: 4210, p95: 310, errorRate: 0.66, sessions: 0 },
  { id: "svc-email", name: "Email Worker", region: "eu-west-1", category: "worker", status: "operational", rpm: 1980, p95: 420, errorRate: 0.48, sessions: 0 },
  { id: "svc-analytics", name: "Analytics Pipeline", region: "us-west-2", category: "data", status: "operational", rpm: 7640, p95: 540, errorRate: 0.90, sessions: 0 },
];

/** Deterministic small signed offset in [-span, span] from stable indices. */
function wobble(i: number, k: number, span: number): number {
  const period = 2 * span + 1;
  return (((i * 31 + k * 17 + 7) % period) + period) % period - span;
}

function statusFor(errorRate: number): ServiceStatus {
  if (errorRate > 5) return "down";
  if (errorRate > 1.5) return "degraded";
  return "operational";
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A pure dataset snapshot: nudges each service's metrics by a deterministic
 * wobble so refreshing produces visible morphs. `subset` limits the change to a
 * few rows (partial update); untouched rows are returned unchanged.
 */
function snapshotAt(base: OpsService[], k: number, subset?: (i: number) => boolean): OpsService[] {
  return base.map((r, i) => {
    if (subset && !subset(i)) return r;
    const rpm = Math.max(0, Math.round(r.rpm + wobble(i, k, 4) * Math.max(1, Math.round(r.rpm * 0.035))));
    const p95 = Math.max(12, r.p95 + wobble(i, k + 3, 3) * 6);
    const errorRate = Math.max(0, round2(r.errorRate + wobble(i, k + 5, 3) * 0.28));
    const sessions = Math.max(0, r.sessions + (r.sessions > 0 ? wobble(i, k + 1, 5) * 12 : 0));
    return { ...r, rpm, p95, errorRate, sessions, status: statusFor(errorRate) };
  });
}

/* -------------------------------------------------------------------------- */
/* Aggregates + KPI change                                                     */
/* -------------------------------------------------------------------------- */

interface Aggregate {
  rpm: number;
  p95: number;
  errorRate: number;
  sessions: number;
}

function aggregate(rows: OpsService[]): Aggregate {
  if (rows.length === 0) return { rpm: 0, p95: 0, errorRate: 0, sessions: 0 };
  const rpm = rows.reduce((s, r) => s + r.rpm, 0);
  const sessions = rows.reduce((s, r) => s + r.sessions, 0);
  const p95 = Math.round(rows.reduce((s, r) => s + r.p95, 0) / rows.length);
  // Traffic-weighted error rate — the metric an operator actually watches.
  const weighted = rows.reduce((s, r) => s + r.errorRate * r.rpm, 0);
  const errorRate = rpm > 0 ? round2(weighted / rpm) : 0;
  return { rpm, p95, errorRate, sessions };
}

/* -------------------------------------------------------------------------- */
/* Filter facets                                                               */
/* -------------------------------------------------------------------------- */

interface FacetDef {
  id: string;
  group: string;
  label: string;
  test: (r: OpsService) => boolean;
}

const FACETS: FacetDef[] = [
  { id: "type-api", group: "Type", label: "API", test: (r) => r.category === "api" },
  { id: "type-web", group: "Type", label: "Web", test: (r) => r.category === "web" },
  { id: "type-worker", group: "Type", label: "Workers", test: (r) => r.category === "worker" },
  { id: "type-data", group: "Type", label: "Data", test: (r) => r.category === "data" },
  { id: "status-degraded", group: "Status", label: "Degraded", test: (r) => r.status === "degraded" },
  { id: "status-down", group: "Status", label: "Down", test: (r) => r.status === "down" },
];

const FACET_BY_ID = new Map(FACETS.map((f) => [f.id, f]));

/** Within a facet group → OR; across groups → AND (the usual faceted-search rule). */
function applyFilters(rows: OpsService[], activeIds: string[]): OpsService[] {
  if (activeIds.length === 0) return rows;
  const groups = new Map<string, FacetDef[]>();
  for (const id of activeIds) {
    const f = FACET_BY_ID.get(id);
    if (!f) continue;
    const arr = groups.get(f.group) ?? [];
    arr.push(f);
    groups.set(f.group, arr);
  }
  return rows.filter((r) =>
    Array.from(groups.values()).every((defs) => defs.some((d) => d.test(r))),
  );
}

/* -------------------------------------------------------------------------- */
/* Small presentational bits                                                   */
/* -------------------------------------------------------------------------- */

const STATUS_TONE: Record<ServiceStatus, StatusTone> = {
  operational: "success",
  degraded: "warning",
  down: "error",
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
};

/** Tone conveyed by a distinct glyph + label, never color alone. */
function StatusBadge({ status }: { status: ServiceStatus }) {
  const tone = STATUS_TONE[status];
  const vars = statusVars(tone);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap"
      style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
    >
      <span aria-hidden className="shrink-0">
        {status === "operational" ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5 5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : status === "degraded" ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1.5 11 10.5H1z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )}
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  api: "API",
  web: "Web",
  worker: "Worker",
  data: "Data",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const controlBtn = cn(
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
  "px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[var(--color-border)] disabled:hover:text-[var(--color-fg)]",
  focusRing,
);

function fmtRpm(n: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/* -------------------------------------------------------------------------- */
/* Main block                                                                   */
/* -------------------------------------------------------------------------- */

export function LiveOperationsDashboard({
  services = DEFAULT_SERVICES,
  className,
}: LiveOperationsDashboardProps) {
  const reduce = useReducedMotion();

  // The baseline snapshot the demo starts from and derives every other from.
  const base = React.useMemo(() => services, [services]);

  /* --- demo state machine ------------------------------------------------ */
  // Default first paint: settled live data so the dashboard reads richly.
  const [phase, setPhase] = React.useState<Phase>("live");
  const [data, setData] = React.useState<OpsService[]>(() => base);
  // Mirrors `data` so deferred timers read the committed snapshot, not a stale
  // closure — without nesting one setState inside another.
  const dataRef = React.useRef<OpsService[]>(base);
  // A prior snapshot so the very first paint already shows meaningful KPI deltas.
  const [prevData, setPrevData] = React.useState<OpsService[]>(() => snapshotAt(base, 7));
  const [syncCount, setSyncCount] = React.useState(1);
  const [lastUpdated, setLastUpdated] = React.useState<number>(BASE_TS);
  const [updatedRows, setUpdatedRows] = React.useState<number>(base.length);

  // Keep `data`/`prevData` anchored to the current baseline if the app swaps it.
  React.useEffect(() => {
    setData(base);
    dataRef.current = base;
    setPrevData(snapshotAt(base, 7));
    setSyncCount(1);
    setPhase("live");
    setLastUpdated(BASE_TS);
    setUpdatedRows(base.length);
  }, [base]);

  /* --- timers ------------------------------------------------------------ */
  const timers = React.useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const clearTimers = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const later = React.useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  React.useEffect(() => () => clearTimers(), [clearTimers]);

  /* --- transitions ------------------------------------------------------- */
  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const commitSnapshot = React.useCallback(
    (current: OpsService[], next: OpsService[], changed: number) => {
      setPrevData(current);
      setData(next);
      dataRef.current = next;
      setUpdatedRows(changed);
      setLastUpdated(NOW);
    },
    [],
  );

  const handleRefresh = React.useCallback(() => {
    clearTimers();
    const k = syncCount + 1;
    setSyncCount(k);
    setUpdatedRows(base.length);
    setPhase("refreshing");
    later(() => {
      commitSnapshot(dataRef.current, snapshotAt(base, k), base.length);
      setPhase("live");
    }, 1250);
  }, [base, syncCount, clearTimers, later, commitSnapshot]);

  const handlePartial = React.useCallback(() => {
    clearTimers();
    const k = syncCount + 1;
    setSyncCount(k);
    const changed = base.filter((_, i) => i % 3 === 0).length;
    setUpdatedRows(changed);
    setPhase("refreshing");
    later(() => {
      const current = dataRef.current;
      commitSnapshot(current, snapshotAt(current, k, (i) => i % 3 === 0), changed);
      setPhase("partial");
    }, 1050);
  }, [base, syncCount, clearTimers, later, commitSnapshot]);

  const handleStale = React.useCallback(() => {
    clearTimers();
    setPhase("stale");
  }, [clearTimers]);

  const handleError = React.useCallback(() => {
    clearTimers();
    setPhase("error");
  }, [clearTimers]);

  const handleRecover = React.useCallback(() => {
    clearTimers();
    const k = syncCount + 1;
    setSyncCount(k);
    setUpdatedRows(base.length);
    setPhase("refreshing");
    later(() => {
      commitSnapshot(dataRef.current, snapshotAt(base, k), base.length);
      setPhase("recovery");
      later(() => setPhase("live"), 1600);
    }, 1250);
  }, [base, syncCount, clearTimers, later, commitSnapshot]);

  const handleReload = React.useCallback(() => {
    clearTimers();
    setPhase("loading");
    later(() => {
      setData(base);
      dataRef.current = base;
      setPrevData(snapshotAt(base, 7));
      setSyncCount(1);
      setUpdatedRows(base.length);
      setLastUpdated(BASE_TS);
      setPhase("live");
    }, 1400);
  }, [base, clearTimers, later]);

  const handleCancel = React.useCallback(() => {
    clearTimers();
    setPhase(data.length ? "live" : "stale");
  }, [data.length, clearTimers]);

  const handleReset = React.useCallback(() => {
    clearTimers();
    setData(base);
    dataRef.current = base;
    setPrevData(snapshotAt(base, 7));
    setSyncCount(1);
    setUpdatedRows(base.length);
    setLastUpdated(BASE_TS);
    setPhase("live");
  }, [base, clearTimers]);

  /* --- filters ----------------------------------------------------------- */
  const [activeFilterIds, setActiveFilterIds] = React.useState<string[]>([]);
  const toggleFilter = React.useCallback((id: string) => {
    setActiveFilterIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }, []);
  const removeFilter = React.useCallback((f: ActiveFilter) => {
    setActiveFilterIds((ids) => ids.filter((x) => x !== f.id));
  }, []);
  const clearFilters = React.useCallback(() => setActiveFilterIds([]), []);

  const activeFilters: ActiveFilter[] = React.useMemo(
    () =>
      activeFilterIds
        .map((id) => FACET_BY_ID.get(id))
        .filter((f): f is FacetDef => !!f)
        .map((f) => ({ id: f.id, group: f.group, label: f.label })),
    [activeFilterIds],
  );

  /* --- derived views ----------------------------------------------------- */
  const isBusy = phase === "refreshing";
  const isLoading = phase === "loading";
  const isError = phase === "error";

  const filteredRows = React.useMemo(
    () => applyFilters(data, activeFilterIds),
    [data, activeFilterIds],
  );

  const agg = React.useMemo(() => aggregate(data), [data]);
  const prevAgg = React.useMemo(() => aggregate(prevData), [prevData]);

  const kpiState: "idle" | "loading" | "error" = isLoading ? "loading" : isError ? "error" : "idle";
  const filterState: FilterResultState = isLoading ? "loading" : isError ? "error" : "idle";
  const tableState: StreamingTableState = isLoading ? "loading" : isError ? "error" : "idle";
  // Freeze morphs while stale so the frozen dataset doesn't imply live movement.
  const tablePaused = phase === "stale";

  const refreshState: RefreshState = ((): RefreshState => {
    switch (phase) {
      case "loading":
        return "checking";
      case "refreshing":
        return "refreshing";
      case "partial":
        return "partially_updated";
      case "stale":
        return "stale";
      case "error":
        return "error";
      case "recovery":
        return "success";
      default:
        return "idle";
    }
  })();

  /* --- table columns ----------------------------------------------------- */
  const columns = React.useMemo<Column<OpsService>[]>(
    () => [
      {
        key: "name",
        header: "Service",
        value: (r) => r.name,
        render: (r) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-[var(--color-fg)]">{r.name}</span>
            <span className="text-[11.5px] text-[var(--color-muted)]">
              {CATEGORY_LABEL[r.category]} · {r.region}
            </span>
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        value: (r) => r.status,
        sortable: true,
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: "rpm",
        header: "Req/min",
        align: "end",
        sortable: true,
        numeric: true,
        value: (r) => r.rpm,
        format: fmtRpm,
      },
      {
        key: "p95",
        header: "p95",
        align: "end",
        sortable: true,
        numeric: true,
        value: (r) => r.p95,
        format: (n) => `${Math.round(n)} ms`,
      },
      {
        key: "errorRate",
        header: "Errors",
        align: "end",
        sortable: true,
        numeric: true,
        value: (r) => r.errorRate,
        format: (n) => `${n.toFixed(2)}%`,
      },
    ],
    [],
  );

  const getRowId = React.useCallback((r: OpsService) => r.id, []);

  /* --- filter toggle groups ---------------------------------------------- */
  const facetGroups = React.useMemo(() => {
    const groups: Record<string, FacetDef[]> = {};
    for (const f of FACETS) (groups[f.group] ??= []).push(f);
    return groups;
  }, []);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-[var(--color-fg)] shadow-[var(--shadow-md)] sm:p-4",
        className,
      )}
    >
      {/* Header: title + refresh control ------------------------------- */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 3 3 5-6" />
              </svg>
            </span>
            <span className="flex flex-col leading-tight">
              <span>Live Operations Dashboard</span>
              <span className="font-mono text-[11px] font-normal text-[var(--color-muted)]">acme-platform · production</span>
            </span>
          </span>

          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
            Demo data
          </span>
        </div>

        <DataRefreshState
          mode="inline"
          state={refreshState}
          label="Platform metrics"
          source="Metrics warehouse · replica-2"
          lastUpdated={lastUpdated}
          nextRefresh={NOW + REFRESH_INTERVAL}
          now={NOW}
          updatedCount={updatedRows}
          totalCount={data.length}
          staleness="6m behind live"
          errorSummary="Upstream metrics endpoint timed out (504)."
          onRefresh={handleRefresh}
          onRetry={handleRecover}
          onCancel={handleCancel}
        />
      </div>

      {/* KPI row -------------------------------------------------------- */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiNumberMorph
          label="Requests / min"
          value={agg.rpm}
          notation="compact"
          change={agg.rpm - prevAgg.rpm}
          changeLabel="vs last sync"
          state={kpiState}
        />
        <KpiNumberMorph
          label="p95 latency"
          value={agg.p95}
          suffix=" ms"
          change={agg.p95 - prevAgg.p95}
          changeLabel="vs last sync"
          state={kpiState}
        />
        <KpiNumberMorph
          label="Error rate"
          value={agg.errorRate}
          suffix="%"
          decimals={2}
          change={round2(agg.errorRate - prevAgg.errorRate)}
          changeAsPercent
          changeLabel="vs last sync"
          state={kpiState}
        />
        <KpiNumberMorph
          label="Active sessions"
          value={agg.sessions}
          notation="compact"
          change={agg.sessions - prevAgg.sessions}
          changeLabel="vs last sync"
          state={kpiState}
        />
      </div>

      {/* Filters + result grid ----------------------------------------- */}
      <section aria-label="Service filters" className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-3.5">
        <div className="mb-3 flex flex-col gap-2">
          {Object.entries(facetGroups).map(([group, defs]) => (
            <div key={group} className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Filter by ${group}`}>
              <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{group}</span>
              {defs.map((f) => {
                const on = activeFilterIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleFilter(f.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
                      focusRing,
                      on
                        ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]"
                        : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)] hover:border-[var(--color-accent)]",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <FilterResultTransition<OpsService>
          items={filteredRows}
          getItemId={getRowId}
          layout="grid"
          state={filterState}
          regionLabel="Matching services"
          activeFilters={activeFilters}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
          error="Couldn't load services — the metrics endpoint is unavailable."
          onRetry={handleRecover}
          resultLabel={(n) => (
            <>
              <span className="tabular-nums [font-variant-numeric:tabular-nums]">{n}</span>{" "}
              {n === 1 ? "service matches" : "services match"}
            </>
          )}
          renderItem={(r) => (
            <div className="flex h-full flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-[var(--color-fg)]">{r.name}</span>
                  <span className="block text-[11.5px] text-[var(--color-muted)]">{CATEGORY_LABEL[r.category]} · {r.region}</span>
                </span>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-auto flex items-end justify-between gap-2">
                <span className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Req/min</span>
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--color-fg)]">{fmtRpm(r.rpm)}</span>
                </span>
                <span className="flex flex-col text-right">
                  <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">Errors</span>
                  <span className="text-[15px] font-semibold tabular-nums text-[var(--color-fg)]">{r.errorRate.toFixed(2)}%</span>
                </span>
              </div>
            </div>
          )}
        />
      </section>

      {/* Main live feed ------------------------------------------------- */}
      <section aria-label="Live service feed" className="mt-3">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Live feed</h3>
          <span className="inline-flex items-center gap-1 font-mono text-[11.5px] text-[var(--color-muted)]">
            <span className="relative grid h-2 w-2 place-items-center" aria-hidden>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background: isError
                    ? "var(--color-error)"
                    : phase === "stale"
                      ? "var(--color-warning)"
                      : isBusy
                        ? "var(--color-accent)"
                        : "var(--color-success)",
                }}
              />
              {isBusy && !reduce ? (
                <motion.span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                  initial={{ opacity: 0.55, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.6 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
            </span>
            {filteredRows.length} of {data.length} services
          </span>
        </div>

        <StreamingDataRows<OpsService>
          rows={filteredRows}
          columns={columns}
          getRowId={getRowId}
          state={tableState}
          paused={tablePaused}
          defaultSort={{ key: "rpm", dir: "desc" }}
          caption="Live operational metrics per service"
          onRetry={handleRecover}
          emptyContent="No services match these filters."
          errorContent="Live feed unavailable — the metrics endpoint timed out."
          renderMobileRow={(r) => (
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-[var(--color-fg)]">{r.name}</span>
                  <span className="block text-[11.5px] text-[var(--color-muted)]">{CATEGORY_LABEL[r.category]} · {r.region}</span>
                </span>
                <StatusBadge status={r.status} />
              </div>
              <dl className="grid grid-cols-3 gap-2 text-[12.5px]">
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wide text-[var(--color-muted)]">Req/min</dt>
                  <dd className="font-semibold tabular-nums text-[var(--color-fg)]">{fmtRpm(r.rpm)}</dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wide text-[var(--color-muted)]">p95</dt>
                  <dd className="font-semibold tabular-nums text-[var(--color-fg)]">{Math.round(r.p95)} ms</dd>
                </div>
                <div>
                  <dt className="text-[10.5px] uppercase tracking-wide text-[var(--color-muted)]">Errors</dt>
                  <dd className="font-semibold tabular-nums text-[var(--color-fg)]">{r.errorRate.toFixed(2)}%</dd>
                </div>
              </dl>
            </div>
          )}
        />
      </section>

      {/* Demo controls + note ------------------------------------------ */}
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Demo controls">
          <button type="button" className={controlBtn} onClick={handleReload} disabled={isBusy || isLoading}>
            Initial loading
          </button>
          <button type="button" className={controlBtn} onClick={handleRefresh} disabled={isBusy || isLoading}>
            Refresh
          </button>
          <button type="button" className={controlBtn} onClick={handlePartial} disabled={isBusy || isLoading}>
            Partial update
          </button>
          <button type="button" className={controlBtn} onClick={handleStale} disabled={isBusy || isLoading}>
            Mark stale
          </button>
          <button type="button" className={controlBtn} onClick={handleError} disabled={isBusy || isLoading}>
            Simulate error
          </button>
          <button type="button" className={controlBtn} onClick={handleRecover} disabled={isBusy || isLoading}>
            Recover
          </button>
          <button type="button" className={controlBtn} onClick={handleReset}>
            Reset
          </button>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
          Demo data — fictional services, no live backend
        </span>
      </div>
    </div>
  );
}

export default LiveOperationsDashboard;
