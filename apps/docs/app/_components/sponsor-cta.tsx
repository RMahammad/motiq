import Link from "next/link";

/**
 * Compact sponsor call-to-action used at the bottom of the docs sidebar and
 * below the table of contents. Deliberately small — a nudge, not a pitch;
 * full tiers live on /sponsor only.
 */
export function SponsorCta() {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3.5">
      <p className="text-[12.5px] font-semibold text-[var(--color-fg)]">Keep product motion open</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-muted)]">
        Motiq is free and community-supported. Sponsorship funds components, docs, and accessibility testing.
      </p>
      <Link
        href="/sponsor"
        className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-accent-text)] hover:underline"
      >
        Become a sponsor →
      </Link>
    </div>
  );
}
