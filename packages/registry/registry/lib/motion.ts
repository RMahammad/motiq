"use client";

/**
 * Motionkit shared primitives — small, dependency-free hooks/utilities reused
 * across workflow components so each one doesn't re-implement reduced-motion,
 * offscreen pausing, or locale number formatting. Installs as editable source
 * (`@motionkit/primitives`). No React import of `motion` here — this is engine-
 * agnostic. Clean-room original.
 */
import * as React from "react";
import { createPortal } from "react-dom";

/**
 * SSR-safe `prefers-reduced-motion`. Reads synchronously on the client so a
 * reduced-motion user never sees a frame of motion; the value is never rendered
 * into markup, so there is no hydration-mismatch risk.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Returns whether the referenced element is currently worth animating — i.e.
 * on-screen AND the tab is visible. Use it to pause per-frame work, autoplay,
 * or streaming when the component scrolls away or the tab is backgrounded.
 */
export function useVisibilityPause<T extends Element>(
  ref: React.RefObject<T | null>,
  { threshold = 0.1 }: { threshold?: number } = {},
): boolean {
  const [onScreen, setOnScreen] = React.useState(true);
  const [tabVisible, setTabVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  React.useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return onScreen && tabVisible;
}

export interface FormatNumberOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** "standard" | "compact" (e.g. 12.3K, 4.1M). */
  notation?: Intl.NumberFormatOptions["notation"];
  prefix?: string;
  suffix?: string;
  signDisplay?: Intl.NumberFormatOptions["signDisplay"];
  /** Shorthand for a currency format. */
  currency?: string;
}

/** Locale-aware number formatting with prefix/suffix and compact notation. */
export function formatNumber(value: number, opts: FormatNumberOptions = {}): string {
  const { locale, prefix = "", suffix = "", currency, ...intl } = opts;
  const core = new Intl.NumberFormat(locale, {
    ...intl,
    ...(currency ? { style: "currency", currency } : {}),
  }).format(value);
  return `${prefix}${core}${suffix}`;
}

/**
 * Drives an eased numeric transition from a previous value to the next with
 * requestAnimationFrame; returns the current display value. Respects reduced
 * motion (snaps instantly) and cleans up on unmount/interruption.
 */
export function useAnimatedNumber(
  value: number,
  { durationMs = 700, disabled = false }: { durationMs?: number; disabled?: boolean } = {},
): number {
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (disabled || typeof requestAnimationFrame === "undefined" || durationMs <= 0) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(from + (to - from) * easeOut(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      fromRef.current = to; // interruption starts the next run from here
    };
  }, [value, durationMs, disabled]);

  return display;
}

/* -------------------------------------------------------------------------- */
/* Workflow foundations — shared by status/stream/activity/table components.   */
/* -------------------------------------------------------------------------- */

export type StatusTone = "success" | "warning" | "error" | "info" | "neutral" | "active";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

/** Broad status vocabulary shared across workflow components (open string too). */
export type WorkflowStatus =
  | "idle" | "queued" | "pending" | "active" | "running" | "in_progress"
  | "success" | "completed" | "passed" | "approved" | "published"
  | "warning" | "waiting" | "waiting_approval"
  | "error" | "failed" | "rejected"
  | "cancelled" | "skipped" | "paused" | "archived"
  | (string & {});

const STATUS_TABLE: Record<string, StatusMeta> = {
  idle: { label: "Idle", tone: "neutral" },
  queued: { label: "Queued", tone: "neutral" },
  pending: { label: "Pending", tone: "neutral" },
  active: { label: "Active", tone: "active" },
  running: { label: "Running", tone: "active" },
  in_progress: { label: "In progress", tone: "active" },
  success: { label: "Success", tone: "success" },
  completed: { label: "Completed", tone: "success" },
  passed: { label: "Passed", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  published: { label: "Published", tone: "success" },
  warning: { label: "Warning", tone: "warning" },
  waiting: { label: "Waiting", tone: "warning" },
  waiting_approval: { label: "Waiting for approval", tone: "warning" },
  error: { label: "Error", tone: "error" },
  failed: { label: "Failed", tone: "error" },
  rejected: { label: "Rejected", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  skipped: { label: "Skipped", tone: "neutral" },
  paused: { label: "Paused", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
};

function humanize(s: string): string {
  const t = s.replace(/[_-]+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : s;
}

/** Resolve a status string to a display label + semantic tone. */
export function getStatusMeta(status: string, overrides?: Record<string, Partial<StatusMeta>>): StatusMeta {
  const key = status.toLowerCase();
  const base = STATUS_TABLE[key] ?? { label: humanize(status), tone: "neutral" as StatusTone };
  const over = overrides?.[status] ?? overrides?.[key];
  return { ...base, ...over };
}

const TONE_VAR: Record<StatusTone, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  info: "var(--color-info)",
  neutral: "var(--color-neutral, var(--color-muted))",
  active: "var(--color-accent)",
};

/** Inline-style-ready color/bg/border for a status tone (uses semantic tokens). */
export function statusVars(tone: StatusTone): { color: string; bg: string; border: string } {
  const c = TONE_VAR[tone];
  return {
    color: c,
    bg: `color-mix(in oklab, ${c} 14%, transparent)`,
    border: `color-mix(in oklab, ${c} 38%, var(--color-border))`,
  };
}

export interface FormatTimestampOptions {
  /** Render as "3m ago" / "just now" instead of an absolute time. */
  relative?: boolean;
  locale?: string;
  /** Reference "now" (ms) — pass a stable value to avoid SSR/CSR drift. */
  now?: number;
  /** Full override — receives a Date, returns the string. */
  format?: (d: Date) => string;
}

/** Absolute or relative timestamp formatting, no date library. */
export function formatTimestamp(value: Date | number | string, opts: FormatTimestampOptions = {}): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  if (opts.format) return opts.format(d);
  if (opts.relative) {
    const now = opts.now ?? Date.now();
    const diff = Math.round((now - d.getTime()) / 1000);
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return "yesterday";
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Intl.DateTimeFormat(opts.locale, { month: "short", day: "numeric" }).format(d);
  }
  return new Intl.DateTimeFormat(opts.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d);
}

/**
 * Stream viewport: auto-follow the bottom of a scroll container, pausing when
 * the user scrolls up and exposing a "new items" count + resume control.
 * Attach `onScroll` to the scroll container and call `notifyNew(n)` after
 * appending entries. Scroll jumps are instant (reduced-motion-safe).
 */
export function useAutoFollow(ref: React.RefObject<HTMLElement | null>, { enabled = true }: { enabled?: boolean } = {}) {
  const [following, setFollowing] = React.useState(true);
  const [newCount, setNewCount] = React.useState(0);
  const followingRef = React.useRef(true);
  followingRef.current = following && enabled;

  const onScroll = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 28;
    setFollowing(atBottom);
    if (atBottom) setNewCount(0);
  }, [ref]);

  const scrollToLatest = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setFollowing(true);
    setNewCount(0);
  }, [ref]);

  const notifyNew = React.useCallback((n = 1) => {
    const el = ref.current;
    if (followingRef.current && el) {
      requestAnimationFrame(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
      });
    } else {
      setNewCount((c) => c + n);
    }
  }, [ref]);

  return { following, newCount, onScroll, scrollToLatest, notifyNew, setFollowing };
}

/**
 * Shared enter/exit for streamed list items — consume with AnimatePresence.
 * Under reduced motion pass `initial={false}` (or gate with useReducedMotion)
 * so items appear without offset.
 */
export const streamItemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
} as const;

/**
 * Copy-to-clipboard with a transient "copied" state for accessible feedback.
 * The component is responsible for rendering an sr-only status; this hook owns
 * the state, reset timing, and an optional app callback override.
 */
export function useCopy({ resetMs = 1600, onCopy }: { resetMs?: number; onCopy?: (text: string) => void } = {}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const copy = React.useCallback(
    async (text: string): Promise<boolean> => {
      let ok = false;
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      onCopy?.(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), resetMs);
      return ok;
    },
    [resetMs, onCopy],
  );
  return { copied, copy };
}

export interface UseDisclosureOptions {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  idPrefix?: string;
  /**
   * When true, treat this as a popover: while open, a pointerdown outside the
   * `rootRef` element (or an Escape key) closes it. Opt-in so inline
   * expand/collapse disclosures are unaffected. Spread `rootRef` on the element
   * that wraps both the trigger and the panel.
   */
  dismissable?: boolean;
}

/**
 * Controlled/uncontrolled disclosure with accessible trigger/panel wiring —
 * shared by source excerpts, API request sections, approval history, and future
 * audit-log rows. Keyboard activation comes free from using a real <button> for
 * the trigger (spread `triggerProps`).
 */
export function useDisclosure({ open, defaultOpen = false, onOpenChange, idPrefix = "mk", dismissable = false }: UseDisclosureOptions = {}) {
  const isControlled = open !== undefined;
  const [internal, setInternal] = React.useState(defaultOpen);
  const actualOpen = isControlled ? open : internal;
  const reactId = React.useId();
  const triggerId = `${idPrefix}-tr-${reactId}`;
  const panelId = `${idPrefix}-pn-${reactId}`;
  const rootRef = React.useRef<HTMLElement | null>(null);
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  const toggle = React.useCallback(() => setOpen(!actualOpen), [setOpen, actualOpen]);

  // Popover dismissal: close on outside pointerdown / Escape while open (opt-in).
  React.useEffect(() => {
    if (!dismissable || !actualOpen) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      const root = rootRef.current;
      // The panel may be portaled outside `rootRef` (see `useAnchoredPortal`), so
      // also treat a click inside the panel — matched by its stable `panelId` —
      // as "inside". Keeps outside-dismiss correct for portaled dropdowns.
      const panel = typeof document !== "undefined" ? document.getElementById(panelId) : null;
      if ((root && root.contains(target)) || (panel && panel.contains(target))) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [dismissable, actualOpen, setOpen]);

  return {
    open: actualOpen,
    setOpen,
    toggle,
    rootRef,
    triggerProps: {
      id: triggerId,
      "aria-expanded": actualOpen,
      "aria-controls": panelId,
      onClick: toggle,
    },
    panelProps: {
      id: panelId,
      role: "region" as const,
      "aria-labelledby": triggerId,
    },
  };
}

export interface UseAnchoredPortalOptions {
  /** Vertical side the panel opens toward relative to the trigger. Default "bottom". */
  side?: "top" | "bottom";
  /** Horizontal edge the panel aligns to. Default "start" (left in LTR). */
  align?: "start" | "end";
  /** Gap in px between the trigger and the panel. Default 4. */
  gap?: number;
}

/**
 * Anchor a portaled popover/menu/listbox panel to a trigger so it escapes any
 * ancestor `overflow-hidden` / `overflow: clip` (cards, scroll areas, preview
 * frames) that would otherwise crop it. The panel is rendered into `<body>` via
 * `renderInPortal` and positioned `fixed` from the trigger's rect.
 *
 * A per-frame re-measure — committed only when the position actually changes, so
 * a static open menu causes no re-renders — keeps the panel glued to its trigger
 * through page scroll, smooth-scroll libraries, resizes, and layout shifts
 * (matches Floating UI's `autoUpdate({ animationFrame: true })`).
 *
 * Wiring:
 *   const { triggerRef, panelRef, anchored, panelStyle, renderInPortal } = useAnchoredPortal(open);
 *   <button ref={triggerRef} ... />
 *   {renderInPortal(
 *     <AnimatePresence>
 *       {open && anchored ? (
 *         <motion.div ref={panelRef} style={panelStyle} ...>…</motion.div>
 *       ) : null}
 *     </AnimatePresence>,
 *   )}
 *
 * Keep the `AnimatePresence` mounted (portal it unconditionally) and gate the
 * inner child on `open && anchored` so exit animations still play. For outside-
 * click dismissal, treat `panelRef.current?.contains(target)` as "inside"
 * (`useDisclosure` already does this by panel id).
 */
export function useAnchoredPortal(
  open: boolean,
  { side = "bottom", align = "start", gap = 4 }: UseAnchoredPortalOptions = {},
) {
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const panelRef = React.useRef<HTMLElement | null>(null);
  const [pos, setPos] = React.useState<React.CSSProperties | null>(null);

  React.useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const measure = () => {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const next: React.CSSProperties =
        side === "top" ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap };
      if (align === "end") next.right = window.innerWidth - r.right;
      else next.left = r.left;
      setPos((prev) =>
        prev &&
        prev.top === next.top &&
        prev.bottom === next.bottom &&
        prev.left === next.left &&
        prev.right === next.right
          ? prev
          : next,
      );
    };
    // Measure once synchronously so the panel can render on the next commit
    // (no wasted frame, and it works under test renderers where rAF never
    // fires). The rAF loop then keeps it glued through scroll/resize/layout.
    measure();
    let raf = 0;
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, side, align, gap]);

  const panelStyle = React.useMemo<React.CSSProperties>(() => ({ position: "fixed", ...(pos ?? {}) }), [pos]);

  const renderInPortal = React.useCallback(
    (node: React.ReactNode) => (typeof document !== "undefined" ? createPortal(node, document.body) : null),
    [],
  );

  return { triggerRef, panelRef, anchored: pos !== null, panelStyle, renderInPortal };
}

/**
 * Controlled/uncontrolled value — the standard "value / defaultValue / onChange"
 * pattern shared by selection surfaces (environment switcher, filter sheet,
 * timeline active step, comment selection). Framework-agnostic.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<T>(defaultValue);
  const current = isControlled ? (value as T) : internal;
  const set = React.useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [current, set];
}

export type AsyncStatus = "idle" | "pending" | "success" | "error" | "cancelled";

/**
 * A tiny async-status machine for controllable side-effects — data refresh,
 * environment switching, comment sending, agent-run retry. NOT a state manager:
 * the app still owns the actual work; this only tracks the phase + error.
 */
export function useAsyncStatus(initial: AsyncStatus = "idle") {
  const [status, setStatus] = React.useState<AsyncStatus>(initial);
  const [error, setError] = React.useState<string | null>(null);
  const cancelledRef = React.useRef(false);

  const run = React.useCallback(async (fn: () => Promise<void> | void) => {
    cancelledRef.current = false;
    setStatus("pending");
    setError(null);
    try {
      await fn();
      if (!cancelledRef.current) setStatus("success");
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }
  }, []);

  const cancel = React.useCallback(() => {
    cancelledRef.current = true;
    setStatus("cancelled");
  }, []);

  const reset = React.useCallback(() => {
    cancelledRef.current = false;
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, setStatus, setError, run, cancel, reset };
}

export type OptimisticPhase = "idle" | "pending" | "success" | "error";

/**
 * Optimistic mutation with automatic rollback. Show `value` immediately, run the
 * async `action`, and on failure restore the previous committed value + expose
 * an error. Adopts a new `committed` value from the app whenever not mid-flight,
 * so real state catching up replaces the optimistic value cleanly.
 *
 * Shared by Cart Item Transition, Task Dependency Map, and Project Timeline —
 * each applies an optimistic change (quantity, dependency, move) that must roll
 * back if the app's async handler rejects. Focus restoration after a rollback is
 * the component's responsibility (it holds the DOM refs).
 */
export function useOptimisticAction<T>(committed: T) {
  const [state, setState] = React.useState<{ value: T; active: boolean }>({ value: committed, active: false });
  const [phase, setPhase] = React.useState<OptimisticPhase>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const baseRef = React.useRef(committed);

  // Adopt the app's committed value whenever we're not mid-flight.
  React.useEffect(() => {
    if (phase === "pending") return;
    baseRef.current = committed;
    setState({ value: committed, active: false });
    if (phase === "success") setPhase("idle");
  }, [committed, phase]);

  const commit = React.useCallback(async (next: T, action: () => Promise<void> | void) => {
    const prev = baseRef.current;
    setState({ value: next, active: true });
    setPhase("pending");
    setError(null);
    try {
      await action();
      setPhase("success");
    } catch (e) {
      setState({ value: prev, active: false }); // rollback
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  }, []);

  const reset = React.useCallback(() => {
    setPhase("idle");
    setError(null);
    setState({ value: baseRef.current, active: false });
  }, []);

  return { value: state.value, optimistic: state.active, phase, error, commit, reset };
}
