"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { categories, categoryCount, itemsByCategory, bySlug, type CategoryId } from "../../lib/catalog";
import { packs } from "../../lib/packs";
import { NavSheet } from "./nav-sheet";
import { SearchTrigger } from "./search";
import { NavChevron, NavCount, NavGroupLabel, navChildClass, navChildListClass, navRowClass } from "./sidebar-nav";

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
  { label: "Showpieces", ids: ["cursor", "media", "scroll"] },
];

const START_LINKS: [string, string][] = [
  ["/getting-started", "Getting started"],
  ["/components", "All components"],
];

const catLabel = (id: CategoryId) => categories.find((c) => c.id === id)?.label ?? id;

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
              className={navRowClass(pathname === href)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mt-5">
          <NavGroupLabel>{group.label}</NavGroupLabel>
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
                    className={navRowClass(false)}
                  >
                    <span className="flex items-center gap-1.5">
                      <NavChevron open={isOpen} />
                      {catLabel(id)}
                    </span>
                    <NavCount>{n}</NavCount>
                  </button>
                  {isOpen ? (
                    <ul className={navChildListClass}>
                      {items.map((item) => {
                        const active = item.slug === activeSlug;
                        return (
                          <li key={item.slug}>
                            <Link
                              href={item.documentationPath}
                              ref={active ? activeRef : undefined}
                              aria-current={active ? "page" : undefined}
                              className={navChildClass(active)}
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
        <NavGroupLabel>Workflow packs</NavGroupLabel>
        <ul className="space-y-0.5">
          {packs.map((p) => {
            const href = `/packs/${p.slug}`;
            const active = pathname === href;
            return (
              <li key={p.slug}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={navChildClass(active)}
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

/**
 * Sub-header controls for viewports without the fixed rails: a docs-menu
 * button (below lg) and an "On this page" disclosure (below xl, i.e. wherever
 * the right-hand table of contents is hidden).
 */
export function DocsMobileControls({ activeSlug, toc }: { activeSlug?: string; toc: TocItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [tocOpen, setTocOpen] = React.useState(false);
  const tocRef = React.useRef<HTMLDivElement>(null);
  const tocBtnRef = React.useRef<HTMLButtonElement>(null);

  // Close both on route change.
  React.useEffect(() => {
    setMenuOpen(false);
    setTocOpen(false);
  }, [pathname]);

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

      {/* Same sheet the /components rail uses — see nav-sheet.tsx. */}
      <NavSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Documentation">
        {/* No search trigger here: the global header's search icon stays visible
            on mobile, and a palette opened from inside this sheet would fight
            its focus trap. */}
        <DocsNavTree activeSlug={activeSlug} />
      </NavSheet>
    </div>
  );
}
