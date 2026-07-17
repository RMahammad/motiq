"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { categories, categoryCount, type CategoryId } from "../../lib/catalog";
import { SearchTrigger } from "./search";
import { ThemeToggle } from "./theme";

/**
 * Product navigation (docs/56 §5–7). Desktop: a small primary bar + an Explore
 * mega-menu for category discovery. Mobile: a dedicated drawer (focus trap, Esc,
 * scroll-lock, grouped collapsible categories) — NOT a shrunk desktop menu.
 */

type NavProps = {
  productName: string;
  waitlistEnabled: boolean;
  ctaHref: string;
  ctaLabel: string;
};

const EXPLORE_GROUPS: { label: string; ids: CategoryId[] }[] = [
  {
    label: "Product workflows",
    ids: ["ai", "developer-tools", "collaboration", "data-motion", "file", "commerce", "security", "communication", "productivity"],
  },
  { label: "Creative", ids: ["text", "backgrounds", "creative", "mobile", "animated-shadcn", "icons"] },
];

const PRODUCTS: { label: string; href: string; desc: string }[] = [
  { label: "All components", href: "/components", desc: "The full catalog" },
  { label: "Blocks", href: "/components?kind=block", desc: "Composed workflows" },
  { label: "Packs", href: "/packs", desc: "Installable bundles" },
  { label: "Free registry", href: "/components?access=free", desc: "Public, editable source" },
  { label: "Pro access", href: "/access", desc: "Private registry" },
];

const catLabel = (id: CategoryId) => categories.find((c) => c.id === id)?.label ?? id;

function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
  React.useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const sel =
      'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>(sel)).filter((n) => n.offsetParent !== null);
    // move focus into the panel
    const first = focusables()[0];
    first?.focus();
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
      if (e.shiftKey && (idx <= 0)) {
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

export function SiteNav({ productName, waitlistEnabled, ctaHref, ctaLabel }: NavProps) {
  const pathname = usePathname();
  // Read the query string client-side (avoids useSearchParams, which would force
  // a Suspense/prerender bailout in the root-layout header — docs/56).
  const [search, setSearch] = React.useState("");
  React.useEffect(() => {
    setSearch(typeof window !== "undefined" ? window.location.search : "");
  }, [pathname]);
  const params = React.useMemo(() => new URLSearchParams(search), [search]);
  const [explore, setExplore] = React.useState(false);
  const [mobile, setMobile] = React.useState(false);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({ "Product workflows": true });

  const exploreRef = React.useRef<HTMLDivElement>(null);
  const exploreBtnRef = React.useRef<HTMLButtonElement>(null);
  const mobileRef = React.useRef<HTMLDivElement>(null);
  const activeCat = params.get("category");
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Close menus on route change.
  const routeKey = `${pathname}?${params.toString()}`;
  React.useEffect(() => {
    setExplore(false);
    setMobile(false);
  }, [routeKey]);

  // Body scroll lock while the mobile drawer is open.
  React.useEffect(() => {
    if (!mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobile]);

  // Explore: click-outside + Esc close, focus back to trigger.
  React.useEffect(() => {
    if (!explore) return;
    const onDown = (e: MouseEvent) => {
      if (exploreRef.current?.contains(e.target as Node) || exploreBtnRef.current?.contains(e.target as Node)) return;
      setExplore(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExplore(false);
        exploreBtnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [explore]);

  useFocusTrap(mobile, mobileRef, () => setMobile(false));

  const isActive = (href: string) => {
    if (href === "/components") return pathname === "/components" && !params.get("kind");
    if (href.startsWith("/components?kind=block")) return pathname === "/components" && params.get("kind") === "block";
    if (href === "/packs") return pathname.startsWith("/packs");
    return pathname === href;
  };

  const primaryLink = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      className={`rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors ${
        isActive(href)
          ? "bg-[var(--color-bg-secondary)] text-[var(--color-fg)]"
          : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1680px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-md"
            style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))" }}
          />
          <span className="text-[15px]">{productName}</span>
        </Link>

        {/* Desktop primary nav */}
        <nav aria-label="Primary" className="ml-2 hidden items-center gap-0.5 md:flex">
          {primaryLink("/components", "Components")}
          <div className="relative">
            <button
              ref={exploreBtnRef}
              type="button"
              aria-expanded={explore}
              aria-haspopup="true"
              onClick={() => setExplore((v) => !v)}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors ${
                explore
                  ? "bg-[var(--color-bg-secondary)] text-[var(--color-fg)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
              }`}
            >
              Explore
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={explore ? "rotate-180" : ""} aria-hidden>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {explore ? (
              <div
                ref={exploreRef}
                role="menu"
                className="absolute left-0 top-[calc(100%+8px)] z-50 w-[640px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-lg)]"
              >
                <div className="grid grid-cols-[1fr_1fr_200px] gap-5">
                  {EXPLORE_GROUPS.map((g) => (
                    <div key={g.label}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{g.label}</p>
                      <ul className="space-y-0.5">
                        {g.ids.map((id) => {
                          const n = categoryCount(id);
                          if (!n) return null;
                          return (
                            <li key={id}>
                              <Link
                                href={`/components?category=${id}`}
                                role="menuitem"
                                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13.5px] text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
                              >
                                <span>{catLabel(id)}</span>
                                <span className="text-[12px] tabular-nums text-[var(--color-muted)]">{n}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                  <div className="border-l border-[var(--color-border)] pl-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Products</p>
                    <ul className="space-y-0.5">
                      {PRODUCTS.filter((p) => waitlistEnabled || p.href !== "/access").map((p) => (
                        <li key={p.href}>
                          <Link
                            href={p.href}
                            role="menuitem"
                            className="block rounded-md px-2 py-1.5 hover:bg-[var(--color-bg-secondary)]"
                          >
                            <span className="block text-[13.5px] font-medium text-[var(--color-fg)]">{p.label}</span>
                            <span className="block text-[12px] text-[var(--color-muted)]">{p.desc}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {primaryLink("/packs", "Packs")}
          {waitlistEnabled ? primaryLink("/access", "Access") : null}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchTrigger />
          <ThemeToggle />
          <Link
            href={ctaHref}
            className="hidden rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-[14px] font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)] sm:inline-block"
          >
            {ctaLabel}
          </Link>
          {/* Mobile menu trigger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg)] md:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer — portaled to <body> so the header's backdrop-filter does
          not become the containing block for `position: fixed` (docs/56 M1). */}
      {mounted && mobile
        ? createPortal(
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_55%,black)]/70" onClick={() => setMobile(false)} />
          <div
            ref={mobileRef}
            className="absolute inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
              <span className="text-[15px] font-semibold text-[var(--color-fg)]">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobile(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg)]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <Link
                href={ctaHref}
                className="block rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-center text-[14px] font-medium text-[var(--color-accent-fg)]"
                style={{ background: "var(--color-accent)" }}
              >
                {ctaLabel}
              </Link>
              <nav aria-label="Primary" className="mt-4 flex flex-col gap-0.5">
                {[
                  ["/components", "All components"],
                  ["/components?kind=block", "Blocks"],
                  ["/packs", "Packs"],
                  ...(waitlistEnabled ? [["/access", "Request access"]] : []),
                  ["/updates", "Updates"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="rounded-md px-2.5 py-2 text-[15px] font-medium text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]">
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                {EXPLORE_GROUPS.map((g) => {
                  const open = openGroups[g.label];
                  return (
                    <div key={g.label} className="mb-1">
                      <button
                        type="button"
                        aria-expanded={!!open}
                        onClick={() => setOpenGroups((s) => ({ ...s, [g.label]: !s[g.label] }))}
                        className="flex w-full items-center justify-between px-2.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]"
                      >
                        {g.label}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={open ? "" : "-rotate-90"} aria-hidden>
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {open ? (
                        <ul>
                          {g.ids.map((id) => {
                            const n = categoryCount(id);
                            if (!n) return null;
                            return (
                              <li key={id}>
                                <Link
                                  href={`/components?category=${id}`}
                                  aria-current={activeCat === id ? "page" : undefined}
                                  className={`flex items-center justify-between rounded-md px-2.5 py-2 text-[14.5px] ${
                                    activeCat === id
                                      ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-accent)]"
                                      : "text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
                                  }`}
                                >
                                  <span>{catLabel(id)}</span>
                                  <span className="text-[12px] tabular-nums text-[var(--color-muted)]">{n}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </header>
  );
}
