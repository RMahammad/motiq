import type { ReactNode } from "react";
import Link from "next/link";

import { product } from "../lib/product";
import { featuredItems, categoryCount, bySlug, packSpans, SPAN_CLASS, accessLabel, resolvePresentation, componentItems, type CatalogItem } from "../lib/catalog";
import { packs, type Pack } from "../lib/packs";
import { completeCatalogCta, statusLabel } from "../lib/commerce";
import { CatalogPreview } from "./_previews";
import { CatalogStage } from "./_components/catalog-stage";
import { LazyPreview } from "./_components/lazy-preview";
import { HeroShowcase } from "./_components/hero-showcase";
import { AccessCta } from "./_components/access-cta";
import { PageView } from "./_components/page-view";

/* ------------------------------------------------------------------ *
 * Homepage art-direction (docs/59). Seven distinct sections, one visual
 * story: Hero → Differentiation → Featured → Categories → Packs → Tiers → CTA.
 * Surfaces use elevated tokens (surface / surface-raised + shadow) instead of
 * flat near-black; category families carry a controlled accent hue so the page
 * never reads as one repeated dark dashboard grid.
 * ------------------------------------------------------------------ */

// Controlled per-family accent palette — one hue per workflow family, used only
// on card chrome (icon, count pill, explore link, hover ring). Shared design
// system; distinct color so families are visually separable at a glance.
type Family = {
  cat: string;
  name: string;
  value: string;
  count: number;
  icon: string;
  c: string;
};
const FAMILIES: Family[] = [
  { cat: "ai", name: "AI workspace", value: "Streaming responses, agent runs, and tool activity.", count: 6, c: "#8b7bff", icon: "M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3zM18 15l.9 2.3L21 18l-2.1.7L18 21l-.9-2.3L15 18l2.1-.7z" },
  { cat: "developer-tools", name: "Developer console", value: "Pipelines, logs, inspectors, and environments.", count: 6, c: "#5b9dff", icon: "M5 6l6 6-6 6M13 18h6" },
  { cat: "collaboration", name: "Collaboration", value: "Presence, approvals, comments, and activity.", count: 6, c: "#f0b000", icon: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 10-2-5.2M15.5 14.5A6 6 0 0121 20" },
  { cat: "data-motion", name: "Data motion", value: "KPIs, refresh states, and streaming tables.", count: 6, c: "#31c5f0", icon: "M5 20V11M12 20V4M19 20v-6" },
  { cat: "commerce", name: "Commerce", value: "Variants, cart, and checkout flows.", count: 3, c: "#3fcf8e", icon: "M4 6h15l-1.6 8.5a2 2 0 01-2 1.6H8.6a2 2 0 01-2-1.7L4.7 4.6A1 1 0 003.7 4H2M8 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z" },
  { cat: "security", name: "Security", value: "Passkeys, two-factor, and session safety.", count: 3, c: "#2dd4bf", icon: "M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6zM9 12l2 2 4-4" },
  { cat: "productivity", name: "Productivity", value: "Boards, timelines, and dependencies.", count: 3, c: "#fb8c4b", icon: "M4 4h5v16H4zM10 4h4v10h-4zM15 4h5v7h-5z" },
  { cat: "text", name: "Text & creative", value: "Kinetic text, cards, and backgrounds.", count: 6, c: "#f472b6", icon: "M4 7V5h16v2M12 5v14M9 19h6" },
];

const categoryHref = (cat: string) => `/components?category=${cat}`;

/* Small stroke icon set for the differentiation band (decorative). */
function PropIcon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const DIFFERENTIATORS = [
  { t: "You drive the state", d: "Every component and workflow block is application-controlled — no backend lock-in.", icon: "M12 3v18M5 8l7-5 7 5" },
  { t: "Editable source", d: "Installs through the shadcn CLI as TypeScript + Tailwind you own and edit.", icon: "M8 6l-5 6 5 6M16 6l5 6-5 6" },
  { t: "Accessible by default", d: "Keyboard-safe, reduced-motion behavior and honest states in every item.", icon: "M12 3a4 4 0 100 8 4 4 0 000-8zM5 21v-1a7 7 0 0114 0v1" },
  { t: "Composed blocks", d: "Four components compose into one installable, app-owned workflow block.", icon: "M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7z" },
];

/* ---- Featured component card (lean, editorial) ---- */
function FeaturedCard({ item, wide }: { item: CatalogItem; wide?: boolean }) {
  const p = resolvePresentation(item);
  const stage = (
    <CatalogStage size={p.previewSize} family={p.stageFamily} ambient={p.previewMode === "ambient"} mobileFrame={p.previewSize === "mobile"}>
      <CatalogPreview id={item.id} />
    </CatalogStage>
  );
  const preview =
    p.previewSize === "full" || p.previewSize === "wide" || p.previewSize === "mobile" ? (
      <LazyPreview label={`${item.name} preview`} minHeightClass="min-h-[300px]">
        {stage}
      </LazyPreview>
    ) : (
      stage
    );

  const meta = (
    <div className={`flex flex-col ${wide ? "justify-center gap-3 p-6 lg:p-8" : "gap-2 p-5"}`}>
      <div className="flex items-center gap-2.5">
        <h3 className={`font-semibold tracking-tight text-[var(--color-fg)] ${wide ? "text-[22px]" : "text-[17px]"}`}>
          <Link href={item.documentationPath} className="outline-none after:absolute after:inset-0 after:rounded-3xl hover:text-[var(--color-accent-text)]">
            {item.name}
          </Link>
        </h3>
        <AccessPill access={item.access} />
      </div>
      <p className={`text-[var(--color-muted)] ${wide ? "max-w-md text-[15px] leading-relaxed" : "line-clamp-2 text-[13.5px] leading-relaxed"}`}>
        {item.description.split(" — ")[0].split(". ")[0]}.
      </p>
      <span className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-medium text-[var(--color-accent-text)]">
        Open component →
      </span>
    </div>
  );

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]">
      {wide ? (
        <div className="grid lg:grid-cols-[1.35fr_0.65fr]">
          <div className="min-w-0 border-b border-[var(--color-border)] lg:border-b-0 lg:border-r">{preview}</div>
          {meta}
        </div>
      ) : (
        <>
          <div className="border-b border-[var(--color-border)]">{preview}</div>
          {meta}
        </>
      )}
    </div>
  );
}

function AccessPill({ access }: { access: CatalogItem["access"] }) {
  const pro = access === "pro";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        pro
          ? "bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-accent-text)]"
          : "bg-[var(--color-bg-secondary)] text-[var(--color-muted)]"
      }`}
    >
      {accessLabel[access]}
    </span>
  );
}

/* ---- Hero product-proof stat (truthful, catalog-derived — never fake trust) ---- */
function ProofStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-9 shrink-0 text-right text-[22px] font-semibold tabular-nums tracking-tight text-[var(--color-fg)]">{value}</span>
      <span className="text-[13.5px] leading-tight text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

/* ---- Hero product-proof line with a check (qualitative, truthful) ---- */
function ProofLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_15%,transparent)] text-[var(--color-accent-text)]" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <span className="text-[13.5px] leading-tight text-[var(--color-fg)]">{children}</span>
    </div>
  );
}

/* ---- Product-strength chip for the row below the showcase ---- */
function StrengthChip({ path, children }: { path: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-fg)] shadow-[var(--shadow-sm)]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[var(--color-accent-text)]">
        <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

/* ---- Workflow category tile (bold family-colored cover) ---- */
function CategoryTile({ f }: { f: Family }) {
  const n = categoryCount(f.cat as never);
  return (
    <Link
      href={categoryHref(f.cat)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
      style={{ ["--fam" as string]: f.c }}
    >
      {/* Bold family cover — a colored panel with the family glyph + a soft grid
          motif. Distinct per family so the section never reads as a dark-dashboard grid. */}
      <div
        className="relative flex h-[150px] items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, color-mix(in oklab, var(--fam) 30%, var(--color-surface)) 0%, color-mix(in oklab, var(--fam) 10%, var(--color-surface)) 100%)" }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{ background: "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--fam) 45%, transparent) 1px, transparent 0)", backgroundSize: "18px 18px" }}
        />
        <span
          className="relative grid h-16 w-16 place-items-center rounded-2xl border shadow-[var(--shadow-sm)] transition-transform duration-300 group-hover:scale-105"
          style={{ background: "color-mix(in oklab, var(--fam) 22%, var(--color-surface))", borderColor: "color-mix(in oklab, var(--fam) 45%, transparent)", color: "var(--fam)" }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d={f.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[19px] font-semibold tracking-tight text-[var(--color-fg)]">{f.name}</h3>
          <span
            className="ml-auto rounded-full px-2.5 py-0.5 text-[12px] font-semibold tabular-nums"
            style={{ background: "color-mix(in oklab, var(--fam) 16%, transparent)", color: "var(--fam)" }}
          >
            {n}
          </span>
        </div>
        <p className="text-[14px] leading-relaxed text-[var(--color-muted)]">{f.value}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[13.5px] font-semibold" style={{ color: "var(--fam)" }}>
          Explore {f.name} →
        </span>
      </div>
    </Link>
  );
}

/* ---- Pack card (product offering, static composition) ---- */
function PackCard({ p }: { p: Pack }) {
  const comps = p.components.map((s) => bySlug.get(s)).filter(Boolean) as CatalogItem[];
  const free = comps.filter((c) => c.access === "free").length;
  const pro = comps.length - free;
  return (
    <Link
      href={`/packs/${p.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:shadow-[var(--shadow-md)]"
    >
      {/* Static composition: the block, evoked as a layered stack of its parts. */}
      <div className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "radial-gradient(120% 120% at 15% -20%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 60%)" }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--color-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> Installs 1 block · {comps.length} components
          </span>
          <div className="mt-4 space-y-2">
            {comps.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-[var(--shadow-sm)]"
                style={{ marginLeft: `${i * 10}px`, width: `calc(100% - ${i * 10}px)` }}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[11px] font-semibold text-[var(--color-accent-text)]" aria-hidden>
                  {i + 1}
                </span>
                <span className="truncate text-[13px] font-medium text-[var(--color-fg)]">{c.name}</span>
                <span className="ml-auto text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">{accessLabel[c.access]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Complete workflow</p>
        <h3 className="mt-1.5 text-[20px] font-semibold tracking-tight text-[var(--color-fg)]">{p.name}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted)]">{p.tagline}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
          <span className="text-[13px] font-medium text-[var(--color-muted)]">
            <span className="text-[var(--color-fg)]">{free} Free</span> · {pro} Pro · {p.blockName}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] transition-colors group-hover:bg-[var(--color-accent-hover)]">
            View pack →
          </span>
        </div>
      </div>
    </Link>
  );
}


export default function HomePage() {
  const featured = featuredItems();
  const featuredSpans = packSpans(featured);
  const complete = completeCatalogCta();

  const componentTotal = componentItems().length;

  return (
    <>
      <PageView event="homepage_viewed" />

      {/* ===== 1 · Hero — left-aligned editorial composition over a soft
              light-first environment, with the product proof on the right and a
              large browser-style showcase below (docs/60 rebuild). ===== */}
      <section className="relative isolate overflow-hidden">
        {/* Background environment: a fine dot lattice masked to fade toward the
            readable content, one soft accent glow drawn up-right (off-center for
            an editorial feel), and a base wash into the page background.
            Restrained — no particles/beams/animated noise — and token-driven so
            it reads intentionally in both light and dark. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-fg) 10%, transparent) 1px, transparent 0)",
              backgroundSize: "28px 28px",
              opacity: 0.5,
              WebkitMaskImage: "radial-gradient(115% 75% at 70% 4%, #000 0%, transparent 60%)",
              maskImage: "radial-gradient(115% 75% at 70% 4%, #000 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(48% 40% at 82% -4%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 66%)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-40"
            style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg))" }}
          />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-12 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
          {/* Top hero content: ~60% copy on the left, ~28% product proof on the
              right, with breathing space between. Stacks on tablet/mobile. */}
          <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            {/* Left — headline + copy + CTAs */}
            <div className="max-w-[640px]">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-muted)] shadow-[var(--shadow-sm)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {statusLabel()} · {product.freeTierLabel} &amp; {product.premiumTierLabel}
              </span>

              <h1 className="mt-6 text-[clamp(2.5rem,6.2vw,5.5rem)] font-semibold leading-[1.05] tracking-tight text-[var(--color-fg)]">
                Ship product interfaces
                <br className="hidden sm:block" /> that feel{" "}
                <span className="relative whitespace-nowrap text-[var(--color-accent-text)]">
                  alive
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-1 h-[0.14em] rounded-full bg-[color-mix(in_oklab,var(--color-accent)_55%,transparent)]"
                  />
                </span>
                .
              </h1>

              <p className="mt-6 max-w-[540px] text-[clamp(1.02rem,1.4vw,1.18rem)] leading-relaxed text-[var(--color-muted)]">
                Animated React components and complete product workflows — editable source you
                install with one shadcn command. Your application owns the state, always.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/components"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-7 py-3.5 text-[15.5px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] sm:w-auto"
                >
                  Browse components
                </Link>
                <Link
                  href="/packs"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-3.5 text-[15.5px] font-semibold text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)] sm:w-auto"
                >
                  Explore packs
                </Link>
              </div>
            </div>

            {/* Right — truthful product proof (no fabricated trust proof) */}
            <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] p-5 shadow-[var(--shadow-sm)] lg:mt-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">What ships today</p>
              <div className="mt-4 flex flex-col gap-3.5">
                <ProofStat value={`${componentTotal}`} label="released components" />
                <ProofStat value={`${packs.length}`} label="complete workflow packs" />
              </div>
              <div className="my-4 h-px bg-[var(--color-border)]" />
              <div className="flex flex-col gap-3">
                <ProofLine>{product.freeTierLabel} &amp; {product.premiumTierLabel} editable source</ProofLine>
                <ProofLine>Reduced-motion &amp; keyboard safe</ProofLine>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Large browser-style showcase — the hero's main visual feature. */}
      <div className="pb-8">
        <HeroShowcase />
      </div>

      {/* Small product-strength row below the showcase (truthful labels only). */}
      <div className="mx-auto max-w-[1440px] px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <div className="flex flex-wrap items-center gap-2.5">
          <StrengthChip path="M8 6l-5 6 5 6M16 6l5 6-5 6">Editable React source</StrengthChip>
          <StrengthChip path="M4 7l8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4">shadcn-compatible</StrengthChip>
          <StrengthChip path="M12 3a4 4 0 100 8 4 4 0 000-8zM5 21v-1a7 7 0 0114 0v1">Accessible interactions</StrengthChip>
          <StrengthChip path="M12 3v18M5 8l7-5 7 5">Reduced-motion support</StrengthChip>
          <StrengthChip path="M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7z">Framework-neutral components</StrengthChip>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
      {/* ===== 2 · Product differentiation ===== */}
      <section className="py-8">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 sm:p-8 lg:p-10">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Why this library</p>
          <h2 className="mt-2 max-w-2xl text-[clamp(1.5rem,3vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            A motion system for real products — not a pile of effects.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.t} className="flex flex-col gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-accent-text)]">
                  <PropIcon path={d.icon} />
                </span>
                <h3 className="text-[15.5px] font-semibold text-[var(--color-fg)]">{d.t}</h3>
                <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{d.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3 · Featured components ===== */}
      <section className="py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Featured components</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">Six of the catalog’s strongest — each preview is the real component in one representative state.</p>
          </div>
          <Link href="/components" className="shrink-0 text-[14px] font-semibold text-[var(--color-accent-text)] hover:underline">
            All components →
          </Link>
        </div>
        <div className="grid grid-cols-12 items-start gap-5">
          {featured.map((item) => {
            const span = featuredSpans.get(item.id) ?? 6;
            return (
              <div key={item.id} className={SPAN_CLASS[span]}>
                <FeaturedCard item={item} wide={span === 12} />
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 4 · Workflow categories ===== */}
      <section className="py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Built for real workflows</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">Eight product families — pick a surface, preview it live, install what you need.</p>
          </div>
          <Link href="/components" className="shrink-0 text-[14px] font-semibold text-[var(--color-accent-text)] hover:underline">
            All categories →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FAMILIES.map((f) => (
            <CategoryTile key={f.cat} f={f} />
          ))}
        </div>
      </section>

      {/* ===== 5 · Complete packs ===== */}
      <section className="py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Complete workflow packs</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">Finished product outcomes — four components composed into one installable, app-controlled block.</p>
          </div>
          <Link href="/packs" className="shrink-0 text-[14px] font-semibold text-[var(--color-accent-text)] hover:underline">
            All packs →
          </Link>
        </div>
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
          {packs.map((p) => (
            <PackCard key={p.slug} p={p} />
          ))}
        </div>
      </section>

      {/* ===== 6 · Free vs Pro ===== */}
      <section className="py-14">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{product.freeTierLabel}</p>
            <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--color-fg)]">Start free</h3>
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              A genuinely useful set — animated shadcn components, text effects, icons, and workflow surfaces. Public registry, editable source, full accessibility.
            </p>
            <div className="mt-6 flex-1" />
            <Link
              href="/components?access=free"
              className="inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-3 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
            >
              Install the free registry →
            </Link>
          </div>
          <div className="flex flex-col rounded-3xl border border-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_7%,var(--color-surface))] p-8 shadow-[var(--shadow-md)]">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">{product.premiumTierLabel}</p>
            <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--color-fg)]">Go Pro</h3>
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              The full catalog, advanced creative components and backgrounds, every complete workflow block and pack, private registry delivery, updates, and support.
            </p>
            <div className="mt-6 flex-1" />
            <AccessCta cta={complete} />
          </div>
        </div>
      </section>

      {/* ===== 7 · Final CTA ===== */}
      <section className="py-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-16 text-center shadow-[var(--shadow-md)] sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(80% 120% at 50% -10%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 60%)" }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-semibold tracking-tight text-[var(--color-fg)]">
              Ship product motion today.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-[var(--color-muted)]">
              Browse the catalog, preview every component live, and install the ones you want as editable source.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/components"
                className="rounded-xl bg-[var(--color-accent)] px-6 py-3 text-[15px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Browse components
              </Link>
              <Link
                href="/packs"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-secondary)]"
              >
                Explore packs
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
