"use client";

import * as React from "react";

import {
  ProductVariantSelector,
  type OptionGroup,
  type VariantSelection,
  type VariantState,
} from "@/registry/commerce/product-variant-selector";

/* -------------------------------------------------------------------------
 * DEMO ONLY — a fictional product page for the imaginary brand "Foldwork",
 * configuring the (invented) "Foldwork Range 24 backpack". Every colour,
 * fabric, price, and stock state below is made up and local. There is NO real
 * store: the selector only presents what this shell hands it, the "availability
 * recalculation" is a local setTimeout, and nothing is ever purchased. Stock
 * copy is honest and app-owned — no fake scarcity or invented discounts.
 * ---------------------------------------------------------------------- */

const BASE_PRICE = 148;

const GROUPS: OptionGroup[] = [
  {
    id: "color",
    type: "color",
    label: "Colour",
    hint: "Swatches are labelled — colour is never the only cue.",
    values: [
      { value: "graphite", label: "Graphite", swatch: "#33373d", inventoryState: "in_stock", recommended: true },
      { value: "clay", label: "Clay", swatch: "#b06a4f", inventoryState: "in_stock" },
      { value: "moss", label: "Moss", swatch: "#5c6b48", inventoryState: "low_stock" },
      { value: "bone", label: "Bone", swatch: "#e7e0d2", inventoryState: "out_of_stock", disabledReason: "Bone is out of stock — restock expected next month." },
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
      { value: "ballistic", label: "Ballistic weave", priceAdjustment: 46, inventoryState: "low_stock" },
    ],
  },
  {
    id: "carry",
    type: "custom",
    label: "Carry system",
    values: [
      { value: "standard", label: "Standard straps", inventoryState: "in_stock", recommended: true },
      { value: "harness", label: "Load harness", priceAdjustment: 18, inventoryState: "in_stock" },
    ],
  },
];

// No real product photography exists in this demo, so we synthesize a tinted
// backpack silhouette as an inline SVG data-URI per colour. This gives the
// component a genuine, valid image that visibly changes with the selection
// (and exercises its onImageChange + crossfade), with no external asset.
const COLOR_STOPS: Record<string, [string, string]> = {
  graphite: ["#2b2f34", "#474d55"],
  clay: ["#9c5a41", "#c48064"],
  moss: ["#4c5a3c", "#6f8055"],
  bone: ["#d9d2c1", "#efe9df"],
};

function productImage(colorId: string): string {
  const [a, b] = COLOR_STOPS[colorId] ?? COLOR_STOPS.graphite;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/>
    </linearGradient></defs>
    <rect width='240' height='240' fill='#00000000'/>
    <g fill='url(#g)' stroke='rgba(0,0,0,0.18)' stroke-width='2'>
      <path d='M78 70c0-26 84-26 84 0v118c0 12-10 20-22 20H100c-12 0-22-8-22-20z'/>
    </g>
    <path d='M96 70c0-18 48-18 48 0' fill='none' stroke='rgba(255,255,255,0.35)' stroke-width='6'/>
    <rect x='96' y='128' width='48' height='40' rx='8' fill='rgba(255,255,255,0.14)'/>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Dependent rule: the 32 L body isn't produced in Waxed canvas — an unavailable
// *combination* the app declares (not a per-value stock fact).
function getVariantState({ group, value, selection }: { group: OptionGroup; value: { value: string }; selection: VariantSelection }): VariantState | undefined {
  if (group.id === "capacity" && value.value === "32l" && selection.fabric === "waxed") {
    return { disabled: true, reason: "32 L isn’t offered in waxed canvas — pick 18 L or 24 L, or switch fabric." };
  }
  if (group.id === "fabric" && value.value === "waxed" && selection.capacity === "32l") {
    return { disabled: true, reason: "Waxed canvas tops out at 24 L." };
  }
  return undefined;
}

const controlBtn =
  "inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-50";

export function ProductVariantSelectorPreview() {
  const [selection, setSelection] = React.useState<VariantSelection>({
    color: "graphite",
    capacity: "24l",
    fabric: "recycled",
    carry: "standard",
  });
  const [compact, setCompact] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [lastEvent, setLastEvent] = React.useState<string>("Configure the Range 24 to see live pricing and stock.");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onValueChange = React.useCallback((next: VariantSelection, meta: { group: OptionGroup; value: { label: string } }) => {
    setSelection(next);
    setLastEvent(`Selected ${meta.value.label} for ${meta.group.label}.`);
  }, []);

  const onPriceChange = React.useCallback((total: number, delta: number) => {
    if (delta !== 0) {
      setLastEvent(`Price updated to $${total} (${delta > 0 ? "+" : "−"}$${Math.abs(delta)}).`);
    }
  }, []);

  // Simulate the store recalculating availability against a backend.
  const recheck = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setChecking(true);
    timer.current = setTimeout(() => setChecking(false), 1100);
  }, []);

  const reset = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setChecking(false);
    setSelection({ color: "graphite", capacity: "24l", fabric: "recycled", carry: "standard" });
    setLastEvent("Reset to the recommended build.");
  }, []);

  const current = GROUPS[0].values.find((v) => v.value === selection.color);

  return (
    <div className="w-full max-w-[860px]">
      {/* Product-page shell ---------------------------------------------- */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]">
        {/* Store header */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-fg)]">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-[var(--color-accent)] text-[11px] font-bold text-white" aria-hidden>F</span>
            Foldwork
          </span>
          <span className="text-[var(--color-muted)]" aria-hidden>/</span>
          <span className="text-[13px] text-[var(--color-fg)]">Range 24 backpack</span>
          <span className="ml-auto text-[11.5px] text-[var(--color-muted)]">Demo store · no checkout, no live stock</span>
        </div>

        {/* Title + rating row (static, honest — no fabricated review counts) */}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 px-4 pt-4">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-[var(--color-fg)]">Range 24 — modular daypack</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">
              Build yours in {current?.label ?? "your colour"}. Pricing and stock update as you configure.
            </p>
          </div>
        </div>

        {/* The selector dominates the page body -------------------------- */}
        <div className="px-4 py-4">
          <ProductVariantSelector
            groups={GROUPS}
            value={selection}
            onValueChange={onValueChange}
            basePrice={BASE_PRICE}
            onPriceChange={onPriceChange}
            getVariantState={getVariantState}
            loadingAvailability={checking}
            resolveImage={(sel) => productImage(sel.color)}
            currency="USD"
            productName="Range 24 backpack"
            layout={compact ? "compact" : "comfortable"}
            className="border-0 p-0 shadow-none"
          />
        </div>
      </div>

      {/* Working controls ------------------------------------------------- */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Demo controls">
        <button type="button" className={controlBtn} onClick={recheck}>
          Recheck availability
        </button>
        <button
          type="button"
          className={controlBtn}
          aria-pressed={compact}
          onClick={() => setCompact((c) => !c)}
        >
          Mobile layout: {compact ? "compact" : "comfortable"}
        </button>
        <button type="button" className={controlBtn} onClick={reset}>
          Reset build
        </button>
        <span className="ml-auto max-w-full truncate text-[12px] text-[var(--color-muted)]" aria-live="polite">
          {lastEvent}
        </span>
      </div>
    </div>
  );
}

export default ProductVariantSelectorPreview;
