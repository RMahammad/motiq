import type { Metadata } from "next";

import { product } from "../../../lib/product";
import { SupportForm } from "./support-form";

export const metadata: Metadata = {
  title: `Preview support — ${product.productName}`,
  description:
    "Report an installation, registry, component, or documentation problem during the private preview. Recorded locally in development.",
};

export default function PreviewSupportPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <header className="mb-8">
        <p className="mb-3 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
          Private preview
        </p>
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Preview support
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          Hit a problem installing, authenticating, or using a component? Tell us what happened. The more precise the
          error summary, the faster we can help.
        </p>
        <p className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--color-muted)]">
          Tickets are recorded <span className="text-[var(--color-fg)]">locally in development</span> for the preview
          program &mdash; nothing is emailed or sent to an external helpdesk. Never paste tokens, secrets, headers, or
          private source; token-like values are redacted server-side as a safety net.
        </p>
      </header>

      <SupportForm />
    </div>
  );
}
