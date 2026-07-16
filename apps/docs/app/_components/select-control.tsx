"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";

import { useReducedMotion, useDisclosure, useAnchoredPortal } from "@/lib/motionstack";

/**
 * Shared form/toolbar Select — a real library listbox popover (not a native
 * <select>): keyboard-navigable, typeahead, dismiss-on-outside-click, animated,
 * themed, and portaled so an `overflow-hidden` ancestor can't crop it.
 *
 * Generalized from the `IntervalSelect` in the Growth-overview demo
 * (data-refresh-state) so every docs form/preview shares one dropdown vocabulary
 * instead of a mix of browser-chrome <select>s. Clean-room original.
 *
 * Focus stays on the trigger (aria-activedescendant listbox pattern); options are
 * navigated with ArrowUp/Down/Home/End/typeahead and committed with Enter/Space.
 */

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");
const EASE = [0.2, 0, 0, 1] as const;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectControlProps {
  /** Selected value. Use "" together with `placeholder` for an empty state. */
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectOption>;
  /** Shown (muted) on the trigger when no option is selected. */
  placeholder?: string;
  /** Trigger id (wire a <label htmlFor>). */
  id?: string;
  /** Accessible name when there is no associated <label>. */
  "aria-label"?: string;
  /** id of an error/description element (mirrors native aria-describedby). */
  "aria-describedby"?: string;
  /** Marks the trigger invalid for assistive tech + styling. */
  invalid?: boolean;
  disabled?: boolean;
  /** Extra classes for the trigger button (pass the form's field class here). */
  className?: string;
  /** Horizontal edge the panel aligns to. Default "start". */
  align?: "start" | "end";
}

export function SelectControl({
  value,
  onChange,
  options,
  placeholder = "Select…",
  id,
  invalid,
  disabled,
  className,
  align = "start",
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: SelectControlProps) {
  const reduce = useReducedMotion();
  const menu = useDisclosure({ idPrefix: "mk-select", dismissable: true });
  const anchor = useAnchoredPortal(menu.open, { align });

  const selectedIdx = options.findIndex((o) => o.value === value);
  const selected = selectedIdx >= 0 ? options[selectedIdx] : undefined;
  const [activeIdx, setActiveIdx] = React.useState(() => Math.max(0, selectedIdx));
  const [panelWidth, setPanelWidth] = React.useState<number>();
  const typeahead = React.useRef({ buffer: "", timer: 0 as number | ReturnType<typeof setTimeout> });

  React.useEffect(() => {
    if (menu.open) {
      setActiveIdx(Math.max(0, selectedIdx));
      const el = anchor.triggerRef.current;
      if (el) setPanelWidth(el.getBoundingClientRect().width);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu.open]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    menu.setOpen(false);
  };

  const move = (dir: 1 | -1) => {
    setActiveIdx((a) => {
      let next = a;
      for (let i = 0; i < options.length; i++) {
        next = (next + dir + options.length) % options.length;
        if (!options[next]?.disabled) return next;
      }
      return a;
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!menu.open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        menu.setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActiveIdx(options.findIndex((o) => !o.disabled)); }
    else if (e.key === "End") { e.preventDefault(); for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) { setActiveIdx(i); break; } }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(activeIdx); }
    else if (e.key === "Tab") { menu.setOpen(false); }
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // Typeahead: jump to the first option whose label starts with the buffer.
      const t = typeahead.current;
      t.buffer += e.key.toLowerCase();
      clearTimeout(t.timer as ReturnType<typeof setTimeout>);
      t.timer = setTimeout(() => (t.buffer = ""), 600);
      const hit = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(t.buffer));
      if (hit >= 0) setActiveIdx(hit);
    }
  };

  const optionId = (i: number) => `${menu.triggerProps.id}-opt-${i}`;

  return (
    <div ref={menu.rootRef as React.RefObject<HTMLDivElement>} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        {...menu.triggerProps}
        id={id ?? menu.triggerProps.id}
        ref={anchor.triggerRef as React.RefObject<HTMLButtonElement>}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-activedescendant={menu.open ? optionId(activeIdx) : undefined}
        className={cx(
          "inline-flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60",
          invalid && "border-[var(--color-accent)]",
          className,
        )}
      >
        <span className={cx("truncate", !selected && "text-[var(--color-muted)]")}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0 text-[var(--color-muted)]"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {anchor.renderInPortal(
        <AnimatePresence>
          {menu.open && anchor.anchored ? (
            <motion.div
              {...menu.panelProps}
              ref={anchor.panelRef as React.RefObject<HTMLDivElement>}
              role="listbox"
              aria-label={ariaLabel}
              aria-activedescendant={optionId(activeIdx)}
              initial={reduce ? false : { opacity: 0, y: -4, scale: 0.98 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: EASE }}
              style={{ ...anchor.panelStyle, minWidth: panelWidth, maxHeight: 280 }}
              className="z-[70] overflow-auto rounded-lg bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)] [border:1px_solid_var(--color-border)]"
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIdx;
                return (
                  <button
                    key={opt.value}
                    id={optionId(i)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onMouseEnter={() => !opt.disabled && setActiveIdx(i)}
                    onClick={() => commit(i)}
                    className={cx(
                      "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--color-fg)] outline-none disabled:cursor-not-allowed disabled:opacity-50",
                      isActive ? "bg-[var(--color-bg-secondary)]" : "hover:bg-[var(--color-bg-secondary)]",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                        className="shrink-0 text-[var(--color-accent)]"
                      >
                        <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>,
      )}
    </div>
  );
}
