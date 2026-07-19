import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { product } from "../../lib/product";
import { pageMetadata, absoluteUrl } from "../../lib/seo";
import { componentItems, blockItems, categories, categoryCount } from "../../lib/catalog";
import { packs } from "../../lib/packs";
import {
  fundingConfig,
  fundingAreas,
  fundingFaq,
  fundingGoals,
  individualTiers,
  goldTier,
  companySponsors,
  individualSponsors,
  verifiedMonthlyFundingUsd,
  formatUsd,
  type SponsorTier,
} from "../../lib/funding";
import { FundingPipeline } from "../_components/funding-pipeline";

const TITLE = `Support ${product.productName} — Sponsor Open-Source Product Motion`;
const DESCRIPTION = `Support ${product.productName}'s open-source React components, documentation, accessibility testing, and long-term maintenance.`;

export const metadata: Metadata = {
  ...pageMetadata({ title: TITLE, description: DESCRIPTION, path: "/sponsor" }),
  title: { absolute: TITLE },
};

/* ---- Shared CTA buttons — Ko-fi is the active destination; GitHub Sponsors
   renders as an informational, non-payment state while approval is pending. ---- */

function KoFiButton({ children, offset = "bg" }: { children: ReactNode; offset?: "bg" | "surface" }) {
  return (
    <a
      href={fundingConfig.koFiUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-[15px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
        offset === "surface"
          ? "focus-visible:ring-offset-[var(--color-surface)]"
          : "focus-visible:ring-offset-[var(--color-bg)]"
      }`}
    >
      {children}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">(opens Ko-fi in a new tab)</span>
    </a>
  );
}

function GithubSponsorsButton() {
  if (fundingConfig.githubSponsorsStatus === "active") {
    return (
      <a
        href={fundingConfig.githubSponsorsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-6 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:bg-[var(--color-bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
      >
        GitHub Sponsors
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  // Pending approval: informational, not a payment path.
  return (
    <span
      aria-disabled="true"
      title="GitHub Sponsors is awaiting approval — Ko-fi is the active destination."
      className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-6 text-[15px] font-medium text-[var(--color-muted)]"
    >
      GitHub Sponsors — pending approval
    </span>
  );
}

/* ---- Section scaffolding ---- */

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">{eyebrow}</p>
      <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
        {title}
      </h2>
      {lead ? <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">{lead}</p> : null}
    </div>
  );
}

/* ---- Tier card, shared by all individual tiers (data in lib/funding.ts) ---- */

function TierCard({ tier }: { tier: SponsorTier }) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl border bg-[var(--color-surface)] p-7 shadow-[var(--shadow-sm)] ${
        tier.highlighted
          ? "border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] ring-1 ring-[color-mix(in_oklab,var(--color-accent)_25%,transparent)]"
          : "border-[var(--color-border)]"
      }`}
    >
      {tier.highlighted ? (
        <span className="absolute -top-3 left-7 inline-flex items-center rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent-fg)]">
          Most popular
        </span>
      ) : null}
      <h3 className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)]">{tier.name}</h3>
      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{tier.blurb}</p>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[32px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-fg)]">
          {formatUsd(tier.priceUsd)}
        </span>
        <span className="text-[13px] text-[var(--color-muted)]">/ month</span>
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {tier.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-[var(--color-fg-secondary)]">
            <span
              className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent-text)]"
              aria-hidden
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <a
          href={fundingConfig.koFiUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex h-10 w-full items-center justify-center rounded-xl text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] ${
            tier.highlighted
              ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)]"
              : "border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
          }`}
        >
          Sponsor as {tier.name}
          <span className="sr-only"> — {formatUsd(tier.priceUsd)} per month on Ko-fi (opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}

/* ---- Metrics — verified counts derived from the canonical catalog/pack data ---- */

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-[var(--shadow-sm)]">
      <div className="text-[30px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-fg)]">
        {value}
      </div>
      <div className="mt-1.5 text-[13px] leading-tight text-[var(--color-muted)]">{label}</div>
    </div>
  );
}

export default function SponsorPage() {
  const releasedComponents = componentItems().length + blockItems().length;
  const activeCategories = categories.filter((c) => categoryCount(c.id) > 0).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: TITLE,
        description: DESCRIPTION,
        url: absoluteUrl("/sponsor"),
      },
      {
        "@type": "FAQPage",
        mainEntity: fundingFaq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ===== 1 · Hero — copy left, the funding workflow (a real Motiq
              component communicating state) right ===== */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 90% at 50% -20%, var(--color-bg-elevated), transparent 70%)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(42% 46% at 84% 12%, var(--color-spotlight), transparent 64%)" }}
          />
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 45%, transparent), transparent)" }}
          />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pt-16">
          <div className="grid items-center gap-x-10 gap-y-10 lg:grid-cols-[1.15fr_1fr]">
            <div className="max-w-[600px]">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">
                Open-source sponsorship
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,4.2vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.02em] text-[var(--color-fg)]">
                Keep product motion open.
              </h1>
              <p className="mt-5 max-w-[520px] text-[clamp(1rem,1.2vw,1.1rem)] leading-relaxed text-[var(--color-muted)]">
                {product.productName} is a free, open-source library of animated React components for real product
                workflows. Sponsorship funds new components, documentation, accessibility testing, production
                examples, and long-term maintenance.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <KoFiButton>Support on Ko-fi</KoFiButton>
                <GithubSponsorsButton />
              </div>
              <p className="mt-4 flex items-center gap-2 text-[13.5px] text-[var(--color-muted)]">
                <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-success)_16%,transparent)] text-[var(--color-success)]" aria-hidden>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {product.productName} remains free and open source.
              </p>
            </div>

            <div className="relative w-full">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl"
                style={{ background: "radial-gradient(60% 60% at 60% 30%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 70%)" }}
              />
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                How support becomes a release
              </p>
              <FundingPipeline />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2 · Project metrics — verified counts from the catalog ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8" aria-label="Project metrics">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric value={`${releasedComponents}`} label="Released components & blocks" />
          <Metric value={`${packs.length}`} label="Complete workflow packs" />
          <Metric value={`${activeCategories}`} label="Workflow categories" />
          <Metric value="MIT" label="Open source, free to use commercially" />
        </div>
      </section>

      {/* ===== 3 · What sponsorship funds ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Where the money goes"
          title="What sponsorship funds"
          lead="Four kinds of work keep an open catalog production-ready. None of them are glamorous; all of them are the product."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {fundingAreas.map((area) => (
            <div
              key={area.title}
              className="flex flex-col gap-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-accent)_22%,transparent)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d={area.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="text-[15.5px] font-semibold text-[var(--color-fg)]">{area.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{area.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 4 · Individual tiers ===== */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)]" />
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Individual sponsorship"
            title="Monthly tiers"
            lead="Pick what fits — every tier funds the same open catalog. Benefits are recognition and early access, never roadmap control."
          />
          <div className="grid gap-5 pt-3 md:grid-cols-3">
            {individualTiers.map((tier) => (
              <TierCard key={tier.id} tier={tier} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5 · Company sponsorship — one horizontal partner card ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Company sponsorship"
          title="For companies building on Motiq"
        />
        <div className="relative overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-surface))] shadow-[var(--shadow-md)]">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 90% at 100% 0%, var(--color-card-glow), transparent 62%)" }} />
          <div className="relative grid gap-8 p-8 lg:grid-cols-[1.2fr_1fr] lg:p-10">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="text-[24px] font-semibold tracking-tight text-[var(--color-fg)]">{goldTier.name}</h3>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-semibold tabular-nums tracking-tight text-[var(--color-fg)]">
                    {formatUsd(goldTier.priceUsd)}
                  </span>
                  <span className="text-[13px] text-[var(--color-muted)]">/ month</span>
                </p>
              </div>
              <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-muted)]">{goldTier.blurb}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <KoFiButton offset="surface">Become a Gold Sponsor</KoFiButton>
                <a
                  href={product.supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  Talk to us first
                  <span className="sr-only"> (opens GitHub issues in a new tab)</span>
                </a>
              </div>
              <p className="mt-5 max-w-xl text-[12.5px] leading-relaxed text-[var(--color-muted)]">
                Gold sponsorship supports the project and earns recognition. It does not guarantee a requested
                feature, a roadmap decision, or delivery timelines — the catalog stays independently maintained.
              </p>
            </div>
            <ul className="grid content-center gap-2.5">
              {goldTier.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14px] leading-snug text-[var(--color-fg-secondary)]">
                  <span
                    className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent-text)]"
                    aria-hidden
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 6 · One-time support ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)] md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-[20px] font-semibold tracking-tight text-[var(--color-fg)]">
              Prefer a one-time contribution?
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">
              No commitment needed — Ko-fi accepts one-time contributions of any amount alongside monthly
              memberships. Every contribution funds the same work.
            </p>
          </div>
          <div className="shrink-0">
            <KoFiButton offset="surface">Support once on Ko-fi</KoFiButton>
          </div>
        </div>
      </section>

      {/* ===== 7 · Funding goals — no fabricated progress ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Funding goals"
          title="What each level of support unlocks"
          lead={
            verifiedMonthlyFundingUsd === null
              ? "Goals are listed without a progress amount until there is a verified monthly figure to show — no invented numbers."
              : undefined
          }
        />
        <ol className="grid gap-5 md:grid-cols-3">
          {fundingGoals.map((goal) => {
            const pct =
              verifiedMonthlyFundingUsd === null
                ? null
                : Math.min(100, Math.round((verifiedMonthlyFundingUsd / goal.amountUsd) * 100));
            return (
              <li
                key={goal.amountUsd}
                className="flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]"
              >
                <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">
                  {formatUsd(goal.amountUsd)} / month
                </p>
                <h3 className="mt-1.5 text-[16.5px] font-semibold tracking-tight text-[var(--color-fg)]">{goal.title}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{goal.detail}</p>
                <div className="mt-5">
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
                    role={pct === null ? undefined : "progressbar"}
                    aria-valuenow={pct ?? undefined}
                    aria-valuemin={pct === null ? undefined : 0}
                    aria-valuemax={pct === null ? undefined : 100}
                    aria-label={pct === null ? undefined : `${goal.title} progress`}
                  >
                    {pct !== null ? (
                      <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${pct}%` }} />
                    ) : null}
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--color-muted)]">
                    {pct === null ? "Progress shown once verified funding data exists." : `${pct}% funded`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ===== 8 · Sponsor wall — honest empty states, never invented ===== */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)]" />
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Sponsor wall"
            title="The people and companies keeping Motiq open"
            lead="Every sponsor is also listed in SPONSORS.md in the repository. Listing is optional — sponsor privately if you prefer."
          />

          <h3 className="text-[15px] font-semibold text-[var(--color-fg)]">Company sponsors</h3>
          {companySponsors.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {companySponsors.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-24 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- sponsor logos are external, unoptimizable assets */}
                    <img src={s.logoSrc} alt={s.name} className="max-h-10 w-auto max-w-full" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center">
              <p className="text-[14px] text-[var(--color-muted)]">
                No company sponsors yet — be the first. Sponsor and Gold Sponsor logos appear here with a link.
              </p>
            </div>
          )}

          <h3 className="mt-10 text-[15px] font-semibold text-[var(--color-fg)]">Individual supporters</h3>
          {individualSponsors.length ? (
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {individualSponsors.map((s) => (
                <li key={s.name}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
                    >
                      {s.name}
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-fg)]">
                      {s.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 text-center">
              <p className="text-[14px] text-[var(--color-muted)]">
                No individual supporters yet.{" "}
                <a
                  href={fundingConfig.koFiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--color-accent-text)] hover:underline"
                >
                  Become the first →
                </a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== 9 · Transparency ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeading
            eyebrow="Transparency"
            title="How sponsorship is handled"
          />
          <ul className="grid content-start gap-4">
            {[
              "Payments go directly through Ko-fi (and GitHub Sponsors once approved). This site never collects or processes card details.",
              "Every sponsor is recorded in SPONSORS.md in the public repository, unless they ask to stay private.",
              "No invented numbers: funding progress, audience, or reach figures are only shown when verified.",
              "Sponsorship funds maintenance and new open-source work. It does not purchase roadmap control, guaranteed features, or fixed response times.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-[var(--color-fg-secondary)]">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_15%,transparent)] text-[var(--color-accent-text)]" aria-hidden>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {line}
              </li>
            ))}
            <li className="pl-8 text-[13.5px] text-[var(--color-muted)]">
              Public ledger:{" "}
              <a
                href={fundingConfig.sponsorsFileUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--color-accent-text)] hover:underline"
              >
                SPONSORS.md on GitHub
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== 10 · FAQ ===== */}
      <section className="mx-auto max-w-[920px] px-4 py-14 sm:px-6">
        <SectionHeading eyebrow="Questions" title="Sponsorship FAQ" />
        <dl className="space-y-6">
          {fundingFaq.map((f) => (
            <div key={f.q} className="border-t border-[var(--color-border)] pt-5">
              <dt className="text-[15.5px] font-semibold text-[var(--color-fg)]">{f.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-muted)]">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ===== 11 · Final CTA ===== */}
      <section className="mx-auto max-w-[1440px] px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-surface-strong)] px-6 py-14 text-center shadow-[var(--shadow-lg)] sm:px-12">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 100% at 50% -15%, var(--color-spotlight), transparent 60%)" }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 55%, transparent), transparent)" }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold tracking-tight text-[var(--color-fg)]">
              Keep product motion open.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-muted)]">
              Sponsorship keeps every component free, accessible, documented, and maintained — for everyone.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <KoFiButton>Support on Ko-fi</KoFiButton>
              <Link
                href="/components"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-strong)]"
              >
                Browse the catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
