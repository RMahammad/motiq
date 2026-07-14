"use client";

import * as React from "react";

import {
  CartItemTransition,
  type CartLineItem,
  type CartItemVisualState,
} from "@/registry/commerce/cart-item-transition";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a fictional cart line for the imaginary brand "Auralite",
 * configuring the (invented) "Auralite Drift" wireless headphones. Every price,
 * variant, stock message, and discount below is made up and local. There is NO
 * real cart, backend, or checkout: the controls mutate local React state, the
 * "async" mutations are local Promises, and nothing is ever purchased. Stock and
 * price copy are honest and app-owned — no fake scarcity, no invented urgency.
 * ---------------------------------------------------------------------- */

const HEADPHONE_STOPS: Record<string, [string, string]> = {
  midnight: ["#2b2f3a", "#454c60"],
  sand: ["#c9b48c", "#e3d4b4"],
  forest: ["#3c5346", "#587567"],
};

function headphoneImage(variant: string): string {
  const [a, b] = HEADPHONE_STOPS[variant] ?? HEADPHONE_STOPS.midnight;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <rect width='120' height='120' fill='#00000000'/>
    <path d='M30 66V54a30 30 0 0 1 60 0v12' fill='none' stroke='url(#g)' stroke-width='7' stroke-linecap='round'/>
    <rect x='22' y='62' width='16' height='30' rx='7' fill='url(#g)'/>
    <rect x='82' y='62' width='16' height='30' rx='7' fill='url(#g)'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const VARIANTS = ["midnight", "sand", "forest"] as const;
const VARIANT_LABEL: Record<string, string> = {
  midnight: "Midnight · Over-ear",
  sand: "Sand · Over-ear",
  forest: "Forest · Over-ear",
};

const BASE_PRICE = 279;

const controlBtn =
  "inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-50";

function makeItem(over: Partial<CartLineItem> = {}): CartLineItem {
  const variant = (over.metadata?.variant as string) ?? "midnight";
  const unitPrice = over.unitPrice ?? BASE_PRICE;
  const quantity = over.quantity ?? 1;
  return {
    id: "auralite-drift",
    productName: "Auralite Drift headphones",
    variantSummary: VARIANT_LABEL[variant],
    image: headphoneImage(variant),
    unitPrice,
    quantity,
    total: unitPrice * quantity,
    availability: "available",
    fulfilmentMessage: "Ships in 2–3 days",
    metadata: { variant },
    ...over,
  };
}

export function CartItemTransitionPreview() {
  const [present, setPresent] = React.useState(true);
  const [item, setItem] = React.useState<CartLineItem>(() => makeItem());
  const [failNext, setFailNext] = React.useState(false);
  const [state, setState] = React.useState<CartItemVisualState>("active");
  const [log, setLog] = React.useState("Use the controls to drive realistic cart-item transitions.");
  const variantIdx = React.useRef(0);

  // Local "async" mutation: resolves after a short delay, or rejects when the
  // Fail toggle is armed. No real backend is contacted.
  const mutate = React.useCallback(
    (next: CartLineItem) =>
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (failNext) {
            setFailNext(false);
            reject(new Error("Update failed — the store couldn’t confirm this change."));
          } else {
            setItem(next);
            resolve();
          }
        }, 620);
      }),
    [failNext],
  );

  const onQuantityChange = React.useCallback(
    (quantity: number, current: CartLineItem) => {
      setLog(`Quantity → ${quantity}${failNext ? " (will fail)" : ""}.`);
      return mutate({ ...current, quantity, total: current.unitPrice * quantity });
    },
    [mutate, failNext],
  );

  const onRemove = React.useCallback(
    () => new Promise<void>((r) => { setLog("Removed line (Undo available)."); setTimeout(r, 420); }),
    [],
  );
  const onUndoRemove = React.useCallback(
    () => new Promise<void>((r) => { setLog("Restored line to cart."); setTimeout(r, 420); }),
    [],
  );

  /* Deterministic control actions (no Math.random / Date.now) --------------- */
  const changeVariant = () => {
    variantIdx.current = (variantIdx.current + 1) % VARIANTS.length;
    const variant = VARIANTS[variantIdx.current];
    setItem((it) => ({
      ...it,
      variantSummary: VARIANT_LABEL[variant],
      image: headphoneImage(variant),
      metadata: { ...it.metadata, variant },
    }));
    setLog(`Variant → ${VARIANT_LABEL[variant]}.`);
  };

  const changePrice = () => {
    setItem((it) => {
      const dropped = it.unitPrice >= BASE_PRICE;
      const nextUnit = dropped ? 239 : BASE_PRICE;
      return {
        ...it,
        previousPrice: it.unitPrice,
        unitPrice: nextUnit,
        total: nextUnit * it.quantity,
        discount: dropped ? { label: "Launch price −$40" } : undefined,
      };
    });
    setLog("Unit price updated by the store.");
  };

  const markUnavailable = () => {
    setItem((it) =>
      it.availability === "unavailable"
        ? { ...it, availability: "available", inventoryMessage: undefined }
        : { ...it, availability: "unavailable", inventoryMessage: "Sold out in this colour — try another." },
    );
    setLog("Availability updated by the store.");
  };

  const markLimited = () => {
    setItem((it) => ({ ...it, availability: "limited", inventoryMessage: "Limited stock — ships from one warehouse." }));
    setLog("Marked limited availability.");
  };

  const reset = () => {
    variantIdx.current = 0;
    setFailNext(false);
    setItem(makeItem());
    setPresent(true);
    setLog("Reset to the initial line.");
  };

  return (
    <div className="w-full max-w-[560px]">
      {/* Mini-cart shell -------------------------------------------------- */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white" aria-hidden>A</span>
            Auralite
          </span>
          <span className="text-[var(--color-muted)]" aria-hidden>/</span>
          <span className="text-[13px] text-[var(--color-fg)]">Your cart</span>
          <span className="ml-auto text-[11.5px] text-[var(--color-muted)]">Demo · no checkout, state: {state}</span>
        </div>

        <div className="p-4">
          {present ? (
            <CartItemTransition
              item={item}
              minQuantity={1}
              maxQuantity={5}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
              onUndoRemove={onUndoRemove}
              onChangeVariant={changeVariant}
              onSaveForLater={() => setLog("Saved for later.")}
              onRetry={() => setLog("Retrying the last change…")}
              onStateChange={setState}
              currency="USD"
            />
          ) : (
            <p className="py-8 text-center text-[13px] text-[var(--color-muted)]">Line removed. Reset to bring it back.</p>
          )}
        </div>
      </div>

      {/* Working controls ------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Demo controls">
        <button type="button" className={controlBtn} onClick={changeVariant}>Change variant</button>
        <button type="button" className={controlBtn} onClick={changePrice}>Change price</button>
        <button type="button" className={controlBtn} onClick={markLimited}>Mark limited</button>
        <button type="button" className={controlBtn} onClick={markUnavailable}>Toggle unavailable</button>
        <button
          type="button"
          className={controlBtn}
          aria-pressed={failNext}
          onClick={() => { setFailNext((f) => !f); setLog(failNext ? "Next update will succeed." : "Next update will fail."); }}
        >
          Fail next update: {failNext ? "on" : "off"}
        </button>
        <button type="button" className={controlBtn} onClick={reset}>Reset</button>
        <span className="ml-auto max-w-full truncate text-[12px] text-[var(--color-muted)]" aria-live="polite">
          {log}
        </span>
      </div>
    </div>
  );
}

export default CartItemTransitionPreview;
