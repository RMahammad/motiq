"use client";

import * as React from "react";

import { ProductVariantSelector, type OptionGroup, type VariantSelection } from "@/registry/commerce/product-variant-selector";

/**
 * Compact catalog adapter (docs/55 §7). Renders the REAL ProductVariantSelector
 * for one clean product (the fictional "Range 24" daypack) — colour, capacity,
 * and fabric groups with live price + inventory badges. Uncontrolled: the tiles
 * remain the component's own inherent affordance. No external recheck/reset demo
 * controls. Deterministic (synthesised SVG image per colour).
 */

const COLOR_STOPS: Record<string, [string, string]> = {
  graphite: ["#2b2f34", "#474d55"],
  clay: ["#9c5a41", "#c48064"],
  moss: ["#4c5a3c", "#6f8055"],
};

function productImage(colorId: string): string {
  const [a, b] = COLOR_STOPS[colorId] ?? COLOR_STOPS.graphite;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <g fill='url(#g)' stroke='rgba(0,0,0,0.18)' stroke-width='2'>
      <path d='M78 70c0-26 84-26 84 0v118c0 12-10 20-22 20H100c-12 0-22-8-22-20z'/>
    </g>
    <path d='M96 70c0-18 48-18 48 0' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='6'/>
    <rect x='96' y='128' width='48' height='40' rx='8' fill='rgba(255,255,255,0.14)'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const GROUPS: OptionGroup[] = [
  {
    id: "color",
    type: "color",
    label: "Colour",
    values: [
      { value: "graphite", label: "Graphite", swatch: "#33373d", inventoryState: "in_stock", recommended: true },
      { value: "clay", label: "Clay", swatch: "#b06a4f", inventoryState: "in_stock" },
      { value: "moss", label: "Moss", swatch: "#5c6b48", inventoryState: "low_stock" },
    ],
  },
  {
    id: "capacity",
    type: "size",
    label: "Capacity",
    values: [
      { value: "18l", label: "18 L", inventoryState: "in_stock" },
      { value: "24l", label: "24 L", inventoryState: "in_stock", recommended: true },
      { value: "32l", label: "32 L", priceAdjustment: 24, inventoryState: "backordered" },
    ],
  },
  {
    id: "fabric",
    type: "material",
    label: "Fabric",
    values: [
      { value: "recycled", label: "Recycled nylon", inventoryState: "in_stock" },
      { value: "waxed", label: "Waxed canvas", priceAdjustment: 32, inventoryState: "in_stock" },
    ],
  },
];

export function ProductVariantSelectorCatalogPreview() {
  return (
    <div className="mx-auto w-full max-w-[460px]">
      <ProductVariantSelector
        groups={GROUPS}
        defaultValue={{ color: "graphite", capacity: "24l", fabric: "recycled" } satisfies VariantSelection}
        basePrice={148}
        currency="USD"
        productName="Range 24 backpack"
        resolveImage={(sel) => productImage(sel.color)}
        showReset={false}
      />
    </div>
  );
}

export default ProductVariantSelectorCatalogPreview;
