import type { Metadata } from "next";
import Link from "next/link";

import { packs } from "../../lib/packs";
import { bySlug } from "../../lib/catalog";
import { product } from "../../lib/product";
import { packPrimaryCta, completeCatalogCta, statusLabel, upcomingPacks } from "../../lib/commerce";
import { Preview } from "../_previews";
import { PreviewStage } from "../_components/preview-stage";
import { LazyPreview } from "../_components/lazy-preview";
import { AccessCta } from "../_components/access-cta";

export const metadata: Metadata = {
  title: `Workflow packs — ${product.productName}`,
  description: "Curated component packs that compose into complete, installable workflow blocks.",
};

export default function PacksIndex() {
  const complete = completeCatalogCta();
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
      <header className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {statusLabel()}
        </span>
        <h1 className="mt-4 text-[clamp(2rem,4.6vw,3.2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Complete workflow packs
        </h1>
        <p className="mt-4 max-w-2xl text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-[var(--color-muted)]">
          Not just components — finished product outcomes. Each pack composes four components into one complete,
          accessible, editable block you install and drive with your own data. Animated components and complete
          workflows for AI products, developer tools, collaboration, and live data interfaces.
        </p>
        <div className="mt-6">
          <AccessCta cta={complete} />
        </div>
      </header>

      {/* Four large pack previews */}
      <div className="grid gap-6 lg:grid-cols-2">
        {packs.map((p) => {
          const comps = p.components.map((s) => bySlug.get(s)).filter(Boolean) as NonNullable<ReturnType<typeof bySlug.get>>[];
          const free = comps.filter((c) => c.access === "free").length;
          const pro = comps.length - free;
          const cta = packPrimaryCta(p.slug);
          return (
            <section key={p.slug} className="flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <LazyPreview label={`${p.blockName} — preview`} minHeightClass="min-h-[240px]">
                <PreviewStage stage="interactive">
                  <Preview id={p.blockSlug} />
                </PreviewStage>
              </LazyPreview>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <Link href={`/packs/${p.slug}`} className="text-[19px] font-semibold text-[var(--color-fg)] hover:text-[var(--color-accent)]">
                    {p.name}
                  </Link>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">{statusLabel()}</span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">{p.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {comps.map((c) => (
                    <span key={c.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[12px] text-[var(--color-muted)]">
                      {c.name}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-[12.5px] text-[var(--color-muted)]">
                  {comps.length} components · {free} Free · {pro} Pro · block: {p.blockName}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <AccessCta cta={cta} />
                  <Link href={`/packs/${p.slug}`} className="text-[13px] font-medium text-[var(--color-accent)] hover:underline">
                    Full pack details →
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Pack comparison */}
      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold tracking-tight text-[var(--color-fg)]">Compare packs</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Pack</th>
                <th className="px-4 py-2 font-medium">For</th>
                <th className="px-4 py-2 font-medium">Components</th>
                <th className="px-4 py-2 font-medium">Free / Pro</th>
                <th className="px-4 py-2 font-medium">Block</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-fg)]">
              {packs.map((p) => {
                const comps = p.components.map((s) => bySlug.get(s)).filter(Boolean) as NonNullable<ReturnType<typeof bySlug.get>>[];
                const free = comps.filter((c) => c.access === "free").length;
                return (
                  <tr key={p.slug} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2">
                      <Link href={`/packs/${p.slug}`} className="hover:text-[var(--color-accent)]">{p.name}</Link>
                    </td>
                    <td className="px-4 py-2 text-[var(--color-muted)]">{p.useCases[0]}</td>
                    <td className="px-4 py-2">{comps.length}</td>
                    <td className="px-4 py-2">{free} / {comps.length - free}</td>
                    <td className="px-4 py-2 text-[var(--color-muted)]">{p.blockName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upcoming packs — clearly not purchasable */}
      <section className="mt-12">
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-[var(--color-fg)]">Upcoming packs</h2>
        <p className="mb-4 text-[13px] text-[var(--color-muted)]">Planned, not yet available. Not purchasable.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {upcomingPacks.map((u) => (
            <div key={u.slug} className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
              <p className="text-[14px] font-medium text-[var(--color-fg)]">{u.name}</p>
              <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">{u.progress}</p>
              <span className="mt-3 inline-block rounded-md border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">Coming soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* Complete catalog CTA */}
      <section className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-fg)]">Want every pack?</h2>
        <p className="mt-1 max-w-2xl text-[14px] text-[var(--color-muted)]">
          The complete catalog includes all four workflow packs and every component — as editable source. Access and
          pricing are being finalized.
        </p>
        <div className="mt-4">
          <AccessCta cta={complete} />
        </div>
      </section>
    </div>
  );
}
