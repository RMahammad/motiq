"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { formatNumber, useAnimatedNumber, useReducedMotion } from "@/lib/motiq";

type KpiState = "idle" | "loading" | "error";

export interface KpiNumberMorphProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** Current metric value (controlled). */
  value: number;
  /** Metric name shown above the number. */
  label?: string;
  prefix?: string;
  suffix?: string;
  /** Fixed decimal places for the morphing number. */
  decimals?: number;
  /** "standard" | "compact" (12.4K, 3.1M). */
  notation?: "standard" | "compact";
  /** ISO currency code — renders the value as currency. */
  currency?: string;
  locale?: string;
  /** Signed change (delta or percent); drives the direction-aware trend row. */
  change?: number;
  /** Text after the change, e.g. "vs last week". */
  changeLabel?: string;
  /** Render the change as a percentage (adds %, one decimal). */
  changeAsPercent?: boolean;
  state?: KpiState;
  durationMs?: number;
}

function Trend({ dir }: { dir: "up" | "down" }) {
  // Direction is conveyed by the glyph itself (not color alone) and stays
  // visible under forced-colors.
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      {dir === "up" ? (
        <path d="M12 19V5m0 0l-6 6m6-6l6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 5v14m0 0l6-6m-6 6l-6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * KpiNumberMorph — an accessible KPI stat that smoothly morphs between values
 * with a clear, direction-aware trend indicator.
 *
 * Accessibility: change direction is carried by an arrow glyph AND a sign in the
 * text — never by color alone; the tile exposes a combined `aria-label`
 * (label + value + change) and does not spam a live region. Loading uses
 * `aria-busy`. Under `prefers-reduced-motion` the number snaps instead of
 * counting. Clean-room original.
 */
export function KpiNumberMorph({
  value,
  label,
  prefix,
  suffix,
  decimals = 0,
  notation = "standard",
  currency,
  locale,
  change,
  changeLabel,
  changeAsPercent = false,
  state = "idle",
  durationMs = 750,
  className,
  ...rest
}: KpiNumberMorphProps) {
  const reduce = useReducedMotion();
  const animate = state === "idle";
  const display = useAnimatedNumber(value, { durationMs, disabled: reduce || !animate });

  // Compact notation reads better with one significant decimal (3.1M, 48.2K)
  // and no forced trailing zero; standard notation honors `decimals` exactly.
  const fraction =
    notation === "compact"
      ? { minimumFractionDigits: 0, maximumFractionDigits: Math.max(decimals, 1) }
      : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };

  const numberOpts = { locale, notation, currency, prefix, suffix, ...fraction } as const;
  const formatted = formatNumber(display, numberOpts);

  const hasChange = typeof change === "number" && change !== 0;
  const dir: "up" | "down" = (change ?? 0) >= 0 ? "up" : "down";
  const changeText = hasChange
    ? `${change! > 0 ? "+" : "−"}${formatNumber(Math.abs(change!), {
        locale,
        minimumFractionDigits: changeAsPercent ? 1 : 0,
        maximumFractionDigits: changeAsPercent ? 1 : 2,
        suffix: changeAsPercent ? "%" : "",
      })}`
    : null;

  const settledLabel = [
    label,
    formatNumber(value, numberOpts),
    changeText ? `change ${dir === "up" ? "up" : "down"} ${changeText}${changeLabel ? ` ${changeLabel}` : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className={cn(
        // `@container/kpi` — every size decision below reacts to *this tile's*
        // width, never the viewport. A KPI in a 180px column inside a 1440px
        // window is a narrow KPI, and the viewport has no way to know that.
        //
        // The `p-4 → p-5` step is a container query on the tile's own box, so
        // the threshold (16rem of content) is deliberately placed far from any
        // width the padding step itself could push across it.
        //
        // Sizing note: `container-type: inline-size` zeroes the element's
        // intrinsic inline contribution, so give the tile a definite or
        // stretched width (a grid/flex track, `w-full`) — never let it size to
        // its own content.
        "@container/kpi flex min-w-0 flex-col gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] @[16rem]/kpi:p-5",
        className,
      )}
      role="group"
      aria-label={state === "idle" ? settledLabel : undefined}
      aria-busy={state === "loading" || undefined}
      {...rest}
    >
      {label ? (
        // Wraps rather than truncating: a metric name is never worth eliding.
        <span className="text-[12px] font-medium tracking-wide text-[var(--color-muted)] uppercase @[16rem]/kpi:text-[12.5px]">
          {label}
        </span>
      ) : null}

      {state === "error" ? (
        <div className="flex items-center gap-2 py-1 text-[15px] text-[var(--color-muted)]" role="status">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 8v5m0 3h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Unavailable
        </div>
      ) : state === "loading" ? (
        <div className="py-1.5" aria-hidden>
          <div className="h-8 w-24 animate-pulse rounded-md bg-[var(--color-bg-secondary)] motion-reduce:animate-none" />
        </div>
      ) : (
        <span
          // `cqi` (1% of this tile's inline size), not `vw`: the number is sized
          // by the room it actually has. 14cqi reaches the 2.3rem ceiling at
          // ~263px of tile content — the width a three-up KPI row has on a real
          // desktop — so wide layouts are unchanged and narrow tiles step down
          // to the 1.7rem floor instead of overflowing.
          className="text-[clamp(1.7rem,14cqi,2.3rem)] font-semibold leading-none tracking-tight text-[var(--color-fg)] tabular-nums [font-variant-numeric:tabular-nums]"
          aria-hidden
        >
          {formatted}
        </span>
      )}

      {state === "idle" && changeText ? (
        // Grouped, wrappable trend row: the glyph + delta are one unwrappable
        // unit and the qualifier is another, so a narrow tile drops the label to
        // its own line instead of stranding "+1.2" and "vs" on separate rows.
        <span
          aria-hidden
          data-kpi-change=""
          className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] font-medium"
        >
          <span
            data-kpi-change-value=""
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap",
              dir === "up" ? "text-[var(--color-success)]" : "text-[var(--color-muted)]",
            )}
          >
            <Trend dir={dir} />
            {changeText}
          </span>
          {changeLabel ? (
            <span className="font-normal text-[var(--color-muted)]">{changeLabel}</span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

export default KpiNumberMorph;
