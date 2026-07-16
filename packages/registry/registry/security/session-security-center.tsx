"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useReducedMotion,
  useDisclosure,
  useAnchoredPortal,
  formatTimestamp as defaultFormatTimestamp,
  statusVars,
  type StatusTone,
} from "@/lib/motionkit";

/* --------------------------------------------------------------------------
 * SessionSecurityCenter — a presentation + control surface for reviewing and
 * MANAGING the active sign-in sessions on an account (this laptop, a phone, a
 * tablet, an office desktop) and revoking the ones that shouldn't be there.
 *
 * It is deliberately NOT a security scanner, a login flow, or a 2FA/passkey
 * SETUP wizard (its siblings own that). It never inspects the network, never
 * geolocates anyone, never derives an IP, and never decides on its own that a
 * session is compromised. The APPLICATION owns the session data and every real
 * mutation; this component renders that data honestly and emits intent.
 *
 * Security-honesty rules it enforces in the UI:
 *  - The current session is always clearly identified (icon + the words "This
 *    device") and is preserved: it has no Revoke control and is excluded from
 *    "Revoke all other sessions" unless the app explicitly opts in.
 *  - Only fields the app supplies are shown. Location is labelled as app-
 *    reported / approximate, never as a precise fix. IP is shown exactly as the
 *    app summarised it (e.g. "203.0.113.x") — the component never reconstructs a
 *    full address.
 *  - A risk label appears only when the app supplies one, as a calm icon+text
 *    badge — never an alarming pulse, and never invented by the component.
 *  - Destructive actions (revoke one, revoke all others) require an accessible
 *    confirmation. A failed revocation is shown as failed, with Retry.
 *
 * Accessibility: a semantic list of sessions; state conveyed by icon + text
 * (never colour alone); revoke controls carry the device name; confirmations use
 * role="alertdialog" with a focus trap and Escape; focus is preserved onto a
 * neighbouring session after one is removed; a per-session Details disclosure
 * surfaces the full metadata for small screens; timestamps are relative + human;
 * everything renders in its final state under prefers-reduced-motion. Clean-room
 * original.
 * ----------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Lifecycle/state of a session. `current` and `suspicious` are app-determined:
 * the component never promotes a session to `suspicious` on its own.
 */
export type SessionState =
  | "active"
  | "current"
  | "idle"
  | "expired"
  | "revoked"
  | "pending-revocation"
  | "suspicious"
  | "unknown"
  | (string & {});

/** An app-supplied, calm risk annotation. Presence is entirely app-driven. */
export interface SessionRisk {
  /** Short human label, e.g. "New location" or "Unrecognised device". */
  label: string;
  /** Severity used only for icon/tone selection — never for alarming motion. */
  level?: "info" | "attention";
}

export interface Session {
  /** Stable id — drives keys, focus restoration, and revocation intent. */
  id: string;
  /** Human device label, e.g. "MacBook Pro" or "Pixel 8". App-owned. */
  device: string;
  /** Browser label, e.g. "Chrome 128". */
  browser?: string;
  /** OS label, e.g. "macOS 15". */
  os?: string;
  /** Coarse device kind — drives the icon. Inferred from text when omitted. */
  deviceKind?: "laptop" | "desktop" | "phone" | "tablet" | "unknown";
  /** App-reported, approximate location string. Never treated as precise. */
  location?: string;
  /** App-summarised IP (e.g. "203.0.113.x"). Shown verbatim; never expanded. */
  ipSummary?: string;
  createdTime: Date | number | string;
  lastActiveTime: Date | number | string;
  /** True for the session viewing this screen. Exactly one should be current. */
  current?: boolean;
  /** App-owned lifecycle state. Falls back to "active" (or "current"). */
  state?: SessionState;
  /** App-supplied "trusted device" label, e.g. "Trusted". */
  trustLabel?: string;
  /** App-supplied risk annotation. Only rendered when present. */
  risk?: SessionRisk;
  /** How this session authenticated, e.g. "Passkey" or "Password + 2FA". */
  authMethod?: string;
  /** Owning org/workspace label, when the account spans several. */
  organization?: string;
  metadata?: Record<string, unknown>;
}

export type SessionFilter = "all" | "active" | "idle" | "flagged";
export type SessionSort = "recent" | "device";

export interface SessionSecurityCenterProps {
  /** All sessions the app knows about. The app owns this data. */
  sessions: Session[];
  /** Inspect a single session (open a detail panel / audit trail app-side). */
  onInspect?: (session: Session) => void;
  /** Revoke one session. Fired only after the user confirms. */
  onRevoke?: (session: Session) => void;
  /**
   * Revoke every other (non-current, revocable) session at once. Receives the
   * exact list that will be affected — the current session is never in it unless
   * `allowRevokeCurrent` is set. Fired only after the user confirms.
   */
  onRevokeAllOthers?: (others: Session[]) => void;
  /** Rename a device label. Fired with the new name after inline editing. */
  onRenameDevice?: (session: Session, name: string) => void;
  /** Mark a session's device as trusted (app owns what that means). */
  onMarkTrusted?: (session: Session) => void;
  /** Remove a device's trusted status. */
  onRemoveTrust?: (session: Session) => void;
  /** Re-fetch the session list. Renders a refresh control when provided. */
  onRefresh?: () => void;
  /** App-owned refresh-in-flight flag. */
  refreshing?: boolean;
  /**
   * Allow the current session to be revoked too (signs this device out). Off by
   * default so the current session is preserved. When on, revoking it is still
   * gated behind confirmation with distinct copy.
   */
  allowRevokeCurrent?: boolean;
  /** App-owned error (e.g. a failed revocation); renders a banner + Retry. */
  error?: string | null;
  /** Wired to the host's retry logic for `error`. */
  onRetry?: () => void;
  /** Controlled filter. */
  filter?: SessionFilter;
  /** Uncontrolled initial filter. */
  defaultFilter?: SessionFilter;
  onFilterChange?: (filter: SessionFilter) => void;
  /** Controlled sort. */
  sort?: SessionSort;
  /** Uncontrolled initial sort. */
  defaultSort?: SessionSort;
  onSortChange?: (sort: SessionSort) => void;
  /** Stable "now" epoch (ms) for deterministic relative timestamps. */
  now?: number;
  /** Override timestamp rendering. */
  formatTimestamp?: (value: Date | number | string) => string;
  /** Accessible heading for the region. */
  label?: string;
  /** Optional supporting line under the heading. */
  description?: string;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* State vocabulary                                                             */
/* -------------------------------------------------------------------------- */

interface StateMeta {
  label: string;
  tone: StatusTone;
}

const STATE_META: Record<string, StateMeta> = {
  current: { label: "This device", tone: "active" },
  active: { label: "Active", tone: "success" },
  idle: { label: "Idle", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
  revoked: { label: "Revoked", tone: "neutral" },
  "pending-revocation": { label: "Revoking…", tone: "warning" },
  suspicious: { label: "Needs review", tone: "warning" },
  unknown: { label: "Unknown", tone: "neutral" },
};

function resolveState(session: Session): SessionState {
  if (session.state) return session.state;
  if (session.current) return "current";
  return "active";
}

function stateMeta(state: SessionState): StateMeta {
  return STATE_META[state] ?? { label: humanize(String(state)), tone: "neutral" };
}

function humanize(s: string): string {
  const t = s.replace(/[_-]+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : s;
}

/** States for which a Revoke action is meaningful. */
const REVOCABLE_STATES = new Set(["current", "active", "idle", "suspicious", "unknown"]);

function isCurrent(session: Session): boolean {
  return session.current === true || resolveState(session) === "current";
}

function isRevocable(session: Session, allowRevokeCurrent: boolean): boolean {
  const state = resolveState(session);
  if (state === "pending-revocation" || state === "revoked" || state === "expired") return false;
  if (isCurrent(session) && !allowRevokeCurrent) return false;
  return REVOCABLE_STATES.has(state);
}

function inferKind(session: Session): NonNullable<Session["deviceKind"]> {
  if (session.deviceKind) return session.deviceKind;
  const hay = `${session.device} ${session.os ?? ""}`.toLowerCase();
  if (/iphone|android|pixel|galaxy|phone/.test(hay)) return "phone";
  if (/ipad|tablet/.test(hay)) return "tablet";
  if (/imac|desktop|tower|studio/.test(hay)) return "desktop";
  if (/macbook|laptop|thinkpad|surface|book/.test(hay)) return "laptop";
  return "unknown";
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

const glyph = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

const LaptopGlyph = () => (
  <svg {...glyph} width={18} height={18}>
    <rect x="4" y="5" width="16" height="11" rx="1.5" />
    <path d="M2 20h20M9 20l.5-2h5l.5 2" />
  </svg>
);
const DesktopGlyph = () => (
  <svg {...glyph} width={18} height={18}>
    <rect x="3" y="4" width="18" height="12" rx="1.5" />
    <path d="M9 20h6M12 16v4" />
  </svg>
);
const PhoneGlyph = () => (
  <svg {...glyph} width={18} height={18}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>
);
const TabletGlyph = () => (
  <svg {...glyph} width={18} height={18}>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M11 18h2" />
  </svg>
);
const UnknownDeviceGlyph = () => (
  <svg {...glyph} width={18} height={18}>
    <rect x="4" y="5" width="16" height="14" rx="2" />
    <path d="M9.5 10a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 1.75-2 3M12 16.5v.01" />
  </svg>
);

function DeviceIcon({ session }: { session: Session }) {
  const kind = inferKind(session);
  if (kind === "phone") return <PhoneGlyph />;
  if (kind === "tablet") return <TabletGlyph />;
  if (kind === "desktop") return <DesktopGlyph />;
  if (kind === "laptop") return <LaptopGlyph />;
  return <UnknownDeviceGlyph />;
}

const CheckGlyph = () => (
  <svg {...glyph} width={13} height={13} strokeWidth={2.3}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const ClockGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const PinGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);
const ShieldCheckGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <path d="M12 3 5 6v6c0 4 3 6.7 7 8 4-1.3 7-4 7-8V6l-7-3Z" />
    <path d="M9.5 12 11 13.5l3.5-3.6" />
  </svg>
);
const FlagGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <path d="M5 21V4M5 4h11l-1.5 4L16 12H5" />
  </svg>
);
const WarnGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const RevokeGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);
const RefreshGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const SpinnerGlyph = ({ reduce, size = 14 }: { reduce: boolean; size?: number }) => (
  <motion.svg
    {...glyph}
    width={size}
    height={size}
    animate={reduce ? undefined : { rotate: 360 }}
    transition={reduce ? undefined : { duration: 0.9, ease: "linear", repeat: Infinity }}
    style={{ display: "inline-block" }}
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </motion.svg>
);
const KeyGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2 20 3M17 6l2 2M14 9l1.5 1.5" />
  </svg>
);
const ChevronGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Shared class helpers                                                         */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface)]";

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/* -------------------------------------------------------------------------- */
/* Custom sort dropdown — a real library listbox popover (not a native
   <select>): keyboard-navigable, dismiss-on-outside-click, animated, themed,
   and portaled so a scroll container can't crop it.                           */
/* -------------------------------------------------------------------------- */

const SORT_OPTIONS: { value: SessionSort; label: string }[] = [
  { value: "recent", label: "Recent activity" },
  { value: "device", label: "Device name" },
];

function SortSelect({ value, onChange }: { value: SessionSort; onChange: (v: SessionSort) => void }) {
  const reduce = useReducedMotion();
  const menu = useDisclosure({ idPrefix: "mk-sort", dismissable: true });
  const anchor = useAnchoredPortal(menu.open, { align: "end" });
  const currentIdx = Math.max(0, SORT_OPTIONS.findIndex((o) => o.value === value));
  const [activeIdx, setActiveIdx] = React.useState(currentIdx);

  React.useEffect(() => {
    if (menu.open) setActiveIdx(currentIdx);
  }, [menu.open, currentIdx]);

  const commit = (idx: number) => {
    onChange(SORT_OPTIONS[idx].value);
    menu.setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!menu.open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        menu.setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((a) => Math.min(SORT_OPTIONS.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((a) => Math.max(0, a - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActiveIdx(0); }
    else if (e.key === "End") { e.preventDefault(); setActiveIdx(SORT_OPTIONS.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(activeIdx); }
  };

  return (
    <div ref={menu.rootRef as React.RefObject<HTMLDivElement>} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        {...menu.triggerProps}
        ref={anchor.triggerRef as React.RefObject<HTMLButtonElement>}
        aria-haspopup="listbox"
        aria-label="Sort sessions"
        aria-activedescendant={menu.open ? `mk-sort-opt-${activeIdx}` : undefined}
        className={cn(
          "inline-flex min-h-[30px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]",
          focusRing,
        )}
      >
        {SORT_OPTIONS[currentIdx].label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {anchor.renderInPortal(
        <AnimatePresence>
          {menu.open && anchor.anchored ? (
            <motion.div
              {...menu.panelProps}
              ref={anchor.panelRef as React.RefObject<HTMLDivElement>}
              role="listbox"
              aria-label="Sort sessions"
              aria-activedescendant={`mk-sort-opt-${activeIdx}`}
              initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: EASE }}
              style={anchor.panelStyle}
              className="z-[70] min-w-[150px] overflow-auto rounded-lg bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
            >
              {SORT_OPTIONS.map((opt, i) => {
                const selected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    id={`mk-sort-opt-${i}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => commit(i)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[var(--color-fg)] outline-none",
                      i === activeIdx ? "bg-[var(--color-bg-secondary)]" : "hover:bg-[var(--color-bg-secondary)]",
                    )}
                  >
                    {opt.label}
                    {selected ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-accent)]"><path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : null}
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>,
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small presentational pieces                                                  */
/* -------------------------------------------------------------------------- */

function StateBadge({ state, reduce }: { state: SessionState; reduce: boolean }) {
  const meta = stateMeta(state);
  const v = statusVars(meta.tone);
  const inFlight = state === "pending-revocation";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[11px] font-semibold leading-none"
      style={{ color: v.color, borderColor: v.border, background: v.bg }}
    >
      {inFlight ? (
        <SpinnerGlyph reduce={reduce} size={11} />
      ) : state === "current" ? (
        <CheckGlyph />
      ) : state === "suspicious" ? (
        <WarnGlyph />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} aria-hidden />
      )}
      {meta.label}
    </span>
  );
}

/** Risk badge — calm icon + text, deliberately NOT animated. */
function RiskBadge({ risk }: { risk: SessionRisk }) {
  const tone: StatusTone = risk.level === "attention" ? "warning" : "info";
  const v = statusVars(tone);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-[3px] text-[11px] font-medium leading-none"
      style={{ color: v.color, borderColor: v.border, background: v.bg }}
    >
      <FlagGlyph />
      <span>
        <span className="sr-only">Flagged by security: </span>
        {risk.label}
      </span>
    </span>
  );
}

function TrustBadge({ label }: { label: string }) {
  const v = statusVars("success");
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-[3px] text-[11px] font-medium leading-none"
      style={{ color: v.color, borderColor: v.border, background: v.bg }}
    >
      <ShieldCheckGlyph />
      {label}
    </span>
  );
}

const controlBtn =
  "inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_50%,var(--color-border))] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50";

/** Secondary-destructive: error-tinted outlined chip (never a loud solid red). */
const dangerBtn =
  "inline-flex min-h-[32px] items-center gap-1 rounded-lg border px-2.5 py-1 text-[12px] font-semibold text-[var(--color-error)] transition-colors border-[color-mix(in_oklab,var(--color-error)_36%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-error)_20%,transparent)] hover:border-[color-mix(in_oklab,var(--color-error)_55%,var(--color-border))] disabled:cursor-not-allowed disabled:opacity-50";

/* -------------------------------------------------------------------------- */
/* Session row                                                                  */
/* -------------------------------------------------------------------------- */

interface RowProps {
  session: Session;
  reduce: boolean;
  fmt: (v: Date | number | string) => string;
  allowRevokeCurrent: boolean;
  registerAction: (id: string, el: HTMLButtonElement | null) => void;
  onInspect?: SessionSecurityCenterProps["onInspect"];
  onRevoke?: (session: Session) => void;
  onRenameDevice?: SessionSecurityCenterProps["onRenameDevice"];
  onMarkTrusted?: SessionSecurityCenterProps["onMarkTrusted"];
  onRemoveTrust?: SessionSecurityCenterProps["onRemoveTrust"];
  announce: (msg: string) => void;
}

function SessionRow({
  session,
  reduce,
  fmt,
  allowRevokeCurrent,
  registerAction,
  onInspect,
  onRevoke,
  onRenameDevice,
  onMarkTrusted,
  onRemoveTrust,
  announce,
}: RowProps) {
  const state = resolveState(session);
  const current = isCurrent(session);
  const revocable = isRevocable(session, allowRevokeCurrent);
  const pending = state === "pending-revocation";
  const details = useDisclosure({ idPrefix: "session-details" });

  const [renaming, setRenaming] = React.useState(false);
  const [draftName, setDraftName] = React.useState(session.device);
  const renameBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const revokeRef = React.useRef<HTMLButtonElement | null>(null);

  // The revoke control is the natural focus anchor after a neighbour is removed;
  // fall back to the details toggle for rows that can't be revoked.
  const anchorRef = React.useCallback(
    (el: HTMLButtonElement | null) => {
      revokeRef.current = el;
      registerAction(session.id, el);
    },
    [registerAction, session.id],
  );

  const startRename = () => {
    setDraftName(session.device);
    setRenaming(true);
  };
  const commitRename = () => {
    const next = draftName.trim();
    setRenaming(false);
    if (next && next !== session.device) {
      onRenameDevice?.(session, next);
      announce(`Renamed device to ${next}`);
    }
    requestAnimationFrame(() => renameBtnRef.current?.focus());
  };
  const cancelRename = () => {
    setRenaming(false);
    requestAnimationFrame(() => renameBtnRef.current?.focus());
  };

  const metaBits: React.ReactNode[] = [];
  if (session.browser || session.os) {
    metaBits.push(
      <span key="ua">{[session.browser, session.os].filter(Boolean).join(" · ")}</span>,
    );
  }
  if (session.location) {
    metaBits.push(
      <span key="loc" className="inline-flex items-center gap-1" title="Approximate, app-reported location">
        <PinGlyph />
        {session.location}
        <span className="sr-only"> (approximate, reported by the app)</span>
      </span>,
    );
  }
  metaBits.push(
    <span key="active" className="inline-flex items-center gap-1">
      <ClockGlyph />
      <span className="sr-only">Last active </span>
      {fmt(session.lastActiveTime)}
    </span>,
  );

  const nameId = `session-name-${session.id}`;

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "rounded-xl border px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-200",
          current
            ? "border-[color-mix(in_oklab,var(--color-accent)_42%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-surface))] shadow-[0_1px_0_color-mix(in_oklab,var(--color-accent)_18%,transparent),var(--shadow-sm)]"
            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[color-mix(in_oklab,var(--color-fg)_16%,var(--color-border))] hover:bg-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-surface))] hover:shadow-[var(--shadow-sm)]",
          pending && "opacity-75",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors",
              current
                ? "border-[color-mix(in_oklab,var(--color-accent)_28%,transparent)] bg-[color-mix(in_oklab,var(--color-accent)_14%,var(--color-surface))] text-[var(--color-accent)]"
                : "border-[color-mix(in_oklab,var(--color-border)_70%,transparent)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)]",
            )}
            aria-hidden
          >
            <DeviceIcon session={session} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {renaming ? (
                <span className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRename();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelRename();
                      }
                    }}
                    aria-label={`Device name for ${session.device}`}
                    className={cn(
                      "min-h-[30px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-[13px] text-[var(--color-fg)]",
                      focusRing,
                    )}
                  />
                  <button type="button" onClick={commitRename} className={cn(controlBtn, focusRing)}>
                    Save
                  </button>
                  <button type="button" onClick={cancelRename} className={cn(controlBtn, focusRing)}>
                    Cancel
                  </button>
                </span>
              ) : (
                <span id={nameId} className="truncate text-[13.5px] font-semibold text-[var(--color-fg)]">
                  {session.device}
                </span>
              )}
              <StateBadge state={state} reduce={reduce} />
              {session.trustLabel ? <TrustBadge label={session.trustLabel} /> : null}
              {session.risk ? <RiskBadge risk={session.risk} /> : null}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
              {metaBits.map((bit, i) => (
                <React.Fragment key={i}>{bit}</React.Fragment>
              ))}
            </div>

            {/* Actions */}
            {!renaming ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[color-mix(in_oklab,var(--color-border)_65%,transparent)] pt-2.5">
                {onInspect ? (
                  <button
                    type="button"
                    onClick={() => onInspect(session)}
                    className={cn(controlBtn, focusRing)}
                    aria-label={`Inspect session on ${session.device}`}
                  >
                    Inspect
                  </button>
                ) : null}

                {onRenameDevice ? (
                  <button
                    ref={renameBtnRef}
                    type="button"
                    onClick={startRename}
                    className={cn(controlBtn, focusRing)}
                    aria-label={`Rename ${session.device}`}
                  >
                    Rename
                  </button>
                ) : null}

                {session.trustLabel && onRemoveTrust ? (
                  <button
                    type="button"
                    onClick={() => onRemoveTrust(session)}
                    className={cn(controlBtn, focusRing)}
                    aria-label={`Remove trust from ${session.device}`}
                  >
                    Remove trust
                  </button>
                ) : !session.trustLabel && onMarkTrusted ? (
                  <button
                    type="button"
                    onClick={() => onMarkTrusted(session)}
                    className={cn(controlBtn, focusRing)}
                    aria-label={`Mark ${session.device} as trusted`}
                  >
                    Mark trusted
                  </button>
                ) : null}

                <button
                  type="button"
                  {...details.triggerProps}
                  className={cn(controlBtn, focusRing)}
                >
                  <motion.span
                    aria-hidden
                    className="inline-flex"
                    animate={reduce ? undefined : { rotate: details.open ? 90 : 0 }}
                    style={reduce ? { transform: details.open ? "rotate(90deg)" : "none" } : undefined}
                  >
                    <ChevronGlyph />
                  </motion.span>
                  Details
                </button>

                {/* Revoke — anchored for focus restoration; current session is
                    preserved (no control) unless the app allows it. */}
                {onRevoke && revocable ? (
                  <button
                    ref={anchorRef}
                    type="button"
                    disabled={pending}
                    onClick={() => onRevoke(session)}
                    aria-label={
                      current
                        ? `Sign out this device (${session.device})`
                        : `Revoke session on ${session.device}`
                    }
                    className={cn(dangerBtn, "ml-auto", focusRing)}
                  >
                    <RevokeGlyph />
                    {current ? "Sign out" : "Revoke"}
                  </button>
                ) : current ? (
                  <span
                    ref={anchorRef as unknown as React.Ref<HTMLButtonElement>}
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-[color-mix(in_oklab,var(--color-accent)_28%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_9%,transparent)] px-2 py-[3px] text-[11px] font-medium text-[var(--color-accent)]"
                  >
                    <ShieldCheckGlyph />
                    Current session — kept active
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Details disclosure — the full app-supplied metadata, useful on
                small screens where the inline meta row is compressed. */}
            <AnimatePresence initial={false}>
              {details.open ? (
                <motion.div
                  {...details.panelProps}
                  aria-label={`Details for ${session.device}`}
                  initial={reduce ? false : { opacity: 0, height: 0 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="overflow-hidden"
                >
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-[12px] sm:grid-cols-2">
                    {session.authMethod ? (
                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                        <dt className="inline-flex items-center gap-1 text-[var(--color-muted)]">
                          <KeyGlyph /> Signed in with
                        </dt>
                        <dd className="font-medium text-[var(--color-fg)]">{session.authMethod}</dd>
                      </div>
                    ) : null}
                    {session.ipSummary ? (
                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                        <dt className="text-[var(--color-muted)]">IP</dt>
                        <dd className="font-mono text-[var(--color-fg)]">
                          {session.ipSummary}
                          <span className="sr-only"> (summarised by the app)</span>
                        </dd>
                      </div>
                    ) : null}
                    {session.organization ? (
                      <div className="flex items-center justify-between gap-2 sm:justify-start">
                        <dt className="text-[var(--color-muted)]">Workspace</dt>
                        <dd className="font-medium text-[var(--color-fg)]">{session.organization}</dd>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 sm:justify-start">
                      <dt className="text-[var(--color-muted)]">First seen</dt>
                      <dd className="text-[var(--color-fg)]">{fmt(session.createdTime)}</dd>
                    </div>
                  </dl>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

/* -------------------------------------------------------------------------- */
/* Confirmation dialog                                                          */
/* -------------------------------------------------------------------------- */

interface ConfirmState {
  kind: "revoke" | "revoke-others";
  session?: Session;
  others?: Session[];
}

function ConfirmDialog({
  confirm,
  reduce,
  onConfirm,
  onCancel,
}: {
  confirm: ConfirmState;
  reduce: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    requestAnimationFrame(() => cancelRef.current?.focus());
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if (e.key === "Tab") {
      const focusable = ref.current?.querySelectorAll<HTMLElement>("button");
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
  };

  const isOthers = confirm.kind === "revoke-others";
  const count = confirm.others?.length ?? 0;
  const target = confirm.session;
  const current = target ? isCurrent(target) : false;

  const title = isOthers
    ? "Revoke all other sessions?"
    : current
      ? "Sign out this device?"
      : "Revoke this session?";

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-[color-mix(in_oklab,var(--color-fg)_20%,transparent)] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: EASE }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={onKeyDown}
        className="w-[min(94vw,26rem)] rounded-xl border p-4 shadow-[var(--shadow-lg,var(--shadow-md))]"
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
            <h2 id={titleId} className="text-[14px] font-semibold text-[var(--color-fg)]">
              {title}
            </h2>
            <p id={descId} className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted)]">
              {isOthers ? (
                <>
                  This signs out{" "}
                  <span className="font-semibold text-[var(--color-fg)]">
                    {count} other {count === 1 ? "session" : "sessions"}
                  </span>
                  . Your current session on this device stays signed in. Anyone using those
                  sessions will need to sign in again.
                </>
              ) : current ? (
                <>
                  This signs out{" "}
                  <span className="font-semibold text-[var(--color-fg)]">this device</span>. You
                  will need to sign in again to continue.
                </>
              ) : (
                <>
                  This signs out{" "}
                  <span className="font-semibold text-[var(--color-fg)]">{target?.device}</span>
                  {target?.location ? ` (${target.location})` : ""}. Whoever is using it will need to
                  sign in again.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={cn(
              "inline-flex min-h-[40px] items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]",
              focusRing,
            )}
          >
            Keep signed in
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors",
              focusRing,
            )}
            style={{
              color: statusVars("error").color,
              borderColor: statusVars("error").border,
              background: statusVars("error").bg,
            }}
          >
            <RevokeGlyph />
            {isOthers ? `Revoke ${count}` : current ? "Sign out" : "Revoke"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                      */
/* -------------------------------------------------------------------------- */

const FILTERS: { id: SessionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "idle", label: "Idle" },
  { id: "flagged", label: "Flagged" },
];

function matchesFilter(session: Session, filter: SessionFilter): boolean {
  if (filter === "all") return true;
  const state = resolveState(session);
  if (filter === "active") return state === "active" || state === "current";
  if (filter === "idle") return state === "idle";
  if (filter === "flagged") return !!session.risk || state === "suspicious";
  return true;
}

/* -------------------------------------------------------------------------- */
/* Main component                                                               */
/* -------------------------------------------------------------------------- */

export function SessionSecurityCenter({
  sessions,
  onInspect,
  onRevoke,
  onRevokeAllOthers,
  onRenameDevice,
  onMarkTrusted,
  onRemoveTrust,
  onRefresh,
  refreshing = false,
  allowRevokeCurrent = false,
  error,
  onRetry,
  filter,
  defaultFilter = "all",
  onFilterChange,
  sort,
  defaultSort = "recent",
  onSortChange,
  now,
  formatTimestamp,
  label = "Active sessions",
  description,
  className,
}: SessionSecurityCenterProps) {
  const reduce = useReducedMotion();

  const [filterInternal, setFilterInternal] = React.useState<SessionFilter>(defaultFilter);
  const activeFilter = filter ?? filterInternal;
  const setFilter = React.useCallback(
    (next: SessionFilter) => {
      if (filter === undefined) setFilterInternal(next);
      onFilterChange?.(next);
    },
    [filter, onFilterChange],
  );

  const [sortInternal, setSortInternal] = React.useState<SessionSort>(defaultSort);
  const activeSort = sort ?? sortInternal;
  const setSort = React.useCallback(
    (next: SessionSort) => {
      if (sort === undefined) setSortInternal(next);
      onSortChange?.(next);
    },
    [sort, onSortChange],
  );

  const [confirm, setConfirm] = React.useState<ConfirmState | null>(null);
  const [liveMessage, setLiveMessage] = React.useState("");
  const announce = React.useCallback((msg: string) => setLiveMessage(msg), []);

  const fmt = React.useMemo(
    () =>
      formatTimestamp ??
      ((v: Date | number | string) => defaultFormatTimestamp(v, now != null ? { relative: true, now } : { relative: true })),
    [formatTimestamp, now],
  );

  /* Focus restoration ----------------------------------------------------- */
  const actionRefs = React.useRef(new Map<string, HTMLButtonElement | null>());
  const registerAction = React.useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) actionRefs.current.set(id, el);
    else actionRefs.current.delete(id);
  }, []);
  // When a session is removed, focus its recorded neighbour.
  const focusAfterRemoval = React.useRef<{ removedId: string; neighbourId: string | null } | null>(null);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

  const currentSession = React.useMemo(() => sessions.find(isCurrent), [sessions]);

  /* Filter + sort --------------------------------------------------------- */
  const visible = React.useMemo(() => {
    const filtered = sessions.filter((s) => matchesFilter(s, activeFilter));
    const rank = (s: Session) => (isCurrent(s) ? 0 : 1); // current always first
    return filtered
      .map((s, i) => ({ s, i }))
      .sort((a, b) => {
        const r = rank(a.s) - rank(b.s);
        if (r !== 0) return r;
        if (activeSort === "device") return a.s.device.localeCompare(b.s.device) || a.i - b.i;
        // recent: most-recently-active first
        return toMs(b.s.lastActiveTime) - toMs(a.s.lastActiveTime) || a.i - b.i;
      })
      .map((x) => x.s);
  }, [sessions, activeFilter, activeSort]);

  /* The exact set "revoke all others" will affect (never includes current). */
  const others = React.useMemo(
    () => sessions.filter((s) => !isCurrent(s) && isRevocable(s, false)),
    [sessions],
  );

  /* After sessions change, if a revoked session is gone, restore focus. ---- */
  React.useEffect(() => {
    const pending = focusAfterRemoval.current;
    if (!pending) return;
    const stillPresent = sessions.some((s) => s.id === pending.removedId);
    if (stillPresent) return; // app kept it (e.g. pending-revocation) — leave focus be
    focusAfterRemoval.current = null;
    requestAnimationFrame(() => {
      const neighbour = pending.neighbourId ? actionRefs.current.get(pending.neighbourId) : null;
      if (neighbour) neighbour.focus();
      else headingRef.current?.focus();
    });
  }, [sessions]);

  /* Revocation flow ------------------------------------------------------- */
  const requestRevoke = React.useCallback((session: Session) => {
    setConfirm({ kind: "revoke", session });
  }, []);

  const requestRevokeOthers = React.useCallback(() => {
    if (others.length === 0) return;
    setConfirm({ kind: "revoke-others", others });
  }, [others]);

  const computeNeighbour = React.useCallback(
    (removedId: string): string | null => {
      const idx = visible.findIndex((s) => s.id === removedId);
      if (idx === -1) return null;
      const after = visible.slice(idx + 1).find((s) => s.id !== removedId);
      if (after) return after.id;
      const before = visible.slice(0, idx).reverse().find((s) => s.id !== removedId);
      return before ? before.id : null;
    },
    [visible],
  );

  const doConfirm = React.useCallback(() => {
    if (!confirm) return;
    if (confirm.kind === "revoke" && confirm.session) {
      const s = confirm.session;
      focusAfterRemoval.current = { removedId: s.id, neighbourId: computeNeighbour(s.id) };
      setConfirm(null);
      onRevoke?.(s);
      announce(`Revoking session on ${s.device}`);
    } else if (confirm.kind === "revoke-others") {
      const affected = confirm.others ?? others;
      setConfirm(null);
      onRevokeAllOthers?.(affected);
      announce(
        `Revoking ${affected.length} other ${affected.length === 1 ? "session" : "sessions"}. This device stays signed in.`,
      );
      requestAnimationFrame(() => headingRef.current?.focus());
    }
  }, [confirm, others, onRevoke, onRevokeAllOthers, announce, computeNeighbour]);

  const cancelConfirm = React.useCallback(() => {
    const target = confirm?.session;
    setConfirm(null);
    // Restore focus to the revoke control it came from, when still present.
    if (target) {
      requestAnimationFrame(() => actionRefs.current.get(target.id)?.focus());
    }
  }, [confirm]);

  const otherCount = others.length;

  return (
    <section
      aria-label={label}
      className={cn(
        "relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-[15px] font-semibold text-[var(--color-fg)] focus-visible:outline-none"
          >
            {label}
          </h2>
          <span className="inline-flex min-w-[22px] justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--color-muted)]">
            {sessions.length}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className={cn(controlBtn, focusRing)}
                aria-label="Refresh session list"
              >
                {refreshing ? <SpinnerGlyph reduce={reduce} /> : <RefreshGlyph />}
                Refresh
              </button>
            ) : null}
            {onRevokeAllOthers ? (
              <button
                type="button"
                onClick={requestRevokeOthers}
                disabled={otherCount === 0}
                className={cn(dangerBtn, focusRing)}
              >
                <RevokeGlyph />
                Revoke all other sessions
                {otherCount > 0 ? <span className="tabular-nums">({otherCount})</span> : null}
              </button>
            ) : null}
          </div>
        </div>

        {description ? (
          <p className="text-[12.5px] leading-relaxed text-[var(--color-muted)]">{description}</p>
        ) : null}

        {/* Filter + sort */}
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter sessions" className="flex flex-wrap items-center gap-1">
            {FILTERS.map((f) => {
              const on = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "min-h-[30px] rounded-lg border px-2 py-1 text-[12px] font-medium transition-colors",
                    on
                      ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-fg)]",
                    focusRing,
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
            <span id="mk-sort-label">Sort</span>
            <SortSelect value={activeSort} onChange={(v) => setSort(v)} />
          </div>
        </div>
      </div>

      {/* Error banner */}
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
              className="mx-4 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
              style={{
                color: statusVars("error").color,
                borderColor: statusVars("error").border,
                background: statusVars("error").bg,
              }}
            >
              <span className="mt-0.5 shrink-0">
                <WarnGlyph />
              </span>
              <span className="flex-1 text-[var(--color-fg)]">{error}</span>
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className={cn(controlBtn, focusRing, "shrink-0")}
                >
                  <RefreshGlyph />
                  Retry
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Session list */}
      <div className="px-4 py-3">
        {visible.length === 0 ? (
          <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-muted)]" aria-hidden>
              <ShieldCheckGlyph />
            </span>
            <p className="text-[13px] font-medium text-[var(--color-fg)]">
              {sessions.length === 0 ? "No active sessions" : "No sessions match this filter"}
            </p>
            <p className="max-w-[36ch] text-[12px] text-[var(--color-muted)]">
              {sessions.length === 0
                ? "When you sign in on a device, it will appear here so you can review and manage it."
                : "Try a different filter to see other sessions."}
            </p>
          </div>
        ) : (
          <ul role="list" className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {visible.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  reduce={reduce}
                  fmt={fmt}
                  allowRevokeCurrent={allowRevokeCurrent}
                  registerAction={registerAction}
                  onInspect={onInspect}
                  onRevoke={onRevoke ? requestRevoke : undefined}
                  onRenameDevice={onRenameDevice}
                  onMarkTrusted={onMarkTrusted}
                  onRemoveTrust={onRemoveTrust}
                  announce={announce}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Footer note — reinforces that the current session is preserved. */}
      {currentSession && !allowRevokeCurrent ? (
        <p className="border-t border-[var(--color-border)] px-4 py-2.5 text-[11.5px] text-[var(--color-muted)]">
          Revoking sessions signs out other devices. Your current session on this device is kept
          active.
        </p>
      ) : null}

      {/* Confirmation */}
      <AnimatePresence>
        {confirm ? (
          <ConfirmDialog
            confirm={confirm}
            reduce={reduce}
            onConfirm={doConfirm}
            onCancel={cancelConfirm}
          />
        ) : null}
      </AnimatePresence>

      {/* Polite announcer */}
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>
    </section>
  );
}

function toMs(value: Date | number | string): number {
  const d = value instanceof Date ? value : new Date(value);
  const t = d.getTime();
  return Number.isNaN(t) ? 0 : t;
}

export default SessionSecurityCenter;
