"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { catalog, searchCatalog, accessLabel } from "../../lib/catalog";

export function SearchTrigger() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  const results = query ? searchCatalog(query) : catalog;

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/components/${slug}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        aria-label="Search components"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-[var(--color-border)] px-1 text-[10px] sm:inline">⌘K</kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[color-mix(in_oklab,var(--color-fg)_45%,transparent)] p-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search components"
            className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search animated components…"
              className="w-full border-b border-[var(--color-border)] bg-transparent px-4 py-3.5 text-[15px] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted)]"
            />
            <ul className="max-h-[50vh] overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-[13px] text-[var(--color-muted)]">
                  No components match “{query}”.
                </li>
              ) : (
                results.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => go(c.slug)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-secondary)]"
                    >
                      <span>
                        <span className="text-[14px] text-[var(--color-fg)]">{c.name}</span>
                        <span className="ml-2 text-[12px] text-[var(--color-muted)]">{c.category}</span>
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)]">{accessLabel[c.access]}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
