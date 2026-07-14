"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { commerce, product } from "../../lib/product";

/**
 * Shared shell for the legal / policy DRAFT pages.
 *
 * These are placeholder outlines, not finalized legal terms. Every legal page
 * inherits the prominent draft banner rendered here. Nav hrefs come from the
 * configurable commerce URLs so they stay in sync with product.config.json.
 */
const NAV: { href: string; label: string }[] = [
  { href: commerce.termsUrl, label: "Terms of Service" },
  { href: commerce.privacyUrl, label: "Privacy" },
  { href: commerce.licenseUrl, label: "License" },
  { href: commerce.refundPolicyUrl, label: "Refund Policy" },
  { href: commerce.updatePolicyUrl, label: "Update Policy" },
  { href: commerce.supportPolicyUrl, label: "Support Policy" },
];

const TITLES: Record<string, string> = {
  [commerce.termsUrl]: "Terms of Service",
  [commerce.privacyUrl]: "Privacy Policy",
  [commerce.licenseUrl]: "License",
  [commerce.refundPolicyUrl]: "Refund Policy",
  [commerce.updatePolicyUrl]: "Update Policy",
  [commerce.supportPolicyUrl]: "Support Policy",
};

export default function LegalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Legal";

  return (
    <div className="mx-auto max-w-[820px] px-4 py-12 sm:px-6">
      {/* Draft banner — must remain prominent on every legal page. */}
      <div
        role="alert"
        className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4"
      >
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-fg)]">
          Draft — requires legal review
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
          Terms are not finalized. Do not rely on this draft. Every item below is a
          placeholder topic outline pending human legal sign-off.
        </p>
      </div>

      <header className="mb-8">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {product.productName} · Legal
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          {title}
        </h1>
      </header>

      <nav aria-label="Legal pages" className="mb-10 flex flex-wrap gap-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-md border border-[var(--color-fg)] bg-[var(--color-fg)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-bg)]"
                  : "rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-[13px] text-[var(--color-muted)] transition-colors hover:border-[var(--color-fg)] hover:text-[var(--color-fg)]"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="text-[var(--color-fg)]">{children}</div>
    </div>
  );
}
