import type { ReactNode } from "react";

import { product } from "../../lib/product";
import { legalApproved } from "../../lib/legal";
import { LegalNav, LegalTitle } from "./_nav";

/**
 * Shared shell for the /legal/* policy pages.
 *
 * A Server Component so it can read the MOTIQ_LEGAL_APPROVED review flag; the
 * pathname-dependent parts live in ./_nav.tsx as a small client island.
 *
 * The review notice stays visible on EVERY legal page until an owner sets
 * MOTIQ_LEGAL_APPROVED=1 — the same flag the paid-launch assertions
 * (lib/server/launch-assertions.ts) and the CI gate
 * (scripts/check-launch-config.mjs) already read. Do not remove the notice by
 * editing this file; flip the flag.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[820px] px-4 py-12 sm:px-6">
      {legalApproved ? null : (
        <div
          role="note"
          aria-label="Legal review notice"
          className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4"
        >
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-fg)]">
            Pending legal review
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">
            These policies describe how {product.productName} actually operates today and are
            complete, but they have not been reviewed by a qualified lawyer and are not yet in
            force.
          </p>
        </div>
      )}

      <header className="mb-8">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {product.productName} · Legal
        </p>
        <LegalTitle />
      </header>

      <LegalNav />

      <div className="text-[var(--color-fg)]">{children}</div>
    </div>
  );
}
