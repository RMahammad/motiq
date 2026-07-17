import type { Metadata } from "next";

import { product } from "../../lib/product";
import { allReleases, CATALOG_COMPLETE, DEFAULT_VERSION } from "../../lib/server/versioning";
import { pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Updates",
  description: "Release versions, dates, and changelog for the catalog and its components.",
  path: "/updates",
});

function labelFor(itemName: string): string {
  return itemName === CATALOG_COMPLETE ? "Complete catalog" : itemName;
}

// Server Component: reads the in-repo versioning table (deterministic, constant
// dates) and renders it as an accessible changelog table. Semantic tokens only.
export default function UpdatesPage() {
  const rows = allReleases();

  return (
    <main className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {product.productName} · Releases
        </p>
        <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Updates
        </h1>
        <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[var(--color-muted)]">
          Every release is versioned. Items without their own entry ship at the
          baseline version ({DEFAULT_VERSION}). Breaking changes are flagged and
          carry migration guidance.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full border-collapse text-left text-[14px]">
          <caption className="sr-only">
            Release versions with dates, changelog, and breaking-change flags.
          </caption>
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-fg)]">
                Item
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-fg)]">
                Version
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-fg)]">
                Date
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-fg)]">
                Changes
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-fg)]">
                Breaking
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={`${r.itemName}@${r.version}`}
                className="border-b border-[var(--color-border)] align-top last:border-b-0"
              >
                <th scope="row" className="px-4 py-4 font-medium text-[var(--color-fg)]">
                  {labelFor(r.itemName)}
                </th>
                <td className="px-4 py-4 font-mono text-[13px] text-[var(--color-muted)]">
                  {r.version}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-[var(--color-muted)]">
                  <time dateTime={r.releaseDate}>{r.releaseDate}</time>
                </td>
                <td className="px-4 py-4 text-[var(--color-muted)]">
                  <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                    {r.changelog.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  {r.breaking && r.migrationNote ? (
                    <p className="mt-2 text-[13px] text-[var(--color-warning-foreground)]">
                      Migration: {r.migrationNote}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4">
                  {r.breaking ? (
                    <span className="inline-flex items-center rounded-md border border-[var(--color-warning)] bg-[color-mix(in_oklab,var(--color-warning)_16%,transparent)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-warning-foreground)]">
                      Breaking
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[12px] text-[var(--color-muted)]">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
