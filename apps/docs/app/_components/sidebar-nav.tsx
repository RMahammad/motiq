import type { ReactNode } from "react";

/**
 * Shared left-rail navigation language.
 *
 * Extracted from the component-docs sidebar so the /components browser rail is
 * literally the same design rather than a lookalike: same row height, radius,
 * type scale, count treatment, active tint and hover. Change it here and both
 * rails move together.
 */

/** Disclosure chevron — points down when open, right when closed. */
export function NavChevron({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className={open ? "" : "-rotate-90"} aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Small uppercase heading above a group of rows. */
export function NavGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
      {children}
    </p>
  );
}

/** Top-level row: nav link, or a category with its count. */
export const navRowClass = (active: boolean) =>
  `flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left font-medium ${
    active
      ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent-text)]"
      : "text-[var(--color-fg)] hover:bg-[var(--color-bg-secondary)]"
  }`;

/** Nested row: an individual component beneath its category. */
export const navChildClass = (active: boolean) =>
  `block truncate rounded-md px-2 py-[5px] text-[13px] ${
    active
      ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] font-medium text-[var(--color-accent-text)]"
      : "text-[var(--color-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
  }`;

/** The hairline rail that indents a category's children. */
export const navChildListClass = "mb-1 ml-4 border-l border-[var(--color-border)] pl-2";

/** Count badge sitting at the end of a row. */
export function NavCount({ children }: { children: ReactNode }) {
  return <span className="text-[11.5px] tabular-nums text-[var(--color-muted)]">{children}</span>;
}
