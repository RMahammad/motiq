import Link from "next/link";

import { companySponsors } from "../../lib/funding";

/**
 * Gold Sponsor logos. The Ko-fi Gold tier promises "prominent logo on the
 * homepage" and "top of the README", so this surfaces real Gold Sponsors in
 * the homepage band ("strip") and the docs right rail ("rail").
 *
 * - "rail": always visible. Shows logos when Gold Sponsors exist, otherwise an
 *   honest "be the first" invite that actively solicits sponsors (no fake logo).
 * - "strip": hidden while empty — the homepage band already carries a sponsor
 *   CTA, so a second empty invite there would be redundant.
 *
 * Add a real Gold Sponsor to `companySponsors` in lib/funding.ts and their logo
 * appears in every slot automatically.
 */
export function GoldSponsors({ variant = "strip" }: { variant?: "strip" | "rail" }) {
  const gold = companySponsors.filter((s) => s.tier === "gold");

  if (variant === "rail") {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-3.5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Gold Sponsors
        </p>
        {gold.length ? (
          <ul className="flex flex-col gap-2.5">
            {gold.map((s) => (
              <li key={s.name}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- sponsor logos are external, unoptimizable assets */}
                  <img src={s.logoSrc} alt={s.name} className="max-h-6 w-auto max-w-[150px]" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="text-[12px] leading-relaxed text-[var(--color-muted)]">
              Your logo here - Gold Sponsors get prominent placement on the homepage, docs, and README.
            </p>
            <Link
              href="/sponsor"
              className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-accent-text)] hover:underline"
            >
              Become a Gold Sponsor →
            </Link>
          </>
        )}
      </div>
    );
  }

  // "strip" — full-width row inside the homepage band; hidden while empty.
  if (!gold.length) return null;
  return (
    <div className="relative border-t border-[var(--color-border)] px-6 py-6 sm:px-8 lg:px-10">
      <p className="mb-4 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Gold Sponsors
      </p>
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-5">
        {gold.map((s) => (
          <li key={s.name}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg opacity-90 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- sponsor logos are external, unoptimizable assets */}
              <img src={s.logoSrc} alt={s.name} className="max-h-8 w-auto max-w-[160px]" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
