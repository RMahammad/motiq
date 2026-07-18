import type { Metadata } from "next";
import Link from "next/link";

import { packs, packInstallShort } from "../../lib/packs";
import { bySlug } from "../../lib/catalog";
import { product } from "../../lib/product";
import { completeCatalogCta, statusLabel } from "../../lib/commerce";
import { pageMetadata } from "../../lib/seo";
import { AccessCta } from "../_components/access-cta";
import { CompactPreview } from "./_compact-previews";
import { FeaturedShowcase, type FeaturedPack } from "./_featured-showcase";

export const metadata: Metadata = pageMetadata({
  title: "Workflow packs",
  description:
    "Complete, installable workflow blocks — AI interface, developer tools, collaboration, and data motion. Editable source, shadcn-compatible.",
  path: "/packs",
});

/** Resolve a pack's components (name + featured flag) from the catalog, in visual order. */
function resolveComponents(slugs: string[]) {
  return slugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)
    .map((c) => ({ slug: c!.slug, name: c!.name, featured: c!.featured }));
}

const DOMAINS: Record<string, string> = {
  "ai-interface": "app.acme.ai/agent",
  "developer-tools": "console.acme.dev/deploy",
  "collaboration": "review.acme.com/design",
  "data-motion": "ops.acme.com/live",
};

const BEST_FOR: Record<string, string> = {
  "ai-interface": "AI agents & assistants",
  "developer-tools": "Deploy & CI/CD consoles",
  "collaboration": "Review & sign-off tools",
  "data-motion": "Live ops dashboards",
};

// Upcoming packs — clearly not purchasable. Local to this page so the labels
// (progress + availability) are fully controlled here.
const UPCOMING: { name: string; progress: string; tone: "progress" | "later" | "unavailable" }[] = [
  { name: "File Workflows", progress: "3 / 4 complete", tone: "progress" },
  { name: "Commerce", progress: "Coming later", tone: "later" },
  { name: "Security & Accounts", progress: "Coming later", tone: "later" },
  { name: "Communication", progress: "Not available yet", tone: "unavailable" },
  { name: "Productivity", progress: "Not available yet", tone: "unavailable" },
];

const PROOF = ["4 complete packs", "Editable source", "shadcn-compatible", "Free & open source"];

export default function PacksIndex() {
  const complete = completeCatalogCta();
  const status = statusLabel();

  const resolved = packs.map((p) => {
    const comps = resolveComponents(p.components);
    return { pack: p, comps };
  });

  const featured: FeaturedPack[] = resolved.map(({ pack, comps }) => ({
    slug: pack.slug,
    name: pack.name,
    blockSlug: pack.blockSlug,
    blockName: pack.blockName,
    tagline: pack.tagline,
    install: packInstallShort(pack),
    detailHref: `/packs/${pack.slug}`,
    components: comps,
    states: pack.states.slice(0, 6),
    domain: DOMAINS[pack.slug] ?? product.productName.toLowerCase(),
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-16">
      {/* 1 ── Hero ─────────────────────────────────────────────────────── */}
      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Workflow packs · {status}
        </span>
        <h1 className="mt-5 text-[clamp(2.4rem,5.4vw,3.6rem)] font-semibold leading-[1.04] tracking-tight text-[var(--color-fg)]">
          Complete workflows,
          <br className="hidden sm:block" /> not just components.
        </h1>
        <p className="mt-5 max-w-2xl text-[clamp(1.05rem,2.2vw,1.2rem)] leading-relaxed text-[var(--color-muted)]">
          Each pack composes four accessible, animated components into one editable block you install and drive with
          your own data — for AI products, developer tools, collaboration, and live data interfaces.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#packs"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-[14.5px] font-semibold text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Explore packs
          </a>
          <Link
            href="/components"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-[14.5px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Browse components
          </Link>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
          {PROOF.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[13.5px] text-[var(--color-muted)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[var(--color-accent-text)]">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {p}
            </li>
          ))}
        </ul>
      </header>

      {/* 2 ── Four pack overview cards (2×2) ──────────────────────────────── */}
      <section id="packs" className="mt-16 scroll-mt-24 sm:mt-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {resolved.map(({ pack, comps }) => (
            <article
              key={pack.slug}
              className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] sm:p-5"
            >
              <CompactPreview slug={pack.slug} />

              <div className="mt-4 flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)]">
                    <Link href={`/packs/${pack.slug}`} className="hover:text-[var(--color-accent-text)]">
                      {pack.name}
                    </Link>
                  </h2>
                  <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
                    {comps.length} components
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 min-h-[40px] text-[13.5px] leading-relaxed text-[var(--color-muted)]">
                  {pack.tagline}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {comps.map((c) => (
                    <span
                      key={c.slug}
                      className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11.5px] text-[var(--color-muted)]"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-4">
                  <Link
                    href={`/packs/${pack.slug}`}
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--color-accent-text)] transition-transform group-hover:gap-2"
                  >
                    View pack
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3 ── Featured pack showcase ─────────────────────────────────────── */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            See a complete block in action
          </h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">
            Every pack ships as one full, editable workflow block. Switch packs to preview each one rendering a real
            state — the same source you install.
          </p>
        </div>
        <FeaturedShowcase packs={featured} />
      </section>

      {/* 4 ── Pack comparison ────────────────────────────────────────────── */}
      <section className="mt-20 sm:mt-24">
        <h2 className="mb-6 text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Compare the packs
        </h2>

        {/* Desktop / tablet: table */}
        <div className="hidden overflow-hidden rounded-2xl border border-[var(--color-border)] md:block">
          <table className="w-full border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="bg-[var(--color-bg-secondary)] text-[var(--color-muted)]">
                <th className="px-4 py-3 font-medium">Pack</th>
                <th className="px-4 py-3 font-medium">Best for</th>
                <th className="px-4 py-3 font-medium">Components</th>
                <th className="px-4 py-3 font-medium">Complete block</th>
                <th className="px-4 py-3 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map(({ pack, comps }) => (
                <tr key={pack.slug} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-secondary)]">
                  <td className="px-4 py-3">
                    <Link href={`/packs/${pack.slug}`} className="font-medium text-[var(--color-fg)] hover:text-[var(--color-accent-text)]">
                      {pack.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{BEST_FOR[pack.slug]}</td>
                  <td className="px-4 py-3 text-[var(--color-fg)]">{comps.length}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{pack.blockName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11.5px] text-[var(--color-muted)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked comparison cards */}
        <div className="grid gap-3 md:hidden">
          {resolved.map(({ pack, comps }) => (
            <div key={pack.slug} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/packs/${pack.slug}`} className="text-[15px] font-semibold text-[var(--color-fg)]">
                  {pack.name}
                </Link>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  {status}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                <div>
                  <dt className="text-[var(--color-muted)]">Best for</dt>
                  <dd className="text-[var(--color-fg)]">{BEST_FOR[pack.slug]}</dd>
                </div>
                <div>
                  <dt className="text-[var(--color-muted)]">Components</dt>
                  <dd className="text-[var(--color-fg)]">{comps.length}</dd>
                </div>
                <div>
                  <dt className="text-[var(--color-muted)]">Complete block</dt>
                  <dd className="text-[var(--color-fg)]">{pack.blockName}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      {/* 5 ── Upcoming packs (clearly not purchasable) ───────────────────── */}
      <section className="mt-20 sm:mt-24">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            Upcoming packs
          </h2>
          <p className="text-[13px] text-[var(--color-muted)]">Planned — not yet available and not purchasable.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {UPCOMING.map((u) => (
            <div key={u.name} className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-[14px] font-semibold text-[var(--color-fg)]">{u.name}</p>
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  u.tone === "progress"
                    ? "bg-[color-mix(in_oklab,var(--color-accent)_12%,transparent)] text-[var(--color-accent-text)]"
                    : "border border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {u.tone === "progress" ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> : null}
                {u.progress}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 6 ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="mt-20 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 sm:mt-24 sm:p-12">
        <div className="max-w-2xl">
          <h2 className="text-[clamp(1.7rem,3.6vw,2.3rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            Get every pack as editable source
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
            The complete catalog includes all four workflow packs and every component — installed through a
            shadcn-compatible registry and yours to edit. Access and pricing are being finalized.
          </p>
          <div className="mt-6 flex flex-wrap items-start gap-4">
            <AccessCta cta={complete} />
            <Link
              href="/components"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
            >
              Browse components
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
