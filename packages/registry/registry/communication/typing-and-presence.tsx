"use client";

import * as React from "react";
import { motion, AnimatePresence, type Transition } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, useVisibilityPause, statusVars, type StatusTone } from "@/lib/motiq";

/* --------------------------------------------------------------------------
 * TypingAndPresence — a combined real-time TYPING + PARTICIPANT-PRESENCE strip
 * for messaging surfaces. It answers "who is here, and who is doing something
 * right now" in one restrained, accessible unit — more useful than three
 * bouncing dots.
 *
 * PRESENTATION ONLY. The application owns all presence and typing data and
 * passes it in; the component never opens a socket, never invents a status, and
 * never advances a state on its own. Motion only COMMUNICATES a change the app
 * just made — a join/leave, a presence transition, a typing start/stop, an
 * overflow change, a reconnection. There is no endless high-energy typing loop;
 * the ambient typing pulse is low-energy and PAUSES when the strip is offscreen
 * or the tab is hidden, and reduced-motion users see every change instantly.
 *
 * Accessibility is deliberate: presence is conveyed by shape + TEXT (never
 * colour alone), avatars fall back to initials, the overflow list is keyboard
 * navigable, and the live region is NON-SPAMMING — it voices the settled typing
 * summary ("Jamie is typing", "Three people are typing") and reconnection, not
 * every keystroke or micro-update. Clean-room original.
 * ----------------------------------------------------------------------- */

export type PresenceState = "online" | "active" | "idle" | "away" | "offline" | "reconnecting";

export type TypingState = "typing" | "recording" | "uploading" | "editing" | "stopped";

export type TypingAndPresenceMode = "compact" | "inline" | "floating-panel";

export interface Participant {
  /** Stable identity — drives keys, join/leave animation, and avatar hue. */
  id: string;
  /** Human name; also the avatar's accessible text and the typing summary. */
  displayName: string;
  /** Optional avatar image URL; when absent an initials + hue avatar is generated. */
  avatar?: string;
  /** App-owned presence. The component never changes this itself. */
  presenceState: PresenceState;
  /** App-owned live activity. Absent / "stopped" means not currently typing. */
  typingState?: TypingState;
  /** What they're doing it in — e.g. a channel or document ("#pricing"). */
  activeContext?: string;
  /** When they were last active (shown in the detail list). */
  lastActiveTime?: Date | number | string;
  /** Explicit avatar colour (any CSS colour). Defaults to a hue from the id. */
  color?: string;
  /** Optional role label shown in the detail list (e.g. "Owner"). */
  role?: string;
  /** Connection health, distinct from presence; drives the reconnecting cue. */
  connectionState?: "connected" | "reconnecting" | "disconnected";
}

export interface TypingAndPresenceProps {
  /** App-owned participants (source of truth). */
  participants: Participant[];
  /**
   * Convenience: ids the app reports as typing. A participant counts as typing
   * when its id is here OR its `typingState` is set and not "stopped".
   */
  typingParticipantIds?: string[];
  /** Shared context these people are in (channel/thread) — used in labels. */
  context?: string;
  /** Max avatars shown before collapsing into a keyboard-accessible "+N". */
  maxVisible?: number;
  /** Layout: a one-line strip, an inline block, or an elevated panel. */
  mode?: TypingAndPresenceMode;
  /** Called when a participant is chosen from the overflow/detail list. */
  onParticipantSelect?: (participantId: string) => void;
  /** Render a custom avatar/cell for a participant (escape hatch). */
  renderParticipant?: (participant: Participant) => React.ReactNode;
  /** Describe a participant's current activity (detail rows). */
  formatActivity?: (participant: Participant) => string;
  /** Voice the settled typing summary in a polite live region. Default true. */
  announceTyping?: boolean;
  /** Density modifier — smaller avatars, tighter text. Combines with `mode`. */
  compact?: boolean;
  /** Accessible group label. Defaults from the participant count + context. */
  label?: string;
  className?: string;
}

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

/* -- presence + typing vocabulary --------------------------------------- */

const PRESENCE_META: Record<PresenceState, { label: string; tone: StatusTone; live: boolean }> = {
  online: { label: "Online", tone: "success", live: true },
  active: { label: "Active", tone: "active", live: true },
  idle: { label: "Idle", tone: "warning", live: false },
  away: { label: "Away", tone: "neutral", live: false },
  offline: { label: "Offline", tone: "neutral", live: false },
  reconnecting: { label: "Reconnecting", tone: "info", live: true },
};

const TYPING_VERB: Record<Exclude<TypingState, "stopped">, string> = {
  typing: "typing",
  recording: "recording audio",
  uploading: "uploading a file",
  editing: "editing",
};

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five",
  "six", "seven", "eight", "nine", "ten",
];

function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/**
 * Build the restrained typing summary. Pure + exported so its grammar is
 * unit-tested independently of the render:
 *   []                       → ""
 *   ["Jamie"]                → "Jamie is typing"
 *   ["Jamie","Morgan"]       → "Jamie and Morgan are typing"
 *   ["Jamie","Morgan","Ada"] → "Three people are typing"
 * `verbPhrase` swaps the activity ("recording audio", "uploading a file", …)
 * while the auxiliary is/are is chosen by count.
 */
export function typingSummary(names: string[], verbPhrase = "typing"): string {
  const n = names.length;
  if (n === 0) return "";
  if (n === 1) return `${names[0]} is ${verbPhrase}`;
  if (n === 2) return `${names[0]} and ${names[1]} are ${verbPhrase}`;
  return `${capitalize(numberWord(n))} people are ${verbPhrase}`;
}

/* -- helpers ------------------------------------------------------------- */

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + second).toUpperCase();
}

function isTyping(p: Participant, typingIds: Set<string>): boolean {
  return (p.typingState != null && p.typingState !== "stopped") || typingIds.has(p.id);
}

/** Shared verb for a set of typers — their common activity, else "typing". */
function sharedVerbPhrase(typers: Participant[]): string {
  const verbs = new Set<string>();
  for (const p of typers) {
    const st = p.typingState && p.typingState !== "stopped" ? p.typingState : "typing";
    verbs.add(TYPING_VERB[st]);
  }
  return verbs.size === 1 ? [...verbs][0] : "typing";
}

/* -- avatar -------------------------------------------------------------- */

function Avatar({
  participant,
  size,
  decorative = false,
}: {
  participant: Participant;
  size: number;
  /** When true the face is aria-hidden (name provided by an ancestor row). */
  decorative?: boolean;
}) {
  const meta = PRESENCE_META[participant.presenceState];
  const dimmed = participant.presenceState === "offline" || participant.presenceState === "away";
  const label = `${participant.displayName}, ${meta.label}`;
  const h = hueFromString(participant.color ?? participant.id + participant.displayName);
  const bg = participant.color
    ?? `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 66% 42%))`;

  const ring = cn(
    "shrink-0 select-none rounded-full ring-2 ring-[var(--color-surface)] [border:1px_solid_rgba(0,0,0,0.08)]",
  );
  const style = { width: size, height: size, opacity: dimmed ? 0.55 : 1 };

  if (participant.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={participant.avatar}
        alt={decorative ? "" : label}
        aria-hidden={decorative || undefined}
        title={label}
        className={cn(ring, "object-cover")}
        style={style}
      />
    );
  }
  return (
    <span
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      title={label}
      className={cn(ring, "grid place-items-center font-semibold text-white")}
      style={{ ...style, fontSize: Math.round(size * 0.4), background: bg }}
    >
      {initials(participant.displayName)}
    </span>
  );
}

/** Presence pip: shape + position + colour + (in the list) a text label. */
function PresencePip({
  state,
  animate,
  size = 10,
}: {
  state: PresenceState;
  animate: boolean;
  size?: number;
}) {
  const meta = PRESENCE_META[state];
  const v = statusVars(meta.tone);
  const hollow = state === "away" || state === "offline";
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 grid place-items-center rounded-full ring-2 ring-[var(--color-surface)]"
      style={{
        width: size,
        height: size,
        background: hollow ? "var(--color-surface)" : v.color,
        boxShadow: hollow ? `inset 0 0 0 2px ${v.color}` : undefined,
      }}
    >
      {meta.live && animate ? (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: v.color }}
          animate={{ scale: [1, 2], opacity: [0.5, 0] }}
          transition={{ duration: state === "reconnecting" ? 1 : 1.8, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}
    </span>
  );
}

/* -- typing dots (low-energy, pauseable) --------------------------------- */

function TypingDots({ animate }: { animate: boolean }) {
  return (
    <span aria-hidden className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
          animate={animate ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.7 }}
          transition={
            animate
              ? { duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }
              : { duration: 0 }
          }
        />
      ))}
    </span>
  );
}

/* -- detail list (overflow + panel) -------------------------------------- */

function ParticipantList({
  participants,
  typingIds,
  formatActivity,
  onSelect,
  onEscape,
  listRef,
}: {
  participants: Participant[];
  typingIds: Set<string>;
  formatActivity?: (p: Participant) => string;
  onSelect?: (id: string) => void;
  onEscape?: () => void;
  listRef?: React.RefObject<HTMLUListElement | null>;
}) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onEscape?.();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = Array.from(
      listRef?.current?.querySelectorAll<HTMLElement>("[data-participant]") ?? [],
    );
    if (rows.length === 0) return;
    e.preventDefault();
    const cur = rows.indexOf(document.activeElement as HTMLElement);
    let next = cur;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = rows.length - 1;
    else if (e.key === "ArrowDown") next = cur < 0 ? 0 : (cur + 1) % rows.length;
    else next = cur <= 0 ? rows.length - 1 : cur - 1;
    rows[next]?.focus();
  };

  return (
    <ul ref={listRef} role="list" onKeyDown={onKeyDown} className="max-h-[300px] overflow-y-auto">
      {participants.map((p) => {
        const meta = PRESENCE_META[p.presenceState];
        const typing = isTyping(p, typingIds);
        const activity = formatActivity
          ? formatActivity(p)
          : typing
            ? `${capitalize(TYPING_VERB[(p.typingState && p.typingState !== "stopped" ? p.typingState : "typing")])}${p.activeContext ? ` in ${p.activeContext}` : ""}`
            : meta.label + (p.activeContext ? ` · ${p.activeContext}` : "");
        return (
          <li key={p.id}>
            <button
              type="button"
              data-participant
              onClick={() => onSelect?.(p.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <span className="relative">
                <Avatar participant={p} size={30} decorative />
                <PresencePip state={p.presenceState} animate={false} size={9} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-medium text-[var(--color-fg)]">
                    {p.displayName}
                  </span>
                  {p.role ? (
                    <span className="shrink-0 rounded px-1 py-px text-[10px] font-medium text-[var(--color-muted)] [border:1px_solid_var(--color-border)]">
                      {p.role}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
                  {typing ? <TypingDots animate={false} /> : (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: statusVars(meta.tone).color }}
                    />
                  )}
                  <span className="truncate">{activity}</span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/* -- typing region (avatars + dots + summary) ---------------------------- */

function TypingRegion({
  typers,
  animate,
  compact,
}: {
  typers: Participant[];
  animate: boolean;
  compact: boolean;
}) {
  const summary = typingSummary(typers.map((p) => p.displayName), sharedVerbPhrase(typers));
  const av = compact ? 18 : 22;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {!compact ? (
        <span className="flex -space-x-1.5" aria-hidden>
          {typers.slice(0, 3).map((p) => (
            <Avatar key={p.id} participant={p} size={av} decorative />
          ))}
        </span>
      ) : null}
      <TypingDots animate={animate} />
      <span className={cn("truncate text-[var(--color-muted)]", compact ? "text-[12px]" : "text-[13px]")}>
        {summary}
      </span>
    </span>
  );
}

/* -- presence cluster (avatar stack + overflow disclosure) --------------- */

function PresenceCluster({
  participants,
  typingIds,
  maxVisible,
  compact,
  animatePips,
  reduce,
  formatActivity,
  onParticipantSelect,
  label,
}: {
  participants: Participant[];
  typingIds: Set<string>;
  maxVisible: number;
  compact: boolean;
  animatePips: boolean;
  reduce: boolean;
  formatActivity?: (p: Participant) => string;
  onParticipantSelect?: (id: string) => void;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const reactId = React.useId();
  const panelId = `${reactId}-panel`;

  const count = participants.length;
  const visibleCount = count > maxVisible ? Math.max(0, maxVisible - 1) : count;
  const visible = participants.slice(0, visibleCount);
  const overflow = count - visibleCount;
  const size = compact ? 26 : 32;

  const close = React.useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>("[data-participant]")?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const from = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, x: -8 };
  const enter = { opacity: 1, scale: 1, x: 0 };
  const leave = reduce ? { opacity: 0 } : { opacity: 0, scale: 0.4, x: 8 };

  return (
    <div ref={rootRef} className="relative inline-flex items-center">
      <div className="relative flex items-center rounded-full [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] py-1 pl-2 pr-1 shadow-[var(--shadow-sm)]">
        <ul role="list" className="flex items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((p, i) => (
              <motion.li
                key={p.id}
                layout={!reduce}
                initial={from}
                animate={enter}
                exit={leave}
                transition={{ duration: 0.28, ease: EASE }}
                className="relative -ml-2 first:ml-0"
                style={{ zIndex: visible.length - i }}
              >
                <Avatar participant={p} size={size} />
                <PresencePip state={p.presenceState} animate={animatePips} />
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
                  aria-hidden
                  className="grid shrink-0 select-none place-items-center rounded-full text-[12px] font-semibold text-[var(--color-fg)] ring-2 ring-[var(--color-surface)] [border:1px_solid_var(--color-border)]"
                  style={{ width: size, height: size, background: "var(--color-bg-secondary)" }}
                >
                  +{overflow}
                </span>
              </motion.li>
            ) : null}
          </AnimatePresence>
        </ul>

        <span aria-hidden className="ml-1 mr-0.5 grid h-6 w-5 place-items-center text-[var(--color-muted)]">
          <motion.svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={reduce ? { transform: open ? "rotate(180deg)" : "none" } : undefined}
          >
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </span>

        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`${open ? "Hide" : "Show"} details for ${label}`}
          onClick={() => setOpen((v) => !v)}
          className="absolute inset-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
        />
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={panelId}
            role="dialog"
            aria-label={label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute left-0 top-full z-50 mt-2 min-w-[256px] origin-top-left rounded-xl [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-lg)]"
          >
            <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {label}
            </p>
            <ParticipantList
              participants={participants}
              typingIds={typingIds}
              formatActivity={formatActivity}
              onSelect={(id) => {
                onParticipantSelect?.(id);
                close(true);
              }}
              onEscape={() => close(true)}
              listRef={listRef}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -- root ---------------------------------------------------------------- */

export function TypingAndPresence({
  participants,
  typingParticipantIds,
  context,
  maxVisible = 4,
  mode = "inline",
  onParticipantSelect,
  renderParticipant,
  formatActivity,
  announceTyping = true,
  compact = false,
  label,
  className,
}: TypingAndPresenceProps) {
  const reduce = useReducedMotion();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const onScreen = useVisibilityPause(rootRef);
  const animate = !reduce && onScreen;

  const typingIds = React.useMemo(
    () => new Set(typingParticipantIds ?? []),
    [typingParticipantIds],
  );
  const typers = React.useMemo(
    () => participants.filter((p) => isTyping(p, typingIds)),
    [participants, typingIds],
  );

  const onlineCount = participants.filter(
    (p) => p.presenceState !== "offline" && p.presenceState !== "away",
  ).length;
  const reconnecting = participants.filter((p) => p.presenceState === "reconnecting");

  const count = participants.length;
  const groupLabel =
    label ??
    `${count} ${count === 1 ? "participant" : "participants"}${context ? ` in ${context}` : ""}`;

  const typingText = typingSummary(typers.map((p) => p.displayName), sharedVerbPhrase(typers));

  /* -- non-spamming live region: voice the SETTLED summary only ---------- */
  const reconnectingNames = reconnecting.map((p) => p.displayName).join(", ");
  const [liveMessage, setLiveMessage] = React.useState("");
  const settleRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (settleRef.current) clearTimeout(settleRef.current);
    const reconnectMsg = reconnectingNames
      ? `${reconnectingNames} ${reconnecting.length === 1 ? "is" : "are"} reconnecting`
      : "";
    // Debounce so rapid start/stop of typing does not spam the live region.
    settleRef.current = setTimeout(() => {
      const msg = announceTyping ? typingText : "";
      setLiveMessage([reconnectMsg, msg].filter(Boolean).join(". "));
    }, 500);
    return () => {
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, [typingText, announceTyping, reconnectingNames, reconnecting.length]);

  const cluster = (
    <PresenceCluster
      participants={participants}
      typingIds={typingIds}
      maxVisible={maxVisible}
      compact={compact}
      animatePips={animate}
      reduce={reduce}
      formatActivity={formatActivity}
      onParticipantSelect={onParticipantSelect}
      label={groupLabel}
    />
  );

  const presenceSummary = (
    <span className={cn("text-[var(--color-muted)]", compact ? "text-[12px]" : "text-[13px]")}>
      {onlineCount} online{count > onlineCount ? ` · ${count} total` : ""}
    </span>
  );

  const typingSlot = (
    <AnimatePresence mode="wait" initial={false}>
      {typers.length > 0 ? (
        <motion.span
          key="typing"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
          className="inline-flex min-w-0"
        >
          <TypingRegion typers={typers} animate={animate} compact={compact} />
        </motion.span>
      ) : (
        <motion.span
          key="presence"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: EASE }}
        >
          {presenceSummary}
        </motion.span>
      )}
    </AnimatePresence>
  );

  const liveRegion = (
    <div aria-live="polite" role="status" className="sr-only">
      {liveMessage}
    </div>
  );

  /* -- floating-panel: an elevated card with a full participant list ----- */
  if (mode === "floating-panel") {
    return (
      <div
        ref={rootRef}
        role="group"
        aria-label={groupLabel}
        className={cn(
          "flex w-full max-w-[340px] flex-col rounded-2xl [border:1px_solid_var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]",
          className,
        )}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3.5 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-[var(--color-fg)]">
              {context ?? "Participants"}
            </span>
            <span className="text-[12px] text-[var(--color-muted)]">{onlineCount} online</span>
          </span>
          <span className="flex -space-x-1.5" aria-hidden>
            {participants.slice(0, 3).map((p) => (
              <Avatar key={p.id} participant={p} size={24} decorative />
            ))}
          </span>
        </div>

        <div className="p-1.5">
          {renderParticipant ? (
            <ul role="list" className="flex flex-col">
              {participants.map((p) => (
                <li key={p.id}>{renderParticipant(p)}</li>
              ))}
            </ul>
          ) : (
            <ParticipantList
              participants={participants}
              typingIds={typingIds}
              formatActivity={formatActivity}
              onSelect={onParticipantSelect}
            />
          )}
        </div>

        <div className="min-h-[38px] border-t border-[var(--color-border)] px-3.5 py-2">
          {typingSlot}
        </div>
        {liveRegion}
      </div>
    );
  }

  /* -- compact: a single dense line -------------------------------------- */
  if (mode === "compact") {
    return (
      <div
        ref={rootRef}
        role="group"
        aria-label={groupLabel}
        className={cn("inline-flex max-w-full items-center gap-2.5", className)}
      >
        {cluster}
        <span className="min-w-0 truncate">{typingSlot}</span>
        {liveRegion}
      </div>
    );
  }

  /* -- inline (default): cluster + a divider + the typing/presence slot --- */
  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={groupLabel}
      className={cn("flex w-full max-w-full flex-wrap items-center gap-3", className)}
    >
      {cluster}
      <span aria-hidden className="h-5 w-px bg-[var(--color-border)]" />
      <span className="min-w-0 flex-1">{typingSlot}</span>
      {liveRegion}
    </div>
  );
}

export default TypingAndPresence;
