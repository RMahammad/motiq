import { companySponsors } from "../../lib/funding";

/**
 * Gold Sponsor logos. The Ko-fi Gold tier promises "prominent logo on the
 * homepage" and "top of the README", so this surfaces real Gold Sponsors in
 * the homepage band ("strip") and the docs sidebar ("rail").
 *
 * Renders nothing while there are no Gold Sponsors — never placeholder logos
 * (honest empty state). The moment a real Gold Sponsor is added to
 * lib/funding.ts, their logo appears automatically.
 */
export function GoldSponsors({ variant = "strip" }: { variant?: "strip" | "rail" }) {
  const gold = companySponsors.filter((s) => s.tier === "gold");
  if (!gold.length) return null;

  if (variant === "rail") {
    return (
      <div className="rounded-xl border border-[var(--color-border)] p-3.5">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Gold Sponsors
        </p>
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
      </div>
    );
  }

  // "strip" — full-width row inside the homepage sponsorship band.
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
