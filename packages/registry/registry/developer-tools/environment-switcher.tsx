"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useControllableState,
  useReducedMotion,
  getStatusMeta,
  statusVars,
  formatTimestamp as defaultFormatTimestamp,
  type StatusTone,
} from "@/lib/motiq";

/**
 * EnvironmentSwitcher — a presentation + control surface for choosing the
 * environment (dev / staging / production, regions, preview branches) an app is
 * pointed at. It is NOT a deployment tool: it never opens a socket, deploys,
 * promotes, or mutates any backend. The host application owns the actual switch;
 * this component surfaces the choice, the per-environment status/health the host
 * already knows, and — critically — a production safety guard.
 *
 * What makes it worth shipping over a bare <select>: each environment carries a
 * status (available / active / degraded / offline / deploying / locked /
 * restricted), optional region / branch / version / last-deploy / health, and an
 * app-provided disabled reason. Production is treated as a first-class hazard —
 * it is marked with an icon AND a text label (never colour alone) and, when the
 * host opts in via `requireProductionConfirmation`, a switch to it is gated
 * behind an explicit confirmation dialog. A switch in flight and a switch error
 * (with retry) are app-owned states the component renders honestly.
 *
 * Accessibility: the trigger is a real button (aria-haspopup="listbox"); the
 * popup is the ARIA combobox pattern — a search input (role="combobox",
 * aria-activedescendant) controlling a role="listbox" of role="option" rows with
 * full Arrow / Home / End / Enter / Escape keyboard support. Disabled options
 * keep their reason readable. The current value is announced via a polite live
 * region; production and every status use icon + text; focus is restored to the
 * trigger on close; targets are ≥44px; under prefers-reduced-motion everything
 * renders in its final state. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type EnvironmentType =
  | "local"
  | "development"
  | "preview"
  | "staging"
  | "production"
  | (string & {});

/** App-owned health/lifecycle of an environment. */
export type EnvironmentStatus =
  | "available"
  | "loading"
  | "active"
  | "degraded"
  | "offline"
  | "deploying"
  | "locked"
  | "restricted"
  | (string & {});

export interface Environment {
  id: string;
  /** Human label, e.g. "Production" or "Preview PR-248". */
  name: string;
  type: EnvironmentType;
  status: EnvironmentStatus;
  region?: string;
  branch?: string;
  version?: string;
  /** When this environment last received a deploy. */
  lastDeploy?: Date | number | string;
  url?: string;
  /** 0–100 health score; drawn as a small meter (never colour alone). */
  health?: number;
  /** Non-secret capability labels, e.g. ["read", "write"]. */
  permissions?: string[];
  /** Free-text caution shown inline (e.g. "Live customer data"). */
  warning?: string;
  /** Explicitly non-selectable; the app owns why (see disabledReason). */
  disabled?: boolean;
  /** Reason surfaced to the user when the environment can't be selected. */
  disabledReason?: string;
  /** Group id — matched against the `groups` prop for section ordering. */
  group?: string;
  metadata?: Record<string, unknown>;
}

export interface EnvironmentGroup {
  id: string;
  label: string;
}

export interface EnvironmentRenderContext {
  selected: boolean;
  active: boolean;
  disabled: boolean;
}

export interface EnvironmentSwitcherProps {
  /** All environments the app offers. The app owns this data. */
  environments: Environment[];
  /** Controlled selected id. */
  value?: string;
  /** Uncontrolled initial selected id. */
  defaultValue?: string;
  /** Fired when the user commits a selection (after production confirm, if any). */
  onValueChange?: (id: string, environment: Environment) => void;
  /** App-owned: a switch is in flight. Renders a loading trigger state. */
  switching?: boolean;
  /** Which environment id the in-flight switch targets (for messaging). */
  switchingId?: string;
  /** App-owned switch error; renders an inline banner + Retry (when onRetry). */
  error?: string | null;
  /** Wired to the host's retry logic. */
  onRetry?: () => void;
  /** Require an explicit confirmation dialog before switching to production. */
  requireProductionConfirmation?: boolean;
  /** Ids to float to the top and badge as recently used. */
  recentIds?: string[];
  /** Ids to float to the top and badge as favorites. */
  favoriteIds?: string[];
  /** Optional group order + labels; environments reference groups via env.group. */
  groups?: EnvironmentGroup[];
  /** Fully override how one environment row renders. */
  renderEnvironment?: (env: Environment, ctx: EnvironmentRenderContext) => React.ReactNode;
  /** Override timestamp rendering (last deploy). */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Stable "now" epoch (ms) for deterministic relative last-deploy times. */
  now?: number;
  /** Accessible context label, e.g. "Environment" — also labels the trigger. */
  label?: string;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Disable the whole control. */
  disabled?: boolean;
  /** Popup alignment relative to the trigger. */
  align?: "start" | "end";
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Status + type vocabulary                                                    */
/* -------------------------------------------------------------------------- */

const STATUS_OVERRIDES: Record<string, { label: string; tone: StatusTone }> = {
  available: { label: "Available", tone: "neutral" },
  active: { label: "Active", tone: "active" },
  loading: { label: "Loading", tone: "active" },
  degraded: { label: "Degraded", tone: "warning" },
  offline: { label: "Offline", tone: "error" },
  deploying: { label: "Deploying", tone: "info" },
  locked: { label: "Locked", tone: "warning" },
  restricted: { label: "Restricted", tone: "warning" },
};

/** Statuses that block selection unless the app says otherwise. */
const BLOCKING_STATUS: Record<string, string> = {
  offline: "This environment is offline.",
  locked: "This environment is locked.",
  restricted: "You don't have access to this environment.",
};

const IN_FLIGHT_STATUS = new Set(["loading", "deploying"]);

const TYPE_LABEL: Record<string, string> = {
  local: "Local",
  development: "Dev",
  preview: "Preview",
  staging: "Staging",
  production: "Production",
};

function isProduction(env: Environment): boolean {
  return env.type === "production";
}

function disabledInfo(env: Environment): { disabled: boolean; reason?: string } {
  if (env.disabled) return { disabled: true, reason: env.disabledReason ?? "This environment is unavailable." };
  const blocking = BLOCKING_STATUS[env.status];
  if (blocking) return { disabled: true, reason: env.disabledReason ?? blocking };
  return { disabled: false, reason: env.disabledReason };
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

const glyph = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

const ChevronGlyph = () => (
  <svg {...glyph} width={16} height={16}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const CheckGlyph = () => (
  <svg {...glyph} width={15} height={15} strokeWidth={2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const SearchGlyph = () => (
  <svg {...glyph} width={15} height={15}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const WarnGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const ShieldGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <path d="M12 3 4 6v6c0 4.5 3.2 7.6 8 9 4.8-1.4 8-4.5 8-9V6l-8-3Z" />
    <path d="M9.5 12.2 11 13.7l3.5-3.6" />
  </svg>
);
const LockGlyph = () => (
  <svg {...glyph} width={13} height={13} strokeWidth={2.2}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const OfflineGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="m2 2 20 20" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0" />
    <path d="M5 12.9a10 10 0 0 1 3-2" />
    <path d="M19 12.9a10 10 0 0 0-4.4-2.6" />
  </svg>
);
const SpinnerGlyph = ({ reduce }: { reduce: boolean }) => (
  <motion.svg
    {...glyph}
    width={14}
    height={14}
    animate={reduce ? undefined : { rotate: 360 }}
    transition={reduce ? undefined : { duration: 0.9, ease: "linear", repeat: Infinity }}
    style={{ display: "inline-block" }}
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </motion.svg>
);
const RetryGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const StarGlyph = () => (
  <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" aria-hidden focusable="false">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
);
const ClockGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

function StatusIcon({ status }: { status: EnvironmentStatus }): React.ReactElement | null {
  if (status === "offline") return <OfflineGlyph />;
  if (status === "locked") return <LockGlyph />;
  if (status === "restricted") return <LockGlyph />;
  if (status === "degraded") return <WarnGlyph />;
  return null;
}

/** Trigger avatar glyph: a status icon when one exists, else a tinted dot. */
function TriggerIcon({ env }: { env: Environment }): React.ReactElement {
  const icon = StatusIcon({ status: env.status });
  if (icon) return icon;
  const meta = getStatusMeta(env.status, STATUS_OVERRIDES);
  return <span className="h-2 w-2 rounded-full" style={{ background: statusVars(meta.tone).color }} aria-hidden />;
}

/* -------------------------------------------------------------------------- */
/* Shared class helpers                                                        */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const EASE = [0.2, 0, 0, 1] as const;

/* -------------------------------------------------------------------------- */
/* Status chip                                                                 */
/* -------------------------------------------------------------------------- */

function StatusChip({ status, reduce }: { status: EnvironmentStatus; reduce: boolean }) {
  const meta = getStatusMeta(status, STATUS_OVERRIDES);
  const svars = statusVars(meta.tone);
  const inFlight = IN_FLIGHT_STATUS.has(status);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold leading-none"
      style={{ color: svars.color, borderColor: svars.border, background: svars.bg }}
    >
      <span className="relative grid h-2 w-2 place-items-center" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: svars.color }} />
        {inFlight && !reduce ? (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: svars.color }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
      </span>
      <StatusIcon status={status} />
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Type badge — production always carries an icon + the word "Production".     */
/* -------------------------------------------------------------------------- */

function TypeBadge({ env }: { env: Environment }) {
  const prod = isProduction(env);
  const label = TYPE_LABEL[env.type] ?? env.type;
  const svars = statusVars(prod ? "warning" : "neutral");
  return (
    <span
      className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10.5px] font-bold uppercase leading-none tracking-wide"
      style={{ color: svars.color, borderColor: svars.border, background: svars.bg }}
    >
      {prod ? <ShieldGlyph /> : null}
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Option row                                                                  */
/* -------------------------------------------------------------------------- */

function OptionRow({
  env,
  optionId,
  selected,
  active,
  disabled,
  reason,
  badges,
  fmt,
  reduce,
  onSelect,
  onHover,
}: {
  env: Environment;
  optionId: string;
  selected: boolean;
  active: boolean;
  disabled: boolean;
  reason?: string;
  badges: { favorite: boolean; recent: boolean };
  fmt: (v: Date | number | string) => string;
  reduce: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const prod = isProduction(env);
  const descId = reason ? `${optionId}-reason` : undefined;
  const metaBits: React.ReactNode[] = [];
  if (env.branch) metaBits.push(<span key="branch" className="font-mono">{env.branch}</span>);
  if (env.region) metaBits.push(<span key="region">{env.region}</span>);
  if (env.version) metaBits.push(<span key="version" className="font-mono">{env.version}</span>);
  if (env.lastDeploy != null)
    metaBits.push(
      <span key="deploy" className="inline-flex items-center gap-1">
        <ClockGlyph />
        {fmt(env.lastDeploy)}
      </span>,
    );

  return (
    <div
      id={optionId}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      aria-describedby={descId}
      // Keep focus on the search input; commit on click.
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={onHover}
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "flex min-h-[44px] scroll-my-1 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2",
        "transition-[background-color,box-shadow] duration-150 ease-out",
        disabled && "cursor-not-allowed opacity-60",
      )}
      style={
        active && !disabled
          ? {
              background: "color-mix(in oklab, var(--color-accent) 10%, var(--color-bg-secondary))",
              boxShadow:
                "inset 3px 0 0 0 var(--color-accent), inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 22%, transparent), 0 1px 2px color-mix(in oklab, var(--color-accent) 16%, transparent)",
            }
          : undefined
      }
    >
      {/* selected check reserves width so rows don't shift */}
      <span className="grid w-4 shrink-0 place-items-center text-[var(--color-accent)]" aria-hidden>
        {selected ? <CheckGlyph /> : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[13.5px] font-semibold text-[var(--color-fg)]">{env.name}</span>
          <TypeBadge env={env} />
          {badges.favorite ? (
            <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-[var(--color-accent)]" title="Favorite">
              <StarGlyph />
              <span className="sr-only">Favorite</span>
            </span>
          ) : null}
          {badges.recent && !badges.favorite ? (
            <span className="text-[10.5px] font-medium text-[var(--color-muted)]">Recent</span>
          ) : null}
        </span>

        {metaBits.length ? (
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
            {metaBits}
          </span>
        ) : null}

        {prod && env.warning ? (
          <span
            className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium leading-tight"
            style={{
              color: statusVars("warning").color,
              background: statusVars("warning").bg,
              border: `1px solid ${statusVars("warning").border}`,
            }}
          >
            <span className="shrink-0">
              <WarnGlyph />
            </span>
            {env.warning}
          </span>
        ) : null}

        {disabled && reason ? (
          <span id={descId} className="inline-flex items-center gap-1 text-[11.5px] text-[var(--color-muted)]">
            <LockGlyph />
            {reason}
          </span>
        ) : null}
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-2">
        {typeof env.health === "number" ? <HealthMeter value={env.health} reduce={reduce} /> : null}
        <StatusChip status={env.status} reduce={reduce} />
      </span>
    </div>
  );
}

function HealthMeter({ value, reduce }: { value: number; reduce: boolean }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone: StatusTone = clamped >= 80 ? "success" : clamped >= 50 ? "warning" : "error";
  const svars = statusVars(tone);
  return (
    <span className="hidden items-center gap-1 sm:inline-flex" title={`Health ${clamped}%`}>
      <span className="h-1.5 w-10 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]" aria-hidden>
        <motion.span
          className="block h-full rounded-full"
          style={{ background: svars.color }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </span>
      <span className="text-[10.5px] font-medium tabular-nums text-[var(--color-muted)]">
        <span className="sr-only">Health </span>
        {clamped}%
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function EnvironmentSwitcher({
  environments,
  value,
  defaultValue,
  onValueChange,
  switching = false,
  switchingId,
  error,
  onRetry,
  requireProductionConfirmation = false,
  recentIds,
  favoriteIds,
  groups,
  renderEnvironment,
  formatTimestamp,
  now,
  label = "Environment",
  placeholder = "Select environment",
  disabled = false,
  align = "start",
  className,
}: EnvironmentSwitcherProps) {
  const reduce = useReducedMotion();
  const baseId = React.useId();
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;
  const searchId = `${baseId}-search`;

  const firstEnabled = React.useMemo(
    () => environments.find((e) => !disabledInfo(e).disabled)?.id ?? environments[0]?.id ?? "",
    [environments],
  );
  const [selectedId, setSelectedId] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? firstEnabled,
    onChange: undefined,
  });

  const selectedEnv = React.useMemo(
    () => environments.find((e) => e.id === selectedId),
    [environments, selectedId],
  );

  const fmt = React.useMemo(
    () =>
      formatTimestamp ??
      ((v: Date | number | string) => defaultFormatTimestamp(v, now != null ? { relative: true, now } : {})),
    [formatTimestamp, now],
  );

  const favoriteSet = React.useMemo(() => new Set(favoriteIds ?? []), [favoriteIds]);
  const recentSet = React.useMemo(() => new Set(recentIds ?? []), [recentIds]);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [pending, setPending] = React.useState<Environment | null>(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const confirmRef = React.useRef<HTMLDivElement | null>(null);
  const confirmCancelRef = React.useRef<HTMLButtonElement | null>(null);

  /* Filtering + section ordering ------------------------------------------ */
  const needle = query.trim().toLowerCase();

  const matches = React.useCallback(
    (env: Environment) => {
      if (!needle) return true;
      const hay = [env.name, env.type, env.status, env.region, env.branch, env.version]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    },
    [needle],
  );

  const sections = React.useMemo(() => {
    const visible = environments.filter(matches);
    if (groups && groups.length) {
      const known = new Set(groups.map((g) => g.id));
      const out: Array<{ label?: string; options: Environment[] }> = [];
      for (const g of groups) {
        const opts = visible.filter((e) => e.group === g.id);
        if (opts.length) out.push({ label: g.label, options: opts });
      }
      const ungrouped = visible.filter((e) => !e.group || !known.has(e.group));
      if (ungrouped.length) out.push({ label: out.length ? "Other" : undefined, options: ungrouped });
      return out;
    }
    // No groups: float favorites, then recents, then the rest (stable).
    const rank = (e: Environment) => (favoriteSet.has(e.id) ? 0 : recentSet.has(e.id) ? 1 : 2);
    const sorted = visible
      .map((e, i) => ({ e, i }))
      .sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i)
      .map((x) => x.e);
    return [{ options: sorted }];
  }, [environments, matches, groups, favoriteSet, recentSet]);

  /** Flat, render-ordered list used for keyboard navigation. */
  const flat = React.useMemo(() => sections.flatMap((s) => s.options), [sections]);

  const optionId = React.useCallback((id: string) => `${baseId}-opt-${id}`, [baseId]);

  /* Keep activeIndex valid + land on the selected row when opening ---------- */
  React.useEffect(() => {
    if (!open) return;
    const selIdx = flat.findIndex((e) => e.id === selectedId && !disabledInfo(e).disabled);
    const firstOk = flat.findIndex((e) => !disabledInfo(e).disabled);
    setActiveIndex(selIdx >= 0 ? selIdx : firstOk >= 0 ? firstOk : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (open) setActiveIndex((i) => Math.min(i, Math.max(0, flat.length - 1)));
  }, [flat.length, open]);

  /* Scroll the active option into view ------------------------------------- */
  React.useEffect(() => {
    if (!open) return;
    const el = flat[activeIndex] ? document.getElementById(optionId(flat[activeIndex].id)) : null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, flat, optionId]);

  /* Focus management: input on open, trigger on close ---------------------- */
  const openMenu = React.useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  const closeMenu = React.useCallback((restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  /* Commit / confirm ------------------------------------------------------- */
  const commit = React.useCallback(
    (env: Environment) => {
      setSelectedId(env.id);
      onValueChange?.(env.id, env);
    },
    [onValueChange, setSelectedId],
  );

  const requestSelect = React.useCallback(
    (env: Environment) => {
      if (disabledInfo(env).disabled) return;
      if (isProduction(env) && requireProductionConfirmation && env.id !== selectedId) {
        setPending(env);
        return;
      }
      commit(env);
      closeMenu();
    },
    [commit, closeMenu, requireProductionConfirmation, selectedId],
  );

  const confirmProduction = React.useCallback(() => {
    if (pending) commit(pending);
    setPending(null);
    closeMenu();
  }, [pending, commit, closeMenu]);

  const cancelProduction = React.useCallback(() => {
    setPending(null);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  /* Keyboard (on the search combobox) -------------------------------------- */
  const moveActive = React.useCallback(
    (dir: 1 | -1) => {
      if (!flat.length) return;
      setActiveIndex((i) => {
        let next = i;
        for (let step = 0; step < flat.length; step++) {
          next = (next + dir + flat.length) % flat.length;
          if (!disabledInfo(flat[next]).disabled) return next;
        }
        return i;
      });
    },
    [flat],
  );

  const onSearchKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          moveActive(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          moveActive(-1);
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(flat.findIndex((x) => !disabledInfo(x).disabled));
          break;
        case "End":
          e.preventDefault();
          for (let j = flat.length - 1; j >= 0; j--) {
            if (!disabledInfo(flat[j]).disabled) {
              setActiveIndex(j);
              break;
            }
          }
          break;
        case "Enter": {
          e.preventDefault();
          const env = flat[activeIndex];
          if (env) requestSelect(env);
          break;
        }
        case "Escape":
          e.preventDefault();
          closeMenu();
          break;
        case "Tab":
          closeMenu(false);
          break;
      }
    },
    [moveActive, flat, activeIndex, requestSelect, closeMenu],
  );

  /* Trigger keyboard: open on ArrowDown / Enter / Space -------------------- */
  const onTriggerKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
    },
    [openMenu],
  );

  /* Outside interaction closes the menu (blur-out + pointerdown) ------------ */
  const onRootBlur = React.useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (pending) return; // confirm dialog owns focus
      const rt = e.relatedTarget as Node | null;
      // The popup (incl. its search field) is portaled outside the root, so
      // focus landing there is still "inside" the widget — don't close.
      if (!e.currentTarget.contains(rt) && !popupRef.current?.contains(rt)) {
        setOpen(false);
        setQuery("");
      }
    },
    [pending],
  );

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // The popup is portaled to <body>, so it is outside `rootRef`; treat clicks
      // inside it as inside the widget.
      if (rootRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  /* Anchor the popup to the trigger via a portal --------------------------- */
  // Portaled to <body> and positioned `fixed` from the trigger's rect so the
  // menu escapes any ancestor `overflow-hidden` (cards, preview frames, scroll
  // containers) that would otherwise clip it. A per-frame re-measure — committed
  // only when the position actually changes — keeps it glued to the trigger
  // through page scroll, smooth-scroll libraries, resizes, and layout shifts.
  const [anchor, setAnchor] = React.useState<{ top: number; left: number; right: number } | null>(null);
  React.useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const measure = () => {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const next = { top: r.bottom + 8, left: r.left, right: window.innerWidth - r.right };
      setAnchor((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.right === next.right ? prev : next,
      );
    };
    // Measure synchronously so the popup renders on the next commit (no wasted
    // frame; also works where rAF never fires, e.g. test renderers).
    measure();
    let raf = 0;
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  /* Confirm dialog: focus + Escape + minimal focus trap -------------------- */
  React.useEffect(() => {
    if (pending) requestAnimationFrame(() => confirmCancelRef.current?.focus());
  }, [pending]);

  const onConfirmKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelProduction();
        return;
      }
      if (e.key === "Tab") {
        const focusable = confirmRef.current?.querySelectorAll<HTMLElement>("button");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [cancelProduction],
  );

  const activeEnv = flat[activeIndex];
  const activeDescId = open && activeEnv ? optionId(activeEnv.id) : undefined;

  /* Announcement text (polite) --------------------------------------------- */
  const announcement = React.useMemo(() => {
    if (error) return "";
    if (switching) {
      const target = switchingId ? environments.find((e) => e.id === switchingId) : undefined;
      return `Switching to ${target?.name ?? "environment"}…`;
    }
    if (selectedEnv) {
      const meta = getStatusMeta(selectedEnv.status, STATUS_OVERRIDES);
      return `Current environment: ${selectedEnv.name}, ${TYPE_LABEL[selectedEnv.type] ?? selectedEnv.type}, ${meta.label}.`;
    }
    return "";
  }, [error, switching, switchingId, environments, selectedEnv]);

  /* ----------------------------------------------------------------------- */

  return (
    <div
      ref={rootRef}
      onBlur={onRootBlur}
      className={cn("relative inline-block w-full max-w-[420px] text-left", className)}
    >
      {/* Trigger -------------------------------------------------------- */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={selectedEnv ? `${label}: ${selectedEnv.name}` : label}
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex min-h-[44px] w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors",
          "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]",
          "hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-55",
          focusRing,
        )}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-muted)]" aria-hidden>
          {switching ? <SpinnerGlyph reduce={reduce} /> : selectedEnv ? <TriggerIcon env={selectedEnv} /> : <SearchGlyph />}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">{label}</span>
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-[var(--color-fg)]">
              {switching
                ? `Switching to ${(switchingId && environments.find((e) => e.id === switchingId)?.name) ?? selectedEnv?.name ?? "…"}`
                : selectedEnv?.name ?? placeholder}
            </span>
            {selectedEnv && !switching ? <TypeBadge env={selectedEnv} /> : null}
          </span>
        </span>

        {selectedEnv && !switching ? <StatusChip status={selectedEnv.status} reduce={reduce} /> : null}

        <motion.span
          className="shrink-0 text-[var(--color-muted)]"
          animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          style={{ display: "inline-flex" }}
          aria-hidden
        >
          <ChevronGlyph />
        </motion.span>
      </button>

      {/* Switch error banner ------------------------------------------- */}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.div
            key="err"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: "hidden" }}
          >
            <div
              role="alert"
              className="mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
              style={{ color: statusVars("error").color, borderColor: statusVars("error").border, background: statusVars("error").bg }}
            >
              <span className="mt-0.5 shrink-0">
                <WarnGlyph />
              </span>
              <span className="flex-1 text-[var(--color-fg)]">{error}</span>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(
                    "inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[12px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                    focusRing,
                  )}
                >
                  <RetryGlyph />
                  Retry
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Popup — portaled to <body> so no ancestor overflow can clip it -- */}
      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && anchor && !pending ? (
                <motion.div
                  key="popup"
                  ref={popupRef}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: EASE }}
                  className="z-[60] w-[min(92vw,26rem)] origin-top overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg,var(--shadow-md))]"
                  style={{
                    position: "fixed",
                    top: anchor.top,
                    ...(align === "end" ? { right: anchor.right } : { left: anchor.left }),
                    transformOrigin: align === "end" ? "top right" : "top left",
                  }}
                >
            {/* Search */}
            <div className="border-b border-[var(--color-border)] p-2">
              <label className="relative flex items-center">
                <span className="pointer-events-none absolute left-2.5 text-[var(--color-muted)]">
                  <SearchGlyph />
                </span>
                <span className="sr-only">Search environments</span>
                <input
                  ref={searchRef}
                  id={searchId}
                  type="text"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={activeDescId}
                  autoComplete="off"
                  spellCheck={false}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search environments…"
                  className={cn(
                    "min-h-[40px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-8 pr-2 text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-muted)]",
                    focusRing,
                  )}
                />
              </label>
            </div>

            {/* Listbox */}
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={`${label} options`}
              className="max-h-[19rem] overflow-y-auto overflow-x-hidden p-1"
            >
              {flat.length === 0 ? (
                <p className="px-3 py-6 text-center text-[12.5px] text-[var(--color-muted)]">
                  No environments match “{query}”.
                </p>
              ) : (
                sections.map((section, si) => {
                  const body = section.options.map((env) => {
                    const idx = flat.indexOf(env);
                    const info = disabledInfo(env);
                    const oid = optionId(env.id);
                    if (renderEnvironment) {
                      return (
                        <div
                          key={env.id}
                          id={oid}
                          role="option"
                          aria-selected={env.id === selectedId}
                          aria-disabled={info.disabled || undefined}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseMove={() => setActiveIndex(idx)}
                          onClick={info.disabled ? undefined : () => requestSelect(env)}
                          className={cn("scroll-my-1", info.disabled && "cursor-not-allowed")}
                        >
                          {renderEnvironment(env, {
                            selected: env.id === selectedId,
                            active: idx === activeIndex,
                            disabled: info.disabled,
                          })}
                        </div>
                      );
                    }
                    return (
                      <OptionRow
                        key={env.id}
                        env={env}
                        optionId={oid}
                        selected={env.id === selectedId}
                        active={idx === activeIndex}
                        disabled={info.disabled}
                        reason={info.reason}
                        badges={{ favorite: favoriteSet.has(env.id), recent: recentSet.has(env.id) }}
                        fmt={fmt}
                        reduce={reduce}
                        onSelect={() => requestSelect(env)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    );
                  });
                  return section.label ? (
                    <div key={section.label + si} role="group" aria-label={section.label}>
                      <div className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]" aria-hidden>
                        {section.label}
                      </div>
                      {body}
                    </div>
                  ) : (
                    <React.Fragment key={"sec" + si}>{body}</React.Fragment>
                  );
                })
              )}
            </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      {/* Production confirmation dialog --------------------------------- */}
      <AnimatePresence>
        {pending ? (
          <motion.div
            key="confirm"
            className="absolute inset-0 z-30 grid place-items-start"
            initial={reduce ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14, ease: EASE }}
          >
            <div
              ref={confirmRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={`${baseId}-confirm-title`}
              aria-describedby={`${baseId}-confirm-desc`}
              onKeyDown={onConfirmKeyDown}
              className="w-[min(92vw,26rem)] rounded-xl border p-4 shadow-[var(--shadow-lg,var(--shadow-md))]"
              style={{ borderColor: statusVars("warning").border, background: "var(--color-surface)" }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ color: statusVars("warning").color, background: statusVars("warning").bg }}
                  aria-hidden
                >
                  <WarnGlyph />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id={`${baseId}-confirm-title`} className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-fg)]">
                    <ShieldGlyph />
                    Switch to Production?
                  </h2>
                  <p id={`${baseId}-confirm-desc`} className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                    You are about to point this session at{" "}
                    <span className="font-semibold text-[var(--color-fg)]">{pending.name}</span>, a{" "}
                    <span className="font-semibold" style={{ color: statusVars("warning").color }}>production</span>{" "}
                    environment. {pending.warning ? pending.warning + " " : "Changes here can affect live users. "}
                    Confirm you intend to switch.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  ref={confirmCancelRef}
                  type="button"
                  onClick={cancelProduction}
                  className={cn(
                    "inline-flex min-h-[40px] items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]",
                    focusRing,
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmProduction}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors",
                    focusRing,
                  )}
                  style={{
                    color: statusVars("warning").color,
                    borderColor: statusVars("warning").border,
                    background: statusVars("warning").bg,
                  }}
                >
                  <ShieldGlyph />
                  Switch to Production
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Polite announcer ---------------------------------------------- */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

export default EnvironmentSwitcher;
