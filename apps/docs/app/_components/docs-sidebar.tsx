"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { categories, categoryCount, itemsByCategory, bySlug, type CategoryId } from "../../lib/catalog";
import { packs } from "../../lib/packs";
import { SearchTrigger } from "./search";

/**
 * Documentation navigation for component pages (docs shell, left rail).
 *
 * - `DocsSidebar` — the ~260px desktop rail: search, getting-started links,
 *   components grouped by workflow with collapsible categories, environments,
 *   and packs. Pure navigation — sponsorship (CTA + Gold Sponsors) lives on the
 *   right rail so it isn't duplicated. The active route carries
 *   `aria-current="page"`, its category opens automatically, and the link is
 *   scrolled into view inside the rail.
 * - `DocsMobileControls` — the sub-header bar for smaller viewports: a
 *   docs-menu button opening the same navigation in an accessible sheet
 *   (focus trap, Esc, scroll lock), plus a compact "On this page" disclosure
 *   shown wherever the right-hand table of contents is hidden.
 */

export interface TocItem {
  id: string;
  label: string;
}

const NAV_GROUPS: { label: string; ids: CategoryId[] }[] = [
  {
    label: "Product workflows",
    ids: [
      "ai",
      "developer-tools",
      "collaboration",
      "data-motion",
      "file",
      "commerce",
      "security",
      "communication",
      "productivity",
    ],
  },
  { label: "Environments", ids: ["product-backgrounds", "workflow-heroes"] },
  { label: "Creative", ids: ["text", "backgrounds", "creative", "mobile", "animated-shadcn", "icons"] },
];

const START_LINKS: [string, string][] = [
  ["/getting-started", "Getting started"],
  ["/components", "All components"],
];

const catLabel = (id: CategoryId) => categories.find((c) => c.id === id)?.label ?? id;

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={open ? "" : "-rotate-90"} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The nav tree itself — shared by the desktop rail and the mobile sheet. */
function DocsNavTree({ activeSlug }: { activeSlug?: string }) {
  const pathname = usePathname();
  const activeCategory = activeSlug ? bySlug.get(activeSlug)?.category : undefined;
  const [open, setOpen] = React.useState<Partial<Record<CategoryId, boolean>>>(() =>
    activeCategory ? { [activeCategory]: true } : {},
  );
  const activeRef = React.useRef<HTMLAnchorElement | null>(null);

  // Keep the active link visible inside the scrollable rail on load.
  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <nav aria-label="Documentation" className="text-[13.5px]">
      <ul className="space-y-0.5">
        {START_LINKS.map(([href, label]) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={`block rounded-md px-2.5 py-1.5 font-medium ${
                pathname === href
                  ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent-text)]"
                  : "text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mt-5">
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {group.label}
          </p>
          <ul>
            {group.ids.map((id) => {
              const n = categoryCount(id);
              if (!n) return null;
              const isOpen = !!open[id];
              const items = itemsByCategory(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((s) => ({ ...s, [id]: !s[id] }))}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Chevron open={isOpen} />
                      {catLabel(id)}
                    </span>
                    <span className="text-[11.5px] tabular-nums text-[var(--color-muted)]">{n}</span>
                  </button>
                  {isOpen ? (
                    <ul className="mb-1 ml-4 border-l border-[var(--color-border)] pl-2">
                      {items.map((item) => {
                        const active = item.slug === activeSlug;
                        return (
                          <li key={item.slug}>
                            <Link
                              href={item.documentationPath}
                              ref={active ? activeRef : undefined}
                              aria-current={active ? "page" : undefined}
                              className={`block truncate rounded-md px-2 py-[5px] text-[13px] ${
                                active
                                  ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-accent-text)]"
                                  : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
                              }`}
                            >
                              {item.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-5">
        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Workflow packs
        </p>
        <ul className="space-y-0.5">
          {packs.map((p) => {
            const href = `/packs/${p.slug}`;
            const active = pathname === href;
            return (
              <li key={p.slug}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`block truncate rounded-md px-2.5 py-1.5 text-[13px] ${
                    active
                      ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-accent-text)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  {p.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

    </nav>
  );
}

/** Desktop left rail — sticky below the 56px global header, scrolls internally. */
export function DocsSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-14 flex max-h-[calc(100dvh-3.5rem)] flex-col gap-4 overflow-y-auto py-8 pr-3">
        {/* Secondary trigger: no ⌘K registration (the header's instance owns it). */}
        <SearchTrigger hotkey={false} block />
        <DocsNavTree activeSlug={activeSlug} />
      </div>
    </aside>
  );
}

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  React.useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>(sel)).filter((n) => n.offsetParent !== null);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && idx <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && idx === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevActive?.focus?.();
    };
  }, [active, containerRef, onClose]);
}

/**
 * Sub-header controls for viewports without the fixed rails: a docs-menu
 * button (below lg) and an "On this page" disclosure (below xl, i.e. wherever
 * the right-hand table of contents is hidden).
 */
export function DocsMobileControls({ activeSlug, toc }: { activeSlug?: string; toc: TocItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [tocOpen, setTocOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const tocRef = React.useRef<HTMLDivElement>(null);
  const tocBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => setMounted(true), []);

  // Close both on route change.
  React.useEffect(() => {
    setMenuOpen(false);
    setTocOpen(false);
  }, [pathname]);

  // Body scroll lock while the sheet is open.
  React.useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useFocusTrap(menuOpen, sheetRef, () => setMenuOpen(false));

  // "On this page": click-outside + Esc close.
  React.useEffect(() => {
    if (!tocOpen) return;
    const onDown = (e: MouseEvent) => {
      if (tocRef.current?.contains(e.target as Node) || tocBtnRef.current?.contains(e.target as Node)) return;
      setTocOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTocOpen(false);
        tocBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [tocOpen]);

  return (
    <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_92%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-b-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none xl:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)] lg:hidden"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Docs menu
        </button>

        {toc.length ? (
          <div className="relative">
            <button
              ref={tocBtnRef}
              type="button"
              aria-expanded={tocOpen}
              aria-haspopup="true"
              onClick={() => setTocOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-fg)]"
            >
              On this page
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={tocOpen ? "rotate-180" : ""} aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {tocOpen ? (
              <div
                ref={tocRef}
                className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[60vh] w-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2 shadow-[var(--shadow-lg)]"
              >
                <ul>
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        onClick={() => setTocOpen(false)}
                        className="block rounded-md px-2.5 py-1.5 text-[13px] text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
                      >
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Documentation sheet — portaled so backdrop-blur ancestors can't trap it. */}
      {mounted && menuOpen
        ? createPortal(
            <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Documentation menu">
              <div
                className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_55%,black)]/70"
                onClick={() => setMenuOpen(false)}
              />
              <div
                ref={sheetRef}
                className="absolute inset-y-0 left-0 flex w-[min(88vw,340px)] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] pb-[env(safe-area-inset-bottom)]"
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
                  <span className="text-[15px] font-semibold text-[var(--color-fg)]">Documentation</span>
                  <button
                    type="button"
                    aria-label="Close documentation menu"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg)]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  {/* No search trigger here: the global header's search icon stays
                      visible on mobile, and a palette opened from inside this
                      sheet would fight its focus trap. */}
                  <DocsNavTree activeSlug={activeSlug} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
