"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useOptimisticAction,
  useReducedMotion,
  useAnimatedNumber,
  formatNumber,
  statusVars,
  type OptimisticPhase,
  type StatusTone,
} from "@/lib/motionkit";

/**
 * CartItemTransition — a single, app-controlled cart LINE ITEM that animates the
 * realistic transitions a line goes through in a real cart: it arrives, its
 * quantity and total change (optimistically, with rollback if the app's mutation
 * fails), a variant is swapped, the price changes, stock turns limited or
 * unavailable, it is removed, and it can be undone. It is NOT a cart, a
 * checkout, or a store: it never fetches, prices, decides stock, mutates a
 * backend, or touches payment. The host app owns every fact — unit price, line
 * total, availability, inventory copy, discounts — and every side-effect runs
 * through the app's async callbacks.
 *
 * What earns its keep over a static product card: an optimistic quantity/remove
 * flow with automatic rollback + an honest failed/retry state, a price-change
 * treatment that morphs the number *and* always states it as text (old → new,
 * never colour alone), a variant-replace crossfade, an app-owned
 * limited/unavailable state, and a remove → Undo affordance with correct focus
 * management throughout.
 *
 * Deliberately NOT included: no exaggerated fly-to-cart arc, no manufactured
 * urgency ("only 2 left!" countdowns), no invented discounts or stock. Inventory
 * and price copy come from the app verbatim.
 *
 * Accessibility: quantity steppers are real <button>s with explicit labels and a
 * text readout; price and price-change are rendered as text (never conveyed by
 * animation or colour alone); limited/unavailable is stated in words with an
 * icon; remove and undo are keyboard operable; focus is preserved on the pressed
 * quantity control after a change, moves to Undo after a removal, and falls back
 * to a stable control after undo; every transition renders in its final state
 * under prefers-reduced-motion. Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

/** App-owned availability of the line. Inventory *copy* is separate + verbatim. */
export type CartItemAvailability = "available" | "limited" | "unavailable" | (string & {});

/** App-owned discount applied to the line (label is shown verbatim). */
export interface CartItemDiscount {
  /** Human label, e.g. "Bundle −15%". Shown as text. */
  label: string;
  /** Optional monetary amount already reflected in `total` (host currency units). */
  amount?: number;
}

/** A single cart line. Everything here is owned and supplied by the host app. */
export interface CartLineItem {
  id: string;
  productName: string;
  /** Selected-options summary, e.g. "Graphite · 24 L · Recycled nylon". */
  variantSummary?: string;
  /** Product image URL (optional). */
  image?: string;
  /** Current per-unit price (host currency units). */
  unitPrice: number;
  quantity: number;
  /** Line total (host currency units). App-owned; not assumed to be unit×qty. */
  total: number;
  /** Prior unit price — when it differs from `unitPrice`, a price change is shown. */
  previousPrice?: number;
  /** App-owned discount surfaced on the line. */
  discount?: CartItemDiscount;
  availability?: CartItemAvailability;
  /** App copy for a limited/unavailable line, e.g. "Only ships to EU". */
  inventoryMessage?: string;
  /** App copy for fulfilment, e.g. "Ships in 2–3 days". */
  fulfilmentMessage?: string;
  /** Subscription cadence, e.g. "month" → renders "/ month". */
  subscriptionInterval?: string;
  metadata?: Record<string, unknown>;
}

/** Derived, presentation-level state of the line (also reported via onStateChange). */
export type CartItemVisualState =
  | "adding"
  | "active"
  | "updating"
  | "removing"
  | "removed"
  | "unavailable"
  | "quantity-limited"
  | "price-changed"
  | "failed"
  | "restoring";

/** Optional external override of the mutation phase for apps that own their own async. */
export interface CartItemMutationState {
  phase: OptimisticPhase;
  error?: string | null;
}

export interface CartItemTransitionProps {
  /** The cart line. Controlled by the app. */
  item: CartLineItem;
  /** Minimum selectable quantity (default 1). */
  minQuantity?: number;
  /** Maximum selectable quantity (app-owned cap; disables + at the ceiling). */
  maxQuantity?: number;
  /**
   * Called when the user steps the quantity. May return a Promise; if it
   * rejects, the optimistic quantity + total roll back and a failed state with
   * Retry is shown. This component never mutates a backend itself.
   */
  onQuantityChange?: (quantity: number, item: CartLineItem) => void | Promise<void>;
  /** Called to remove the line. May return a Promise (rollback on rejection). */
  onRemove?: (item: CartLineItem) => void | Promise<void>;
  /** Called to restore a removed line. May return a Promise. */
  onUndoRemove?: (item: CartLineItem) => void | Promise<void>;
  /** Called when the user asks to change the variant (app opens its own UI). */
  onChangeVariant?: (item: CartLineItem) => void;
  /** Called to move the line to a saved-for-later list. */
  onSaveForLater?: (item: CartLineItem) => void;
  /** Called when the user retries a failed mutation (in addition to the internal retry). */
  onRetry?: (item: CartLineItem) => void;
  /** Require an inline confirm step before removing. */
  confirmRemove?: boolean;
  /** Price formatter — overrides the built-in Intl currency format. */
  formatPrice?: (amount: number) => string;
  currency?: string;
  locale?: string;
  /** External mutation phase override (takes precedence over the internal machine). */
  mutationState?: CartItemMutationState;
  /** Notified whenever the derived visual state changes. */
  onStateChange?: (state: CartItemVisualState) => void;
  /** Play the arrival animation on mount (default true). */
  enterOnMount?: boolean;
  /** Density: "compact" for tight/mobile layouts. */
  layout?: "comfortable" | "compact";
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Motion + class helpers                                                      */
/* -------------------------------------------------------------------------- */

const EASE = [0.2, 0, 0, 1] as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

/* -------------------------------------------------------------------------- */
/* Icons (decorative; meaning is always carried by adjacent text)              */
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

const MinusGlyph = () => (
  <svg {...glyph} width={15} height={15} strokeWidth={2.4}>
    <path d="M5 12h14" />
  </svg>
);
const PlusGlyph = () => (
  <svg {...glyph} width={15} height={15} strokeWidth={2.4}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrashGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
);
const UndoGlyph = () => (
  <svg {...glyph} width={14} height={14}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
  </svg>
);
const WarnGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const TagGlyph = () => (
  <svg {...glyph} width={12} height={12}>
    <path d="M20.6 13.4 12 22l-9-9V4h9l8.6 8.6a1 1 0 0 1 0 1.4Z" />
    <path d="M7.5 7.5h.01" />
  </svg>
);
const PriceUpGlyph = () => (
  <svg {...glyph} width={12} height={12} strokeWidth={2.4}>
    <path d="M12 19V5m0 0-6 6m6-6 6 6" />
  </svg>
);
const PriceDownGlyph = () => (
  <svg {...glyph} width={12} height={12} strokeWidth={2.4}>
    <path d="M12 5v14m0 0 6-6m-6 6-6-6" />
  </svg>
);
const BagGlyph = () => (
  <svg {...glyph} width={22} height={22} strokeWidth={1.5}>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
const SpinnerGlyph = ({ reduce }: { reduce: boolean }) => (
  <motion.svg
    {...glyph}
    width={13}
    height={13}
    animate={reduce ? undefined : { rotate: 360 }}
    transition={reduce ? undefined : { duration: 0.9, ease: "linear", repeat: Infinity }}
    style={{ display: "inline-block" }}
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </motion.svg>
);

/* -------------------------------------------------------------------------- */
/* Availability vocabulary (text + icon — never colour alone)                  */
/* -------------------------------------------------------------------------- */

interface AvailabilityMeta {
  label: string;
  tone: StatusTone;
  purchasable: boolean;
}

function availabilityMeta(a: CartItemAvailability | undefined): AvailabilityMeta {
  switch (a) {
    case "limited":
      return { label: "Limited availability", tone: "warning", purchasable: true };
    case "unavailable":
      return { label: "Unavailable", tone: "error", purchasable: false };
    default:
      return { label: "Available", tone: "success", purchasable: true };
  }
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function CartItemTransition({
  item,
  minQuantity = 1,
  maxQuantity,
  onQuantityChange,
  onRemove,
  onUndoRemove,
  onChangeVariant,
  onSaveForLater,
  onRetry,
  confirmRemove = false,
  formatPrice,
  currency = "USD",
  locale,
  mutationState,
  onStateChange,
  enterOnMount = true,
  layout = "comfortable",
  className,
}: CartItemTransitionProps) {
  const reduce = useReducedMotion();
  const baseId = React.useId();
  const compact = layout === "compact";

  const fmt = React.useMemo(
    () => formatPrice ?? ((n: number) => formatNumber(n, { locale, currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })),
    [formatPrice, locale, currency],
  );

  /* Optimistic quantity with rollback (shared primitive) --------------------- */
  const qty = useOptimisticAction<number>(item.quantity);
  const displayQty = qty.value;

  /* Line total: optimistic while a quantity change is in flight, else app-owned */
  const optimisticTotal =
    qty.optimistic && item.quantity !== 0
      ? (item.total / item.quantity) * displayQty
      : item.total;
  const displayTotal = useAnimatedNumber(optimisticTotal, { durationMs: 520, disabled: reduce });

  const avail = availabilityMeta(item.availability);
  const atMax = typeof maxQuantity === "number" && displayQty >= maxQuantity;
  const atMin = displayQty <= minQuantity;

  /* Merge external + internal mutation phase --------------------------------- */
  const phase = mutationState?.phase ?? qty.phase;
  const error = mutationState?.error ?? qty.error;

  /* Lifecycle (remove / undo) local to this line ---------------------------- */
  type Lifecycle = "active" | "removing" | "removed" | "restoring";
  const [lifecycle, setLifecycle] = React.useState<Lifecycle>("active");
  const [confirming, setConfirming] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  /* Focus management refs ---------------------------------------------------- */
  const rootRef = React.useRef<HTMLDivElement>(null);
  const removeBtnRef = React.useRef<HTMLButtonElement>(null);
  const undoBtnRef = React.useRef<HTMLButtonElement>(null);
  const lastQtyBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const incBtnRef = React.useRef<HTMLButtonElement>(null);
  const decBtnRef = React.useRef<HTMLButtonElement>(null);
  const restoreFocusPending = React.useRef(false);
  const lastAttemptRef = React.useRef<number | null>(null);

  /* Price-change flash (derived from previousPrice) -------------------------- */
  const priceChanged =
    typeof item.previousPrice === "number" && item.previousPrice !== item.unitPrice;
  const priceRose = priceChanged && (item.previousPrice as number) < item.unitPrice;
  const [priceFlash, setPriceFlash] = React.useState(false);
  const flashTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);
  React.useEffect(() => {
    if (!priceChanged) return;
    setPriceFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setPriceFlash(false), 2400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.previousPrice, item.unitPrice]);

  /* Derived visual state ----------------------------------------------------- */
  const visualState: CartItemVisualState = React.useMemo(() => {
    if (lifecycle === "removed") return "removed";
    if (lifecycle === "restoring") return "restoring";
    if (lifecycle === "removing") return "removing";
    if (phase === "error") return "failed";
    if (phase === "pending") return "updating";
    if (item.availability === "unavailable") return "unavailable";
    if (item.availability === "limited" || atMax) return "quantity-limited";
    if (priceFlash) return "price-changed";
    return "active";
  }, [lifecycle, phase, item.availability, atMax, priceFlash]);

  const onStateChangeRef = React.useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  const prevStateRef = React.useRef<CartItemVisualState | null>(null);
  React.useEffect(() => {
    if (prevStateRef.current !== visualState) {
      prevStateRef.current = visualState;
      onStateChangeRef.current?.(visualState);
    }
  }, [visualState]);

  /* Quantity change ---------------------------------------------------------- */
  const changeQty = React.useCallback(
    async (next: number, source: "inc" | "dec") => {
      if (next < minQuantity) return;
      if (typeof maxQuantity === "number" && next > maxQuantity) return;
      lastQtyBtnRef.current = source === "inc" ? incBtnRef.current : decBtnRef.current;
      lastAttemptRef.current = next;
      await qty.commit(next, () => onQuantityChange?.(next, item));
      // Preserve focus on the pressed control (falls back to the group root if
      // the control became disabled at a min/max boundary).
      requestAnimationFrame(() => {
        const btn = lastQtyBtnRef.current;
        if (btn && !btn.disabled) btn.focus();
        else rootRef.current?.focus();
      });
    },
    [minQuantity, maxQuantity, qty, onQuantityChange, item],
  );

  const retry = React.useCallback(() => {
    onRetry?.(item);
    if (lastAttemptRef.current != null) {
      void changeQty(lastAttemptRef.current, lastAttemptRef.current >= item.quantity ? "inc" : "dec");
    }
  }, [onRetry, item, changeQty]);

  /* Remove / undo ------------------------------------------------------------ */
  const doRemove = React.useCallback(async () => {
    if (confirmRemove && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setRemoveError(null);
    setLifecycle("removing");
    try {
      await onRemove?.(item);
      setLifecycle("removed");
    } catch (e) {
      setLifecycle("active");
      setRemoveError(e instanceof Error ? e.message : "Couldn’t remove this item.");
      requestAnimationFrame(() => removeBtnRef.current?.focus());
    }
  }, [confirmRemove, confirming, onRemove, item]);

  const doUndo = React.useCallback(async () => {
    setLifecycle("restoring");
    restoreFocusPending.current = true;
    try {
      await onUndoRemove?.(item);
    } finally {
      setLifecycle("active");
    }
  }, [onUndoRemove, item]);

  // Move focus to Undo once the line is removed.
  React.useEffect(() => {
    if (lifecycle === "removed") {
      requestAnimationFrame(() => undoBtnRef.current?.focus());
    }
  }, [lifecycle]);

  // After an undo settles, fall focus back to a stable control (remove button →
  // root), so keyboard users are never dropped on document.body.
  React.useEffect(() => {
    if (lifecycle === "active" && restoreFocusPending.current) {
      restoreFocusPending.current = false;
      requestAnimationFrame(() => {
        if (removeBtnRef.current) removeBtnRef.current.focus();
        else rootRef.current?.focus();
      });
    }
  }, [lifecycle]);

  /* Announcement (polite) ---------------------------------------------------- */
  const announcement =
    lifecycle === "removed"
      ? `${item.productName} removed. Undo available.`
      : lifecycle === "restoring"
        ? `Restoring ${item.productName}.`
        : phase === "pending"
          ? `Updating ${item.productName}.`
          : phase === "error"
            ? `Couldn’t update ${item.productName}. ${error ?? ""}`
            : `${item.productName}, quantity ${displayQty}, line total ${fmt(optimisticTotal)}.`;

  const removed = lifecycle === "removed";
  const busy = phase === "pending" || lifecycle === "removing" || lifecycle === "restoring";

  const sv = statusVars(avail.tone);

  /* ----------------------------------------------------------------------- */

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      aria-label={`Cart item: ${item.productName}`}
      aria-busy={busy || undefined}
      className={cn(
        "relative w-full rounded-2xl border bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)] outline-none",
        item.availability === "unavailable"
          ? "border-[color-mix(in_oklab,var(--color-error)_32%,var(--color-border))]"
          : "border-[var(--color-border)]",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {removed ? (
          /* ---------------- Removed / Undo bar ---------------------------- */
          <motion.div
            key="removed"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex flex-wrap items-center gap-3"
          >
            <span className="flex-1 text-[13.5px] text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-fg)]">{item.productName}</span> removed from cart.
            </span>
            <button
              ref={undoBtnRef}
              type="button"
              onClick={doUndo}
              className={cn(
                "inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                focusRing,
              )}
            >
              <UndoGlyph />
              Undo
            </button>
          </motion.div>
        ) : (
          /* ---------------- Active line ----------------------------------- */
          <motion.div
            key="line"
            initial={enterOnMount && !reduce ? { opacity: 0, y: 10, scale: 0.99 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="flex flex-col gap-3"
          >
            <div className={cn("flex items-start gap-3", compact ? "gap-2.5" : "gap-3.5")}>
              {/* Thumbnail ------------------------------------------------- */}
              <div
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]",
                  compact ? "h-16 w-16" : "h-20 w-20",
                )}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-[var(--color-muted)]" aria-hidden>
                    <BagGlyph />
                  </span>
                )}
                {item.availability === "unavailable" ? (
                  <span className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)]" aria-hidden />
                ) : null}
              </div>

              {/* Details --------------------------------------------------- */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-[14.5px] font-semibold leading-tight text-[var(--color-fg)]">
                    {item.productName}
                  </h3>
                  {/* Unit price (as text, always) with morph on change ----- */}
                  <div className="flex shrink-0 flex-col items-end leading-none">
                    <span className="text-[14px] font-semibold tabular-nums text-[var(--color-fg)]">
                      {fmt(item.unitPrice)}
                      {item.subscriptionInterval ? (
                        <span className="ml-0.5 text-[11px] font-normal text-[var(--color-muted)]">
                          /{item.subscriptionInterval}
                        </span>
                      ) : null}
                    </span>
                    {priceChanged ? (
                      <span className="mt-0.5 text-[11px] tabular-nums text-[var(--color-muted)] line-through">
                        {fmt(item.previousPrice as number)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Variant summary — crossfades on change ------------------ */}
                <div className="min-h-[1.1rem]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={item.variantSummary ?? "no-variant"}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="truncate text-[12.5px] text-[var(--color-muted)]"
                    >
                      {item.variantSummary ?? ""}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Badges: price-change (text), discount, fulfilment ------- */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {priceChanged ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        color: priceRose ? statusVars("warning").color : statusVars("success").color,
                        background: priceRose ? statusVars("warning").bg : statusVars("success").bg,
                      }}
                    >
                      {priceRose ? <PriceUpGlyph /> : <PriceDownGlyph />}
                      {priceRose ? "Price increased" : "Price dropped"}
                    </span>
                  ) : null}
                  {item.discount ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
                      style={{ color: statusVars("success").color, background: statusVars("success").bg }}
                    >
                      <TagGlyph />
                      {item.discount.label}
                    </span>
                  ) : null}
                  {item.fulfilmentMessage ? (
                    <span className="text-[11.5px] text-[var(--color-muted)]">{item.fulfilmentMessage}</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Availability notice (text + icon, never colour alone) ------- */}
            {(item.availability === "unavailable" || item.availability === "limited") ? (
              <p
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium"
                style={{ color: sv.color, background: sv.bg }}
              >
                <WarnGlyph />
                {item.inventoryMessage ?? avail.label}
              </p>
            ) : null}

            {/* Controls row: quantity + total + actions -------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              {/* Quantity stepper ---------------------------------------- */}
              <div
                role="group"
                aria-label={`Quantity for ${item.productName}`}
                className={cn(
                  "inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
                  avail.purchasable ? "" : "opacity-55",
                )}
              >
                <button
                  ref={decBtnRef}
                  type="button"
                  aria-label={`Decrease quantity of ${item.productName}`}
                  disabled={atMin || !avail.purchasable || busy}
                  onClick={() => changeQty(displayQty - 1, "dec")}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-l-lg text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40",
                    focusRing,
                  )}
                >
                  <MinusGlyph />
                </button>
                <span
                  aria-hidden
                  className={cn(
                    "min-w-[2.25rem] px-1 text-center text-[14px] font-semibold tabular-nums transition-colors",
                    qty.optimistic ? "text-[var(--color-accent)]" : "text-[var(--color-fg)]",
                  )}
                >
                  {displayQty}
                </span>
                <button
                  ref={incBtnRef}
                  type="button"
                  aria-label={`Increase quantity of ${item.productName}`}
                  disabled={atMax || !avail.purchasable || busy}
                  onClick={() => changeQty(displayQty + 1, "inc")}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-r-lg text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40",
                    focusRing,
                  )}
                >
                  <PlusGlyph />
                </button>
              </div>

              {/* Line total (morphs; always shown as text) --------------- */}
              <div className="flex items-center gap-1.5">
                {phase === "pending" ? (
                  <span className="text-[var(--color-muted)]" aria-hidden>
                    <SpinnerGlyph reduce={reduce} />
                  </span>
                ) : null}
                <span className="text-[15px] font-semibold tabular-nums text-[var(--color-fg)]">
                  {fmt(displayTotal)}
                </span>
              </div>
            </div>

            {/* Secondary actions ----------------------------------------- */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[var(--color-border)] pt-2.5">
              {onChangeVariant ? (
                <button
                  type="button"
                  onClick={() => onChangeVariant(item)}
                  disabled={busy}
                  className={cn(
                    "text-[12.5px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] disabled:opacity-50",
                    focusRing,
                    "rounded",
                  )}
                >
                  Change options
                </button>
              ) : null}
              {onSaveForLater ? (
                <button
                  type="button"
                  onClick={() => onSaveForLater(item)}
                  disabled={busy}
                  className={cn(
                    "text-[12.5px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] disabled:opacity-50",
                    focusRing,
                    "rounded",
                  )}
                >
                  Save for later
                </button>
              ) : null}

              {/* Remove (with optional inline confirm) ------------------- */}
              <div className="ml-auto inline-flex items-center gap-2">
                <AnimatePresence initial={false} mode="wait">
                  {confirming ? (
                    <motion.span
                      key="confirm"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, x: 6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, x: 6 }}
                      transition={{ duration: 0.16, ease: EASE }}
                      className="inline-flex items-center gap-2"
                    >
                      <span className="text-[12.5px] text-[var(--color-muted)]">Remove?</span>
                      <button
                        type="button"
                        onClick={doRemove}
                        className={cn(
                          "inline-flex min-h-[32px] items-center rounded-md px-2.5 py-1 text-[12.5px] font-semibold text-[var(--color-surface)] transition-colors",
                          focusRing,
                        )}
                        style={{ background: statusVars("error").color }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className={cn(
                          "inline-flex min-h-[32px] items-center rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]",
                          focusRing,
                        )}
                      >
                        Keep
                      </button>
                    </motion.span>
                  ) : (
                    <motion.button
                      key="remove"
                      ref={removeBtnRef}
                      type="button"
                      onClick={doRemove}
                      disabled={lifecycle === "removing"}
                      initial={false}
                      className={cn(
                        "inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-error)] disabled:opacity-50",
                        focusRing,
                      )}
                    >
                      {lifecycle === "removing" ? <SpinnerGlyph reduce={reduce} /> : <TrashGlyph />}
                      Remove
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Failed-mutation banner with Retry ------------------------- */}
            <AnimatePresence initial={false}>
              {phase === "error" || removeError ? (
                <motion.div
                  key="error"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    role="alert"
                    className="mt-0.5 flex flex-wrap items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px]"
                    style={{ background: statusVars("error").bg, color: "var(--color-fg)" }}
                  >
                    <span style={{ color: statusVars("error").color }} className="shrink-0">
                      <WarnGlyph />
                    </span>
                    <span className="flex-1">{error ?? removeError ?? "That change didn’t go through."}</span>
                    {phase === "error" ? (
                      <button
                        type="button"
                        onClick={retry}
                        className={cn(
                          "inline-flex min-h-[30px] items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                          focusRing,
                        )}
                      >
                        Retry
                      </button>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polite announcer --------------------------------------------------- */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

export default CartItemTransition;
