"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  statusVars,
  type StatusTone,
} from "@/lib/motionstack";

import { KpiNumberMorph } from "@/components/motionstack/kpi-number-morph";
import {
  DataRefreshState,
  type RefreshState,
} from "@/components/motionstack/data-refresh-state";
import {
  StreamingDataRows,
  type Column,
  type StreamingTableState,
} from "@/components/motionstack/streaming-data-rows";
import {
  FilterResultTransition,
  type ActiveFilter,
  type FilterResultState,
} from "@/components/motionstack/filter-result-transition";

/**
 * LiveDataCommandHero — an editable hero block for operational-data products.
 * Instead of a static KPI screenshot, the hero puts a *live surface* next to the
 * outcome copy: three morphing KPIs, the current refresh state, a small live
 * subset of signals, and one active filter — all driven by a single phase the
 * app owns. The point is continuity and changing state over time, at reduced
 * complexity: it is a hero framing, not a full analytics dashboard.
 *
 * IMPORTANT — DEMO ONLY. Every signal, region, metric, and timestamp below is
 * fictional and provider-neutral; nothing here talks to a real backend. Rewire
 * `dataset` and `phase` to your own telemetry.
 *
 * Determinism: no `Date.now()` / `Math.random()` / `new Date()` at module scope,
 * during render, or in initializers. Every snapshot derives from a fixed baseline
 * via a pure wobble; timestamps come from fixed epoch constants; the only motion
 * over time is a client-only "live" tick that pauses offscreen and under reduced
 * motion. Server and first client render are identical. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Public types                                                                */
/* -------------------------------------------------------------------------- */

/** The lifecycle the host application drives; the block maps it onto the surface. */
export type DataHeroPhase =
  | "initial"
  | "live"
  | "filtering"
  | "refreshing"
  | "partial-update"
  | "stale"
  | "error"
  | "recovery";

export type SignalStatus = "healthy" | "degraded" | "critical";

export interface HeroSignal {
  /** Stable identity — the key to smooth insert / update / resort. */
  id: string;
  name: string;
  region: string;
  /** Priority band; the demo filter narrows to tier-1. */
  tier: "tier-1" | "tier-2";
  status: SignalStatus;
  /** Events per minute. */
  throughput: number;
  /** p95 latency in milliseconds. */
  latency: number;
  /** Error rate as a percentage (0.34 = 0.34%). */
  errorRate: number;
}

/** A hero call to action. Renders as a link when `href` is set, else a button. */
export interface HeroCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface LiveDataCommandHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Outcome headline (a real heading). */
  headline?: React.ReactNode;
  /** Supporting copy under the headline. */
  copy?: React.ReactNode;
  /** Small label above the headline. */
  eyebrow?: React.ReactNode;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;

  /** Controlled lifecycle phase. */
  phase?: DataHeroPhase;
  /** Initial phase when uncontrolled. */
  defaultPhase?: DataHeroPhase;
  onPhaseChange?: (phase: DataHeroPhase) => void;

  /** The baseline signals (the app owns this). Snapshots derive from it. */
  dataset?: HeroSignal[];

  /** Decorative background slot rendered behind the hero (not imported here). */
  background?: React.ReactNode;

  /** Force the static, reduced-motion presentation. */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Fixed, deterministic demo data                                              */
/* -------------------------------------------------------------------------- */

// Fixed epoch anchors so the server-rendered first paint is deterministic. The
// live tick advances motion only — never wall-clock now().
const BASE_TS = 1_700_000_000_000;
const NOW = BASE_TS + 4 * 60 * 1000; // stable reference "now" (4m after baseline)
const REFRESH_INTERVAL = 20_000;
const LIVE_TICK_MS = 2600;

const DEFAULT_DATASET: HeroSignal[] = [
  { id: "sig-ingest", name: "Ingest Gateway", region: "us-east", tier: "tier-1", status: "healthy", throughput: 42600, latency: 84, errorRate: 0.12 },
  { id: "sig-stream", name: "Stream Processor", region: "us-east", tier: "tier-1", status: "healthy", throughput: 38100, latency: 132, errorRate: 0.34 },
  { id: "sig-index", name: "Index Builder", region: "eu-west", tier: "tier-2", status: "degraded", throughput: 15900, latency: 268, errorRate: 1.90 },
  { id: "sig-archive", name: "Cold Archive", region: "ap-south", tier: "tier-2", status: "healthy", throughput: 6300, latency: 410, errorRate: 0.08 },
];

// Each phase gets a distinct snapshot offset so switching phases produces a
// visible morph even without the ambient tick.
const PHASE_K: Record<DataHeroPhase, number> = {
  initial: 0,
  live: 0,
  filtering: 1,
  refreshing: 2,
  "partial-update": 3,
  stale: 4,
  error: 5,
  recovery: 6,
};

/** Deterministic small signed offset in [-span, span] from stable indices. */
function wobble(i: number, k: number, span: number): number {
  const period = 2 * span + 1;
  return ((((i * 31 + k * 17 + 7) % period) + period) % period) - span;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function statusFor(errorRate: number): SignalStatus {
  if (errorRate > 5) return "critical";
  if (errorRate > 1.5) return "degraded";
  return "healthy";
}

/**
 * A pure snapshot: nudges each signal's metrics by a deterministic wobble so
 * refreshing produces visible morphs. `subset` limits the change to a few rows
 * (partial update); untouched rows are returned unchanged.
 */
function snapshotAt(base: HeroSignal[], k: number, subset?: (i: number) => boolean): HeroSignal[] {
  return base.map((r, i) => {
    if (subset && !subset(i)) return r;
    const throughput = Math.max(0, Math.round(r.throughput + wobble(i, k, 4) * Math.max(1, Math.round(r.throughput * 0.03))));
    const latency = Math.max(12, r.latency + wobble(i, k + 3, 3) * 6);
    const errorRate = Math.max(0, round2(r.errorRate + wobble(i, k + 5, 3) * 0.22));
    return { ...r, throughput, latency, errorRate, status: statusFor(errorRate) };
  });
}

interface Aggregate {
  throughput: number;
  latency: number;
  errorRate: number;
}

function aggregate(rows: HeroSignal[]): Aggregate {
  if (rows.length === 0) return { throughput: 0, latency: 0, errorRate: 0 };
  const throughput = rows.reduce((s, r) => s + r.throughput, 0);
  const latency = Math.round(rows.reduce((s, r) => s + r.latency, 0) / rows.length);
  // Throughput-weighted error rate — the number an operator actually watches.
  const weighted = rows.reduce((s, r) => s + r.errorRate * r.throughput, 0);
  const errorRate = throughput > 0 ? round2(weighted / throughput) : 0;
  return { throughput, latency, errorRate };
}

/* -------------------------------------------------------------------------- */
/* Status badge — tone via glyph + label, never color alone                    */
/* -------------------------------------------------------------------------- */

const STATUS_TONE: Record<SignalStatus, StatusTone> = {
  healthy: "success",
  degraded: "warning",
  critical: "error",
};

const STATUS_LABEL: Record<SignalStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  critical: "Critical",
};

function StatusBadge({ status }: { status: SignalStatus }) {
  const vars = statusVars(STATUS_TONE[status]);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{ color: vars.color, background: vars.bg, borderColor: vars.border }}
    >
      <span aria-hidden className="shrink-0">
        {status === "healthy" ? (
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

const fmtThroughput = (n: number): string =>
  new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

/* -------------------------------------------------------------------------- */
/* CTA rendering                                                               */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

function CtaLink({ cta, variant }: { cta: HeroCta; variant: "primary" | "secondary" }) {
  const className = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-colors",
    focusRing,
    variant === "primary"
      ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground,white)] shadow-[var(--shadow-sm)] hover:opacity-90"
      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
  );
  if (cta.href) {
    return (
      <a href={cta.href} onClick={cta.onClick} className={className}>
        {cta.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={cta.onClick} className={className}>
      {cta.label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Offscreen pause — keep continuous motion out of view idle                   */
/* -------------------------------------------------------------------------- */

function useInView<T extends Element>(ref: React.RefObject<T | null>): boolean {
  // Defaults to true so the very first paint (and any non-IO environment such as
  // jsdom/SSR) renders the surface as visible; the observer only narrows it.
  const [inView, setInView] = React.useState(true);
  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/* -------------------------------------------------------------------------- */
/* Main block                                                                   */
/* -------------------------------------------------------------------------- */

export function LiveDataCommandHero({
  headline = "See your data change the moment it does",
  copy = "A command surface for operational data — live metrics, refresh state, and streaming signals that morph in place, so your team reads change instead of chasing it.",
  eyebrow = "Operational data platform",
  primaryCta = { label: "Start monitoring" },
  secondaryCta = { label: "Book a walkthrough" },
  phase: phaseProp,
  defaultPhase = "live",
  onPhaseChange,
  dataset = DEFAULT_DATASET,
  background,
  reducedMotion,
  className,
  ...rest
}: LiveDataCommandHeroProps) {
  const systemReduce = useReducedMotion();
  const reduce = reducedMotion ?? systemReduce;

  const [phase] = useControllableState<DataHeroPhase>({
    value: phaseProp,
    defaultValue: defaultPhase,
    onChange: onPhaseChange,
  });

  const base = React.useMemo(() => dataset, [dataset]);

  /* --- ambient "live" tick: real continuity, paused offscreen / reduced ---- */
  const rootRef = React.useRef<HTMLElement | null>(null);
  const inView = useInView(rootRef);
  const [tick, setTick] = React.useState(0);
  const running = phase === "live" && !reduce && inView;
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), LIVE_TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  /* --- derived snapshots -------------------------------------------------- */
  const k = tick + PHASE_K[phase];
  const data = React.useMemo(
    () => snapshotAt(base, k, phase === "partial-update" ? (i) => i % 2 === 0 : undefined),
    [base, k, phase],
  );
  const prevData = React.useMemo(() => snapshotAt(base, Math.max(0, k - 1)), [base, k]);

  const agg = React.useMemo(() => aggregate(data), [data]);
  const prevAgg = React.useMemo(() => aggregate(prevData), [prevData]);

  /* --- active filter (the "one active filter" state) ---------------------- */
  const filtering = phase === "filtering";
  const activeFilters: ActiveFilter[] = filtering
    ? [{ id: "tier-1", group: "Priority", label: "Tier-1" }]
    : [];
  const watchlist = React.useMemo(
    () => (filtering ? data.filter((r) => r.tier === "tier-1") : data),
    [data, filtering],
  );

  /* --- phase → component state -------------------------------------------- */
  const isInitial = phase === "initial";
  const isError = phase === "error";
  const cellState: "idle" | "loading" | "error" = isInitial ? "loading" : isError ? "error" : "idle";
  const tableState: StreamingTableState = cellState;
  const filterState: FilterResultState = cellState;
  const kpiState: "idle" | "loading" | "error" = cellState;
  // Freeze morphs while stale so a frozen dataset never implies live movement.
  const tablePaused = phase === "stale";

  const refreshState: RefreshState = ((): RefreshState => {
    switch (phase) {
      case "initial":
        return "checking";
      case "refreshing":
        return "refreshing";
      case "partial-update":
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

  const changedCount = phase === "partial-update" ? base.filter((_, i) => i % 2 === 0).length : base.length;

  /* --- table columns ------------------------------------------------------ */
  const columns = React.useMemo<Column<HeroSignal>[]>(
    () => [
      {
        key: "name",
        header: "Signal",
        value: (r) => r.name,
        render: (r) => (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-[var(--color-fg)]">{r.name}</span>
            <span className="text-[11px] text-[var(--color-muted)]">{r.region}</span>
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        value: (r) => r.status,
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: "throughput",
        header: "Events/min",
        align: "end",
        numeric: true,
        value: (r) => r.throughput,
        format: fmtThroughput,
      },
      {
        key: "errorRate",
        header: "Errors",
        align: "end",
        numeric: true,
        value: (r) => r.errorRate,
        format: (n) => `${n.toFixed(2)}%`,
      },
    ],
    [],
  );

  const getRowId = React.useCallback((r: HeroSignal) => r.id, []);
  const getItemId = React.useCallback((r: HeroSignal) => r.id, []);

  return (
    <section
      ref={rootRef}
      className={cn(
        "relative isolate w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)]",
        className,
      )}
      {...rest}
    >
      {background ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {background}
        </div>
      ) : null}

      <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:p-12">
        {/* Left column: outcome copy + CTAs ------------------------------- */}
        <div className="flex flex-col items-start gap-5">
          {eyebrow ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
              {eyebrow}
            </span>
          ) : null}

          <h2 className="text-[clamp(1.9rem,4vw,2.9rem)] font-semibold leading-[1.08] tracking-tight text-[var(--color-fg)]">
            {headline}
          </h2>

          {copy ? (
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-[var(--color-muted)]">{copy}</p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-3">
            {primaryCta ? <CtaLink cta={primaryCta} variant="primary" /> : null}
            {secondaryCta ? <CtaLink cta={secondaryCta} variant="secondary" /> : null}
          </div>
        </div>

        {/* Right column: the live surface --------------------------------- */}
        <div className="flex w-full flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 shadow-[var(--shadow-md)] sm:p-4">
          {/* Header: label + refresh state */}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]" aria-hidden>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 14l4-4 3 3 5-6" />
                  </svg>
                </span>
                <span className="flex flex-col leading-tight">
                  <span>Signal command</span>
                  <span className="font-mono text-[10.5px] font-normal text-[var(--color-muted)]">demo-stream · fictional</span>
                </span>
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--color-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
                Demo data
              </span>
            </div>

            <DataRefreshState
              mode="inline"
              state={refreshState}
              label="Live signals"
              source="Signal warehouse · replica-1"
              lastUpdated={NOW}
              nextRefresh={NOW + REFRESH_INTERVAL}
              now={NOW}
              updatedCount={changedCount}
              totalCount={base.length}
              staleness="4m behind live"
              errorSummary="Upstream signal endpoint timed out (504)."
              reducedMotion={reduce}
            />
          </div>

          {/* Three KPIs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiNumberMorph
              label="Events / min"
              value={agg.throughput}
              notation="compact"
              change={agg.throughput - prevAgg.throughput}
              changeLabel="vs last tick"
              state={kpiState}
            />
            <KpiNumberMorph
              label="p95 latency"
              value={agg.latency}
              suffix=" ms"
              change={agg.latency - prevAgg.latency}
              changeLabel="vs last tick"
              state={kpiState}
            />
            <KpiNumberMorph
              label="Error rate"
              value={agg.errorRate}
              suffix="%"
              decimals={2}
              change={round2(agg.errorRate - prevAgg.errorRate)}
              changeAsPercent
              changeLabel="vs last tick"
              state={kpiState}
            />
          </div>

          {/* Watchlist — the "one active filter" surface */}
          <section aria-label="Watched signals" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <FilterResultTransition<HeroSignal>
              items={watchlist}
              getItemId={getItemId}
              layout="list"
              state={filterState}
              regionLabel="Watched signals"
              activeFilters={activeFilters}
              loadingCount={3}
              error="Couldn't load signals — the endpoint is unavailable."
              resultLabel={(n) => (
                <>
                  <span className="tabular-nums [font-variant-numeric:tabular-nums]">{n}</span>{" "}
                  {n === 1 ? "signal watched" : "signals watched"}
                </>
              )}
              renderItem={(r) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-[var(--color-fg)]">{r.name}</span>
                    <span className="block text-[11px] text-[var(--color-muted)]">{r.region}</span>
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              )}
            />
          </section>

          {/* Live feed — small streaming subset */}
          <section aria-label="Live signal feed">
            <StreamingDataRows<HeroSignal>
              rows={data}
              columns={columns}
              getRowId={getRowId}
              state={tableState}
              paused={tablePaused}
              loadingRows={3}
              caption="Live per-signal operational metrics"
              emptyContent="No signals match this view."
              errorContent="Live feed unavailable — the endpoint timed out."
              renderMobileRow={(r) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-semibold text-[var(--color-fg)]">{r.name}</span>
                      <span className="block text-[11px] text-[var(--color-muted)]">{r.region}</span>
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <dt className="text-[10.5px] uppercase tracking-wide text-[var(--color-muted)]">Events/min</dt>
                      <dd className="font-semibold tabular-nums text-[var(--color-fg)]">{fmtThroughput(r.throughput)}</dd>
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
        </div>
      </div>
    </section>
  );
}

export default LiveDataCommandHero;
