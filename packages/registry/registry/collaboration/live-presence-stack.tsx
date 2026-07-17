"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause } from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * LivePresenceStack — a live avatar stack for collaborative workspaces.
 *
 * Shows who is present, animates joins/leaves without reflowing the row
 * (layout animation + a reserved slot for the "+N" overflow), reflects a
 * per-user status (active / idle / editing / viewing) with a shape + label
 * (never color alone), and opens a keyboard-accessible detail popover that
 * lists every participant with their status in words.
 *
 * Presence is fully controlled: pass `users` and the stack renders it. It
 * holds no presence state of its own, so it composes with any realtime source.
 * Clean-room original.
 * ----------------------------------------------------------------------- */

export type PresenceStatus = "active" | "idle" | "editing" | "viewing";

export interface PresenceUser {
  /** Stable identity — drives join/leave animation and React keys. */
  id: string;
  /** Human name; also the accessible name of the avatar. */
  name: string;
  status: PresenceStatus;
  /** Optional explicit avatar color (any CSS color). Defaults to a hue derived from the name. */
  color?: string;
}

export interface LivePresenceStackProps {
  /** Controlled presence data (source of truth). */
  users: PresenceUser[];
  /** Maximum avatars shown before collapsing into a "+N" chip. */
  max?: number;
  /** Called when a participant row is chosen in the detail popover. */
  onSelect?: (userId: string) => void;
  /** Accessible group label. Defaults to "N people here". */
  label?: string;
  className?: string;
}

const STATUS_META: Record<PresenceStatus, { label: string; dot: string; live: boolean }> = {
  active: { label: "Active", dot: "var(--color-success)", live: true },
  editing: { label: "Editing", dot: "var(--color-accent)", live: true },
  viewing: { label: "Viewing", dot: "var(--color-fg)", live: false },
  idle: { label: "Idle", dot: "var(--color-muted)", live: false },
};

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/** Deterministic hue from a name so colors are stable across renders/sessions. */
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function avatarBackground(user: PresenceUser): string {
  if (user.color) return user.color;
  const h = hueFromName(user.name);
  return `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 66% 42%))`;
}

/** First letters of the first two words — "Ada L." → "AL". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + second).toUpperCase();
}

/* -- visual avatar ------------------------------------------------------- */

function AvatarFace({
  user,
  size,
  className,
  decorative = false,
}: {
  user: PresenceUser;
  size: number;
  className?: string;
  /** When true the face is aria-hidden (name is provided by an ancestor row). */
  decorative?: boolean;
}) {
  const dimmed = user.status === "idle";
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : `${user.name}, ${STATUS_META[user.status].label}`}
      title={`${user.name} · ${STATUS_META[user.status].label}`}
      className={cn(
        "grid shrink-0 select-none place-items-center rounded-full font-semibold text-white",
        "ring-2 ring-[var(--color-surface)] [border:1px_solid_rgba(0,0,0,0.08)]",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: avatarBackground(user),
        opacity: dimmed ? 0.55 : 1,
      }}
    >
      {initials(user.name)}
    </span>
  );
}

/** Status pip in the corner of an avatar. Shape + position, not color alone. */
function StatusPip({
  status,
  animate,
  size = 10,
}: {
  status: PresenceStatus;
  animate: boolean;
  size?: number;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 grid place-items-center rounded-full ring-2 ring-[var(--color-surface)]"
      style={{ width: size, height: size, background: meta.dot }}
    >
      {meta.live && animate ? (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: meta.dot }}
          animate={{ scale: [1, 2.1], opacity: [0.55, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
    </span>
  );
}

/* -- component ----------------------------------------------------------- */

export function LivePresenceStack({
  users,
  max = 5,
  onSelect,
  label,
  className,
}: LivePresenceStackProps) {
  const reduce = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const onScreen = useVisibilityPause(rootRef);
  const animatePips = !reduce && onScreen;

  const [open, setOpen] = React.useState(false);
  const reactId = React.useId();
  const panelId = `${reactId}-panel`;

  const count = users.length;
  const groupLabel = label ?? `${count} ${count === 1 ? "person" : "people"} here`;

  // Reserve one slot for the "+N" chip when we overflow, so the row width is
  // predictable and joins/leaves never shove the layout.
  const visibleCount = count > max ? Math.max(0, max - 1) : count;
  const visible = users.slice(0, visibleCount);
  const overflow = count - visibleCount;

  const avatarSize = 34;

  const close = React.useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Focus the first participant row when the popover opens.
  React.useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>("[data-participant]");
    first?.focus();
  }, [open]);

  // Dismiss on outside pointer press while open.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Roving arrow-key navigation + Escape inside the popover.
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    const rows = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>("[data-participant]") ?? [],
    );
    if (rows.length === 0) return;
    e.preventDefault();
    const current = rows.indexOf(document.activeElement as HTMLElement);
    let next = current;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = rows.length - 1;
    else if (e.key === "ArrowDown") next = current < 0 ? 0 : (current + 1) % rows.length;
    else next = current <= 0 ? rows.length - 1 : current - 1;
    rows[next]?.focus();
  };

  const enter = { opacity: 1, scale: 1, x: 0 };
  const from = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, x: -8 };
  const leave = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, x: 8 };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={groupLabel}
      className={cn("relative inline-flex w-fit items-center", className)}
    >
      {/* the pill: avatar cluster + expand affordance */}
      <div className="relative flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-2 pr-1 shadow-[var(--shadow-sm)]">
        <ul role="list" className="flex items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((user, i) => (
              <motion.li
                key={user.id}
                layout={!reduce}
                initial={from}
                animate={enter}
                exit={leave}
                transition={{ duration: 0.28, ease: EASE }}
                className="relative -ml-2 first:ml-0"
                style={{ zIndex: visible.length - i }}
              >
                <AvatarFace user={user} size={avatarSize} />
                <StatusPip status={user.status} animate={animatePips} />
              </motion.li>
            ))}
            {overflow > 0 ? (
              <motion.li
                key="overflow"
                layout={!reduce}
                initial={from}
                animate={enter}
                exit={leave}
                transition={{ duration: 0.28, ease: EASE }}
                className="relative -ml-2"
                style={{ zIndex: 0 }}
              >
                <span
                  role="img"
                  aria-label={`${overflow} more ${overflow === 1 ? "person" : "people"}`}
                  title={`${overflow} more`}
                  className="grid shrink-0 select-none place-items-center rounded-full text-[12px] font-semibold text-[var(--color-fg)] ring-2 ring-[var(--color-surface)] [border:1px_solid_var(--color-border)]"
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    background: "var(--color-bg-secondary)",
                  }}
                >
                  +{overflow}
                </span>
              </motion.li>
            ) : null}
          </AnimatePresence>
        </ul>

        {/* expand chevron (decorative; the overlay button is the real control) */}
        <span aria-hidden className="ml-1 mr-0.5 grid h-6 w-5 place-items-center text-[var(--color-muted)]">
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={reduce ? { transform: open ? "rotate(180deg)" : "none" } : undefined}
          >
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </span>

        {/* real trigger: overlays the whole pill so the cluster is one target */}
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`${open ? "Hide" : "Show"} details for ${groupLabel}`}
          onClick={() => setOpen((v) => !v)}
          className="absolute inset-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        />
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Participants"
            onKeyDown={onPanelKeyDown}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[248px] origin-top-left rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-lg)]"
          >
            <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {groupLabel}
            </p>
            <ul role="list" className="max-h-[288px] overflow-y-auto">
              {users.map((user) => {
                const meta = STATUS_META[user.status];
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      data-participant
                      onClick={() => {
                        onSelect?.(user.id);
                        close(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <span className="relative">
                        <AvatarFace user={user} size={30} decorative />
                        <StatusPip status={user.status} animate={false} size={9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-[var(--color-fg)]">
                          {user.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: meta.dot }}
                        />
                        {meta.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default LivePresenceStack;
