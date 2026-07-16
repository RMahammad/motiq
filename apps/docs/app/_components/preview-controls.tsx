"use client";

import * as React from "react";

/**
 * Shared preview "controllers" — one control vocabulary for every live demo so a
 * component page's demo controls read the same as the homepage hero's category /
 * component pickers (chip shape, tint accent, focus rings, real ARIA).
 *
 * Vocabulary:
 *  - <ControlBar>       toolbar container (role="group"); holds the controls
 *  - <ControlButton>    one-shot action chip (Reset, Simulate failure, …)
 *  - <ControlToggle>    on/off pill with aria-pressed + tint dot (like hero picker)
 *  - <ControlSegmented> mutually-exclusive segmented control (Light/Dark, speed…)
 *  - <ControlDivider>   thin vertical rule between control clusters
 *  - <ControlHint>      trailing muted status text (optionally an aria-live region)
 *
 * Accent: everything reads `var(--tint, var(--color-accent))`, so a bar can be
 * tinted per category via <ControlBar tint="…"> (matching the hero's --tint), and
 * otherwise falls back to the product accent. Clean-room original.
 */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/** The tinted accent used across all controls; falls back to the product accent. */
const TINT = "var(--tint, var(--color-accent))";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]";

/* -------------------------------------------------------------------------- */
/* Container                                                                   */
/* -------------------------------------------------------------------------- */

export interface ControlBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible label for the control group. Default "Demo controls". */
  label?: string;
  /** Per-category tint (e.g. the hero category colour). Sets `--tint`. */
  tint?: string;
}

/** Toolbar that wraps a demo's controls — a subtle card that floats on the stage. */
export function ControlBar({ label = "Demo controls", tint, className, style, children, ...rest }: ControlBarProps) {
  return (
    <div
      role="group"
      aria-label={label}
      style={tint ? { ["--tint" as string]: tint, ...style } : style}
      className={cx(
        "flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action chip                                                                 */
/* -------------------------------------------------------------------------- */

const CHIP_BASE =
  "inline-flex min-h-[32px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional leading glyph. */
  icon?: React.ReactNode;
}

/** A one-shot action chip (resting "raised chip", tint border on hover). */
export const ControlButton = React.forwardRef<HTMLButtonElement, ControlButtonProps>(function ControlButton(
  { icon, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        CHIP_BASE,
        FOCUS,
        "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]",
        `hover:border-[color-mix(in_oklab,${TINT}_45%,var(--color-border))] hover:text-[var(--color-fg)]`,
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span className="grid shrink-0 place-items-center text-[var(--color-muted)]" aria-hidden>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* On/off toggle                                                               */
/* -------------------------------------------------------------------------- */

export interface ControlToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Controlled pressed state. */
  pressed: boolean;
  /** Convenience change handler (fires with the next value). */
  onPressedChange?: (next: boolean) => void;
}

/** A pill toggle with a leading tint dot + aria-pressed — mirrors the hero picker. */
export const ControlToggle = React.forwardRef<HTMLButtonElement, ControlToggleProps>(function ControlToggle(
  { pressed, onPressedChange, onClick, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onPressedChange?.(!pressed);
      }}
      className={cx(
        CHIP_BASE,
        FOCUS,
        pressed
          ? `border border-[color-mix(in_oklab,${TINT}_45%,var(--color-border))] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]`
          : "border border-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-fg)]",
        className,
      )}
      {...rest}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors"
        style={{ background: pressed ? TINT : "var(--color-border)" }}
        aria-hidden
      />
      {children}
    </button>
  );
});

/* -------------------------------------------------------------------------- */
/* Segmented control                                                           */
/* -------------------------------------------------------------------------- */

export interface ControlSegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface ControlSegmentedProps<T extends string> {
  /** Accessible label for the segmented group. */
  label: string;
  options: ReadonlyArray<ControlSegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Mutually-exclusive segments (Light/Dark, slow/normal/fast) — hero tab fill. */
export function ControlSegmented<T extends string>({ label, options, value, onChange, className }: ControlSegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("inline-flex shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)]", className)}
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(opt.value)}
            className={cx(
              "px-2.5 py-1 text-[12px] font-medium transition-colors",
              FOCUS,
              on
                ? `bg-[color-mix(in_oklab,${TINT}_16%,var(--color-surface))] text-[var(--color-fg)]`
                : "text-[var(--color-muted)] hover:text-[var(--color-fg)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Divider + hint                                                              */
/* -------------------------------------------------------------------------- */

/** Thin vertical rule to separate control clusters. */
export function ControlDivider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-[var(--color-border)]" aria-hidden />;
}

export interface ControlHintProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Announce updates politely (for status text the demo updates). */
  live?: boolean;
}

/** Trailing muted status text, pushed to the end of the bar. */
export function ControlHint({ live, className, children, ...rest }: ControlHintProps) {
  return (
    <span
      aria-live={live ? "polite" : undefined}
      className={cx("ml-auto max-w-[340px] text-right text-[12px] leading-snug text-[var(--color-muted)]", className)}
      {...rest}
    >
      {children}
    </span>
  );
}
