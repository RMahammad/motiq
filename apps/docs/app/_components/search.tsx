"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import { catalog, searchCatalog, type CatalogItem } from "../../lib/catalog";

const EASE = [0.2, 0, 0, 1] as const;

/** Bold the matched substring of `text` (case-insensitive), if any. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-semibold text-[var(--color-accent)]">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function SearchTrigger({
  hotkey = true,
  block = false,
}: {
  /** Register the global ⌘K listener. Only ONE mounted instance may keep this
   *  on (the site header's) — secondary triggers (docs sidebar) opt out so the
   *  shortcut doesn't open stacked palettes. */
  hotkey?: boolean;
  /** Full-width trigger variant for sidebar placement. */
  block?: boolean;
} = {}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const reduce = useReducedMotion();
  const listboxId = React.useId();
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  // The overlay portals to <body>: the site header has a backdrop-filter, which
  // would otherwise make it the containing block for our `position: fixed`
  // overlay (mis-sizing it to the header and breaking click-outside-to-close).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const results = React.useMemo<CatalogItem[]>(
    () => (query.trim() ? searchCatalog(query) : catalog),
    [query],
  );

  // Reset the highlighted row whenever the query (and therefore the list) changes.
  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Global ⌘K / Ctrl-K toggles the palette (primary instance only).
  React.useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  // While open: focus the input, lock body scroll, and restore focus on close.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const restoreTo = (document.activeElement as HTMLElement | null) ?? triggerRef.current;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      restoreTo?.focus?.();
    };
  }, [open]);

  // Keep the highlighted row scrolled into view during keyboard navigation.
  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  // Close on any pointer press outside the panel (reliable across the portal +
  // motion overlay). Added after the opening render, so the click that opened
  // the palette is never caught.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open]);

  const go = React.useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/components/${slug}`);
    },
    [router],
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(Math.max(0, results.length - 1));
        break;
      case "Enter": {
        e.preventDefault();
        const hit = results[activeIndex];
        if (hit) go(hit.slug);
        break;
      }
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        // Only the input is a tab stop; keep focus trapped inside the dialog.
        e.preventDefault();
        break;
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        // Neutral hover/focus (no accent): opt out of the global accent focus
        // ring and use a calm border change so the search chrome never lights up.
        data-noring
        style={{ boxShadow: "none" }}
        className={`flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors hover:border-[color-mix(in_oklab,var(--color-fg)_22%,var(--color-border))] hover:text-[var(--color-fg)] focus-visible:border-[color-mix(in_oklab,var(--color-fg)_38%,var(--color-border))] focus-visible:text-[var(--color-fg)] focus-visible:outline-none ${
          block ? "w-full" : ""
        }`}
        aria-label="Search components"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-[var(--color-border)] px-1 text-[10px] sm:inline">⌘K</kbd>
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_oklab,var(--color-fg)_45%,transparent)] p-4 pt-[12vh] backdrop-blur-sm"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search components"
              className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
              initial={reduce ? false : { opacity: 0, scale: 0.98, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
              transition={{ duration: 0.16, ease: EASE }}
            >
              {/* input row */}
              <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[var(--color-muted)]">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search animated components…"
                  aria-label="Search components"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={results.length ? optionId(activeIndex) : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  // The palette's search field is unmistakably focused (it just
                  // opened); it reads as a clean, cmdk-style bare field. `data-noring`
                  // opts out of the global input:focus-visible ring; the inline
                  // boxShadow:none is a belt-and-suspenders override that beats that
                  // unlayered global rule directly (no dependency on CSS cascade order).
                  data-noring
                  style={{ boxShadow: "none" }}
                  className="w-full bg-transparent py-3.5 text-[15px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="grid h-6 w-6 shrink-0 place-items-center rounded text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                ) : null}
              </div>

              {/* results */}
              <ul ref={listRef} id={listboxId} role="listbox" aria-label="Components" className="min-h-0 flex-1 overflow-y-auto p-1.5">
                {results.length === 0 ? (
                  <li className="px-3 py-10 text-center text-[13px] text-[var(--color-muted)]">
                    No components match “{query}”.
                  </li>
                ) : (
                  results.map((c, i) => {
                    const active = i === activeIndex;
                    return (
                      <li
                        key={c.id}
                        id={optionId(i)}
                        role="option"
                        aria-selected={active}
                        data-idx={i}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => go(c.slug)}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                          active ? "bg-[var(--color-bg-secondary)]" : ""
                        }`}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="truncate text-[14px] text-[var(--color-fg)]">
                            <Highlight text={c.name} query={query} />
                          </span>
                          <span className="shrink-0 text-[12px] capitalize text-[var(--color-muted)]">{c.category}</span>
                        </span>
                        {c.featured ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--color-accent)]">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
                            </svg>
                            Featured
                          </span>
                        ) : null}
                      </li>
                    );
                  })
                )}
              </ul>

              {/* footer hints */}
              <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] px-3 py-2 text-[11px] text-[var(--color-muted)]">
                <span className="tabular-nums">
                  {results.length} {results.length === 1 ? "result" : "results"}
                </span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5 leading-none">↑</kbd>
                    <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5 leading-none">↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5 leading-none">↵</kbd>
                    open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-[var(--color-border)] px-1 py-0.5 leading-none">esc</kbd>
                    close
                  </span>
                </span>
              </div>
            </motion.div>
          </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
