"use client";

/**
 * SwipeActionRow — a mobile-first swipe-to-reveal action row that is *never*
 * touch-only. Every action is reachable three ways: swipe/drag (pointer +
 * touch), Tab-to-focus reveal, and an always-visible overflow menu — so the
 * component works with a mouse and a keyboard exactly as well as with a thumb.
 *
 * Safety model (destructive actions must not fire by accident):
 *  - Full-swipe-to-fire is OFF by default (`fullSwipe`).
 *  - Destructive actions require an inline Confirm step (a two-tap guard) unless
 *    explicitly opted out; `confirmAction` forces confirm on every action.
 *  - Destructive actions are marked with a label + icon + `--color-error`, never
 *    color alone (forced-colors safe).
 *
 * Only-one-open: wrap rows in <SwipeActionGroup> so opening one row snaps any
 * other open row shut (the mail-app pattern).
 *
 * Accessibility: real <button> actions, a labelled overflow menu, a polite
 * live region announcing completed actions, ≥44px targets, focus restoration
 * after a confirm, and a reduced-motion path that drops drag physics entirely
 * and snaps instantly while keeping every action operable. Clean-room original.
 */

import * as React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
  type PanInfo,
  type MotionValue,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/motionkit";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SwipeSide = "left" | "right";
export type SwipeOpenState = SwipeSide | null;
export type SwipeActionTone = "success" | "warning" | "error" | "info" | "neutral" | "accent";

export interface SwipeAction {
  /** Stable identifier passed back to `onAction`. */
  id: string;
  /** Human label — used on the button, the menu item, and announcements. */
  label: string;
  /** Optional leading icon (decorative; the label carries the accessible name). */
  icon?: React.ReactNode;
  /** Semantic tone → maps to a `--color-*` token. Defaults to `neutral`. */
  tone?: SwipeActionTone;
  /** Marks a destructive action: renders in `--color-error` and requires confirm. */
  destructive?: boolean;
  /** Override the confirm requirement (defaults: true when destructive). */
  confirm?: boolean;
  /** Label for the confirm button (defaults to the action label). */
  confirmLabel?: string;
}

export interface RenderActionMenuArgs {
  /** All actions from both sides, in a single flat list. */
  actions: SwipeAction[];
  /** Fire an action by object (handles the confirm guard). */
  trigger: (action: SwipeAction) => void;
  /** Whether the menu is currently open. */
  open: boolean;
  /** Toggle the menu open/closed. */
  setOpen: (open: boolean) => void;
}

export interface SwipeActionRowProps {
  /** The row's main content (title, meta, thumbnail…). */
  children: React.ReactNode;
  /** Actions revealed by swiping right (they sit on the left edge). */
  leftActions?: SwipeAction[];
  /** Actions revealed by swiping left (they sit on the right edge). */
  rightActions?: SwipeAction[];
  /** Pixels the row must travel past to commit to "open" on release. */
  threshold?: number;
  /** Opt in to full-swipe-to-fire the primary action of a side. Off by default. */
  fullSwipe?: boolean;
  /** Controlled open side. Pass with `onOpenChange` for full control. */
  open?: SwipeOpenState;
  /** Uncontrolled initial open side. */
  defaultOpen?: SwipeOpenState;
  /** Notified whenever the open side changes (drag, keyboard, group, action). */
  onOpenChange?: (open: SwipeOpenState) => void;
  /** Fired when an action is committed (after confirm, for destructive ones). */
  onAction?: (actionId: string, side: SwipeSide) => void;
  /** Disable all gestures + actions. */
  disabled?: boolean;
  /** Force a confirm step on every action (not just destructive ones). */
  confirmAction?: boolean;
  /** Replace the default overflow menu. Return your own menu UI. */
  renderActionMenu?: (args: RenderActionMenuArgs) => React.ReactNode;
  /** Hide the overflow (kebab) menu. Actions stay reachable via focus reveal. */
  hideOverflowMenu?: boolean;
  /** Accessible label for the row region (e.g. the item title). */
  label?: string;
  /** Force reduced motion regardless of the media query (for demos/tests). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Group context — only one row open at a time                                */
/* -------------------------------------------------------------------------- */

interface GroupContextValue {
  openId: string | null;
  requestOpen: (id: string | null) => void;
}

const SwipeActionGroupContext = React.createContext<GroupContextValue | null>(null);

/**
 * Wrap several <SwipeActionRow> in a group so opening one closes the others —
 * the standard mail/task-list behavior. Optional: a lone row works fine without it.
 */
export function SwipeActionGroup({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const requestOpen = React.useCallback((id: string | null) => setOpenId(id), []);
  const value = React.useMemo<GroupContextValue>(() => ({ openId, requestOpen }), [openId, requestOpen]);
  return <SwipeActionGroupContext.Provider value={value}>{children}</SwipeActionGroupContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/* Tokens + helpers                                                           */
/* -------------------------------------------------------------------------- */

const TONE_VAR: Record<SwipeActionTone, string> = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  info: "var(--color-info)",
  neutral: "var(--color-neutral, var(--color-muted))",
  accent: "var(--color-accent)",
};

const TONE_FG: Record<SwipeActionTone, string> = {
  success: "var(--color-success-foreground, #fff)",
  warning: "var(--color-warning-foreground, #fff)",
  error: "var(--color-error-foreground, #fff)",
  info: "var(--color-info-foreground, #fff)",
  neutral: "var(--color-neutral-foreground, var(--color-fg))",
  accent: "var(--color-accent-foreground, #fff)",
};

/** Per-action reveal width in px (also the touch-target width — ≥44px). */
const ACTION_W = 84;

function actionTone(a: SwipeAction): SwipeActionTone {
  if (a.destructive) return "error";
  return a.tone ?? "neutral";
}

function KebabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function SwipeActionRow({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 48,
  fullSwipe = false,
  open: openProp,
  defaultOpen = null,
  onOpenChange,
  onAction,
  disabled = false,
  confirmAction = false,
  renderActionMenu,
  hideOverflowMenu = false,
  label,
  reducedMotion,
  className,
}: SwipeActionRowProps) {
  const mediaReduced = useReducedMotion();
  const reduced = reducedMotion ?? mediaReduced;

  const rowId = React.useId();
  const group = React.useContext(SwipeActionGroupContext);

  /* controlled / uncontrolled open state -------------------------------- */
  const isControlled = openProp !== undefined;
  const [openInternal, setOpenInternal] = React.useState<SwipeOpenState>(defaultOpen);
  const open = isControlled ? openProp : openInternal;
  const openRef = React.useRef<SwipeOpenState>(open);
  openRef.current = open;

  const setOpen = React.useCallback(
    (next: SwipeOpenState) => {
      if (openRef.current !== next) {
        if (!isControlled) setOpenInternal(next);
        onOpenChange?.(next);
      }
      if (group) group.requestOpen(next ? rowId : group.openId === rowId ? null : group.openId);
    },
    [isControlled, onOpenChange, group, rowId],
  );

  /* geometry ------------------------------------------------------------ */
  const x = useMotionValue(0);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [rowW, setRowW] = React.useState(320);

  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setRowW(el.clientWidth || 320);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxLeft = leftActions.length * ACTION_W;
  const maxRight = rightActions.length * ACTION_W;
  const fullSwipeThreshold = Math.max(threshold * 2.4, rowW * 0.52);

  const restX = React.useCallback(
    (side: SwipeOpenState) => (side === "left" ? maxLeft : side === "right" ? -maxRight : 0),
    [maxLeft, maxRight],
  );

  /* imperative snap ----------------------------------------------------- */
  const draggingRef = React.useRef(false);
  const controlsRef = React.useRef<ReturnType<typeof animate> | null>(null);

  const animateTo = React.useCallback(
    (side: SwipeOpenState) => {
      controlsRef.current?.stop();
      const target = restX(side);
      if (reduced) {
        x.set(target);
        return;
      }
      controlsRef.current = animate(x, target, {
        type: "spring",
        stiffness: 560,
        damping: 42,
        mass: 0.9,
      });
    },
    [restX, reduced, x],
  );

  // React to open changes coming from anywhere (props, group, keyboard).
  React.useEffect(() => {
    if (draggingRef.current) return;
    animateTo(open);
  }, [open, animateTo]);

  // Group: close myself if another row in the group opened.
  React.useEffect(() => {
    if (!group) return;
    if (group.openId && group.openId !== rowId && openRef.current !== null) {
      setOpen(null);
    }
  }, [group, rowId, setOpen]);

  React.useEffect(() => () => controlsRef.current?.stop(), []);

  /* announcements + confirm flow ---------------------------------------- */
  const [announcement, setAnnouncement] = React.useState("");
  const [confirming, setConfirming] = React.useState<{ action: SwipeAction; side: SwipeSide } | null>(null);
  const lastTriggerRef = React.useRef<HTMLElement | null>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const overflowBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const needsConfirm = React.useCallback(
    (a: SwipeAction) => (a.destructive ? a.confirm !== false : a.confirm === true || confirmAction),
    [confirmAction],
  );

  const commit = React.useCallback(
    (action: SwipeAction, side: SwipeSide) => {
      onAction?.(action.id, side);
      setAnnouncement(`${action.label} — done`);
      setConfirming(null);
      setOpen(null);
    },
    [onAction, setOpen],
  );

  const trigger = React.useCallback(
    (action: SwipeAction, side: SwipeSide) => {
      if (disabled) return;
      lastTriggerRef.current = (typeof document !== "undefined" ? document.activeElement : null) as HTMLElement | null;
      if (needsConfirm(action)) {
        setConfirming({ action, side });
        setOpen(side);
      } else {
        commit(action, side);
      }
    },
    [disabled, needsConfirm, commit, setOpen],
  );

  const cancelConfirm = React.useCallback(() => {
    setConfirming(null);
    setOpen(null);
    setAnnouncement("Cancelled");
    // Restore focus to whatever launched the confirm.
    requestAnimationFrame(() => {
      (lastTriggerRef.current ?? overflowBtnRef.current)?.focus?.();
    });
  }, [setOpen]);

  // Focus the confirm button when the confirm bar appears.
  React.useEffect(() => {
    if (confirming) requestAnimationFrame(() => confirmBtnRef.current?.focus());
  }, [confirming]);

  /* drag handling ------------------------------------------------------- */
  const onDragStart = React.useCallback(() => {
    draggingRef.current = true;
    if (group) group.requestOpen(rowId);
  }, [group, rowId]);

  const onDragEnd = React.useCallback(
    (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      draggingRef.current = false;
      const dx = x.get();
      const flick = Math.abs(info.velocity.x) > 480;
      let next: SwipeOpenState = null;
      let fired = false;

      if (dx > 0 && leftActions.length) {
        if (fullSwipe && dx >= fullSwipeThreshold) {
          trigger(leftActions[0], "left");
          fired = true;
        } else if (dx >= threshold || (flick && info.velocity.x > 0)) {
          next = "left";
        }
      } else if (dx < 0 && rightActions.length) {
        if (fullSwipe && -dx >= fullSwipeThreshold) {
          trigger(rightActions[0], "right");
          fired = true;
        } else if (-dx >= threshold || (flick && info.velocity.x < 0)) {
          next = "right";
        }
      }

      if (!fired) {
        setOpen(next);
        animateTo(next);
      }
    },
    [x, leftActions, rightActions, fullSwipe, fullSwipeThreshold, threshold, trigger, setOpen, animateTo],
  );

  /* focus reveal + blur-close ------------------------------------------- */
  const revealSide = (side: SwipeSide) => () => {
    if (!disabled && openRef.current !== side) setOpen(side);
  };

  const onRootBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (draggingRef.current || confirming) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      if (openRef.current !== null) setOpen(null);
    }
  };

  /* overflow menu ------------------------------------------------------- */
  const allActions = React.useMemo(() => [...leftActions, ...rightActions], [leftActions, rightActions]);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        overflowBtnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const menuTrigger = React.useCallback(
    (action: SwipeAction) => {
      const side: SwipeSide = leftActions.some((a) => a.id === action.id) ? "left" : "right";
      setMenuOpen(false);
      trigger(action, side);
    },
    [leftActions, trigger],
  );

  /* threshold feedback (no re-renders) — arm the primary full-swipe action */
  const leftArm = useTransform(x, [0, fullSwipeThreshold], [0, 1]);
  const rightArm = useTransform(x, [0, -fullSwipeThreshold], [0, 1]);

  /* -------------------------------------------------------------------- */
  const dataState: string = open ? `open-${open}` : "closed";
  const canDrag = !disabled && !reduced && (leftActions.length > 0 || rightActions.length > 0);

  const dragLeftBound = fullSwipe && leftActions.length ? rowW : maxLeft;
  const dragRightBound = fullSwipe && rightActions.length ? rowW : maxRight;

  return (
    <div
      ref={rootRef}
      data-state={dataState}
      data-disabled={disabled || undefined}
      onBlur={onRootBlur}
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      {/* left action panel (revealed by swiping right). Buttons stay Tab-
          focusable so keyboard users reach them and focusing reveals the side. */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 z-0 flex">
          {leftActions.map((a, i) => (
            <ActionButton
              key={a.id}
              action={a}
              side="left"
              disabled={disabled}
              onFocus={revealSide("left")}
              onActivate={() => trigger(a, "left")}
              arm={fullSwipe && i === 0 ? leftArm : undefined}
            />
          ))}
        </div>
      )}

      {/* right action panel (revealed by swiping left) */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 z-0 flex">
          {rightActions.map((a, i) => (
            <ActionButton
              key={a.id}
              action={a}
              side="right"
              disabled={disabled}
              onFocus={revealSide("right")}
              onActivate={() => trigger(a, "right")}
              arm={fullSwipe && i === 0 ? rightArm : undefined}
            />
          ))}
        </div>
      )}

      {/* draggable content layer */}
      <motion.div
        role="group"
        aria-label={label}
        aria-roledescription="Swipe action row"
        style={{ x, touchAction: canDrag ? "pan-y" : undefined }}
        drag={canDrag ? "x" : false}
        dragConstraints={{ left: -dragRightBound, right: dragLeftBound }}
        dragElastic={fullSwipe ? 0.16 : 0.06}
        dragMomentum={false}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="relative z-10 flex min-h-[56px] items-center gap-3 bg-[var(--color-surface)] px-4 py-3"
      >
        <div className="min-w-0 flex-1">{children}</div>

        {/* always-visible overflow menu — the keyboard/desktop parity path */}
        {!hideOverflowMenu && allActions.length > 0 && (
          <div className="relative shrink-0">
            {renderActionMenu ? (
              renderActionMenu({ actions: allActions, trigger: menuTrigger, open: menuOpen, setOpen: setMenuOpen })
            ) : (
              <>
                <button
                  ref={overflowBtnRef}
                  type="button"
                  disabled={disabled}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="More actions"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-muted)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-40"
                >
                  <KebabIcon />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.ul
                      role="menu"
                      aria-label="Row actions"
                      initial={reduced ? false : { opacity: 0, scale: 0.96, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
                      transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
                      className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[180px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[var(--shadow-md,0_8px_24px_rgba(0,0,0,0.14))]"
                    >
                      {allActions.map((a) => {
                        const tone = actionTone(a);
                        return (
                          <li key={a.id} role="none">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => menuTrigger(a)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13.5px] font-medium outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:bg-[var(--color-bg-secondary)]"
                              style={{ color: a.destructive ? "var(--color-error)" : "var(--color-fg)" }}
                            >
                              {a.icon && (
                                <span aria-hidden className="grid h-4 w-4 place-items-center" style={{ color: TONE_VAR[tone] }}>
                                  {a.icon}
                                </span>
                              )}
                              <span className="flex-1">{a.label}</span>
                              {a.destructive && (
                                <span className="text-[11px] uppercase tracking-wide text-[var(--color-error)]">confirm</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* confirm bar — the two-tap safety guard for destructive actions */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-0 z-40 flex items-center gap-3 rounded-xl border border-[var(--color-error)] bg-[var(--color-surface)] px-4"
            style={{ boxShadow: "inset 0 0 0 1px var(--color-error)" }}
            role="alertdialog"
            aria-label={`${confirming.action.confirmLabel ?? confirming.action.label}?`}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--color-error)]" style={{ background: "color-mix(in oklab, var(--color-error) 16%, transparent)" }} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v5M12 16.5h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="min-w-0 flex-1 text-[13.5px] font-medium text-[var(--color-fg)]">
              {confirming.action.confirmLabel ?? `${confirming.action.label}?`}
              <span className="ml-1 font-normal text-[var(--color-muted)]">This can’t be undone here.</span>
            </p>
            <button
              type="button"
              onClick={cancelConfirm}
              className="h-9 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] font-medium text-[var(--color-fg)] outline-none transition-colors hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Cancel
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              onClick={() => commit(confirming.action, confirming.side)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold outline-none transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--color-error)] focus-visible:ring-offset-1"
              style={{ background: "var(--color-error)", color: "var(--color-error-foreground, #fff)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {confirming.action.confirmLabel ?? confirming.action.label}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* polite announcements for completed / cancelled actions */}
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action button (revealed in a side panel)                                   */
/* -------------------------------------------------------------------------- */

function ActionButton({
  action,
  side,
  disabled,
  onFocus,
  onActivate,
  arm,
}: {
  action: SwipeAction;
  side: SwipeSide;
  disabled: boolean;
  onFocus: () => void;
  onActivate: () => void;
  arm?: MotionValue<number>;
}) {
  const tone = actionTone(action);
  return (
    <button
      type="button"
      disabled={disabled}
      onFocus={onFocus}
      onClick={onActivate}
      data-side={side}
      aria-label={action.label}
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-1 text-[11.5px] font-semibold outline-none transition-[filter] hover:brightness-105 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 disabled:opacity-50",
      )}
      style={{
        width: ACTION_W,
        minWidth: 44,
        background: TONE_VAR[tone],
        color: TONE_FG[tone],
      }}
    >
      {/* full-swipe "armed" wash on the primary action */}
      {arm && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ opacity: arm, background: "rgba(255,255,255,0.18)" }}
        />
      )}
      {action.icon && (
        <span aria-hidden className="grid h-5 w-5 place-items-center">
          {action.icon}
        </span>
      )}
      <span className="relative px-1 text-center leading-tight">{action.label}</span>
    </button>
  );
}

export default SwipeActionRow;
