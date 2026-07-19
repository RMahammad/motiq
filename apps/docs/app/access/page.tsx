import type { Metadata } from "next";
import Link from "next/link";

import { product, commerce } from "../../lib/product";
import { launchMode } from "../../lib/commerce";
import { pageMetadata } from "../../lib/seo";
import { AccessRequestForm } from "./access-request-form";
import type { WaitlistPack } from "../../lib/server/waitlist";

export const metadata: Metadata = pageMetadata({
  title: "Request access",
  description: "Request early access to the private preview.",
  path: "/access",
  noIndex: true,
});

const PACK_LABELS: Record<WaitlistPack, string> = {
  "ai-interface": "AI Interface Pack",
  "developer-tools": "Developer Tools Pack",
  collaboration: "Collaboration Pack",
  "data-motion": "Data Motion Pack",
  complete: "the complete catalog",
};

function resolvePack(pack?: string, tier?: string): WaitlistPack | undefined {
  if (tier === "complete") return "complete";
  if (pack && pack in PACK_LABELS) return pack as WaitlistPack;
  return undefined;
}

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string; tier?: string; component?: string }>;
}) {
  const { pack, tier, component } = await searchParams;
  const mode = launchMode();
  const isPublicBeta = mode === "public-beta";
  const heading = isPublicBeta ? "Join the launch list" : "Request early access";

  const preselectedPack = resolvePack(pack, tier);
  const requestingLabel = preselectedPack
    ? PACK_LABELS[preselectedPack]
    : component
      ? `the “${component}” component`
      : tier === "team"
        ? "a team license"
        : undefined;

  // Waitlist closed → no dead form; show an honest message instead.
  if (!commerce.waitlistEnabled) {
    return (
      <div className="mx-auto max-w-[640px] px-4 py-16 sm:px-6">
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Access requests are not open yet
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          {product.productName} is not accepting access requests at this moment. Check back soon, or explore the
          catalog in the meantime.
        </p>
        <div className="mt-8">
          <Link
            href="/components"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          >
            Explore components
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-16 sm:px-6">
      <header className="mb-8">
        <p className="mb-3 inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
          {isPublicBeta ? "Public beta" : "Private preview"}
        </p>
        <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          {heading}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
          {requestingLabel ? (
            <>
              You’re requesting access to <span className="text-[var(--color-fg)]">{requestingLabel}</span>. Tell us a
              little about what you’re building and we’ll be in touch.
            </>
          ) : (
            <>Tell us a little about what you’re building and we’ll be in touch.</>
          )}
        </p>
        <ul className="mt-5 flex flex-col gap-1.5 text-[13px] text-[var(--color-muted)]">
          <li>· Available during private preview</li>
          <li>· Pricing to be finalized</li>
        </ul>
      </header>

      <AccessRequestForm
        preselectedPack={preselectedPack}
        component={component}
        consentRequired={Boolean(commerce.privacyUrl)}
        privacyUrl={commerce.privacyUrl || undefined}
        submitLabel={isPublicBeta ? "Join the list" : "Request access"}
      />
    </div>
  );
}
