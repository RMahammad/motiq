"use client";

import * as React from "react";

import { CartItemTransition, type CartLineItem } from "@/registry/commerce/cart-item-transition";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL CartItemTransition as a
 * small 2-line mini-cart in one representative state — a line with a price drop
 * (old → new) + discount badge, and a limited-availability line. Quantity
 * steppers stay as the component's inherent affordance; no external
 * change-variant/fail demo controls. Deterministic (synthesised SVG images).
 */

const STOPS: Record<string, [string, string]> = {
  midnight: ["#2b2f3a", "#454c60"],
  sand: ["#c9b48c", "#e3d4b4"],
};

function headphoneImage(variant: string): string {
  const [a, b] = STOPS[variant] ?? STOPS.midnight;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <path d='M30 66V54a30 30 0 0 1 60 0v12' fill='none' stroke='url(#g)' stroke-width='7' stroke-linecap='round'/>
    <rect x='22' y='62' width='16' height='30' rx='7' fill='url(#g)'/>
    <rect x='82' y='62' width='16' height='30' rx='7' fill='url(#g)'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const ITEM_A: CartLineItem = {
  id: "auralite-drift",
  productName: "Auralite Drift headphones",
  variantSummary: "Midnight · Over-ear",
  image: headphoneImage("midnight"),
  unitPrice: 239,
  previousPrice: 279,
  quantity: 1,
  total: 239,
  discount: { label: "Launch price −$40" },
  availability: "available",
  fulfilmentMessage: "Ships in 2–3 days",
};

const ITEM_B: CartLineItem = {
  id: "auralite-case",
  productName: "Travel case",
  variantSummary: "Sand · Hard shell",
  image: headphoneImage("sand"),
  unitPrice: 39,
  quantity: 1,
  total: 39,
  availability: "limited",
  inventoryMessage: "Limited stock - ships from one warehouse.",
};

export function CartItemTransitionCatalogPreview() {
  return (
    <div className="mx-auto flex w-full max-w-[460px] flex-col gap-2.5">
      <CartItemTransition item={ITEM_A} layout="compact" minQuantity={1} maxQuantity={5} currency="USD" enterOnMount={false} />
      <CartItemTransition item={ITEM_B} layout="compact" minQuantity={1} maxQuantity={5} currency="USD" enterOnMount={false} />
    </div>
  );
}

export default CartItemTransitionCatalogPreview;
