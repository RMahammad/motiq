import type { ReactNode } from "react";

/**
 * Shared server-side rendering helpers for the legal DRAFT pages.
 *
 * These pages are NOT finalized legal terms. Every unresolved clause carries one
 * or more literal marker strings supplied by the page itself:
 *   - "[REQUIRES LEGAL REVIEW]"     — wording/obligation must be drafted by counsel
 *   - "[COMMERCIAL DECISION REQUIRED]" — an owner must make a business/pricing choice
 *   - "[PROVIDER-SPECIFIC]"          — depends on the chosen checkout/analytics/host provider
 *
 * The marker strings are intentionally written as plain literals in each page so
 * that a human reviewer AND the paid-launch CI gate can scan for them. Do not
 * centralize them away from the page files.
 */

export interface DraftClause {
  /** Clause body text. */
  text: string;
  /** Inline marker badges appended after the text, e.g. "[REQUIRES LEGAL REVIEW]". */
  markers?: string[];
  /** Optional sub-points rendered under the clause. */
  points?: string[];
}

export interface DraftSection {
  /** Section heading. */
  heading: string;
  /** Optional short framing sentence under the heading. */
  intro?: string;
  /** Numbered clauses within the section. */
  clauses: DraftClause[];
}

function Marker({ label }: { label: string }) {
  return (
    <span className="ml-1.5 inline-block whitespace-nowrap rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 align-baseline text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
      {label}
    </span>
  );
}

/** Renders an intro paragraph plus numbered draft sections/clauses. */
export function DraftBody({
  intro,
  sections,
}: {
  intro: ReactNode;
  sections: DraftSection[];
}) {
  return (
    <article className="space-y-9">
      <p className="text-[15px] leading-relaxed text-[var(--color-muted)]">{intro}</p>

      {sections.map((section, i) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-[19px] font-semibold text-[var(--color-fg)]">
            <span className="text-[var(--color-muted)]">{i + 1}. </span>
            {section.heading}
          </h2>

          {section.intro ? (
            <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              {section.intro}
            </p>
          ) : null}

          <ol className="space-y-2.5">
            {section.clauses.map((clause, j) => (
              <li
                key={clause.text}
                className="flex gap-3 text-[14.5px] leading-relaxed text-[var(--color-muted)]"
              >
                <span className="shrink-0 select-none font-mono text-[12.5px] text-[var(--color-muted)]">
                  {i + 1}.{j + 1}
                </span>
                <span>
                  <span className="text-[var(--color-fg)]">{clause.text}</span>
                  {clause.markers?.map((m) => (
                    <Marker key={m} label={m} />
                  ))}
                  {clause.points ? (
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[var(--color-muted)]">
                      {clause.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}
