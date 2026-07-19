import type { ReactNode } from "react";
import Link from "next/link";

import { product } from "../lib/product";
import { absoluteUrl } from "../lib/seo";
import { AiResponseStream, type ResponseSegment } from "@/registry/ai/ai-response-stream";
import { featuredItems, categoryCount, bySlug, packSpans, SPAN_CLASS, resolvePresentation, componentItems, type CatalogItem } from "../lib/catalog";
import { packs, type Pack } from "../lib/packs";
import { statusLabel } from "../lib/commerce";
import { CatalogPreview } from "./_previews";
import { RuntimeSignalMapHeroPreview } from "./_previews/catalog/runtime-signal-map-hero";
import { CatalogStage } from "./_components/catalog-stage";
import { LazyPreview } from "./_components/lazy-preview";
import { HeroShowcase } from "./_components/hero-showcase";
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
  { cat: "ai", name: "AI workspace", value: "Streaming responses, agent runs, and tool activity.", count: 6, c: "#4f7cff", icon: "M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3zM18 15l.9 2.3L21 18l-2.1.7L18 21l-.9-2.3L15 18l2.1-.7z" },
  { cat: "developer-tools", name: "Developer console", value: "Pipelines, logs, inspectors, and environments.", count: 6, c: "#3e5ae8", icon: "M5 6l6 6-6 6M13 18h6" },
  { cat: "collaboration", name: "Collaboration", value: "Presence, approvals, comments, and activity.", count: 6, c: "#22c7d9", icon: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 10-2-5.2M15.5 14.5A6 6 0 0121 20" },
  { cat: "data-motion", name: "Data motion", value: "KPIs, refresh states, and streaming tables.", count: 6, c: "#14b8a6", icon: "M5 20V11M12 20V4M19 20v-6" },
  { cat: "commerce", name: "Commerce", value: "Variants, cart, and checkout flows.", count: 3, c: "#10b981", icon: "M4 6h15l-1.6 8.5a2 2 0 01-2 1.6H8.6a2 2 0 01-2-1.7L4.7 4.6A1 1 0 003.7 4H2M8 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z" },
  { cat: "security", name: "Security", value: "Passkeys, two-factor, and session safety.", count: 3, c: "#6366f1", icon: "M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6zM9 12l2 2 4-4" },
  { cat: "productivity", name: "Productivity", value: "Boards, timelines, and dependencies.", count: 3, c: "#f59e0b", icon: "M4 4h5v16H4zM10 4h4v10h-4zM15 4h5v7h-5z" },
  { cat: "text", name: "Text & creative", value: "Kinetic text, cards, and backgrounds.", count: 6, c: "#ff6b5e", icon: "M4 7V5h16v2M12 5v14M9 19h6" },
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
  { t: "You drive the state", d: "Every component and workflow block is application-controlled - no backend lock-in.", icon: "M12 3v18M5 8l7-5 7 5" },
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
        <FeaturedPill featured={item.featured} />
      </div>
      <p className={`text-[var(--color-muted)] ${wide ? "max-w-md text-[15px] leading-relaxed" : "line-clamp-2 text-[13.5px] leading-relaxed"}`}>
        {item.description.split(" - ")[0].split(". ")[0]}.
      </p>
      <span className="mt-1 inline-flex items-center gap-1 text-[13.5px] font-medium text-[var(--color-accent-text)]">
        Open component →
      </span>
    </div>
  );

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] ring-1 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-border))] hover:shadow-[var(--shadow-md)] hover:ring-[color-mix(in_oklab,var(--color-accent)_18%,transparent)]">
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

function FeaturedPill({ featured }: { featured: boolean }) {
  if (!featured) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
      </svg>
      Featured
    </span>
  );
}

/* ---- Hero product-proof stat tile (truthful, catalog-derived — never fake trust) ---- */
function ProofStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 py-3">
      <div className="text-[30px] font-semibold leading-none tabular-nums tracking-tight text-[var(--color-fg)]">{value}</div>
      <div className="mt-1.5 text-[12.5px] leading-tight text-[var(--color-muted)]">{label}</div>
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
      {/* Family cover — restrained: a top-border accent + a SOFT top-down tint +
          a colored glyph chip. The family colour reads through the icon, border,
          and a faint wash only — never a filled colour panel (cool identity rule). */}
      <div
        className="relative flex h-[136px] items-center justify-center overflow-hidden border-t-2"
        style={{
          borderTopColor: "var(--fam)",
          background: "radial-gradient(120% 120% at 50% 0%, color-mix(in oklab, var(--fam) 13%, var(--color-surface)) 0%, var(--color-surface) 72%)",
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--fam) 34%, transparent) 1px, transparent 0)", backgroundSize: "18px 18px", WebkitMaskImage: "radial-gradient(90% 90% at 50% 0%, #000, transparent 75%)", maskImage: "radial-gradient(90% 90% at 50% 0%, #000, transparent 75%)" }}
        />
        <span
          className="relative grid h-16 w-16 place-items-center rounded-2xl border shadow-[var(--shadow-sm)] transition-transform duration-300 group-hover:scale-105"
          style={{ background: "color-mix(in oklab, var(--fam) 16%, var(--color-surface))", borderColor: "color-mix(in oklab, var(--fam) 40%, transparent)", color: "var(--fam)" }}
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
                {c.featured ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-label="Featured" className="ml-auto shrink-0 text-[var(--color-accent-text)]">
                    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
                  </svg>
                ) : null}
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
            <span className="text-[var(--color-fg)]">{comps.length} components</span> · {p.blockName}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-accent-fg)] transition-colors group-hover:bg-[var(--color-accent-hover)]">
            View pack →
          </span>
        </div>
      </div>
    </Link>
  );
}


/* One short, representative state of a real component (AI Response Stream) shown
   live inside the hero product panel — a concise answer + streaming caret. No
   code block, no sources rail, and its footer controls are hidden so the panel
   stays a clean, alive preview rather than an interactive surface. */
const HERO_STREAM_SEGMENTS: ResponseSegment[] = [
  {
    type: "text",
    text: "Cap retries with exponential backoff and full jitter, so clients never reconnect in lockstep after an outage.",
  },
];

export default function HomePage() {
  const featured = featuredItems();
  const featuredSpans = packSpans(featured);

  const componentTotal = componentItems().length;

  // Product environments showcase — a controlled selection (not all ten): one
  // lead animated background, one hero block, and two more backgrounds. Each
  // renders through LazyPreview (mounts on scroll) + the components' own
  // offscreen pause + reduced-motion, so nothing autoplays off-screen.
  const productEnvLead = bySlug.get("runtime-signal-map");
  const productEnvCards = ["agent-operations-hero", "workflow-topology-field", "queue-pulse-lanes"]
    .map((s) => bySlug.get(s))
    .filter(Boolean) as CatalogItem[];

  const catalogList = componentItems();
  const catalogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${product.productName} - component catalog`,
    description: product.description,
    url: absoluteUrl("/"),
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: catalogList.length,
      itemListElement: catalogList.slice(0, 30).map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: absoluteUrl(`/components/${item.slug}`),
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogJsonLd) }} />
      <PageView event="homepage_viewed" />

      {/* ===== 1 · Hero — left-aligned editorial composition over a soft
              light-first environment, with the product proof on the right and a
              large browser-style showcase below (docs/60 rebuild). ===== */}
      <section className="relative isolate overflow-hidden">
        {/* Hero atmosphere (docs/30): a deep-ink wash with a very subtle AZURE
            spotlight behind the product panel (upper-right), a faint CYAN
            counter-glow lower-left for depth, a restrained dot lattice masked
            toward the panel, a thin azure top edge-light, and a base wash into the
            page. No particles/beams. Token-driven so it reads in both themes. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* base wash — lifts the page off flat bg for a lit-studio feel */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 90% at 50% -20%, var(--color-bg-elevated), transparent 70%)" }}
          />
          {/* fine dot lattice, masked toward the product panel */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-fg) 7%, transparent) 1px, transparent 0)",
              backgroundSize: "30px 30px",
              opacity: 0.6,
              WebkitMaskImage: "radial-gradient(120% 85% at 80% 4%, #000 0%, transparent 60%)",
              maskImage: "radial-gradient(120% 85% at 80% 4%, #000 0%, transparent 60%)",
            }}
          />
          {/* azure spotlight behind the panel */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(42% 46% at 84% 12%, var(--color-spotlight), transparent 64%)" }}
          />
          {/* cyan counter-glow, very faint, lower-left */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(38% 40% at 6% 88%, var(--color-secondary-accent-soft), transparent 60%)" }}
          />
          {/* azure top edge-light */}
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 45%, transparent), transparent)" }}
          />
          {/* base wash into the page */}
          <div
            className="absolute inset-x-0 bottom-0 h-32"
            style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg))" }}
          />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-9 pt-11 sm:px-6 sm:pt-12 lg:px-8 lg:pt-14">
          {/* Balanced two-column composition: ~61% copy / ~36% product panel,
              vertically centered. Stacks on tablet/mobile. */}
          <div className="grid items-center gap-x-8 gap-y-9 lg:grid-cols-[1.7fr_1fr]">
            {/* Left — headline + copy + CTAs */}
            <div className="max-w-[620px]">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_75%,transparent)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--color-fg)] shadow-[var(--shadow-sm)] backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-75 motion-reduce:hidden" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                </span>
                {statusLabel()}
                <span className="text-[var(--color-muted)]">· Free &amp; open source</span>
              </span>

              <h1 className="mt-5 text-[clamp(2.2rem,4.4vw,3.9rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--color-fg)]">
                Ship product interfaces
                <br className="hidden sm:block" /> that{" "}
                {/* The one Coral signature moment of the hero — headline is
                    otherwise strong-neutral; Azure carries all interaction. */}
                <span className="relative whitespace-nowrap text-[var(--color-signature)]">
                  feel alive
                  <span
                    aria-hidden
                    className="hero-underline absolute inset-x-0 -bottom-1 h-[0.09em] origin-left rounded-full"
                    style={{ background: "linear-gradient(to right, var(--color-signature), color-mix(in oklab, var(--color-signature) 25%, transparent))" }}
                  />
                </span>
                .
              </h1>

              <p className="mt-5 max-w-[500px] text-[clamp(1rem,1.25vw,1.12rem)] leading-relaxed text-[var(--color-muted)]">
                Animated React components and complete workflows, delivered as editable source through a shadcn-compatible registry. Your application owns the state.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/getting-started"
                  className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-[15px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] sm:w-auto"
                >
                  Get started
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
                    <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/components"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] px-6 text-[15px] font-semibold text-[var(--color-fg)] backdrop-blur transition-colors hover:border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-border))] hover:bg-[var(--color-bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] sm:w-auto"
                >
                  Browse components
                </Link>
              </div>
            </div>

            {/* Right — live product panel (truthful proof + one real component) */}
            <div className="relative w-full">
              {/* soft radial light behind the panel */}
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl"
                style={{ background: "radial-gradient(60% 60% at 60% 30%, color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 70%)" }}
              />
              <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-lg)] sm:p-5">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px"
                  style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 55%, transparent), transparent)" }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">What ships today</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-70 motion-reduce:hidden" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                    </span>
                    Live
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-3">
                  <ProofStat value={`${componentTotal}`} label="released components" />
                  <ProofStat value={`${packs.length}`} label="complete workflow packs" />
                </div>

                {/* one real component, live — footer controls hidden so it reads
                    as a preview, not an interactive surface */}
                <div className="mt-3.5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden /> AI Response Stream
                    <span className="ml-auto font-medium normal-case tracking-normal text-[var(--color-accent-text)]">Free</span>
                  </div>
                  <div className="[&_footer]:hidden [&_p]:text-[13.5px]">
                    <AiResponseStream segments={HERO_STREAM_SEGMENTS} state="streaming" assistantName="Atlas" />
                  </div>
                </div>

                <div className="mt-3.5 flex flex-col gap-2.5">
                  <ProofLine>Editable source</ProofLine>
                  <ProofLine>Reduced-motion support</ProofLine>
                </div>
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

      {/* ===== 2 · Product differentiation — restrained, informative band ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, var(--color-border-strong), transparent)" }} />
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Why this library</p>
          <h2 className="mt-2 max-w-2xl text-[clamp(1.5rem,3vw,2.1rem)] font-semibold tracking-tight text-[var(--color-fg)]">
            A motion system for real products - not a pile of effects.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d, i) => {
              // Azure carries the icons; exactly ONE proof point (accessibility)
              // is the Coral signature moment of this section.
              const sig = i === 2;
              return (
              <div key={d.t} className="flex flex-col gap-2.5">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ring-inset ${
                    sig
                      ? "bg-[var(--color-signature-soft)] text-[var(--color-signature-text)] ring-[color-mix(in_oklab,var(--color-signature)_28%,transparent)]"
                      : "bg-[var(--color-accent-soft)] text-[var(--color-accent-text)] ring-[color-mix(in_oklab,var(--color-accent)_22%,transparent)]"
                  }`}
                >
                  <PropIcon path={d.icon} />
                </span>
                <h3 className="text-[15.5px] font-semibold text-[var(--color-fg)]">{d.t}</h3>
                <p className="text-[13.5px] leading-relaxed text-[var(--color-muted)]">{d.d}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 3 · Featured components — editorial showcase on the page base ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">The catalog</p>
            <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Featured components</h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">Six of the catalog’s strongest - each preview is the real component in one representative state.</p>
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

      {/* ===== 3.5 · Product environments — animated backgrounds driven by app
              state + one editable workflow hero. A controlled selection (four of
              ten), each lazy-mounted and offscreen-paused so nothing autoplays
              off-screen. ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Product environments</p>
            <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Backgrounds that carry product state</h2>
            <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]">
              Animated backgrounds driven by your application state, and editable hero blocks that demonstrate a real
              workflow - foreground-safe, reduced-motion-safe, and never just decoration.
            </p>
          </div>
          <Link href="/components?category=product-backgrounds" className="shrink-0 text-[14px] font-semibold text-[var(--color-accent-text)] hover:underline">
            All environments →
          </Link>
        </div>
        {productEnvLead ? (
          <div className="group relative mb-5 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-border))] hover:shadow-[var(--shadow-md)]">
            <LazyPreview label={`${productEnvLead.name} preview`} minHeightClass="min-h-[420px]">
              <div className="relative w-full bg-[var(--color-bg)]">
                <RuntimeSignalMapHeroPreview />
              </div>
            </LazyPreview>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--color-border)] px-6 py-4">
              <h3 className="text-[17px] font-semibold tracking-tight text-[var(--color-fg)]">
                <Link href={productEnvLead.documentationPath} className="outline-none after:absolute after:inset-0 hover:text-[var(--color-accent-text)]">
                  {productEnvLead.name}
                </Link>
              </h3>
              <FeaturedPill featured={productEnvLead.featured} />
              <span className="ml-auto inline-flex items-center gap-1 text-[13.5px] font-medium text-[var(--color-accent-text)]">
                Open component →
              </span>
            </div>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productEnvCards.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* ===== 4 · Workflow categories — vibrant but controlled, warm sand band ===== */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)]" />
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">By workflow</p>
              <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Built for real workflows</h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">Eight product families - each with its own accent - pick a surface, preview it live, install what you need.</p>
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
        </div>
      </section>

      {/* ===== 5 · Complete packs — productized, azure-lit elevated band ===== */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[var(--color-bg-elevated)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: "radial-gradient(55% 55% at 88% -5%, var(--color-spotlight), transparent 62%)" }} />
        {/* subtle azure edge-light across the top of the band */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px" style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 40%, transparent), transparent)" }} />
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              {/* the one small Coral commercial highlight in this section */}
              <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signature)]" aria-hidden />
                Ship faster
              </p>
              <h2 className="mt-2 text-[clamp(1.8rem,3.4vw,2.7rem)] font-semibold tracking-tight text-[var(--color-fg)]">Complete workflow packs</h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">Finished product outcomes - four components composed into one installable, app-controlled block.</p>
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
        </div>
      </section>

      {/* ===== 6 · What you get (free & open) ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)]">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Editable source</p>
            <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--color-fg)]">Components you own</h3>
            <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--color-muted)]">
              Every component installs as real source into your repo via the shadcn CLI - animated shadcn primitives, text effects, icons, and workflow surfaces. Edit anything; your app owns the state, with full accessibility and reduced motion built in.
            </p>
            <div className="mt-6 flex-1" />
            <Link
              href="/components"
              className="inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-3 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
            >
              Browse components →
            </Link>
          </div>
          <div className="relative flex flex-col overflow-hidden rounded-3xl border border-[color-mix(in_oklab,var(--color-accent)_40%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_8%,var(--color-surface))] p-8 shadow-[var(--shadow-md)]">
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 90% at 100% 0%, var(--color-card-glow), transparent 62%)" }} />
            <div className="relative flex flex-1 flex-col">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Complete workflows</p>
              <h3 className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--color-fg)]">Full blocks &amp; packs</h3>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-[var(--color-muted)]">
                Composed workflow blocks and packs install in a single command - dashboards, AI interfaces, and more, assembled from the same accessible components. Free and open, every one.
              </p>
              <div className="mt-6 flex-1" />
              <Link
                href="/packs"
                className="inline-flex w-fit items-center gap-1 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-[15px] font-semibold text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Explore packs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sponsors — the catalog is free; supporters fund the upkeep.
              Logo slots stay as "your logo here" invites until real sponsors
              land, so the section is honest when empty. ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-sm)] sm:p-10">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 100% 0%, var(--color-card-glow), transparent 62%)" }} />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Sponsors</p>
              <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
                Free forever — kept alive by sponsors
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
                The entire catalog is free and open source. Sponsorship funds the unglamorous work that keeps it shippable — accessibility reviews, cross-browser testing, registry hosting, and docs. Support once, or back {product.shortName} monthly.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={product.sponsorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-[15px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  Sponsor {product.shortName} →
                </a>
                <a
                  href={`${product.githubUrl}/blob/main/SPONSORS.md`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-3 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)]"
                >
                  See sponsors
                </a>
              </div>
            </div>
            <ul className="grid w-full shrink-0 grid-cols-2 gap-3 md:w-[320px]" aria-label="Sponsor tiers">
              {[
                { name: "Gold Sponsor", price: "$100/mo" },
                { name: "Sponsor", price: "$25/mo" },
                { name: "Backer", price: "$10/mo" },
                { name: "Supporter", price: "$5/mo" },
              ].map((t) => (
                <li
                  key={t.name}
                  className="flex flex-col rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4 text-center"
                >
                  <span className="text-[13.5px] font-semibold text-[var(--color-fg)]">{t.name}</span>
                  <span className="mt-0.5 text-[12.5px] text-[var(--color-muted)]">{t.price}</span>
                  <span className="mt-2 text-[11.5px] text-[var(--color-muted)]">Your logo here</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== 7 · Final CTA — a deep-ink azure-lit panel that speaks the hero's
              visual language (strong neutral surface + azure/cyan lighting + one
              small Coral detail). Theme-aware, not a disconnected bright rectangle. ===== */}
      <section className="mx-auto max-w-[1440px] px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border-strong)] bg-[var(--color-surface-strong)] px-6 py-16 text-center shadow-[var(--shadow-lg)] sm:px-12">
          {/* azure spotlight + cyan counter-glow — the hero's lighting, echoed */}
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 100% at 50% -15%, var(--color-spotlight), transparent 60%)" }} />
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(50% 60% at 92% 8%, var(--color-secondary-accent-soft), transparent 62%)" }} />
          {/* azure top edge-light */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 55%, transparent), transparent)" }} />
          {/* faint dot lattice masked toward the top, like the hero */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-fg) 8%, transparent) 1px, transparent 0)", backgroundSize: "28px 28px", WebkitMaskImage: "radial-gradient(120% 85% at 50% 0%, #000, transparent 65%)", maskImage: "radial-gradient(120% 85% at 50% 0%, #000, transparent 65%)" }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-[var(--color-fg-secondary)] shadow-[var(--shadow-sm)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signature)]" aria-hidden />
              Start today
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-semibold tracking-tight text-[var(--color-fg)]">
              Ship product motion today.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] leading-relaxed text-[var(--color-muted)]">
              Browse the catalog, preview every component live, and install the ones you want as editable source.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/getting-started"
                className="rounded-xl bg-[var(--color-accent)] px-6 py-3 text-[15px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-strong)]"
              >
                Get started
              </Link>
              <Link
                href="/components"
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-3 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-strong)]"
              >
                Browse components
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
