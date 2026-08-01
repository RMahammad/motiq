"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/**
 * The shared mobile navigation sheet — a left slide-in used by both the
 * component-docs rail and the /components catalog rail, so the two behave
 * identically on phones: portaled out of any backdrop-filter ancestor, modal,
 * focus-trapped, Esc-closable, with the page behind it scroll-locked.
 */

export function useFocusTrap(active: boolean, containerRef: React.RefObject<HTMLElement | null>, onClose: () => void) {
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

export function NavSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Sheet heading, also its accessible name. */
  title: string;
  children: React.ReactNode;
}) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Body scroll lock while the sheet is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useFocusTrap(open, sheetRef, onClose);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-bg)_55%,black)]/70" onClick={onClose} />
      <div
        ref={sheetRef}
        className="absolute inset-y-0 left-0 flex w-[min(88vw,340px)] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
          <span className="text-[15px] font-semibold text-[var(--color-fg)]">{title}</span>
          <button
            type="button"
            aria-label={`Close ${title.toLowerCase()}`}
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-fg)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
