"use client";

import * as React from "react";

import {
  CartItemTransition,
  type CartLineItem,
  type CartItemVisualState,
} from "@/registry/commerce/cart-item-transition";
import {
  ControlBar,
  ControlButton,
  ControlToggle,
  ControlDivider,
  ControlHint,
} from "../_components/preview-controls";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a fictional cart line for the imaginary brand "Auralite",
 * configuring the (invented) "Auralite Drift" wireless headphones. Every price,
 * variant, stock message, and discount below is made up and local. There is NO
 * real cart, backend, or checkout: the controls mutate local React state, the
 * "async" mutations are local Promises, and nothing is ever purchased. Stock and
 * price copy are honest and app-owned — no fake scarcity, no invented urgency.
 * ---------------------------------------------------------------------- */

const HEADPHONE_STOPS: Record<string, [string, string]> = {
  midnight: ["#3a4152", "#20242e"],
  sand: ["#e3d4b4", "#b49a6c"],
  forest: ["#5c7a68", "#33463b"],
};

// A small, studio-lit headphones illustration (colour-tinted glow, soft ground
// shadow, banded headband + cushioned ear-cups with a rim highlight) — reads as a
// real product thumbnail that re-tints per variant, not a flat wire silhouette.
function headphoneImage(variant: string): string {
  const [a, b] = HEADPHONE_STOPS[variant] ?? HEADPHONE_STOPS.midnight;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
    <defs>
      <radialGradient id='glow' cx='0.5' cy='0.42' r='0.6'>
        <stop offset='0' stop-color='${a}' stop-opacity='0.35'/>
        <stop offset='1' stop-color='${a}' stop-opacity='0'/>
      </radialGradient>
      <linearGradient id='band' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
      </linearGradient>
      <linearGradient id='cup' x1='0.2' y1='0' x2='0.8' y2='1'>
        <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
      </linearGradient>
    </defs>
    <circle cx='60' cy='52' r='46' fill='url(#glow)'/>
    <ellipse cx='60' cy='98' rx='30' ry='6' fill='rgba(0,0,0,0.28)'/>
    <path d='M28 66V52a32 32 0 0 1 64 0v14' fill='none' stroke='url(#band)' stroke-width='9' stroke-linecap='round'/>
    <path d='M28 55V52a32 32 0 0 1 64 0v3' fill='none' stroke='#ffffff' stroke-opacity='0.16' stroke-width='2.5' stroke-linecap='round'/>
    <rect x='19' y='60' width='20' height='34' rx='9' fill='url(#cup)' stroke='rgba(0,0,0,0.18)' stroke-width='1'/>
    <rect x='23' y='64' width='7' height='26' rx='3.5' fill='#ffffff' fill-opacity='0.14'/>
    <rect x='81' y='60' width='20' height='34' rx='9' fill='url(#cup)' stroke='rgba(0,0,0,0.18)' stroke-width='1'/>
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
      <ControlBar className="mt-3">
        <ControlButton onClick={changeVariant}>Change variant</ControlButton>
        <ControlButton onClick={changePrice}>Change price</ControlButton>
        <ControlButton onClick={markLimited}>Mark limited</ControlButton>
        <ControlButton onClick={markUnavailable}>Toggle unavailable</ControlButton>
        <ControlDivider />
        <ControlToggle
          pressed={failNext}
          onPressedChange={(next) => {
            setFailNext(next);
            setLog(next ? "Next update will fail." : "Next update will succeed.");
          }}
        >
          Fail next update
        </ControlToggle>
        <ControlButton onClick={reset}>Reset</ControlButton>
        <ControlHint live>{log}</ControlHint>
      </ControlBar>
    </div>
  );
}

export default CartItemTransitionPreview;
