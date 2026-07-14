"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { formatNumber, useAnimatedNumber, useReducedMotion } from "@/lib/motionkit";

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
        "flex min-w-[9rem] flex-col gap-1.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]",
        className,
      )}
      role="group"
      aria-label={state === "idle" ? settledLabel : undefined}
      aria-busy={state === "loading" || undefined}
      {...rest}
    >
      {label ? (
        <span className="text-[12.5px] font-medium tracking-wide text-[var(--color-muted)] uppercase">{label}</span>
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
          className="text-[clamp(1.7rem,3.4vw,2.3rem)] font-semibold leading-none tracking-tight text-[var(--color-fg)] tabular-nums [font-variant-numeric:tabular-nums]"
          aria-hidden
        >
          {formatted}
        </span>
      )}

      {state === "idle" && changeText ? (
        <span
          aria-hidden
          className={cn(
            "mt-0.5 inline-flex items-center gap-1 text-[13px] font-medium",
            dir === "up" ? "text-[var(--color-success)]" : "text-[var(--color-muted)]",
          )}
        >
          <Trend dir={dir} />
          {changeText}
          {changeLabel ? <span className="font-normal text-[var(--color-muted)]">{changeLabel}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

export default KpiNumberMorph;
