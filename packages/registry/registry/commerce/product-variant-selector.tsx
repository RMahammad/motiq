"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import {
  useControllableState,
  useReducedMotion,
  useAnimatedNumber,
  formatNumber,
  statusVars,
  type StatusTone,
} from "@/lib/motionkit";

/**
 * ProductVariantSelector — a presentation + orchestration surface for choosing a
 * configurable product's variant (color / size / material / finish / storage /
 * plan / bundle / custom option groups). It is NOT a store: it never fetches
 * pricing, decides inventory, or checks out. The host application owns every
 * fact — availability, inventory state, price adjustments, images, and which
 * *combinations* are valid — and hands them to this component, which surfaces
 * the choice, animates the change, and reports selections back.
 *
 * What earns its keep over a stack of <select>s: per-value inventory state and
 * app-owned reasons (never colour alone), dependent options where one choice
 * disables another, an honest "checking availability" state, a price adjustment
 * that is animated *and* always shown as text, a product-image change callback,
 * a live selection summary, reset, and an invalid-combination recovery path.
 *
 * Deliberately NOT included: no fabricated scarcity, no fake "only 2 left!"
 * countdowns, no invented discounts. Inventory copy comes from the app verbatim.
 *
 * Accessibility: each option group is an ARIA radiogroup of role="radio" tiles
 * with roving-tabindex Arrow/Home/End keyboard selection; colour swatches always
 * carry a text label (never colour alone); inventory + disabled reasons are
 * exposed to assistive tech; price changes are announced and rendered as text
 * (not by animation alone); focus-visible rings throughout; and under
 * prefers-reduced-motion every transition renders in its final state.
 * Clean-room original.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export type OptionGroupType =
  | "color"
  | "size"
  | "material"
  | "finish"
  | "storage"
  | "plan"
  | "bundle"
  | "custom"
  | (string & {});

/** App-supplied stock/lifecycle of a single variant value. */
export type InventoryState =
  | "in_stock"
  | "low_stock"
  | "backordered"
  | "preorder"
  | "out_of_stock"
  | "discontinued"
  | (string & {});

export interface VariantValue {
  /** Stable id for this value within its group. */
  value: string;
  /** Human label — also the accessible name of the swatch/tile. */
  label: string;
  /** CSS colour (or gradient) for a colour/finish swatch. Text label still shown. */
  swatch?: string;
  /** Product image URL to show when this value is selected. */
  image?: string;
  /** Signed adjustment to the base price (host currency units). */
  priceAdjustment?: number;
  /** App-owned: is this value selectable at all (independent of stock)? */
  availability?: boolean;
  /** App-owned stock state; drives an inventory badge + default selectability. */
  inventoryState?: InventoryState;
  /** Reason surfaced when this value can't be selected. */
  disabledReason?: string;
  /** Marks a suggested value (badge + used as recovery/default fallback). */
  recommended?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OptionGroup {
  id: string;
  type: OptionGroupType;
  /** Group heading, e.g. "Colour". */
  label: string;
  values: VariantValue[];
  /** Optional helper text under the heading. */
  hint?: string;
}

/** Map of groupId → selected value id. */
export type VariantSelection = Record<string, string>;

/** Resolved, selection-aware state of a single value (app overrides merged in). */
export interface VariantState {
  disabled?: boolean;
  reason?: string;
  inventoryState?: InventoryState;
}

export interface VariantChangeMeta {
  groupId: string;
  group: OptionGroup;
  value: VariantValue;
  total: number;
}

export interface ProductVariantSelectorProps {
  /** All option groups. The app owns this data. */
  groups: OptionGroup[];
  /** Controlled selection (groupId → value id). */
  value?: VariantSelection;
  /** Uncontrolled initial selection. */
  defaultValue?: VariantSelection;
  /** Fired when the user changes a group's value. */
  onValueChange?: (selection: VariantSelection, meta: VariantChangeMeta) => void;
  /** Base price before adjustments (host currency units). */
  basePrice: number;
  /** Fired whenever the computed total changes (total, signed delta). */
  onPriceChange?: (total: number, delta: number) => void;
  /**
   * Dependent options: given the current selection, override a value's state —
   * disable it, supply a reason, or revise its inventory. This is how the app
   * declares unavailable *combinations* (e.g. "Titanium not made in XS").
   */
  getVariantState?: (params: { group: OptionGroup; value: VariantValue; selection: VariantSelection }) => VariantState | undefined;
  /** App is recalculating availability/pricing; shows an honest busy state. */
  loadingAvailability?: boolean;
  /** Resolve the product image for a selection (defaults to the last selected value with an image). */
  resolveImage?: (selection: VariantSelection, groups: OptionGroup[]) => string | undefined;
  /** Fired when the resolved product image changes. */
  onImageChange?: (image: string | undefined, selection: VariantSelection) => void;
  /**
   * Price formatter — never assume the currency symbol's position. Defaults to
   * an Intl currency format from `currency`/`locale`.
   */
  priceFormatter?: (amount: number) => string;
  currency?: string;
  locale?: string;
  /** Accessible name for the whole configurator. */
  productName?: string;
  /** Density: "compact" for mobile / tight layouts. */
  layout?: "comfortable" | "compact";
  /** Show the built-in Reset control. */
  showReset?: boolean;
  /** Fired after a reset to the initial selection. */
  onReset?: (selection: VariantSelection) => void;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Inventory vocabulary                                                        */
/* -------------------------------------------------------------------------- */

interface InventoryMeta {
  label: string;
  tone: StatusTone;
  selectable: boolean;
}

const INVENTORY_META: Record<string, InventoryMeta> = {
  in_stock: { label: "In stock", tone: "success", selectable: true },
  low_stock: { label: "Low stock", tone: "warning", selectable: true },
  backordered: { label: "Backordered", tone: "info", selectable: true },
  preorder: { label: "Pre-order", tone: "info", selectable: true },
  out_of_stock: { label: "Out of stock", tone: "error", selectable: false },
  discontinued: { label: "Discontinued", tone: "neutral", selectable: false },
};

function humanize(s: string): string {
  const t = s.replace(/[_-]+/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : s;
}

function inventoryMeta(state?: InventoryState): InventoryMeta | null {
  if (!state) return null;
  return INVENTORY_META[state] ?? { label: humanize(state), tone: "neutral", selectable: true };
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

const CheckGlyph = () => (
  <svg {...glyph} width={13} height={13} strokeWidth={2.6}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const WarnGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);
const StarGlyph = () => (
  <svg viewBox="0 0 24 24" width={11} height={11} fill="currentColor" aria-hidden focusable="false">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
);
const ResetGlyph = () => (
  <svg {...glyph} width={13} height={13}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
const SpinnerGlyph = ({ reduce }: { reduce: boolean }) => (
  <motion.svg
    {...glyph}
    width={14}
    height={14}
    animate={reduce ? undefined : { rotate: 360 }}
    transition={reduce ? undefined : { duration: 0.9, ease: "linear", repeat: Infinity }}
    style={{ display: "inline-block" }}
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.6" />
  </motion.svg>
);
const CubeGlyph = () => (
  <svg {...glyph} width={26} height={26} strokeWidth={1.4}>
    <path d="M21 7.5 12 3 3 7.5m18 0L12 12m9-4.5v9L12 21m0-9L3 7.5m9 4.5v9M3 7.5v9L12 21" />
  </svg>
);

/* -------------------------------------------------------------------------- */
/* Shared class helpers                                                        */
/* -------------------------------------------------------------------------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus,var(--color-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

const EASE = [0.2, 0, 0, 1] as const;

/* -------------------------------------------------------------------------- */
/* Inventory badge (text + dot — never colour alone)                           */
/* -------------------------------------------------------------------------- */

function InventoryBadge({ state }: { state?: InventoryState }) {
  const meta = inventoryMeta(state);
  if (!meta || state === "in_stock") return null;
  const svars = statusVars(meta.tone);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold leading-none"
      style={{ color: svars.color, background: svars.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: svars.color }} aria-hidden />
      {meta.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Price delta formatting                                                       */
/* -------------------------------------------------------------------------- */

function signedPrice(delta: number, fmt: (n: number) => string): string {
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${fmt(Math.abs(delta))}`;
}

/* -------------------------------------------------------------------------- */
/* One option group (ARIA radiogroup with roving tabindex)                     */
/* -------------------------------------------------------------------------- */

interface OptionGroupViewProps {
  group: OptionGroup;
  selectedValue: string | undefined;
  resolve: (group: OptionGroup, value: VariantValue) => { disabled: boolean; reason?: string; inventoryState?: InventoryState };
  invalid: boolean;
  fmtSigned: (n: number) => string;
  compact: boolean;
  reduce: boolean;
  disabledAll: boolean;
  onSelect: (value: VariantValue) => void;
  baseId: string;
}

function OptionGroupView({
  group,
  selectedValue,
  resolve,
  invalid,
  fmtSigned,
  compact,
  reduce,
  disabledAll,
  onSelect,
  baseId,
}: OptionGroupViewProps) {
  const groupLabelId = `${baseId}-g-${group.id}`;
  const selected = group.values.find((v) => v.value === selectedValue);

  // Roving tabindex target: the selected enabled value, else the first enabled.
  const rovingValue = React.useMemo(() => {
    const enabled = group.values.filter((v) => !resolve(group, v).disabled);
    if (selected && !resolve(group, selected).disabled) return selected.value;
    return enabled[0]?.value ?? group.values[0]?.value;
  }, [group, selected, resolve]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabledIdx = group.values
      .map((v, i) => (resolve(group, v).disabled ? -1 : i))
      .filter((i) => i >= 0);
    if (!enabledIdx.length) return;
    const pos = enabledIdx.indexOf(index);
    let target = index;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        target = enabledIdx[(pos + 1 + enabledIdx.length) % enabledIdx.length] ?? enabledIdx[0];
        onSelect(group.values[target]);
        focusTile(baseId, group.id, group.values[target].value);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        target = enabledIdx[(pos - 1 + enabledIdx.length) % enabledIdx.length] ?? enabledIdx[0];
        onSelect(group.values[target]);
        focusTile(baseId, group.id, group.values[target].value);
        break;
      case "Home":
        e.preventDefault();
        onSelect(group.values[enabledIdx[0]]);
        focusTile(baseId, group.id, group.values[enabledIdx[0]].value);
        break;
      case "End":
        e.preventDefault();
        onSelect(group.values[enabledIdx[enabledIdx.length - 1]]);
        focusTile(baseId, group.id, group.values[enabledIdx[enabledIdx.length - 1]].value);
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        if (!resolve(group, group.values[index]).disabled) onSelect(group.values[index]);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h3 id={groupLabelId} className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {group.label}
        </h3>
        {selected ? (
          <span className="text-[12.5px] font-medium text-[var(--color-fg)]">
            {selected.label}
          </span>
        ) : null}
      </div>
      {group.hint ? <p className="-mt-1 text-[12px] text-[var(--color-muted)]">{group.hint}</p> : null}

      <div
        role="radiogroup"
        aria-labelledby={groupLabelId}
        aria-invalid={invalid || undefined}
        className={cn("flex flex-wrap", compact ? "gap-1.5" : "gap-2")}
      >
        {group.values.map((v, i) => {
          const state = resolve(group, v);
          const isSelected = v.value === selectedValue;
          const isDisabled = state.disabled || disabledAll;
          const reasonId = state.reason ? `${baseId}-r-${group.id}-${v.value}` : undefined;
          const adj = v.priceAdjustment ?? 0;
          const tabIndex = v.value === rovingValue && !disabledAll ? 0 : -1;
          const showInvalidRing = isSelected && invalid;

          const accName = [
            v.label,
            adj ? signedPrice(adj, fmtSigned) : null,
            state.inventoryState && state.inventoryState !== "in_stock"
              ? inventoryMeta(state.inventoryState)?.label
              : null,
          ]
            .filter(Boolean)
            .join(", ");

          return (
            <button
              key={v.value}
              type="button"
              role="radio"
              id={tileId(baseId, group.id, v.value)}
              aria-checked={isSelected}
              aria-disabled={isDisabled || undefined}
              aria-label={accName}
              aria-describedby={reasonId}
              tabIndex={tabIndex}
              onClick={() => {
                if (!isDisabled) onSelect(v);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "group relative inline-flex min-h-[44px] select-none items-center gap-2 rounded-xl border text-left transition-colors",
                compact ? "px-2.5 py-1.5" : "px-3 py-2",
                focusRing,
                isSelected
                  ? "border-[var(--color-accent)] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface))]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]",
                isDisabled && "cursor-not-allowed opacity-55 hover:border-[var(--color-border)]",
              )}
              style={showInvalidRing ? { boxShadow: `0 0 0 2px ${statusVars("warning").color}` } : undefined}
            >
              {v.swatch ? (
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-fg)_18%,transparent)]"
                  style={{ background: v.swatch }}
                  aria-hidden
                >
                  {isSelected ? (
                    <span className="text-[var(--color-surface)] mix-blend-difference">
                      <CheckGlyph />
                    </span>
                  ) : null}
                </span>
              ) : isSelected ? (
                <span className="text-[var(--color-accent)]" aria-hidden>
                  <CheckGlyph />
                </span>
              ) : null}

              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13.5px] font-semibold text-[var(--color-fg)]">{v.label}</span>
                  {v.recommended ? (
                    <span className="inline-flex items-center gap-0.5 text-[var(--color-accent)]" title="Recommended">
                      <StarGlyph />
                      <span className="sr-only">Recommended</span>
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  {adj ? (
                    <span className="text-[11.5px] font-medium tabular-nums text-[var(--color-muted)]">
                      {signedPrice(adj, fmtSigned)}
                    </span>
                  ) : null}
                  <InventoryBadge state={state.inventoryState} />
                </span>
              </span>

              {/* selection ring pulse (motion-safe) */}
              {isSelected && !reduce ? (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{ boxShadow: `0 0 0 2px ${statusVars("active").color}` }}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                />
              ) : null}

              {isDisabled && state.reason ? (
                <span id={reasonId} className="sr-only">
                  {state.reason}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Visible reason for the *selected* value when it's disabled (recovery context) */}
      {selected && resolve(group, selected).disabled && resolve(group, selected).reason ? (
        <p className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: statusVars("warning").color }}>
          <WarnGlyph />
          {resolve(group, selected).reason}
        </p>
      ) : null}
    </div>
  );
}

function tileId(baseId: string, groupId: string, value: string) {
  return `${baseId}-t-${groupId}-${value}`;
}
function focusTile(baseId: string, groupId: string, value: string) {
  requestAnimationFrame(() => {
    document.getElementById(tileId(baseId, groupId, value))?.focus();
  });
}

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */

export function ProductVariantSelector({
  groups,
  value,
  defaultValue,
  onValueChange,
  basePrice,
  onPriceChange,
  getVariantState,
  loadingAvailability = false,
  resolveImage,
  onImageChange,
  priceFormatter,
  currency = "USD",
  locale,
  productName = "Product",
  layout = "comfortable",
  showReset = true,
  onReset,
  className,
}: ProductVariantSelectorProps) {
  const reduce = useReducedMotion();
  const baseId = React.useId();
  const compact = layout === "compact";

  const fmt = React.useMemo(
    () => priceFormatter ?? ((n: number) => formatNumber(n, { locale, currency })),
    [priceFormatter, locale, currency],
  );

  /* Initial selection: defaultValue → recommended → first enabled → first ---- */
  const computeInitial = React.useCallback((): VariantSelection => {
    const sel: VariantSelection = {};
    for (const g of groups) {
      const wanted = defaultValue?.[g.id];
      if (wanted && g.values.some((v) => v.value === wanted)) {
        sel[g.id] = wanted;
        continue;
      }
      const recommended = g.values.find((v) => v.recommended && v.availability !== false);
      const firstEnabled = g.values.find(
        (v) => v.availability !== false && inventoryMeta(v.inventoryState)?.selectable !== false,
      );
      sel[g.id] = (recommended ?? firstEnabled ?? g.values[0])?.value ?? "";
    }
    return sel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const initialRef = React.useRef<VariantSelection | null>(null);
  if (initialRef.current === null) initialRef.current = computeInitial();

  const [selection, setSelection] = useControllableState<VariantSelection>({
    value,
    defaultValue: defaultValue ? { ...initialRef.current, ...defaultValue } : initialRef.current,
    onChange: undefined,
  });

  /* Resolve one value's selection-aware state (app override merged over base) */
  const resolve = React.useCallback(
    (group: OptionGroup, v: VariantValue): { disabled: boolean; reason?: string; inventoryState?: InventoryState } => {
      const app = getVariantState?.({ group, value: v, selection }) ?? {};
      const inv = app.inventoryState ?? v.inventoryState;
      const invMeta = inventoryMeta(inv);
      const explicitlyUnavailable = v.availability === false;
      const disabled = app.disabled ?? (explicitlyUnavailable || invMeta?.selectable === false);
      let reason = app.reason ?? v.disabledReason;
      if (disabled && !reason) {
        reason = invMeta && invMeta.selectable === false ? `${v.label} is ${invMeta.label.toLowerCase()}.` : `${v.label} is unavailable.`;
      }
      return { disabled: !!disabled, reason, inventoryState: inv };
    },
    [getVariantState, selection],
  );

  /* Total price = base + selected adjustments -------------------------------- */
  const total = React.useMemo(() => {
    let sum = basePrice;
    for (const g of groups) {
      const v = g.values.find((x) => x.value === selection[g.id]);
      if (v?.priceAdjustment) sum += v.priceAdjustment;
    }
    return sum;
  }, [basePrice, groups, selection]);

  const displayTotal = useAnimatedNumber(total, { durationMs: 550, disabled: reduce });

  /* Price-change callback + transient delta chip ----------------------------- */
  const prevTotalRef = React.useRef(total);
  const [delta, setDelta] = React.useState<number | null>(null);
  const deltaTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (deltaTimer.current) clearTimeout(deltaTimer.current); }, []);

  React.useEffect(() => {
    const prev = prevTotalRef.current;
    if (prev !== total) {
      const d = total - prev;
      prevTotalRef.current = total;
      onPriceChange?.(total, d);
      setDelta(d);
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
      deltaTimer.current = setTimeout(() => setDelta(null), 2200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  /* Resolved product image + change callback --------------------------------- */
  const image = React.useMemo(() => {
    if (resolveImage) return resolveImage(selection, groups);
    let img: string | undefined;
    for (const g of groups) {
      const v = g.values.find((x) => x.value === selection[g.id]);
      if (v?.image) img = v.image;
    }
    return img;
  }, [resolveImage, selection, groups]);

  const prevImageRef = React.useRef<string | undefined>(image);
  React.useEffect(() => {
    if (prevImageRef.current !== image) {
      prevImageRef.current = image;
      onImageChange?.(image, selection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image]);

  /* Invalid combination detection + recovery suggestion ---------------------- */
  const invalidGroups = React.useMemo(() => {
    const out: OptionGroup[] = [];
    for (const g of groups) {
      const v = g.values.find((x) => x.value === selection[g.id]);
      if (v && resolve(g, v).disabled) out.push(g);
    }
    return out;
  }, [groups, selection, resolve]);

  const recovery = React.useMemo(() => {
    const g = invalidGroups[0];
    if (!g) return null;
    const current = g.values.find((x) => x.value === selection[g.id]);
    const fix =
      g.values.find((v) => v.recommended && !resolve(g, v).disabled) ??
      g.values.find((v) => !resolve(g, v).disabled);
    if (!fix) return { group: g, current, fix: null as VariantValue | null };
    return { group: g, current, fix };
  }, [invalidGroups, selection, resolve]);

  /* Commit a selection ------------------------------------------------------- */
  const selectValue = React.useCallback(
    (group: OptionGroup, v: VariantValue) => {
      if (resolve(group, v).disabled) return;
      const next = { ...selection, [group.id]: v.value };
      setSelection(next);
      // compute the total for meta from `next`
      let sum = basePrice;
      for (const g of groups) {
        const val = g.values.find((x) => x.value === next[g.id]);
        if (val?.priceAdjustment) sum += val.priceAdjustment;
      }
      onValueChange?.(next, { groupId: group.id, group, value: v, total: sum });
    },
    [resolve, selection, setSelection, basePrice, groups, onValueChange],
  );

  const applyRecovery = React.useCallback(() => {
    if (recovery?.fix) selectValue(recovery.group, recovery.fix);
  }, [recovery, selectValue]);

  const handleReset = React.useCallback(() => {
    const init = initialRef.current ?? computeInitial();
    setSelection(init);
    onReset?.(init);
    // Announce via the summary live region; also fire price change if it moved.
  }, [computeInitial, setSelection, onReset]);

  /* Selection summary text --------------------------------------------------- */
  const summaryParts = groups.map((g) => {
    const v = g.values.find((x) => x.value === selection[g.id]);
    return v ? `${g.label}: ${v.label}` : null;
  }).filter(Boolean);

  const announcement = loadingAvailability
    ? "Checking availability…"
    : recovery
      ? `Selected combination is unavailable. ${recovery.group.label} needs to change.`
      : `${productName}. ${summaryParts.join(". ")}. Total ${fmt(total)}.`;

  /* ----------------------------------------------------------------------- */

  return (
    <section
      aria-label={`${productName} options`}
      aria-busy={loadingAvailability || undefined}
      className={cn(
        "w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] shadow-[var(--shadow-sm)]",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <div className={cn("grid gap-5", compact ? "grid-cols-1" : "sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]")}>
        {/* Product image panel (abstract; app supplies real images) --------- */}
        <div className={cn("relative", compact && "order-first")}>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={image ?? "placeholder"}
                className="absolute inset-0 grid place-items-center"
                initial={reduce ? false : { opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: EASE }}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[var(--color-muted)]" aria-hidden>
                    <CubeGlyph />
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {loadingAvailability ? (
              <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)]" aria-hidden>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-muted)] shadow-[var(--shadow-sm)]">
                  <SpinnerGlyph reduce={reduce} />
                  Checking availability…
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Options + price -------------------------------------------------- */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className={cn("flex flex-col", compact ? "gap-4" : "gap-5")}>
            {groups.map((g) => (
              <OptionGroupView
                key={g.id}
                group={g}
                selectedValue={selection[g.id]}
                resolve={resolve}
                invalid={invalidGroups.includes(g)}
                fmtSigned={fmt}
                compact={compact}
                reduce={reduce}
                disabledAll={loadingAvailability}
                onSelect={(v) => selectValue(g, v)}
                baseId={baseId}
              />
            ))}
          </div>

          {/* Invalid-combination recovery banner -------------------------- */}
          <AnimatePresence initial={false}>
            {recovery ? (
              <motion.div
                key="recovery"
                initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                style={{ overflow: "hidden" }}
              >
                <div
                  role="alert"
                  className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px]"
                  style={{ borderColor: statusVars("warning").border, background: statusVars("warning").bg }}
                >
                  <span style={{ color: statusVars("warning").color }} className="shrink-0">
                    <WarnGlyph />
                  </span>
                  <span className="flex-1 text-[var(--color-fg)]">
                    That combination isn’t available. {recovery.fix ? (
                      <>Switch <strong>{recovery.group.label}</strong> to <strong>{recovery.fix.label}</strong>?</>
                    ) : (
                      <>Please adjust <strong>{recovery.group.label}</strong>.</>
                    )}
                  </span>
                  {recovery.fix ? (
                    <button
                      type="button"
                      onClick={applyRecovery}
                      className={cn(
                        "inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                        focusRing,
                      )}
                    >
                      Use {recovery.fix.label}
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Price + summary + reset -------------------------------------- */}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[11.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                {recovery ? "Price (pending)" : "Total"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[clamp(1.4rem,3.2vw,1.8rem)] font-semibold leading-none tracking-tight tabular-nums text-[var(--color-fg)]">
                  {/* Price shown as text always — never conveyed by animation alone. */}
                  {fmt(displayTotal)}
                </span>
                <AnimatePresence>
                  {delta ? (
                    <motion.span
                      key={`${delta}-${total}`}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums"
                      style={{
                        color: delta > 0 ? statusVars("warning").color : statusVars("success").color,
                        background: delta > 0 ? statusVars("warning").bg : statusVars("success").bg,
                      }}
                    >
                      {signedPrice(delta, fmt)}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              <span className="mt-0.5 truncate text-[11.5px] text-[var(--color-muted)]">
                {summaryParts.join(" · ")}
              </span>
            </div>

            {showReset ? (
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  focusRing,
                )}
              >
                <ResetGlyph />
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Polite announcer ------------------------------------------------- */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}

export default ProductVariantSelector;
