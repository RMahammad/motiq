"use client";

/**
 * MobileFilterSheet — a real mobile-first filter *workflow*, not a sheet of
 * checkboxes. It ships the pieces production filtering actually needs:
 *
 *  - App-defined filter groups: checkbox · radio · range · date ·
 *    search-within-options · hierarchical · custom (renderFilter).
 *  - A DRAFT vs APPLIED model: editing only mutates the draft; **Apply** commits
 *    the draft (fires `onApply` + `onValueChange`), **Cancel** restores the last
 *    applied value, **Reset** returns to defaults, and Clear-group / Clear-all
 *    empty selections without committing.
 *  - Live result count (`useAnimatedNumber`) announced politely to screen
 *    readers, disabled options with reasons, per-group option counts, collapsible
 *    groups, and removable selected chips.
 *  - Three surfaces: a bottom "sheet", "fullscreen", and a desktop "panel" side
 *    drawer — so it is never mobile-only.
 *
 * Safety & a11y: `role="dialog" aria-modal`, a manual focus trap + focus
 * restoration to the trigger, Escape-to-close, an optional unsaved-change confirm
 * (`confirmDiscard`), a sticky header + scrollable body + sticky footer that
 * stays reachable at 200% zoom, ≥44px targets, forced-colors-safe state (never
 * color-only), and safe-area insets. Swipe-to-close is available on the sheet but
 * is **never** the only way out — a Close/Cancel button is always present, and it
 * is disabled entirely under reduced motion. Clean-room original.
 */

import * as React from "react";
import {
  motion,
  AnimatePresence,
  type PanInfo,
  type Transition,
  type TargetAndTransition,
} from "motion/react";

import { cn } from "@/lib/utils";
import { useControllableState, useAnimatedNumber, useReducedMotion } from "@/lib/motionkit";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type FilterGroupType =
  | "checkbox"
  | "radio"
  | "range"
  | "date"
  | "search"
  | "hierarchical"
  | "custom";

export interface FilterOption {
  /** Stable value stored in the filter value. */
  value: string;
  /** Human label shown in the option row and chips. */
  label: string;
  /** Optional matching count (e.g. "Active (128)"). */
  count?: number;
  /** Disable selecting this option. */
  disabled?: boolean;
  /** Why the option is disabled — surfaced as text, never color-only. */
  disabledReason?: string;
  /** Children for hierarchical groups. */
  children?: FilterOption[];
}

interface FilterGroupBase {
  /** Unique key — indexes into the FilterValue map. */
  id: string;
  /** Group heading. */
  label: string;
  type: FilterGroupType;
  /** Optional helper text under the heading. */
  description?: string;
  /** Render the group collapsed initially (still expandable). */
  defaultCollapsed?: boolean;
  /** Allow collapsing (default true). */
  collapsible?: boolean;
}

export interface CheckboxFilterGroup extends FilterGroupBase {
  type: "checkbox" | "search";
  options: FilterOption[];
  /** Placeholder for the in-group search field ("search" type). */
  searchPlaceholder?: string;
}
export interface RadioFilterGroup extends FilterGroupBase {
  type: "radio";
  options: FilterOption[];
}
export interface RangeFilterGroup extends FilterGroupBase {
  type: "range";
  min: number;
  max: number;
  step?: number;
  unit?: string;
  /** Format a bound for display (defaults to `value + unit`). */
  format?: (n: number) => string;
}
export interface DateFilterGroup extends FilterGroupBase {
  type: "date";
}
export interface HierarchicalFilterGroup extends FilterGroupBase {
  type: "hierarchical";
  options: FilterOption[];
}
export interface CustomFilterGroup extends FilterGroupBase {
  type: "custom";
}

export type FilterGroup =
  | CheckboxFilterGroup
  | RadioFilterGroup
  | RangeFilterGroup
  | DateFilterGroup
  | HierarchicalFilterGroup
  | CustomFilterGroup;

/** Per-group value shapes stored in the FilterValue map. */
export type CheckboxValue = string[];
export type RadioValue = string | null;
export type RangeValue = { min: number; max: number };
export type DateValue = { from: string | null; to: string | null };

/** The whole filter value — one entry per group id. Shape depends on group type. */
export type FilterValue = Record<string, unknown>;

export type FilterSheetMode = "sheet" | "fullscreen" | "panel";

export interface RenderFilterArgs {
  group: CustomFilterGroup;
  /** Current draft value for this group. */
  value: unknown;
  /** Update this group's draft value (does not commit). */
  setValue: (next: unknown) => void;
}

export interface RenderFooterArgs {
  draft: FilterValue;
  resultCount?: number;
  dirty: boolean;
  activeCount: number;
  apply: () => void;
  cancel: () => void;
  clearAll: () => void;
}

export interface MobileFilterSheetProps {
  /** App-defined filter groups. */
  groups: FilterGroup[];
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled APPLIED value. Editing changes a draft; Apply commits it here. */
  value?: FilterValue;
  defaultValue?: FilterValue;
  /** Fires when the draft is committed (Apply). */
  onValueChange?: (value: FilterValue) => void;
  /**
   * Fires whenever the (uncommitted) draft changes — use it to compute the live
   * `resultCount` for the current draft before it is applied.
   */
  onDraftChange?: (draft: FilterValue) => void;
  /** Fires (with the committed value) when Apply is pressed. */
  onApply?: (value: FilterValue) => void;
  /** Fires when the sheet is dismissed without applying. */
  onCancel?: () => void;
  /** Fires when Clear-all empties the draft. */
  onClear?: () => void;
  /** App-computed result count for the current draft (drives the live count). */
  resultCount?: number;
  /** Option counts / results are loading. */
  loading?: boolean;
  /** Error message for the count/result area. */
  error?: string | null;
  /** Retry handler shown with the error. */
  onRetry?: () => void;
  /** Surface: bottom sheet, fullscreen, or desktop side panel. */
  mode?: FilterSheetMode;
  /** Prompt before discarding unsaved draft changes. */
  confirmDiscard?: boolean;
  /** Sheet heading. */
  title?: string;
  /** Optional trigger element; when omitted the app controls `open` itself. */
  trigger?: React.ReactNode;
  /** Custom renderer for `type: "custom"` groups. */
  renderFilter?: (args: RenderFilterArgs) => React.ReactNode;
  /** Replace the sticky footer entirely. */
  renderFooter?: (args: RenderFooterArgs) => React.ReactNode;
  applyLabel?: string;
  cancelLabel?: string;
  clearAllLabel?: string;
  resetLabel?: string;
  /** Format the result count number. */
  formatCount?: (n: number) => string;
  /**
   * Render the overlay absolutely inside the nearest positioned ancestor instead
   * of `fixed` to the viewport. Use for embedded demos / device frames.
   */
  contained?: boolean;
  /** Force reduced-motion behavior (defaults to the media query). */
  reducedMotion?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Value helpers                                                              */
/* -------------------------------------------------------------------------- */

function emptyValue(group: FilterGroup): unknown {
  switch (group.type) {
    case "checkbox":
    case "search":
    case "hierarchical":
      return [] as CheckboxValue;
    case "radio":
      return null as RadioValue;
    case "range":
      return { min: group.min, max: group.max } as RangeValue;
    case "date":
      return { from: null, to: null } as DateValue;
    default:
      return undefined;
  }
}

function readGroup(group: FilterGroup, value: FilterValue): unknown {
  const v = value[group.id];
  return v === undefined ? emptyValue(group) : v;
}

/** Collect leaf options (flattened) for hierarchical groups. */
function leaves(options: FilterOption[]): FilterOption[] {
  const out: FilterOption[] = [];
  for (const o of options) {
    if (o.children && o.children.length) out.push(...leaves(o.children));
    else out.push(o);
  }
  return out;
}

function isGroupActive(group: FilterGroup, value: FilterValue): boolean {
  const v = readGroup(group, value);
  switch (group.type) {
    case "checkbox":
    case "search":
    case "hierarchical":
      return Array.isArray(v) && v.length > 0;
    case "radio":
      return v != null;
    case "range": {
      const r = v as RangeValue;
      return r.min > group.min || r.max < group.max;
    }
    case "date": {
      const d = v as DateValue;
      return Boolean(d.from || d.to);
    }
    case "custom":
      return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
    default:
      return false;
  }
}

function normalize(group: FilterGroup, value: FilterValue): string {
  const v = readGroup(group, value);
  if (Array.isArray(v)) return JSON.stringify([...v].sort());
  return JSON.stringify(v ?? null);
}

function valuesEqual(a: FilterValue, b: FilterValue, groups: FilterGroup[]): boolean {
  return groups.every((g) => normalize(g, a) === normalize(g, b));
}

function optionLabel(options: FilterOption[], value: string): string {
  for (const o of options) {
    if (o.value === value) return o.label;
    if (o.children) {
      const found = optionLabel(o.children, value);
      if (found !== value) return found;
    }
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* Motion                                                                     */
/* -------------------------------------------------------------------------- */

const EASE: Transition["ease"] = [0.2, 0, 0, 1];

const surfaceMotion: Record<
  FilterSheetMode,
  { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }
> = {
  sheet: {
    initial: { y: "100%", opacity: 1 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 1 },
  },
  fullscreen: {
    initial: { y: 24, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 24, opacity: 0 },
  },
  panel: {
    initial: { x: "100%", opacity: 1 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 1 },
  },
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* -------------------------------------------------------------------------- */
/* Small UI atoms                                                             */
/* -------------------------------------------------------------------------- */

function CountBadge({ n, muted }: { n: number; muted?: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        muted
          ? "bg-[var(--color-bg-secondary)] text-[var(--color-muted)]"
          : "bg-[color-mix(in_oklab,var(--color-accent)_16%,transparent)] text-[var(--color-accent)]",
      )}
      aria-hidden
    >
      {n}
    </span>
  );
}

/** Option row: a real <label> wrapping a native checkbox/radio (no nested buttons). */
function OptionRow({
  type,
  name,
  option,
  checked,
  onToggle,
  indent,
}: {
  type: "checkbox" | "radio";
  name: string;
  option: FilterOption;
  checked: boolean;
  onToggle: () => void;
  indent?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
        "hover:bg-[var(--color-bg-secondary)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-accent)]",
        option.disabled && "cursor-not-allowed opacity-60",
        indent && "ml-6",
      )}
    >
      <input
        type={type}
        name={name}
        className="h-[18px] w-[18px] shrink-0 accent-[var(--color-accent)]"
        checked={checked}
        disabled={option.disabled}
        onChange={onToggle}
        aria-describedby={option.disabled && option.disabledReason ? `${name}-${option.value}-why` : undefined}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] text-[var(--color-fg)]">{option.label}</span>
        {option.disabled && option.disabledReason ? (
          <span id={`${name}-${option.value}-why`} className="block text-[12px] text-[var(--color-muted)]">
            {option.disabledReason}
          </span>
        ) : null}
      </span>
      {typeof option.count === "number" ? <CountBadge n={option.count} muted /> : null}
    </label>
  );
}

/** Accessible dual-thumb range with two native sliders + a filled track. */
function RangeControl({
  group,
  value,
  onChange,
}: {
  group: RangeFilterGroup;
  value: RangeValue;
  onChange: (next: RangeValue) => void;
}) {
  const { min, max } = group;
  const step = group.step ?? 1;
  const fmt = group.format ?? ((n: number) => `${n}${group.unit ? ` ${group.unit}` : ""}`);
  const span = Math.max(1, max - min);
  const leftPct = ((value.min - min) / span) * 100;
  const rightPct = ((max - value.max) / span) * 100;
  const thumb =
    "pointer-events-none absolute inset-x-0 top-1/2 h-0 w-full -translate-y-1/2 appearance-none bg-transparent " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--color-surface)] [&::-webkit-slider-thumb]:bg-[var(--color-accent)] [&::-webkit-slider-thumb]:shadow-[var(--shadow-sm)] " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--color-surface)] [&::-moz-range-thumb]:bg-[var(--color-accent)] " +
    "focus-visible:outline-none [&::-webkit-slider-thumb]:focus-visible:outline [&:focus-visible::-webkit-slider-thumb]:outline-2 [&:focus-visible::-webkit-slider-thumb]:outline-[var(--color-accent)]";
  return (
    <div className="px-1 pb-1">
      <div className="mb-3 flex items-center justify-between text-[13px] font-medium tabular-nums text-[var(--color-fg)]">
        <span>{fmt(value.min)}</span>
        <span className="text-[var(--color-muted)]">to</span>
        <span>{fmt(value.max)}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-bg-secondary)]" aria-hidden />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
          aria-hidden
        />
        <input
          type="range"
          className={cn(thumb, "z-10")}
          min={min}
          max={max}
          step={step}
          value={value.min}
          aria-label={`${group.label} minimum`}
          aria-valuetext={fmt(value.min)}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), value.max);
            onChange({ ...value, min: next });
          }}
        />
        <input
          type="range"
          className={cn(thumb, "z-20")}
          min={min}
          max={max}
          step={step}
          value={value.max}
          aria-label={`${group.label} maximum`}
          aria-valuetext={fmt(value.max)}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), value.min);
            onChange({ ...value, max: next });
          }}
        />
      </div>
    </div>
  );
}

const fieldClass =
  "min-h-[44px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[14px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)] focus-visible:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]";

/* -------------------------------------------------------------------------- */
/* Group body renderers                                                       */
/* -------------------------------------------------------------------------- */

function GroupBody({
  group,
  value,
  setValue,
  renderFilter,
}: {
  group: FilterGroup;
  value: FilterValue;
  setValue: (groupId: string, next: unknown) => void;
  renderFilter?: (args: RenderFilterArgs) => React.ReactNode;
}) {
  const raw = readGroup(group, value);

  if (group.type === "checkbox" || group.type === "search") {
    return (
      <CheckboxBody
        group={group}
        selected={raw as CheckboxValue}
        onChange={(next) => setValue(group.id, next)}
      />
    );
  }
  if (group.type === "radio") {
    const selected = raw as RadioValue;
    return (
      <div role="radiogroup" aria-label={group.label} className="space-y-0.5">
        {group.options.map((o) => (
          <OptionRow
            key={o.value}
            type="radio"
            name={group.id}
            option={o}
            checked={selected === o.value}
            onToggle={() => setValue(group.id, selected === o.value ? null : o.value)}
          />
        ))}
      </div>
    );
  }
  if (group.type === "range") {
    return (
      <RangeControl
        group={group}
        value={raw as RangeValue}
        onChange={(next) => setValue(group.id, next)}
      />
    );
  }
  if (group.type === "date") {
    const d = raw as DateValue;
    return (
      <div className="flex flex-col gap-3 px-1 pb-1 sm:flex-row">
        <label className="flex-1 text-[12px] font-medium text-[var(--color-muted)]">
          From
          <input
            type="date"
            className={cn(fieldClass, "mt-1")}
            value={d.from ?? ""}
            max={d.to ?? undefined}
            onChange={(e) => setValue(group.id, { ...d, from: e.target.value || null })}
          />
        </label>
        <label className="flex-1 text-[12px] font-medium text-[var(--color-muted)]">
          To
          <input
            type="date"
            className={cn(fieldClass, "mt-1")}
            value={d.to ?? ""}
            min={d.from ?? undefined}
            onChange={(e) => setValue(group.id, { ...d, to: e.target.value || null })}
          />
        </label>
      </div>
    );
  }
  if (group.type === "hierarchical") {
    return (
      <HierarchicalBody
        group={group}
        selected={raw as CheckboxValue}
        onChange={(next) => setValue(group.id, next)}
      />
    );
  }
  // custom
  return (
    <div className="px-1 pb-1">
      {renderFilter ? (
        renderFilter({ group: group as CustomFilterGroup, value: raw, setValue: (next) => setValue(group.id, next) })
      ) : (
        <p className="text-[13px] text-[var(--color-muted)]">Provide a <code>renderFilter</code> for custom groups.</p>
      )}
    </div>
  );
}

function CheckboxBody({
  group,
  selected,
  onChange,
}: {
  group: CheckboxFilterGroup;
  selected: CheckboxValue;
  onChange: (next: CheckboxValue) => void;
}) {
  const [query, setQuery] = React.useState("");
  const isSearch = group.type === "search";
  const filtered = React.useMemo(() => {
    if (!isSearch || !query.trim()) return group.options;
    const q = query.trim().toLowerCase();
    return group.options.filter((o) => o.label.toLowerCase().includes(q));
  }, [group.options, query, isSearch]);

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <div className="space-y-0.5">
      {isSearch ? (
        <div className="sticky top-0 z-10 -mx-1 mb-1 bg-[var(--color-surface)] px-1 pb-1">
          <input
            type="search"
            className={fieldClass}
            placeholder={group.searchPlaceholder ?? `Search ${group.label.toLowerCase()}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Search options in ${group.label}`}
          />
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <p className="px-2 py-3 text-[13px] text-[var(--color-muted)]">No options match “{query}”.</p>
      ) : (
        filtered.map((o) => (
          <OptionRow
            key={o.value}
            type="checkbox"
            name={group.id}
            option={o}
            checked={selected.includes(o.value)}
            onToggle={() => toggle(o.value)}
          />
        ))
      )}
    </div>
  );
}

function HierarchicalBody({
  group,
  selected,
  onChange,
}: {
  group: HierarchicalFilterGroup;
  selected: CheckboxValue;
  onChange: (next: CheckboxValue) => void;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const o of group.options) if (o.children?.length) init[o.value] = true;
    return init;
  });

  const setMany = (values: string[], on: boolean) => {
    const set = new Set(selected);
    for (const v of values) (on ? set.add(v) : set.delete(v));
    onChange([...set]);
  };

  return (
    <div className="space-y-0.5">
      {group.options.map((parent) => {
        const childLeaves = parent.children ? leaves(parent.children).filter((c) => !c.disabled) : [];
        const childValues = childLeaves.map((c) => c.value);
        const allOn = childValues.length > 0 && childValues.every((v) => selected.includes(v));
        const isExpanded = expanded[parent.value];
        if (!parent.children?.length) {
          return (
            <OptionRow
              key={parent.value}
              type="checkbox"
              name={group.id}
              option={parent}
              checked={selected.includes(parent.value)}
              onToggle={() =>
                onChange(
                  selected.includes(parent.value)
                    ? selected.filter((x) => x !== parent.value)
                    : [...selected, parent.value],
                )
              }
            />
          );
        }
        return (
          <div key={parent.value}>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? "Collapse" : "Expand"} ${parent.label}`}
                onClick={() => setExpanded((e) => ({ ...e, [parent.value]: !e[parent.value] }))}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <OptionRow
                type="checkbox"
                name={group.id}
                option={{ ...parent, label: parent.label }}
                checked={allOn}
                onToggle={() => setMany(childValues, !allOn)}
              />
            </div>
            {isExpanded ? (
              <div role="group" aria-label={parent.label}>
                {parent.children.map((child) => (
                  <OptionRow
                    key={child.value}
                    type="checkbox"
                    name={group.id}
                    option={child}
                    indent
                    checked={selected.includes(child.value)}
                    onToggle={() =>
                      onChange(
                        selected.includes(child.value)
                          ? selected.filter((x) => x !== child.value)
                          : [...selected, child.value],
                      )
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chips                                                                      */
/* -------------------------------------------------------------------------- */

interface Chip {
  key: string;
  label: string;
  remove: () => void;
}

function buildChips(
  groups: FilterGroup[],
  draft: FilterValue,
  setValue: (groupId: string, next: unknown) => void,
): Chip[] {
  const chips: Chip[] = [];
  for (const g of groups) {
    if (!isGroupActive(g, draft)) continue;
    const v = readGroup(g, draft);
    if (g.type === "checkbox" || g.type === "search" || g.type === "hierarchical") {
      const opts = "options" in g ? g.options : [];
      for (const val of v as CheckboxValue) {
        chips.push({
          key: `${g.id}:${val}`,
          label: optionLabel(opts, val),
          remove: () => setValue(g.id, (v as CheckboxValue).filter((x) => x !== val)),
        });
      }
    } else if (g.type === "radio") {
      const val = v as RadioValue;
      if (val)
        chips.push({ key: `${g.id}:${val}`, label: optionLabel(g.options, val), remove: () => setValue(g.id, null) });
    } else if (g.type === "range") {
      const r = v as RangeValue;
      const fmt = g.format ?? ((n: number) => `${n}${g.unit ? ` ${g.unit}` : ""}`);
      chips.push({
        key: `${g.id}:range`,
        label: `${g.label}: ${fmt(r.min)}–${fmt(r.max)}`,
        remove: () => setValue(g.id, emptyValue(g)),
      });
    } else if (g.type === "date") {
      const d = v as DateValue;
      chips.push({
        key: `${g.id}:date`,
        label: `${g.label}: ${d.from ?? "…"} → ${d.to ?? "…"}`,
        remove: () => setValue(g.id, { from: null, to: null }),
      });
    } else if (g.type === "custom") {
      chips.push({ key: `${g.id}:custom`, label: g.label, remove: () => setValue(g.id, emptyValue(g)) });
    }
  }
  return chips;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function MobileFilterSheet({
  groups,
  open,
  defaultOpen = false,
  onOpenChange,
  value,
  defaultValue,
  onValueChange,
  onDraftChange,
  onApply,
  onCancel,
  onClear,
  resultCount,
  loading = false,
  error = null,
  onRetry,
  mode = "sheet",
  confirmDiscard = false,
  title = "Filters",
  trigger,
  renderFilter,
  renderFooter,
  applyLabel = "Apply filters",
  cancelLabel = "Cancel",
  clearAllLabel = "Clear all",
  resetLabel = "Reset",
  formatCount = (n) => n.toLocaleString(),
  contained = false,
  reducedMotion,
  className,
}: MobileFilterSheetProps) {
  const mqReduce = useReducedMotion();
  const reduce = reducedMotion ?? mqReduce;

  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [applied, setApplied] = useControllableState<FilterValue>({
    value,
    defaultValue: defaultValue ?? {},
    onChange: onValueChange,
  });

  const initialDefault = React.useRef<FilterValue>(defaultValue ?? {});
  const [draft, setDraft] = React.useState<FilterValue>(applied);
  const [confirming, setConfirming] = React.useState(false);

  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Sync the draft to the applied value whenever the sheet opens.
  const wasOpen = React.useRef(isOpen);
  React.useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setDraft(applied);
      setConfirming(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, applied]);

  // Surface draft edits so the app can compute a live result count for the draft.
  const onDraftChangeRef = React.useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  React.useEffect(() => {
    if (isOpen) onDraftChangeRef.current?.(draft);
  }, [draft, isOpen]);

  const dirty = React.useMemo(() => !valuesEqual(draft, applied, groups), [draft, applied, groups]);
  const activeCount = React.useMemo(
    () => groups.filter((g) => isGroupActive(g, draft)).length,
    [groups, draft],
  );
  const appliedCount = React.useMemo(
    () => groups.filter((g) => isGroupActive(g, applied)).length,
    [groups, applied],
  );

  const setGroupValue = React.useCallback((groupId: string, next: unknown) => {
    setDraft((d) => ({ ...d, [groupId]: next }));
  }, []);

  const clearGroup = React.useCallback(
    (group: FilterGroup) => setGroupValue(group.id, emptyValue(group)),
    [setGroupValue],
  );

  const clearAll = React.useCallback(() => {
    const cleared: FilterValue = {};
    for (const g of groups) cleared[g.id] = emptyValue(g);
    setDraft(cleared);
    onClear?.();
  }, [groups, onClear]);

  const reset = React.useCallback(() => {
    setDraft(initialDefault.current);
  }, []);

  const apply = React.useCallback(() => {
    setApplied(draft);
    onApply?.(draft);
    setConfirming(false);
    setOpen(false);
  }, [draft, onApply, setApplied, setOpen]);

  const doCancel = React.useCallback(() => {
    setDraft(applied);
    setConfirming(false);
    onCancel?.();
    setOpen(false);
  }, [applied, onCancel, setOpen]);

  const requestClose = React.useCallback(() => {
    if (confirmDiscard && dirty) {
      setConfirming(true);
      return;
    }
    doCancel();
  }, [confirmDiscard, dirty, doCancel]);

  // Keep a stable handle so the focus-trap effect never re-runs (and never steals
  // focus) merely because `requestClose` changed identity as the draft was edited.
  const requestCloseRef = React.useRef(requestClose);
  requestCloseRef.current = requestClose;

  // Focus trap + restoration + Escape + scroll lock.
  React.useEffect(() => {
    if (!isOpen) return;
    const active = (triggerRef.current ?? document.activeElement) as HTMLElement | null;
    const panel = panelRef.current;
    // preventScroll: focusing the sheet must never scroll the background page
    // (an embedded/`contained` sheet would otherwise yank the whole page to it).
    const raf = requestAnimationFrame(() => closeBtnRef.current?.focus({ preventScroll: true }));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    let prevOverflow = "";
    if (!contained) {
      prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      if (!contained) document.body.style.overflow = prevOverflow;
      if (active && typeof active.focus === "function") active.focus({ preventScroll: true });
    };
  }, [isOpen, contained]);

  const chips = React.useMemo(() => buildChips(groups, draft, setGroupValue), [groups, draft, setGroupValue]);
  const shownCount = useAnimatedNumber(resultCount ?? 0, { disabled: reduce || resultCount === undefined });
  const roundedCount = Math.round(shownCount);

  const posClass = contained ? "absolute" : "fixed";
  const anim = surfaceMotion[mode];
  const canSwipe = mode === "sheet" && !reduce;

  const surfaceLayout =
    mode === "panel"
      ? "right-0 top-0 h-full w-full max-w-[420px] rounded-l-2xl"
      : mode === "fullscreen"
        ? "inset-0 h-full w-full"
        : "inset-x-0 bottom-0 max-h-[88%] rounded-t-2xl";

  const overlay = (
    <>
      {/* Backdrop and panel are SEPARATE keyed AnimatePresence children so their
          exit animations actually play on close (a plain wrapper div swallowed
          them, causing the open/close flash). */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="mfs-overlay"
            className={cn(posClass, "inset-0 z-50 bg-[color-mix(in_oklab,var(--color-fg)_45%,transparent)]")}
            data-mode={mode}
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: EASE }}
            onClick={requestClose}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="mfs-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            data-mode={mode}
            className={cn(
              posClass,
              "z-50 flex flex-col border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] outline-none",
              surfaceLayout,
              className,
            )}
            style={{
              paddingBottom: contained ? undefined : "env(safe-area-inset-bottom)",
              paddingTop: mode === "fullscreen" && !contained ? "env(safe-area-inset-top)" : undefined,
            }}
            initial={reduce ? { opacity: 1 } : anim.initial}
            animate={reduce ? { opacity: 1, x: 0, y: 0 } : anim.animate}
            exit={reduce ? { opacity: 1 } : anim.exit}
            transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
            drag={canSwipe ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_e: unknown, info: PanInfo) => {
              if (info.offset.y > 120 || info.velocity.y > 600) requestCloseRef.current();
            }}
          >
            {/* Sticky header */}
            <div className="shrink-0 border-b border-[var(--color-border)] px-4 pb-3 pt-3">
              {mode === "sheet" && !reduce ? (
                <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-[var(--color-border)]" aria-hidden />
              ) : null}
              <div className="flex items-center gap-2">
                <div className="min-w-0">
                  <h2 id={titleId} className="truncate text-[16px] font-semibold text-[var(--color-fg)]">
                    {title}
                  </h2>
                  <p id={descId} className="text-[12px] text-[var(--color-muted)]">
                    {activeCount > 0 ? `${activeCount} active ${activeCount === 1 ? "filter" : "filters"}` : "No filters applied"}
                    {dirty ? " · unsaved" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={activeCount === 0}
                  className="ml-auto min-h-[36px] rounded-lg px-2 text-[13px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {clearAllLabel}
                </button>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={requestClose}
                  aria-label="Close filters"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Selected chips */}
              {chips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <AnimatePresence initial={false}>
                    {chips.map((chip) => (
                      <motion.button
                        key={chip.key}
                        type="button"
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.18, ease: EASE }}
                        onClick={chip.remove}
                        className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-1 pl-2.5 pr-2 text-[12px] font-medium text-[var(--color-fg)] hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                      >
                        <span className="max-w-[16ch] truncate">{chip.label}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-label="Remove">
                          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              ) : null}
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
              {error ? (
                <div
                  role="alert"
                  className="mb-2 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px]"
                  style={{
                    borderColor: "color-mix(in oklab, var(--color-error) 40%, var(--color-border))",
                    background: "color-mix(in oklab, var(--color-error) 12%, transparent)",
                    color: "var(--color-error)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
                    <path d="M12 8v5m0 3h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="flex-1">{error}</span>
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="min-h-[32px] rounded-md px-2 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-error)]"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              ) : null}

              {groups.map((group) => (
                <FilterGroupSection
                  key={group.id}
                  group={group}
                  draft={draft}
                  setGroupValue={setGroupValue}
                  clearGroup={clearGroup}
                  renderFilter={renderFilter}
                  reduce={reduce}
                />
              ))}
            </div>

            {/* Sticky footer */}
            <div
              className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              style={{ paddingBottom: contained ? undefined : "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {renderFooter ? (
                renderFooter({ draft, resultCount, dirty, activeCount, apply, cancel: requestClose, clearAll })
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="min-h-[44px] shrink-0 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-medium text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    {resetLabel}
                  </button>
                  <button
                    type="button"
                    onClick={requestClose}
                    className="ml-auto min-h-[44px] shrink-0 whitespace-nowrap rounded-lg border border-[var(--color-border)] px-3.5 text-[14px] font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--color-accent)] px-4 text-[14px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    {applyLabel}
                    {resultCount !== undefined ? (
                      <span className="tabular-nums opacity-80">· {loading ? "…" : formatCount(roundedCount)}</span>
                    ) : null}
                  </button>
                </div>
              )}
              {/* Polite result-count announcement */}
              <p className="sr-only" role="status" aria-live="polite">
                {loading
                  ? "Updating results"
                  : resultCount !== undefined
                    ? `${formatCount(roundedCount)} results match the current filters`
                    : ""}
              </p>
            </div>

            {/* Unsaved-change confirm */}
            <AnimatePresence>
              {confirming ? (
                <motion.div
                  className="absolute inset-0 z-10 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-fg)_35%,transparent)] p-4 sm:items-center"
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    role="alertdialog"
                    aria-labelledby={`${titleId}-confirm`}
                    className="w-full max-w-[320px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]"
                  >
                    <h3 id={`${titleId}-confirm`} className="text-[15px] font-semibold text-[var(--color-fg)]">
                      Discard changes?
                    </h3>
                    <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                      You have unsaved filter changes. Discard them and close?
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirming(false)}
                        className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-3 text-[14px] font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                      >
                        Keep editing
                      </button>
                      <button
                        type="button"
                        onClick={doCancel}
                        className="min-h-[44px] rounded-lg px-3 text-[14px] font-semibold text-[var(--color-error-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
                        style={{ background: "var(--color-error)" }}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {trigger !== undefined ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-[14px] font-medium text-[var(--color-fg)] shadow-[var(--shadow-sm)] hover:border-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        >
          {trigger}
          {appliedCount > 0 ? <CountBadge n={appliedCount} /> : null}
        </button>
      ) : null}
      {overlay}
    </>
  );
}

function FilterGroupSection({
  group,
  draft,
  setGroupValue,
  clearGroup,
  renderFilter,
  reduce,
}: {
  group: FilterGroup;
  draft: FilterValue;
  setGroupValue: (groupId: string, next: unknown) => void;
  clearGroup: (group: FilterGroup) => void;
  renderFilter?: (args: RenderFilterArgs) => React.ReactNode;
  reduce: boolean;
}) {
  const collapsible = group.collapsible !== false;
  const [collapsed, setCollapsed] = React.useState(Boolean(group.defaultCollapsed));
  const active = isGroupActive(group, draft);
  const contentId = React.useId();
  const open = !collapsible || !collapsed;

  return (
    <section className="border-b border-[var(--color-border)] py-1.5 last:border-b-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex min-h-[44px] flex-1 items-center gap-2 rounded-lg px-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => collapsible && setCollapsed((c) => !c)}
        >
          <span className="text-[14px] font-semibold text-[var(--color-fg)]">{group.label}</span>
          {active ? (
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-label="has active selection" />
          ) : null}
          {collapsible ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="ml-auto text-[var(--color-muted)]"
              style={{ transform: open ? "rotate(180deg)" : "none", transition: reduce ? undefined : "transform .18s" }}
            >
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>
        {active ? (
          <button
            type="button"
            onClick={() => clearGroup(group)}
            className="min-h-[36px] shrink-0 rounded-lg px-2 text-[12px] font-medium text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
          >
            Clear
          </button>
        ) : null}
      </div>
      {group.description ? <p className="px-2 pb-1 text-[12px] text-[var(--color-muted)]">{group.description}</p> : null}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={contentId}
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? { height: "auto", opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="pb-2 pt-1">
              <GroupBody group={group} value={draft} setValue={setGroupValue} renderFilter={renderFilter} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default MobileFilterSheet;
