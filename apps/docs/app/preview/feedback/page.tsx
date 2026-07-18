import type { Metadata } from "next";

import { product } from "../../../lib/product";
import { PreviewFeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: `Private-preview feedback - ${product.productName}`,
  description:
    "Share structured feedback on the private preview. Recorded locally in development - nothing is sent to an external system.",
};

export default async function PreviewFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ component?: string }>;
}) {
  const { component } = await searchParams;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <header className="mb-8">
        <p className="mb-3 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
          Private preview
        </p>
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Preview feedback
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          Tell us how the components work for your real projects - usefulness, quality, gaps, and whether you would
          reach for them in production. Rate what you can; skip what you can&rsquo;t.
        </p>
        <p className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--color-muted)]">
          This feedback is recorded <span className="text-[var(--color-fg)]">locally in development</span> for the
          preview program. It is not sent to any external service. Please share your own words only &mdash; never paste
          source code, tokens, or API payloads.
        </p>
      </header>

      <PreviewFeedbackForm presetComponent={component} />
    </div>
  );
}
