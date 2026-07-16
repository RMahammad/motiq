"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion, statusVars, type StatusTone } from "@/lib/motionkit";

/**
 * MentionSuggestions — the accessible popup half of an @-mention experience.
 *
 * The APPLICATION owns text editing and persistence: it owns the editable field
 * (an <input> or <textarea>), it detects the "@" trigger + the query that
 * follows, and it performs the actual text insertion when a suggestion is
 * chosen. This component only *presents* the filtered suggestion list and drives
 * selection — it never reads or mutates the field's value, opens a socket, or
 * fetches anyone. It is fully controlled: the app passes `open` + `query` and the
 * component renders the matching people/teams.
 *
 * Critically, keyboard focus never leaves the app's field. The component wires
 * the ARIA combobox pattern onto the app's `inputRef` — role="combobox",
 * aria-expanded, aria-controls, aria-autocomplete, and a roving
 * aria-activedescendant that points at the highlighted option — and attaches an
 * Arrow / Home / End / Enter / Escape key handler to that same field. The
 * listbox is a sibling popup; the caret and DOM focus stay in the field the
 * whole time, so typing is never interrupted.
 *
 * Accessibility: role="listbox" of role="option" rows; the active option carries
 * aria-selected and is announced (with its role/status) through a polite live
 * region that also reports the match count. Disabled entries keep a readable
 * reason and are skipped by keyboard navigation. Presence status is conveyed by
 * icon + text, never colour alone. Avatars are initials-only (no network images).
 * Under prefers-reduced-motion the popup appears in its final state. The popup is
 * anchored to its container with responsive widths (no fixed desktop-only
 * coordinates), so it is usable on mobile. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** App-owned presence. Rendered with an icon + text label — never colour alone. */
export type MentionPresence = "online" | "away" | "offline" | "dnd" | (string & {});

export interface MentionUser {
  /** Stable id — drives keys, avatar hue, and option ids. */
  id: string;
  /** Human label, e.g. "Mira Delacroix" or "Design Team". */
  name: string;
  /** Handle shown next to the name, e.g. "@mira". */
  handle?: string;
  /** Secondary line, e.g. a role ("Product") or member count ("6 people"). */
  role?: string;
  /** Presence badge (icon + text). Omit for none. */
  presence?: MentionPresence;
  /** Explicitly non-selectable; the app owns why (see `disabledReason`). */
  disabled?: boolean;
  /** Reason surfaced when the entry can't be mentioned. */
  disabledReason?: string;
  /** Group id — matched against the `groups` prop for section ordering. */
  group?: string;
  /** Literal text the app should insert. Defaults to `handle` or `@name`. */
  value?: string;
  /** Extra search terms (aliases, email local-part) matched by the filter. */
  keywords?: string[];
}

export interface MentionGroup {
  id: string;
  label: string;
}

/** Context handed to `onSelect` so the app can perform the insertion. */
export interface MentionSelectContext {
  /** The active query after "@" (without the "@"), as the app supplied it. */
  query: string;
  /** The literal text to insert (resolved from `item.value` / handle / name). */
  value: string;
}

export interface MentionSuggestionsProps {
  /** Controlled: whether the popup is shown. The app drives this from "@" detection. */
  open: boolean;
  /** Controlled: the query after "@" (without the "@"). Drives filtering + messaging. */
  query: string;
  /** People/teams that can be mentioned. App-owned data. */
  items: MentionUser[];
  /**
   * The app's editable field. The component wires the ARIA combobox pattern and
   * key handling onto it — focus and the caret never leave this element.
   */
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  /** Fired when a suggestion is chosen (click or Enter). The app inserts the text. */
  onSelect: (item: MentionUser, ctx: MentionSelectContext) => void;
  /** Ask the app to change `open` (Escape, outside interaction). */
  onOpenChange?: (open: boolean) => void;
  /** Optional group ordering + labels; items reference groups via `item.group`. */
  groups?: MentionGroup[];
  /** App-owned: suggestions are being fetched. Renders a loading state. */
  loading?: boolean;
  /** Override filtering. Default: case-insensitive substring over name/handle/keywords. */
  filter?: (item: MentionUser, query: string) => boolean;
  /** Max suggestions rendered. Default 8. */
  limit?: number;
  /** Accessible label for the listbox. */
  label?: string;
  /** Empty-state text when nothing matches. */
  emptyLabel?: string;
  /** Loading-state text. */
  loadingLabel?: string;
  /** Popup alignment relative to its container. */
  align?: "start" | "end";
  /**
   * Portal + anchor the popup INSIDE this positioned ancestor (`position: absolute`)
   * instead of `<body>` (`position: fixed`). Use for contained previews / cards
   * where a viewport-fixed overlay would escape the frame and re-anchor on page
   * scroll. The referenced element should be `position: relative`. Defaults to the
   * document body (the normal app behaviour).
   */
  container?: React.RefObject<HTMLElement | null>;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Presence vocabulary — icon + text, never colour alone                       */
/* -------------------------------------------------------------------------- */

const PRESENCE_META: Record<string, { label: string; tone: StatusTone }> = {
  online: { label: "Online", tone: "success" },
  away: { label: "Away", tone: "warning" },
  dnd: { label: "Do not disturb", tone: "error" },
  offline: { label: "Offline", tone: "neutral" },
};

function presenceMeta(p: MentionPresence): { label: string; tone: StatusTone } {
  return PRESENCE_META[p] ?? { label: String(p), tone: "neutral" };
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

const AtGlyph = () => (
  <svg {...glyph} width={15} height={15}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </svg>
);
const LockGlyph = () => (
  <svg {...glyph} width={12} height={12} strokeWidth={2.2}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
const SpinnerGlyph = ({ reduce }: { reduce: boolean }) => (
  <motion.svg
    {...glyph}
    width={15}
    height={15}
    animate={reduce ? undefined : { rotate: 360 }}
    transition={reduce ? undefined : { duration: 0.9, ease: "linear", repeat: Infinity }}
    style={{ display: "inline-block" }}
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </motion.svg>
);

/** Presence indicator: a distinct SHAPE per state (not colour alone) + sr text.
 *  Discord-style glyphs — solid disc (online), crescent (away), minus (dnd),
 *  hollow ring (offline). Size-parametric so the same glyph reads cleanly as a
 *  tiny inline label dot and as a slightly larger avatar-corner badge. */
function PresenceDot({ presence, size = 10 }: { presence: MentionPresence; size?: number }) {
  const meta = presenceMeta(presence);
  const svars = statusVars(meta.tone);
  const key = String(presence);
  const box: React.CSSProperties = { width: size, height: size };
  const cut = Math.round(size * 0.72); // away-crescent cutout
  const off = -Math.round(size * 0.2);
  return (
    <span className="relative inline-block shrink-0 align-middle" style={box} title={meta.label}>
      {key === "online" ? (
        // filled disc
        <span className="block h-full w-full rounded-full" style={{ background: svars.color }} aria-hidden />
      ) : key === "offline" ? (
        // hollow ring (surface fill so it reads as an outline on any backdrop)
        <span className="block h-full w-full rounded-full bg-[var(--color-surface)]" style={{ border: `2px solid ${svars.color}` }} aria-hidden />
      ) : key === "dnd" ? (
        // minus / no-entry bar
        <span className="grid h-full w-full place-items-center rounded-full" style={{ background: svars.color }} aria-hidden>
          <span className="rounded-full bg-[var(--color-surface)]" style={{ height: Math.max(1.5, size * 0.18), width: size * 0.55 }} />
        </span>
      ) : (
        // away — crescent moon (a disc with an offset surface-coloured cutout)
        <span className="relative block h-full w-full overflow-hidden rounded-full" style={{ background: svars.color }} aria-hidden>
          <span className="absolute rounded-full bg-[var(--color-surface)]" style={{ width: cut, height: cut, right: off, top: off }} aria-hidden />
        </span>
      )}
      <span className="sr-only">{meta.label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar — initials only, deterministic hue (no network images)               */
/* -------------------------------------------------------------------------- */

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

function Avatar({ user, size = 30 }: { user: MentionUser; size?: number }) {
  const h = hueFromString(user.id + user.name);
  const bg = `linear-gradient(140deg, hsl(${h} 60% 52%), hsl(${(h + 42) % 360} 64% 42%))`;
  return (
    <span
      aria-hidden
      className="grid shrink-0 select-none place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4), background: bg }}
    >
      {initials(user.name)}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared class helpers                                                         */
/* -------------------------------------------------------------------------- */

const EASE = [0.2, 0, 0, 1] as const;

function mentionValue(item: MentionUser): string {
  if (item.value != null) return item.value;
  if (item.handle) return item.handle;
  return `@${item.name.replace(/\s+/g, "")}`;
}

/* -------------------------------------------------------------------------- */
/* Option row                                                                  */
/* -------------------------------------------------------------------------- */

function OptionRow({
  item,
  optionId,
  active,
  disabled,
  reason,
  onSelect,
  onHover,
}: {
  item: MentionUser;
  optionId: string;
  active: boolean;
  disabled: boolean;
  reason?: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  const descId = disabled && reason ? `${optionId}-reason` : undefined;
  const presence = item.presence ? presenceMeta(item.presence) : null;
  // Accessible name: name + handle + role + presence, so a screen reader hears
  // the whole row from aria-activedescendant alone.
  const a11yName = [item.name, item.handle, item.role, presence?.label]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      id={optionId}
      role="option"
      aria-selected={active}
      aria-disabled={disabled || undefined}
      aria-label={a11yName}
      aria-describedby={descId}
      // Keep DOM focus on the app's field; commit on click.
      onMouseDown={(e) => e.preventDefault()}
      onMouseMove={onHover}
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "flex min-h-[44px] scroll-my-1 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
        active && !disabled ? "bg-[var(--color-bg-secondary)]" : "bg-transparent",
        disabled && "cursor-not-allowed opacity-60",
      )}
      style={active && !disabled ? { boxShadow: "inset 2px 0 0 0 var(--color-accent)" } : undefined}
    >
      <span className="relative shrink-0">
        <Avatar user={item} size={36} />
        {item.presence ? (
          <span className="absolute bottom-0 right-0 grid place-items-center rounded-full bg-[var(--color-surface)] ring-2 ring-[var(--color-surface)]">
            <PresenceDot presence={item.presence} size={11} />
          </span>
        ) : null}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          <span className="truncate text-[13.5px] font-semibold text-[var(--color-fg)]">{item.name}</span>
          {item.handle ? (
            <span className="truncate font-mono text-[11.5px] text-[var(--color-muted)]">{item.handle}</span>
          ) : null}
        </span>

        {item.role || presence ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[var(--color-muted)]">
            {item.role ? <span className="truncate">{item.role}</span> : null}
            {presence && !disabled ? (
              <span className="inline-flex items-center gap-1">
                <PresenceDot presence={item.presence!} />
                {presence.label}
              </span>
            ) : null}
          </span>
        ) : null}

        {disabled && reason ? (
          <span id={descId} className="inline-flex items-center gap-1 text-[11.5px] text-[var(--color-muted)]">
            <LockGlyph />
            {reason}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function MentionSuggestions({
  open,
  query,
  items,
  inputRef,
  onSelect,
  onOpenChange,
  groups,
  loading = false,
  filter,
  limit = 8,
  label = "Mention suggestions",
  emptyLabel = "No people match",
  loadingLabel = "Searching…",
  align = "start",
  container,
  className,
}: MentionSuggestionsProps) {
  const reduce = useReducedMotion();
  const baseId = React.useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = React.useCallback((id: string) => `${baseId}-opt-${id}`, [baseId]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  /* Filtering + section ordering ------------------------------------------ */
  const needle = query.trim().toLowerCase();

  const defaultMatch = React.useCallback(
    (item: MentionUser) => {
      if (!needle) return true;
      const hay = [item.name, item.handle, item.role, ...(item.keywords ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    },
    [needle],
  );

  const visible = React.useMemo(() => {
    const match = filter ? (i: MentionUser) => filter(i, query) : defaultMatch;
    return items.filter(match).slice(0, Math.max(0, limit));
  }, [items, filter, query, defaultMatch, limit]);

  const sections = React.useMemo(() => {
    if (groups && groups.length) {
      const known = new Set(groups.map((g) => g.id));
      const out: Array<{ label?: string; options: MentionUser[] }> = [];
      for (const g of groups) {
        const opts = visible.filter((i) => i.group === g.id);
        if (opts.length) out.push({ label: g.label, options: opts });
      }
      const ungrouped = visible.filter((i) => !i.group || !known.has(i.group));
      if (ungrouped.length) out.push({ label: out.length ? "Other" : undefined, options: ungrouped });
      return out;
    }
    return [{ options: visible }];
  }, [visible, groups]);

  /** Flat, render-ordered list used for keyboard navigation. */
  const flat = React.useMemo(() => sections.flatMap((s) => s.options), [sections]);
  const isDisabled = React.useCallback((item: MentionUser) => !!item.disabled, []);

  /* Refs mirroring the latest state for a stable native key handler --------- */
  const openRef = React.useRef(open);
  const flatRef = React.useRef(flat);
  const activeIndexRef = React.useRef(activeIndex);
  const queryRef = React.useRef(query);
  openRef.current = open;
  flatRef.current = flat;
  activeIndexRef.current = activeIndex;
  queryRef.current = query;

  /* Reset the active row when the popup opens or the query changes ---------- */
  React.useEffect(() => {
    if (!open) return;
    const first = flat.findIndex((i) => !isDisabled(i));
    setActiveIndex(first >= 0 ? first : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  React.useEffect(() => {
    setActiveIndex((i) => Math.min(i, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  /* Scroll the active option into view ------------------------------------- */
  React.useEffect(() => {
    if (!open) return;
    const el = flat[activeIndex] ? document.getElementById(optionId(flat[activeIndex].id)) : null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, flat, optionId]);

  const activeItem = open ? flat[activeIndex] : undefined;
  const activeDescId = activeItem ? optionId(activeItem.id) : undefined;

  /* Roving movement over enabled options ----------------------------------- */
  const moveActive = React.useCallback((dir: 1 | -1) => {
    const list = flatRef.current;
    if (!list.length) return;
    setActiveIndex((i) => {
      let next = i;
      for (let step = 0; step < list.length; step++) {
        next = (next + dir + list.length) % list.length;
        if (!list[next].disabled) return next;
      }
      return i;
    });
  }, []);

  const commit = React.useCallback(
    (item: MentionUser) => {
      if (item.disabled) return;
      onSelect(item, { query: queryRef.current, value: mentionValue(item) });
    },
    [onSelect],
  );
  const commitRef = React.useRef(commit);
  commitRef.current = commit;
  const onOpenChangeRef = React.useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  /* Wire the ARIA combobox pattern onto the app's field -------------------- */
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.setAttribute("role", "combobox");
    el.setAttribute("aria-autocomplete", "list");
    el.setAttribute("aria-haspopup", "listbox");
    return () => {
      el.removeAttribute("role");
      el.removeAttribute("aria-autocomplete");
      el.removeAttribute("aria-haspopup");
      el.removeAttribute("aria-expanded");
      el.removeAttribute("aria-controls");
      el.removeAttribute("aria-activedescendant");
    };
  }, [inputRef]);

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      el.setAttribute("aria-controls", listboxId);
    } else {
      el.removeAttribute("aria-controls");
      el.removeAttribute("aria-activedescendant");
    }
  }, [open, inputRef, listboxId]);

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (open && activeDescId) el.setAttribute("aria-activedescendant", activeDescId);
    else el.removeAttribute("aria-activedescendant");
  }, [open, activeDescId, inputRef]);

  /* Attach the key handler once — it reads latest state from refs ---------- */
  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (!openRef.current) return;
      const list = flatRef.current;
      switch (e.key) {
        case "ArrowDown":
          if (!list.length) return;
          e.preventDefault();
          moveActive(1);
          break;
        case "ArrowUp":
          if (!list.length) return;
          e.preventDefault();
          moveActive(-1);
          break;
        case "Home":
          if (!list.length) return;
          e.preventDefault();
          setActiveIndex(list.findIndex((i) => !i.disabled));
          break;
        case "End":
          if (!list.length) return;
          e.preventDefault();
          for (let j = list.length - 1; j >= 0; j--) {
            if (!list[j].disabled) {
              setActiveIndex(j);
              break;
            }
          }
          break;
        case "Enter": {
          const item = list[activeIndexRef.current];
          if (item && !item.disabled) {
            e.preventDefault();
            commitRef.current(item);
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          onOpenChangeRef.current?.(false);
          break;
        case "Tab":
          onOpenChangeRef.current?.(false);
          break;
      }
    };
    el.addEventListener("keydown", handler as EventListener);
    return () => el.removeEventListener("keydown", handler as EventListener);
  }, [inputRef, moveActive]);

  /* Outside pointer interaction closes the popup --------------------------- */
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (inputRef.current?.contains(target)) return;
      onOpenChangeRef.current?.(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, inputRef]);

  /* Anchor the popup to the app's field via a portal ----------------------- */
  // The popup is portaled to <body> and positioned `fixed` from the field's
  // bounding rect, so it escapes any ancestor `overflow-hidden` (cards, preview
  // frames, scroll containers) that would otherwise clip it. A per-frame
  // re-measure — committed only when the position actually changes — keeps it
  // glued to the field through page scroll, smooth-scroll libraries, resizes,
  // and layout shifts.
  // Resolve the portal host from the `container` ref into state, so the portal
  // and the anchoring re-run once the referenced element is actually attached
  // (a ref read during render can be null on the first commit). Null = portal to
  // <body> (the default viewport-fixed behaviour).
  const [hostEl, setHostEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setHostEl(container?.current ?? null);
  }, [container, open]);

  const [anchor, setAnchor] = React.useState<{ top: number; left: number; right: number } | null>(null);
  React.useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const host = hostEl;
    const measure = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Contained: position ABSOLUTE relative to the host box (which scrolls with
      // the page), so the popup stays inside the frame and never re-anchors on
      // page scroll. Otherwise: position FIXED from the viewport.
      const next = host
        ? {
            top: r.bottom - host.getBoundingClientRect().top + host.scrollTop + 4,
            left: r.left - host.getBoundingClientRect().left + host.scrollLeft,
            right: host.getBoundingClientRect().right - r.right,
          }
        : { top: r.bottom + 4, left: r.left, right: window.innerWidth - r.right };
      setAnchor((prev) =>
        prev && prev.top === next.top && prev.left === next.left && prev.right === next.right ? prev : next,
      );
    };
    // Measure synchronously so the popup renders on the next commit (no wasted
    // frame; also works where rAF never fires, e.g. test renderers).
    measure();
    // Contained popups are static relative to their host, so a per-frame re-measure
    // would only cause churn/flicker — re-measure on resize instead. Viewport-fixed
    // popups keep the rAF loop so they stay glued through page/library scrolling.
    if (host) {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    let raf = 0;
    const tick = () => {
      measure();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, inputRef, hostEl]);

  /* Polite announcement: match count + active option ----------------------- */
  const announcement = React.useMemo(() => {
    if (!open) return "";
    if (loading) return loadingLabel;
    const count = flat.length;
    if (count === 0) return `${emptyLabel}${query ? ` “${query}”` : ""}.`;
    const noun = count === 1 ? "suggestion" : "suggestions";
    const activeName = activeItem ? `. ${activeItem.name}${activeItem.role ? `, ${activeItem.role}` : ""}, selected` : "";
    return `${count} ${noun} available${activeName}.`;
  }, [open, loading, loadingLabel, flat.length, emptyLabel, query, activeItem]);

  /* ----------------------------------------------------------------------- */

  const popup = (
    <AnimatePresence>
      {open && anchor ? (
        <motion.div
          key="popup"
          ref={rootRef}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE }}
            className={cn(
              "z-[60] w-[min(92vw,20rem)] origin-top overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg,var(--shadow-md))]",
              className,
            )}
            style={{
              position: hostEl ? "absolute" : "fixed",
              top: anchor.top,
              ...(align === "end" ? { right: anchor.right } : { left: anchor.left }),
              transformOrigin: align === "end" ? "top right" : "top left",
            }}
          >
            {/* header — anchors the "@" affordance */}
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-muted)]">
              <AtGlyph />
              <span>{query ? <>Mentioning “{query}”</> : "Mention someone"}</span>
            </div>

            {/* listbox */}
            <div
              id={listboxId}
              role="listbox"
              aria-label={label}
              className="max-h-[16rem] overflow-y-auto overflow-x-hidden p-1"
            >
              {loading ? (
                <p className="flex items-center justify-center gap-2 px-3 py-6 text-center text-[12.5px] text-[var(--color-muted)]">
                  <SpinnerGlyph reduce={reduce} />
                  {loadingLabel}
                </p>
              ) : flat.length === 0 ? (
                <p className="px-3 py-6 text-center text-[12.5px] text-[var(--color-muted)]">
                  {emptyLabel}
                  {query ? <> “{query}”</> : null}.
                </p>
              ) : (
                sections.map((section, si) => {
                  const body = section.options.map((item) => {
                    const idx = flat.indexOf(item);
                    return (
                      <OptionRow
                        key={item.id}
                        item={item}
                        optionId={optionId(item.id)}
                        active={idx === activeIndex}
                        disabled={!!item.disabled}
                        reason={item.disabledReason}
                        onSelect={() => commit(item)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    );
                  });
                  return section.label ? (
                    <div key={section.label + si} role="group" aria-label={section.label}>
                      <div
                        className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]"
                        aria-hidden
                      >
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
    </AnimatePresence>
  );

  // Portal into the provided container (contained mode) or the document body.
  const portalTarget = container ? hostEl : typeof document !== "undefined" ? document.body : null;
  return (
    <>
      {portalTarget ? createPortal(popup, portalTarget) : null}

      {/* polite announcer — match count + active option */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}

export default MentionSuggestions;
