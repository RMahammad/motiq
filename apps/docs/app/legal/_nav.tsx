"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { legalNav } from "../../lib/legal";

/**
 * Client-side legal nav — the only part of the legal shell that needs the
 * current pathname. Kept separate so app/legal/layout.tsx can stay a Server
 * Component and read the MOTIQ_LEGAL_APPROVED review flag.
 */
export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Legal pages" className="mb-10 flex flex-wrap gap-2">
      {legalNav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-md border border-[var(--color-fg)] bg-[var(--color-fg)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]"
                : "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-fg)] hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)] motion-reduce:transition-none"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The current page's document title, derived from the pathname. */
export function LegalTitle() {
  const pathname = usePathname();
  const title = legalNav.find((item) => item.href === pathname)?.title ?? "Legal";
  return (
    <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
      {title}
    </h1>
  );
}
