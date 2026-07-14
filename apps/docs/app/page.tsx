import Link from "next/link";

import { product, installCommand } from "../lib/product";
import { categories, featuredItems, catalog, categoryCount, componentItems, bySlug } from "../lib/catalog";
import { packs } from "../lib/packs";
import { completeCatalogCta, statusLabel } from "../lib/commerce";
import { PreviewStage } from "./_components/preview-stage";
import { Preview } from "./_previews";
import { KpiNumberMorphHeroPreview } from "./_previews/kpi-number-morph";
import { CatalogCard } from "./_components/catalog-card";
import { InstallCommand } from "./_components/code-block";
import { AccessCta } from "./_components/access-cta";
import { PageView } from "./_components/page-view";

// One representative preview per category for the category showcase.
const CATEGORY_HERO: Record<string, string> = {
  ai: "ai-response-stream",
  "developer-tools": "deployment-pipeline",
  collaboration: "live-presence-stack",
  "data-motion": "kpi-number-morph",
  mobile: "swipe-action-row",
  file: "file-upload-pipeline",
  commerce: "product-variant-selector",
  security: "passkey-setup-flow",
  communication: "message-delivery-states",
  productivity: "kanban-card-movement",
  text: "kinetic-emphasis",
  creative: "spotlight-card",
  backgrounds: "luminous-topography",
  "animated-shadcn": "animated-tabs",
  icons: "animated-icons",
};

export default function HomePage() {
  const featured = featuredItems();
  const complete = completeCatalogCta();
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      <PageView event="homepage_viewed" />
      {/* ---- Hero ---- */}
      <section className="grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[12.5px] text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {statusLabel()} · {product.freeTierLabel} & {product.premiumTierLabel}
          </span>
          <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-tight text-[var(--color-fg)]">
            Animated components and complete workflows for real products.
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(1rem,2.2vw,1.15rem)] leading-relaxed text-[var(--color-muted)]">
            For AI products, developer tools, collaboration, and live data interfaces. You drive the state — every
            component and composed workflow block is application-controlled, accessible, reduced-motion-safe, and yours
            to edit. No backend lock-in; install as source with one shadcn command.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/components"
              className="rounded-xl bg-[var(--color-accent)] px-5 py-3 text-[15px] font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Browse components
            </Link>
            <Link
              href="/components/blur-text"
              className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-[15px] font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
            >
              View documentation
            </Link>
          </div>
          <div className="mt-8 max-w-md">
            <InstallCommand command={installCommand("blur-text")} />
            {product.namespaceIsPreview ? (
              <p className="mt-2 text-[12px] text-[var(--color-muted)]">
                Registry namespace is a temporary preview value during development.
              </p>
            ) : null}
          </div>
        </div>

        {/* Hero montage — the creative centerpiece + real product workflows */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PreviewStage stage="text" showControls={false}>
              <Preview id="kinetic-emphasis" />
            </PreviewStage>
          </div>
          <PreviewStage stage="interactive" showControls={false}>
            <Preview id="ai-response-stream" />
          </PreviewStage>
          <PreviewStage stage="card" showControls={false}>
            <KpiNumberMorphHeroPreview />
          </PreviewStage>
        </div>
      </section>

      {/* ---- Category showcase ---- */}
      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            Browse by category
          </h2>
          <Link href="/components" className="text-[14px] font-medium text-[var(--color-accent)] hover:underline">
            All components →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] transition-colors focus-within:border-[var(--color-accent)] hover:border-[color-mix(in_oklab,var(--color-accent)_50%,var(--color-border))]"
            >
              {/* The category preview is a non-interactive thumbnail: `inert` keeps
                  its buttons/links out of the tab order and, crucially, out of the
                  card's stretched navigation link (no nested interactive elements). */}
              <div inert aria-hidden className="pointer-events-none">
                <PreviewStage stage="icon" showControls={false}>
                  <Preview id={CATEGORY_HERO[c.id]} />
                </PreviewStage>
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                <div>
                  <Link
                    href={`/components?category=${c.id}`}
                    className="text-[15px] font-semibold text-[var(--color-fg)] outline-none after:absolute after:inset-0 after:rounded-2xl"
                  >
                    {c.label}
                  </Link>
                  <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">{c.blurb}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[12px] text-[var(--color-muted)]">
                  {categoryCount(c.id)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Popular components ---- */}
      <section className="py-12">
        <h2 className="mb-6 text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Popular components
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* ---- Complete workflow packs ---- */}
      <section className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
              Complete workflow packs
            </h2>
            <p className="mt-2 max-w-xl text-[14px] text-[var(--color-muted)]">
              Finished product outcomes — four components composed into one installable, app-controlled block.
            </p>
          </div>
          <Link href="/packs" className="shrink-0 text-[14px] font-medium text-[var(--color-accent)] hover:underline">
            All packs →
          </Link>
        </div>
        {/* Cards link to each pack page, where the full live block renders — so the
            homepage never mounts four heavy blocks on initial load. */}
        <div className="grid gap-5 md:grid-cols-2">
          {packs.map((p) => {
            const comps = p.components.map((s) => bySlug.get(s)).filter(Boolean);
            const free = comps.filter((c) => c!.access === "free").length;
            return (
              <Link
                key={p.slug}
                href={`/packs/${p.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
              >
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-[11.5px] text-[var(--color-muted)]">
                    Workflow pack · {comps.length} components · 1 block
                  </span>
                  <h3 className="mt-3 text-[18px] font-semibold text-[var(--color-fg)]">{p.name}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--color-muted)]">{p.tagline}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {comps.map((c) => (
                    <span key={c!.id} className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[11.5px] text-[var(--color-muted)]">
                      {c!.name}
                    </span>
                  ))}
                  <span className="ml-auto text-[12px] text-[var(--color-accent)]">{free} Free · View pack →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---- Installation ---- */}
      <section className="py-12">
        <div className="grid gap-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 lg:grid-cols-2 lg:p-12">
          <div>
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold tracking-tight text-[var(--color-fg)]">
              Install the source, not a black box.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
              Every component installs through the shadcn CLI as editable TypeScript + Tailwind source, directly into your
              project. No runtime dependency on us, no lock-in — customize freely.
            </p>
            <ul className="mt-6 space-y-2 text-[14px] text-[var(--color-muted)]">
              <li>· Editable source copied into your repo</li>
              <li>· Declares its own dependencies (Motion / Radix only where needed)</li>
              <li>· Works with your existing shadcn setup and Tailwind</li>
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <p className="text-[13px] font-medium text-[var(--color-fg)]">Add a component</p>
            <InstallCommand command={installCommand("animated-dialog")} />
            <p className="mt-2 text-[13px] font-medium text-[var(--color-fg)]">Add the shared utility</p>
            <InstallCommand command={installCommand("utils")} />
          </div>
        </div>
      </section>

      {/* ---- Free / Pro ---- */}
      <section className="py-12">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)] p-8">
            <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {product.freeTierLabel}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--color-fg)]">Free components</h3>
            <p className="mt-3 text-[14px] text-[var(--color-muted)]">
              A genuinely useful set — animated shadcn components, text animations, entrance primitives, icons, and a
              background. Public registry, editable source, full accessibility.
            </p>
            <Link href="/components?access=free" className="mt-5 inline-block text-[14px] font-medium text-[var(--color-accent)] hover:underline">
              Browse free →
            </Link>
          </div>
          <div className="rounded-2xl border border-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_6%,transparent)] p-8">
            <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--color-accent)]">
              {product.premiumTierLabel}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--color-fg)]">Pro catalog</h3>
            <p className="mt-3 text-[14px] text-[var(--color-muted)]">
              The full catalog, advanced creative components and backgrounds, complete workflow blocks and packs,
              private registry delivery of editable source, updates, and support.
            </p>
            <div className="mt-5">
              <AccessCta cta={complete} />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="py-16 text-center">
        <h2 className="mx-auto max-w-2xl text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-tight text-[var(--color-fg)]">
          Start with the free registry.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] text-[var(--color-muted)]">
          Browse the catalog, preview every component live, and install the ones you want as editable source.
        </p>
        <Link
          href="/components"
          className="mt-8 inline-block rounded-xl bg-[var(--color-accent)] px-6 py-3 text-[15px] font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          Browse components
        </Link>
      </section>
    </div>
  );
}
