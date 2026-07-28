import Link from "next/link";
import type { ReactNode } from "react";

import {
  contacts,
  effectiveDateLabel,
  lastUpdatedLabel,
  legalNav,
  ownerDecision,
  supportEmailContact,
} from "../../lib/legal";

/**
 * Shared server-rendered building blocks for the six /legal/* policy pages.
 *
 * Every page composes the SAME primitives so heading levels, spacing, and the
 * decision-token treatment stay identical across policies. The layout owns the
 * <h1>; sections here render <h2>, sub-headings render <h3>.
 *
 * Unresolved items must be rendered through <Decide> / <Review> (or the
 * `ownerDecision()` helper in lib/legal.ts) rather than as free-form prose, so a
 * human reviewer — and scripts/check-launch-config.mjs — can find every one of
 * them by scanning for the literal token strings.
 */

// ---------------------------------------------------------------------------
// Inline decision markers
// ---------------------------------------------------------------------------

function Token({ children }: { children: ReactNode }) {
  return (
    <span className="mx-0.5 inline rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 align-baseline font-mono text-[11.5px] font-semibold uppercase tracking-wide text-[var(--color-fg)]">
      {children}
    </span>
  );
}

/** `[OWNER DECISION REQUIRED: …]` — a business choice nobody has made yet. */
export function Decide({ children }: { children: string }) {
  return <Token>{ownerDecision(children)}</Token>;
}

/** `[LEGAL REVIEW REQUIRED]` — wording a qualified lawyer must draft or approve. */
export function Review() {
  return <Token>[LEGAL REVIEW REQUIRED]</Token>;
}

// ---------------------------------------------------------------------------
// Block model
// ---------------------------------------------------------------------------

export type LegalBlock =
  | { kind: "p"; body: ReactNode }
  | { kind: "h3"; body: string }
  | { kind: "ul"; items: ReactNode[] }
  | { kind: "ol"; items: ReactNode[] }
  | { kind: "note"; title: string; body: ReactNode }
  | { kind: "table"; caption: string; head: string[]; rows: ReactNode[][] }
  | { kind: "defs"; items: { term: string; meaning: ReactNode }[] };

export interface LegalSection {
  /** Stable anchor id, e.g. "acceptable-use". Used for cross-policy deep links. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

function Block({ block, index }: { block: LegalBlock; index: number }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">{block.body}</p>
      );
    case "h3":
      return (
        <h3 className="pt-1 text-[15.5px] font-semibold text-[var(--color-fg)]">{block.body}</h3>
      );
    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          {block.items.map((item, i) => (
            <li key={`${index}-${i}`}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal space-y-1.5 pl-5 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          {block.items.map((item, i) => (
            <li key={`${index}-${i}`}>{item}</li>
          ))}
        </ol>
      );
    case "note":
      return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
          <p className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-fg)]">
            {block.title}
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-muted)]">
            {block.body}
          </p>
        </div>
      );
    case "defs":
      return (
        <dl className="space-y-3">
          {block.items.map((item) => (
            <div key={item.term}>
              <dt className="text-[14.5px] font-semibold text-[var(--color-fg)]">
                &ldquo;{item.term}&rdquo;
              </dt>
              <dd className="mt-0.5 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
                {item.meaning}
              </dd>
            </div>
          ))}
        </dl>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13.5px]">
            <caption className="sr-only">{block.caption}</caption>
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                {block.head.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3.5 py-2.5 font-semibold text-[var(--color-fg)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={`${index}-row-${r}`} className="border-b border-[var(--color-border)] last:border-0">
                  {row.map((cell, c) => (
                    <td
                      key={`${index}-row-${r}-${c}`}
                      className="px-3.5 py-2.5 align-top leading-relaxed text-[var(--color-muted)]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Document shell
// ---------------------------------------------------------------------------

export interface RelatedPolicy {
  href: string;
  label: string;
  why: string;
}

export function LegalDoc({
  intro,
  sections,
  related,
  contact,
}: {
  /** One or two plain-English paragraphs framing the document. */
  intro: ReactNode;
  sections: LegalSection[];
  /** Cross-links to the policies that govern adjacent questions. */
  related: RelatedPolicy[];
  /** Page-specific contact guidance rendered above the shared channel list. */
  contact: ReactNode;
}) {
  return (
    <article className="space-y-10">
      <dl className="flex flex-wrap gap-x-8 gap-y-2 border-y border-[var(--color-border)] py-3 text-[13px]">
        <div className="flex gap-2">
          <dt className="text-[var(--color-muted)]">Effective date</dt>
          <dd className="font-medium text-[var(--color-fg)]">{effectiveDateLabel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[var(--color-muted)]">Last updated</dt>
          <dd className="font-medium text-[var(--color-fg)]">{lastUpdatedLabel}</dd>
        </div>
      </dl>

      <div className="space-y-3 text-[15px] leading-relaxed text-[var(--color-muted)]">{intro}</div>

      <nav aria-label="On this page" className="rounded-xl border border-[var(--color-border)] p-4">
        <p className="text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-fg)]">
          On this page
        </p>
        <ol className="mt-2 space-y-1 text-[13.5px] text-[var(--color-muted)]">
          {sections.map((section, i) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="rounded-sm underline-offset-2 hover:text-[var(--color-fg)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]"
              >
                {i + 1}. {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section, i) => (
        <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
          <h2 className="text-[19px] font-semibold text-[var(--color-fg)]">
            <span className="text-[var(--color-muted)]">{i + 1}. </span>
            {section.heading}
          </h2>
          {section.blocks.map((block, j) => (
            <Block key={`${section.id}-${j}`} block={block} index={j} />
          ))}
        </section>
      ))}

      <section id="related-policies" className="scroll-mt-24 space-y-3">
        <h2 className="text-[19px] font-semibold text-[var(--color-fg)]">
          <span className="text-[var(--color-muted)]">{sections.length + 1}. </span>
          Related policies
        </h2>
        <ul className="space-y-2 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          {related.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded-sm font-medium text-[var(--color-fg)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]"
              >
                {item.label}
              </Link>{" "}
              — {item.why}
            </li>
          ))}
        </ul>
      </section>

      <section id="contact" className="scroll-mt-24 space-y-3">
        <h2 className="text-[19px] font-semibold text-[var(--color-fg)]">
          <span className="text-[var(--color-muted)]">{sections.length + 2}. </span>
          Contact
        </h2>
        <p className="text-[14.5px] leading-relaxed text-[var(--color-muted)]">{contact}</p>
        <ul className="space-y-1.5 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
          {Object.entries({
            ...contacts,
            ...(supportEmailContact ? { supportEmail: supportEmailContact } : {}),
          }).map(([key, channel]) => (
            <li key={key}>
              <span className="text-[var(--color-fg)]">{channel.purpose}:</span>{" "}
              {channel.href ? (
                <a
                  href={channel.href}
                  className="rounded-sm underline underline-offset-2 hover:text-[var(--color-fg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-fg)]"
                >
                  {channel.label}
                </a>
              ) : (
                <Token>{channel.label}</Token>
              )}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

/** Convenience: build the "related policies" list, excluding the current page. */
export function relatedExcept(
  current: string,
  why: Record<string, string>,
): RelatedPolicy[] {
  return legalNav
    .filter((item) => item.href !== current)
    .map((item) => ({ href: item.href, label: item.title, why: why[item.href] ?? "" }))
    .filter((item) => item.why.length > 0);
}
