"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useControllableState,
  statusVars,
  type StatusTone,
} from "@/lib/motiq";

import { KpiNumberMorph } from "@/components/motiq/kpi-number-morph";
import {
  DataRefreshState,
  type RefreshState,
} from "@/components/motiq/data-refresh-state";
import {
  StreamingDataRows,
  type Column,
  type StreamingTableState,
} from "@/components/motiq/streaming-data-rows";
import {
  FilterResultTransition,
  type ActiveFilter,
  type FilterResultState,
} from "@/components/motiq/filter-result-transition";

/**
 * LiveDataCommandHero — an editable hero block for operational-data products.
 * Instead of a static KPI screenshot, a wide copy band sits above a full-width
 * *live surface*: three morphing KPIs, the current refresh state, a small live
 * subset of signals, and one active filter — all driven by a single phase the
 * app owns. On wide screens the watched signals and the live feed tile into two
 * columns so the hero holds a calm height. The point is continuity and changing
 * state over time, at reduced complexity: it is a hero framing, not a full
 * analytics dashboard.
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
    // Full-bleed, equal-width, 44px-tall on phones; from `sm` the original
    // intrinsic-width pill, unchanged.
    "inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-colors @md/hero:min-h-0 @md/hero:w-auto",
    focusRing,
    variant === "primary"
      ? "border border-[color-mix(in_oklab,var(--color-accent)_55%,black)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-accent)_86%,white)_0%,var(--color-accent)_60%)] text-[var(--color-accent-foreground,white)] shadow-[0_1px_0_0_color-mix(in_oklab,white_45%,transparent)_inset,0_8px_22px_-10px_color-mix(in_oklab,var(--color-accent)_80%,transparent)] transition-[transform,filter] hover:brightness-[1.06] motion-safe:hover:-translate-y-px"
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

/**
 * SSR-safe "is this a phone-width viewport" flag. Starts `false` so the server
 * and the first client render agree; it only ever *adds* narrow-viewport
 * affordances after mount. Used strictly for behaviour that CSS cannot express
 * (keyboard reachability of the metric rail) — every layout change is CSS.
 */
function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(max-width: 639.98px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

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
/* Shared shell — ambient backdrop + capability proof strip                     */
/* -------------------------------------------------------------------------- */

/** Decorative, static, token-based ambient field — soft accent glows + a fading
 *  dot grid. Purely visual: aria-hidden, no motion, no browser globals. Renders
 *  only when the consumer provides no `background` of their own. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[12%] -top-[20%] h-[65%] w-[55%] rounded-full opacity-70 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--color-accent) 20%, transparent), transparent 68%)",
        }}
      />
      <div
        className="absolute -right-[8%] top-1/3 h-[60%] w-[45%] rounded-full opacity-50 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklab, var(--color-border) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, black, transparent 72%)",
          maskImage: "radial-gradient(115% 80% at 50% 0%, black, transparent 72%)",
        }}
      />
    </div>
  );
}

const DEFAULT_PROOF: string[] = [
  "Metrics that morph in place, never a reload",
  "Refresh state you can actually see",
  "Streaming signals, filtered live",
];

/** Three short capability lines that give the copy region substance beside the
 *  live surface. Text-only; the check glyph is decorative. */
function ProofStrip({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 @2xl/hero:flex-row @2xl/hero:flex-wrap @2xl/hero:gap-x-7 @2xl/hero:gap-y-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[13px] text-[var(--color-fg)] @2xl/hero:items-center @2xl/hero:text-[13.5px]">
          <span
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]"
            aria-hidden
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 6.2 5 8.5l4.5-5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Metric rail — snap carousel on phones, the original 3-up grid from `sm`      */
/* -------------------------------------------------------------------------- */

/**
 * Three KPI tiles cost ~300px stacked on a phone, and squeezing them into
 * columns shrinks the numbers past legibility. Below `sm` they become one
 * snap-scrolling rail — one tile at full size is the hero's focal moment, the
 * other two are a swipe (or an arrow key) away, and a dot row makes that
 * obvious. From `sm` up the container is the original `grid-cols-3`, so the
 * desktop composition is byte-for-byte what it was.
 */
function MetricRail({ label, tiles }: { label: string; tiles: React.ReactNode[] }) {
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(0);
  // Only the narrow layout actually scrolls, so only there is the rail a
  // focusable region — desktop keeps its original tab order.
  const narrow = useNarrowViewport();

  const handleScroll = React.useCallback(() => {
    const el = railRef.current;
    if (!el || tiles.length === 0) return;
    const step = el.scrollWidth / tiles.length;
    if (step <= 0) return;
    setActive(Math.max(0, Math.min(tiles.length - 1, Math.round(el.scrollLeft / step))));
  }, [tiles.length]);

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={railRef}
        onScroll={handleScroll}
        data-metric-rail=""
        role={narrow ? "region" : undefined}
        aria-label={narrow ? label : undefined}
        tabIndex={narrow ? 0 : undefined}
        className={cn(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Three KPI tiles need ~200px each to keep a 6-glyph tabular number on
          // one line; below that the rail scrolls instead of squeezing them.
          "@2xl/hero:grid @2xl/hero:grid-cols-3 @2xl/hero:overflow-x-visible @2xl/hero:pb-0",
          "rounded-2xl",
          focusRing,
        )}
      >
        {tiles.map((tile, i) => (
          // `grid` (not `flex`) so the tile stretches on both axes and fills its
          // slot exactly as it did when the tiles were grid children themselves.
          <div
            key={i}
            className="grid min-w-[86%] shrink-0 snap-start @2xl/hero:min-w-0 @2xl/hero:shrink"
          >
            {tile}
          </div>
        ))}
      </div>

      {/* Pagination affordance — decorative; the rail itself carries the label. */}
      <div aria-hidden className="flex items-center justify-center gap-1.5 @2xl/hero:hidden">
        {tiles.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
              i === active ? "w-5 bg-[var(--color-accent)]" : "w-1.5 bg-[var(--color-border)]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main block                                                                   */
/* -------------------------------------------------------------------------- */

export function LiveDataCommandHero({
  headline = "See your data change the moment it does",
  copy = "A command surface for operational data - live metrics, refresh state, and streaming signals that morph in place, so your team reads change instead of chasing it.",
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

  /* --- narrow-viewport disclosure for the watchlist ------------------------ */
  // On a phone the watchlist and the live feed show the same four signals, so
  // stacking both is ~300px of duplication. The feed stays the focal surface and
  // the watchlist collapses behind a real disclosure (CSS keeps it open from
  // `sm` up, so the desktop two-column composition never changes).
  const watchlistPanelId = `${React.useId()}-watchlist`;
  const [watchlistOpen, setWatchlistOpen] = React.useState(false);

  return (
    <section
      ref={rootRef}
      className={cn(
        // @container/hero: this block is routinely placed in a column far narrower
        // than the viewport (the docs preview gives it ~780px at a 1440px screen).
        // Layout must follow the space it actually has, not what the viewport claims.
        "@container/hero relative isolate w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg)]",
        className,
      )}
      {...rest}
    >
      {background ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {background}
        </div>
      ) : (
        <HeroBackdrop />
      )}

      {/* `max-[360px]` trims the padding chain on the smallest phones only, where
          four nested paddings otherwise eat ~45% of the viewport. */}
      <div className="flex flex-col gap-6 p-4 max-[360px]:gap-5 max-[360px]:p-3 @2xl/hero:gap-8 @2xl/hero:p-8 @4xl/hero:gap-10 @4xl/hero:p-12">
        {/* Copy band — headline/copy on one side, CTAs + live status on the
            other, so the marketing row reads wide instead of a thin column. */}
        {/* The side-by-side copy/CTA split only earns its keep once the container
            can give the headline a real measure — below ~900px it produced a
            four-line headline beside dead space, so it stacks instead. */}
        <div className="grid gap-5 @2xl/hero:gap-6 @4xl/hero:grid-cols-[minmax(0,1fr)_auto] @4xl/hero:items-end @4xl/hero:gap-10">
          <div className="flex min-w-0 flex-col gap-3.5 @2xl/hero:gap-4">
            {eyebrow ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_80%,transparent)] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)] backdrop-blur-sm @2xl/hero:text-[12px]">
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-70 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                </span>
                {eyebrow}
              </span>
            ) : null}

            {/* The `sm` expression is the original desktop clamp, untouched; the
                unprefixed one is a phone-first scale so the headline never lands
                at a size that costs it two extra lines. */}
            {/* cqw, not vw: sized off the container. A vw-based clamp gave a ~50px
                headline inside a 780px column on a 1440px screen, which is what
                pushed it to four cramped lines. */}
            <h2 className="text-balance text-[clamp(1.75rem,7.5cqw,2.2rem)] font-semibold leading-[1.08] tracking-tight text-[var(--color-fg)] @4xl/hero:text-[clamp(2rem,4.4cqw,3.1rem)] @4xl/hero:leading-[1.05]">
              {headline}
            </h2>

            {copy ? (
              <p className="max-w-[56ch] text-[15px] leading-relaxed text-[var(--color-muted)] @2xl/hero:text-[16px]">{copy}</p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col items-start gap-3.5 @2xl/hero:gap-4 @4xl/hero:w-auto @4xl/hero:items-end">
            <div className="flex w-full flex-col gap-2.5 @md/hero:w-auto @md/hero:flex-row @md/hero:flex-wrap @md/hero:items-center @md/hero:gap-3">
              {primaryCta ? <CtaLink cta={primaryCta} variant="primary" /> : null}
              {secondaryCta ? <CtaLink cta={secondaryCta} variant="secondary" /> : null}
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[12.5px] font-medium text-[var(--color-fg)]">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                {phase === "live" && !reduce ? (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-70 motion-safe:animate-ping" />
                ) : null}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              </span>
              Live signals
            </span>
          </div>
        </div>

        {/* Proof row — three capability lines that carry the copy region. */}
        <div className="flex flex-col gap-4">
          <div className="h-px w-full bg-[var(--color-border)]" />
          <ProofStrip items={DEFAULT_PROOF} />
        </div>

        {/* Signal command — a full-width app window. On wide screens the watched
            signals and the live feed tile into two columns so the hero holds a
            calm height. No overflow/max-height clip: the composed children run
            Framer `layout` animations that collapse inside a constrained scroll
            ancestor. */}
        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(55% 40% at 50% 0%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent)",
            }}
          />
          <div className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-[var(--shadow-lg)]">
            {/* Window header --------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_60%,var(--color-bg-secondary))] px-3 py-2.5 @2xl/hero:px-5 @2xl/hero:py-3">
              <span className="flex min-w-0 items-center gap-2.5 text-[13px] font-semibold">
                {/* Window-chrome dots are pure decoration; a phone needs the room. */}
                <span className="hidden items-center gap-1.5 @2xl/hero:flex" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-error)_65%,transparent)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-warning)_70%,transparent)]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_oklab,var(--color-success)_65%,transparent)]" />
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]" aria-hidden>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M7 14l4-4 3 3 5-6" />
                  </svg>
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span>Signal command</span>
                  <span className="font-mono text-[11px] font-normal text-[var(--color-muted)]">demo-stream · fictional</span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_12%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                Demo data
              </span>
            </div>

            <div className="flex min-w-0 flex-col gap-3 p-3 max-[360px]:gap-2.5 max-[360px]:p-2 @2xl/hero:gap-4 @2xl/hero:p-5">
              {/* Refresh state — full-width strip. It brings its own bordered
                  shell, so it is not wrapped in a second one. */}
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

              {/* Three KPIs — a snap rail on phones, a 3-up row from `sm`. */}
              <MetricRail
                label="Key metrics"
                tiles={[
                  <KpiNumberMorph
                    key="throughput"
                    label="Events / min"
                    value={agg.throughput}
                    notation="compact"
                    change={agg.throughput - prevAgg.throughput}
                    changeLabel="vs last tick"
                    state={kpiState}
                  />,
                  <KpiNumberMorph
                    key="latency"
                    label="p95 latency"
                    value={agg.latency}
                    suffix=" ms"
                    change={agg.latency - prevAgg.latency}
                    changeLabel="vs last tick"
                    state={kpiState}
                  />,
                  <KpiNumberMorph
                    key="errorRate"
                    label="Error rate"
                    value={agg.errorRate}
                    suffix="%"
                    decimals={2}
                    change={round2(agg.errorRate - prevAgg.errorRate)}
                    changeAsPercent
                    changeLabel="vs last tick"
                    state={kpiState}
                  />,
                ]}
              />

              {/* Watched signals · live feed — two tiled columns */}
              <div className="grid min-w-0 gap-3 @2xl/hero:gap-4 @4xl/hero:grid-cols-2 @4xl/hero:gap-5 @4xl/hero:items-start">
                <section aria-label="Watched signals" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 @2xl/hero:p-3">
                  {/* Narrow-container disclosure. The panel is unconditionally
                      shown once the container passes @2xl, so this control simply
                      does not exist at widths that can afford both tiles. */}
                  <button
                    type="button"
                    aria-expanded={watchlistOpen}
                    aria-controls={watchlistPanelId}
                    onClick={() => setWatchlistOpen((open) => !open)}
                    className={cn(
                      "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-1 text-left text-[13px] font-semibold text-[var(--color-fg)] @2xl/hero:hidden",
                      focusRing,
                    )}
                  >
                    {/* The summary carries the state the collapsed panel holds —
                        the live count and any active facet — so nothing is
                        hidden behind the disclosure, only detail. */}
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="whitespace-nowrap">
                        Watched signals
                        <span className="ml-2 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-accent)]">
                          {watchlist.length}
                        </span>
                      </span>
                      {activeFilters.map((f) => (
                        <span
                          key={f.id}
                          className="whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] font-normal text-[var(--color-fg)]"
                        >
                          <span className="text-[var(--color-muted)]">{f.group}: </span>
                          {f.label}
                        </span>
                      ))}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className={cn(
                        "shrink-0 text-[var(--color-muted)] transition-transform duration-200 motion-reduce:transition-none",
                        watchlistOpen && "rotate-180",
                      )}
                    >
                      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div
                    id={watchlistPanelId}
                    data-watchlist-panel=""
                    className={cn(watchlistOpen ? "block pt-1" : "hidden", "@2xl/hero:block @2xl/hero:pt-0")}
                  >
                    <FilterResultTransition<HeroSignal>
                      items={watchlist}
                      getItemId={getItemId}
                      layout="list"
                      state={filterState}
                      regionLabel="Watched signals"
                      activeFilters={activeFilters}
                      loadingCount={3}
                      error="Couldn't load signals - the endpoint is unavailable."
                      resultLabel={(n) => (
                        <>
                          <span className="tabular-nums [font-variant-numeric:tabular-nums]">{n}</span>{" "}
                          {n === 1 ? "signal watched" : "signals watched"}
                        </>
                      )}
                      renderItem={(r) => (
                        <div className="flex items-center justify-between gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-2 @2xl/hero:px-3">
                          <span className="min-w-0">
                            {/* Wraps to two lines rather than eliding to "R…". */}
                            <span className="line-clamp-2 text-[12.5px] font-medium text-[var(--color-fg)]">{r.name}</span>
                            <span className="block text-[11px] text-[var(--color-muted)]">{r.region}</span>
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                      )}
                    />
                  </div>
                </section>

                <section aria-label="Live signal feed" className="min-w-0">
                  <StreamingDataRows<HeroSignal>
                    rows={data}
                    columns={columns}
                    getRowId={getRowId}
                    state={tableState}
                    paused={tablePaused}
                    loadingRows={3}
                    caption="Live per-signal operational metrics"
                    emptyContent="No signals match this view."
                    errorContent="Live feed unavailable - the endpoint timed out."
                    renderMobileRow={(r) => (
                      // Each stacked row is a labelled key/value block. Every
                      // label sits in the same unwrappable span as its value, so
                      // a narrow card wraps whole pairs onto the next line
                      // instead of stranding single words (or a separator).
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 min-w-0 text-[13.5px] font-semibold text-[var(--color-fg)]">
                            {r.name}
                          </span>
                          <StatusBadge status={r.status} />
                        </div>
                        <dl
                          data-signal-meta=""
                          className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[11.5px]"
                        >
                          <div data-meta-pair="" className="whitespace-nowrap">
                            <dt className="sr-only">Region</dt>
                            <dd className="inline text-[var(--color-muted)]">{r.region}</dd>
                          </div>
                          <div data-meta-pair="" className="whitespace-nowrap">
                            <dt className="inline text-[var(--color-muted)]">Events </dt>
                            <dd className="inline font-semibold tabular-nums text-[var(--color-fg)]">
                              {fmtThroughput(r.throughput)}
                            </dd>
                          </div>
                          <div data-meta-pair="" className="whitespace-nowrap">
                            <dt className="inline text-[var(--color-muted)]">Errors </dt>
                            <dd className="inline font-semibold tabular-nums text-[var(--color-fg)]">
                              {r.errorRate.toFixed(2)}%
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  />
                </section>
              </div>
            </div>

            {/* Honesty footer ------------------------------------------- */}
            <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 @2xl/hero:px-5 @2xl/hero:py-2.5">
              <p className="inline-flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
                Demo data - fictional signals, no live backend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LiveDataCommandHero;
