import type { ReactNode } from "react";
import Link from "next/link";

import { product } from "../lib/product";
import { absoluteUrl } from "../lib/seo";
import { AiResponseStream, type ResponseSegment } from "@/registry/ai/ai-response-stream";
import { categories, categoryCount, bySlug, SPAN_CLASS, componentItems, blockItems, type CatalogItem, type CardSpan, type Category, type CategoryId } from "../lib/catalog";
import { packs, type Pack } from "../lib/packs";
import { statusLabel } from "../lib/commerce";
import { fundingConfig } from "../lib/funding";
import { installCommand } from "../lib/product";
import {
  AmbientScene,
  CollaborationScene,
  DeveloperScene,
  FileScene,
  HeroBlockScene,
  ProductivityScene,
  SecurityScene,
  TextScene,
} from "./_components/category-scenes";
import { FundingPipeline } from "./_components/funding-pipeline";
import { StarButton } from "./_components/github-star";
import { GoldSponsors } from "./_components/gold-sponsors";
import { InstallChip } from "./_components/install-chip";
import { HeroShowcase } from "./_components/hero-showcase";
import { Reveal } from "./_components/reveal";
import { PageView } from "./_components/page-view";
import { MediaGalleryHero } from "./_components/media-gallery-hero";

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
/* Per-category identity — one accent + one glyph for every catalog category.
   Single source of truth: the showcase cards above and the browse index below
   both read from it, so a category looks the same wherever it appears. Accents
   stay inside the brand-adjacent range (azure / cyan / teal / emerald / sky /
   indigo / amber / coral / slate); purple is retired. */
const CATEGORY_META: Record<CategoryId, { c: string; icon: string }> = {
  ai: { c: "#4f7cff", icon: "M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3zM18 15l.9 2.3L21 18l-2.1.7L18 21l-.9-2.3L15 18l2.1-.7z" },
  "developer-tools": { c: "#3e5ae8", icon: "M5 6l6 6-6 6M13 18h6" },
  collaboration: { c: "#22c7d9", icon: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 10-2-5.2M15.5 14.5A6 6 0 0121 20" },
  "data-motion": { c: "#14b8a6", icon: "M5 20V11M12 20V4M19 20v-6" },
  mobile: { c: "#0ea5e9", icon: "M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2" },
  file: { c: "#38bdf8", icon: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h4" },
  commerce: { c: "#10b981", icon: "M4 6h15l-1.6 8.5a2 2 0 01-2 1.6H8.6a2 2 0 01-2-1.7L4.7 4.6A1 1 0 003.7 4H2M8 20a1 1 0 100-2 1 1 0 000 2zM17 20a1 1 0 100-2 1 1 0 000 2z" },
  security: { c: "#6366f1", icon: "M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6zM9 12l2 2 4-4" },
  communication: { c: "#2dd4bf", icon: "M4 5h16v10H9l-5 4V5zM8 10h.01M12 10h.01M16 10h.01" },
  productivity: { c: "#f59e0b", icon: "M4 4h5v16H4zM10 4h4v10h-4zM15 4h5v7h-5z" },
  text: { c: "#e0b341", icon: "M4 7V5h16v2M12 5v14M9 19h6" },
  creative: { c: "#fb7185", icon: "M4 5h16v6H4zM4 14h10v5H4zM16 14h4v5h-4z" },
  cursor: { c: "#f59e0b", icon: "M5 3l14 8-6 1.5L9.5 19z" },
  media: { c: "#22c7d9", icon: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9.5a1 1 0 100-2 1 1 0 000 2z" },
  scroll: { c: "#6366f1", icon: "M12 4v13M7 12l5 5 5-5M5 20h14" },
  backgrounds: { c: "#ff6b5e", icon: "M3 11c3-4 6-4 9 0s6 4 9 0M3 16c3-4 6-4 9 0s6 4 9 0M3 6c3-4 6-4 9 0s6 4 9 0" },
  "product-backgrounds": { c: "#4f7cff", icon: "M5 7l7 5 7-5M5 17l7-5 7 5M5 7v10M19 7v10" },
  "workflow-heroes": { c: "#22c7d9", icon: "M4 5h16v6H4zM4 14h7v5H4zM13 14h7v5h-7z" },
  "animated-shadcn": { c: "#94a3b8", icon: "M4 4h16v16H4zM4 10h16M10 10v10" },
  icons: { c: "#f6b94a", icon: "M12 3l2.2 5.3L20 10l-5.8 1.7L12 17l-2.2-5.3L4 10l5.8-1.7z" },
};

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

/* ---- Shared section header (docs/61) — keyline eyebrow + balanced title on
        the left, one quiet bordered CTA button bottom-aligned on the right. ---- */
function SectionHead({
  eyebrow,
  signature,
  title,
  desc,
  href,
  cta,
}: {
  eyebrow: string;
  /** Coral keyline for the one commercial "ship faster" moment. */
  signature?: boolean;
  title: string;
  desc: ReactNode;
  href: string;
  cta: string;
}) {
  const tone = signature ? "text-[var(--color-signature-text)]" : "text-[var(--color-accent-text)]";
  const line = signature ? "bg-[var(--color-signature)]" : "bg-[var(--color-accent)]";
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-[660px]">
        <p className={`inline-flex items-center gap-2.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
          <span aria-hidden className={`h-[1.5px] w-[22px] rounded-full ${line}`} />
          {eyebrow}
        </p>
        <h2 className="mt-3 text-balance text-[clamp(1.8rem,3.4vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.023em] text-[var(--color-fg)]">
          {title}
        </h2>
        <p className="mt-3.5 max-w-[58ch] text-[15.5px] leading-relaxed text-[var(--color-muted)]">{desc}</p>
      </div>
      <Link
        href={href}
        className="group inline-flex h-[42px] shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 text-[14px] font-semibold text-[var(--color-fg)] shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-hover)]"
      >
        {cta}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform duration-200 group-hover:translate-x-[3px]">
          <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}

/* ---- Section atmosphere — the hero's lit-studio language (azure spotlight,
        cyan counter-glow, edge-light, masked dot lattice), echoed per band. ---- */
function SectionAtmo({ dots, counter }: { dots?: boolean; counter?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0" style={{ background: "radial-gradient(48% 46% at 85% -6%, var(--color-spotlight), transparent 64%)" }} />
      {counter ? (
        <div className="absolute inset-0" style={{ background: "radial-gradient(36% 40% at 4% 100%, var(--color-secondary-accent-soft), transparent 60%)" }} />
      ) : null}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--color-accent) 42%, transparent), transparent)" }}
      />
      {dots ? (
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-fg) 7%, transparent) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            WebkitMaskImage: "radial-gradient(110% 70% at 80% 0%, #000, transparent 62%)",
            maskImage: "radial-gradient(110% 70% at 80% 0%, #000, transparent 62%)",
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Catalog category card (docs/61). The homepage sells CATEGORIES, not single
 * components: each card carries one simplified scene standing for that
 * category's work, its live component count, and links straight to the
 * filtered catalog. Full live previews live on the category and component
 * pages, where there is room to read them.
 * ------------------------------------------------------------------ */
type CategoryCardSpec = {
  cat: CategoryId;
  label: string;
  value: string;
  accent: string;
  scene: ReactNode;
  span?: CardSpan;
  /** Full-bleed scenes (backgrounds/heroes) skip the panel padding + lattice. */
  bleed?: boolean;
  minH?: string;
};

function CategoryCard({ cat, label, value, accent, scene, bleed, minH = "min-h-[250px]" }: CategoryCardSpec) {
  return (
    <Link
      href={categoryHref(cat)}
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--fam)_45%,var(--color-border))] hover:shadow-[var(--shadow-md)]"
      style={{ ["--fam" as string]: accent }}
    >
      <div
        className={`sheen relative flex-1 overflow-hidden border-b border-[var(--color-border)] ${minH} ${
          bleed ? "" : "grid place-items-center px-[26px] pb-[26px] pt-[30px]"
        }`}
        style={{
          background:
            "radial-gradient(100% 100% at 50% 0%, color-mix(in oklab, var(--fam) 9%, transparent), transparent 72%), var(--color-bg-elevated)",
        }}
      >
        {bleed ? null : (
          <span
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--color-fg) 8%, transparent) 1px, transparent 0)",
              backgroundSize: "20px 20px",
              WebkitMaskImage: "radial-gradient(90% 90% at 50% 0%, #000, transparent 82%)",
              maskImage: "radial-gradient(90% 90% at 50% 0%, #000, transparent 82%)",
            }}
          />
        )}
        {scene}
        <span
          className="absolute left-[15px] top-[15px] z-[3] inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums tracking-[0.04em]"
          style={{
            color: "var(--fam)",
            background: "color-mix(in oklab, var(--fam) 13%, var(--color-surface))",
            borderColor: "color-mix(in oklab, var(--fam) 32%, transparent)",
          }}
        >
          {categoryCount(cat)} components
        </span>
      </div>
      <div className="flex items-center gap-3.5 px-[19px] py-[17px]">
        <span className="min-w-0">
          <h3 className="text-[16.5px] font-semibold tracking-[-0.012em] text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent-text)]">
            {label}
          </h3>
          <p className="mt-0.5 truncate text-[13.5px] text-[var(--color-muted)]">{value}</p>
        </span>
        <span
          aria-hidden
          className="ml-auto grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-muted)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover:-rotate-45 group-hover:border-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-accent-fg)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * Browse-index card (docs/61 §index). The showcase above previews nine
 * categories at full size; this is the COMPLETE index — every category, in a
 * denser icon-led card so the two grids never read as the same thing. Cards
 * rise in on scroll and answer to hover: accent rail, lifting glyph, sheen,
 * and a chevron that slides out of the label.
 * ------------------------------------------------------------------ */
function CategoryIndexCard({ cat }: { cat: Category }) {
  const meta = CATEGORY_META[cat.id];
  return (
    <Link
      href={categoryHref(cat.id)}
      className="group sheen relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--fam)_50%,var(--color-border))] hover:shadow-[var(--shadow-md)]"
      style={{ ["--fam" as string]: meta.c }}
    >
      {/* accent rail draws in from the left on hover */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover:scale-x-100"
        style={{ background: "linear-gradient(to right, var(--fam), transparent)" }}
      />

      <span className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-xl transition-transform duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover:-translate-y-0.5 group-hover:scale-110"
          style={{
            color: "var(--fam)",
            background: "color-mix(in oklab, var(--fam) 14%, transparent)",
            border: "1px solid color-mix(in oklab, var(--fam) 30%, transparent)",
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path d={meta.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11.5px] font-bold tabular-nums transition-colors"
          style={{ color: "var(--fam)", background: "color-mix(in oklab, var(--fam) 13%, transparent)" }}
        >
          {categoryCount(cat.id)}
        </span>
      </span>

      <h3 className="mt-3.5 flex items-center gap-1 text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--color-fg)] transition-colors group-hover:text-[var(--fam)]">
        {cat.label}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="-translate-x-1 opacity-0 transition-all duration-300 [transition-timing-function:cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0 group-hover:opacity-100"
        >
          <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--color-muted)]">{cat.blurb}</p>
    </Link>
  );
}

/* One unified grid (docs/61 §catalog): every catalog family the homepage
   showcases, in bento order — 8+4 / 4+4+4 / 6+6 / 12. The interactive
   product-backgrounds lead card is rendered separately above these. */
const CATALOG_CARDS: CategoryCardSpec[] = [
  { cat: "developer-tools", label: "Developer console", value: "Pipelines, logs, inspectors, and environments.", accent: "#3e5ae8", span: 8, scene: <DeveloperScene /> },
  { cat: "collaboration", label: "Collaboration", value: "Presence, approvals, and activity.", accent: "#22c7d9", span: 4, scene: <CollaborationScene /> },
  { cat: "file", label: "File workflows", value: "Upload, queue, and processing.", accent: "#38bdf8", span: 4, scene: <FileScene /> },
  { cat: "security", label: "Security & accounts", value: "Passkeys, two-factor, and sessions.", accent: "#6366f1", span: 4, scene: <SecurityScene /> },
  { cat: "productivity", label: "Productivity", value: "Boards, timelines, and dependencies.", accent: "#f59e0b", span: 4, scene: <ProductivityScene /> },
  { cat: "workflow-heroes", label: "Workflow heroes", value: "Hero blocks around a real workflow.", accent: "#22c7d9", span: 6, scene: <HeroBlockScene />, bleed: true, minH: "min-h-[210px]" },
  { cat: "backgrounds", label: "Ambient backgrounds", value: "Quiet, performance-safe texture and light.", accent: "#ff6b5e", span: 6, scene: <AmbientScene />, bleed: true, minH: "min-h-[210px]" },
  { cat: "text", label: "Text animations", value: "Headline-grade reveals, scrambles, and loops.", accent: "#e0b341", span: 12, scene: <TextScene />, minH: "min-h-[240px]" },
];

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

/* ------------------------------------------------------------------ *
 * Pack card (docs/61) — a product shot of the composed block. A browser-frame
 * window renders the block's real workspace layout with its four components as
 * numbered regions, a legend maps numbers to component names, and the footer
 * carries the real one-command install. Identity first; no staircase list.
 * ------------------------------------------------------------------ */

type ShotArt = { c: string; icon: string; addr: string; grid: React.CSSProperties; blockNote: string };
const PACK_ART: Record<string, ShotArt> = {
  "ai-interface": {
    c: "#4f7cff",
    icon: "M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3zM18 15l.9 2.3L21 18l-2.1.7L18 21l-.9-2.3L15 18l2.1-.7z",
    addr: "yourapp.com/agent",
    grid: { gridTemplateColumns: "96px 1fr 92px", gridTemplateRows: "1fr 46px", gridTemplateAreas: '"ra rb rc" "ra rd rc"' },
    blockNote: "app-controlled state",
  },
  "developer-tools": {
    c: "#3e5ae8",
    icon: "M5 6l6 6-6 6M13 18h6",
    addr: "yourapp.com/deploys",
    grid: { gridTemplateColumns: "1.15fr 1fr", gridTemplateRows: "34px 56px 1fr", gridTemplateAreas: '"ra ra" "rb rb" "rc rd"' },
    blockNote: "provider-neutral",
  },
  collaboration: {
    c: "#22c7d9",
    icon: "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20a6 6 0 0112 0M17 11a3 3 0 10-2-5.2M15.5 14.5A6 6 0 0121 20",
    addr: "yourapp.com/reviews/128",
    grid: { gridTemplateColumns: "1fr 108px", gridTemplateRows: "36px 1fr 42px", gridTemplateAreas: '"ra ra" "rc rb" "rd rb"' },
    blockNote: "your users & permissions",
  },
  "data-motion": {
    c: "#14b8a6",
    icon: "M5 20V11M12 20V4M19 20v-6",
    addr: "yourapp.com/ops",
    grid: { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "58px 34px 1fr", gridTemplateAreas: '"ra ra" "rb rc" "rd rd"' },
    blockNote: "no charting library",
  },
};

/* Skeleton atoms for the window regions. `Ln` renders `[data-ln]` so the
   pack-type / pack-logs / pack-rows loops in globals.css can address lines. */
function Ln({ w, dim, fam, ml }: { w: string; dim?: boolean; fam?: boolean; ml?: string }) {
  return (
    <div
      data-ln
      className="mb-[5px] h-[5px] rounded-[4px] last:mb-0"
      style={{
        width: w,
        marginLeft: ml,
        background: fam
          ? "color-mix(in oklab, var(--fam) 45%, transparent)"
          : dim
            ? "color-mix(in oklab, var(--color-fg) 7%, transparent)"
            : "color-mix(in oklab, var(--color-fg) 13%, transparent)",
      }}
    />
  );
}
function MPill({ w, h = 12, on, round, className, style }: { w: number | string; h?: number; on?: boolean; round?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: w,
        height: h,
        borderRadius: round ? "50%" : 99,
        background: on ? "color-mix(in oklab, var(--fam) 45%, transparent)" : "color-mix(in oklab, var(--color-fg) 9%, transparent)",
        ...style,
      }}
    />
  );
}
function ShotRegion({ area, n, label, children, className }: { area: string; n: number; label: string; children?: ReactNode; className?: string }) {
  return (
    <div
      className={`relative min-h-0 min-w-0 overflow-hidden rounded-[9px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 pb-2 pt-6 ${className ?? ""}`}
      style={{ gridArea: area }}
    >
      <span
        className="absolute left-[7px] top-[6px] inline-flex max-w-[calc(100%-14px)] items-center gap-[5px] rounded-[5px] px-1.5 py-[2px] text-[8.5px] font-bold uppercase tracking-[0.05em]"
        style={{ color: "var(--fam)", background: "color-mix(in oklab, var(--fam) 13%, transparent)" }}
      >
        <span aria-hidden className="grid h-[11px] w-[11px] shrink-0 place-items-center rounded-[4px] text-[8px]" style={{ background: "var(--fam)", color: "var(--color-bg)" }}>
          {n}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {children}
    </div>
  );
}

/* Per-pack window interior — the block's real workspace layout, abstracted. */
function PackShotRegions({ slug }: { slug: string }) {
  switch (slug) {
    case "ai-interface":
      return (
        <>
          <ShotRegion area="ra" n={1} label="Runs">
            <MPill w="80%" h={10} on style={{ borderRadius: 6 }} />
            <div className="mt-[6px]">
              <Ln w="70%" dim /><Ln w="85%" dim /><Ln w="60%" dim /><Ln w="75%" dim />
            </div>
          </ShotRegion>
          <ShotRegion area="rb" n={3} label="Answer" className="pack-type">
            <Ln w="92%" /><Ln w="84%" /><Ln w="95%" /><Ln w="70%" /><Ln w="40%" fam />
          </ShotRegion>
          <ShotRegion area="rc" n={4} label="Sources">
            <MPill w="100%" h={16} style={{ borderRadius: 5 }} />
            <MPill w="100%" h={16} style={{ borderRadius: 5, marginTop: 5 }} />
            <MPill w="100%" h={16} on style={{ borderRadius: 5, marginTop: 5 }} />
          </ShotRegion>
          <ShotRegion area="rd" n={2} label="Tools">
            <div className="flex flex-wrap gap-1">
              <MPill w={56} on /><MPill w={44} /><MPill w={62} />
            </div>
          </ShotRegion>
        </>
      );
    case "developer-tools":
      return (
        <>
          <ShotRegion area="ra" n={1} label="Environments">
            <div className="absolute right-[9px] top-[5px] flex gap-1">
              <MPill w={52} /><MPill w={64} on /><MPill w={46} />
            </div>
          </ShotRegion>
          <ShotRegion area="rb" n={2} label="Pipeline">
            <div className="mt-[3px] flex items-center gap-1">
              <MPill w="15%" h={14} on style={{ borderRadius: 5 }} />
              <MPill w="15%" h={14} on style={{ borderRadius: 5 }} />
              <MPill w="15%" h={14} on className="pack-blink" style={{ borderRadius: 5 }} />
              <MPill w="15%" h={14} style={{ borderRadius: 5 }} />
              <MPill w="15%" h={14} style={{ borderRadius: 5 }} />
            </div>
          </ShotRegion>
          <ShotRegion area="rc" n={3} label="Live logs" className="pack-logs">
            <Ln w="90%" dim /><Ln w="74%" dim /><Ln w="86%" dim /><Ln w="64%" fam />
          </ShotRegion>
          <ShotRegion area="rd" n={4} label="Inspector">
            <div className="mb-[5px] flex gap-1">
              <MPill w={38} h={11} on /><MPill w={30} h={11} />
            </div>
            <Ln w="88%" dim /><Ln w="66%" dim />
          </ShotRegion>
        </>
      );
    case "collaboration":
      return (
        <>
          <ShotRegion area="ra" n={1} label="Presence">
            <div className="absolute right-[9px] top-[5px] flex gap-1">
              <MPill w={14} h={14} on round />
              <MPill w={14} h={14} on round style={{ opacity: 0.7 }} />
              <MPill w={14} h={14} round />
              <MPill w={28} h={14} />
            </div>
          </ShotRegion>
          <ShotRegion area="rc" n={3} label="Comments">
            <Ln w="85%" /><Ln w="65%" dim /><Ln w="78%" dim ml="14px" /><Ln w="52%" fam ml="14px" />
          </ShotRegion>
          <ShotRegion area="rb" n={2} label="Approvals">
            <MPill w="100%" h={18} on style={{ borderRadius: 6 }} />
            <MPill w="100%" h={18} style={{ borderRadius: 6, marginTop: 5 }} />
            <MPill w="100%" h={18} style={{ borderRadius: 6, marginTop: 5 }} />
          </ShotRegion>
          <ShotRegion area="rd" n={4} label="Activity" className="pack-rows">
            <Ln w="80%" dim />
          </ShotRegion>
        </>
      );
    default: // data-motion
      return (
        <>
          <ShotRegion area="ra" n={1} label="KPIs">
            <div className="flex gap-[5px]">
              {["24.8k", "99.98%", "312ms", "$41.2k"].map((v) => (
                <span key={v} className="flex-1 rounded-[6px] px-[6px] py-[5px]" style={{ background: "color-mix(in oklab, var(--color-fg) 6%, transparent)" }}>
                  <span className="block text-[10px] font-bold tabular-nums text-[var(--color-fg-secondary)]">{v}</span>
                  <span className="mt-[3px] block h-[3.5px] w-[70%] rounded-[3px]" style={{ background: "color-mix(in oklab, var(--color-fg) 10%, transparent)" }} />
                </span>
              ))}
            </div>
          </ShotRegion>
          <ShotRegion area="rb" n={2} label="Refresh">
            <MPill w={52} h={12} on className="pack-blink" style={{ position: "absolute", right: 9, top: 6 }} />
          </ShotRegion>
          <ShotRegion area="rc" n={3} label="Filters">
            <div className="absolute right-[9px] top-[6px] flex gap-1">
              <MPill w={40} on /><MPill w={34} />
            </div>
          </ShotRegion>
          <ShotRegion area="rd" n={4} label="Streaming rows" className="pack-rows">
            <Ln w="96%" /><Ln w="96%" dim /><Ln w="96%" dim /><Ln w="80%" dim />
          </ShotRegion>
        </>
      );
  }
}

function PackCard({ p }: { p: Pack }) {
  const comps = p.components.map((s) => bySlug.get(s)).filter(Boolean) as CatalogItem[];
  const art = PACK_ART[p.slug] ?? PACK_ART["ai-interface"];
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--fam)_46%,var(--color-border))] hover:shadow-[var(--shadow-md)]"
      style={{ ["--fam" as string]: art.c }}
    >
      {/* family hairline across the top */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 z-10 h-[2px]"
        style={{ background: "linear-gradient(to right, transparent, color-mix(in oklab, var(--fam) 72%, transparent), transparent)" }}
      />

      <div className="flex items-center gap-3.5 px-[26px] pt-6">
        <span
          aria-hidden
          className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px]"
          style={{
            color: "var(--fam)",
            background: "color-mix(in oklab, var(--fam) 14%, var(--color-surface))",
            border: "1px solid color-mix(in oklab, var(--fam) 35%, transparent)",
          }}
        >
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <path d={art.icon} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0">
          <h3 className="text-[20px] font-semibold tracking-[-0.016em] text-[var(--color-fg)]">
            <Link href={`/packs/${p.slug}`} className="outline-none hover:text-[var(--color-accent-text)]">
              {p.name}
            </Link>
          </h3>
          <span className="block truncate text-[12.5px] text-[var(--color-subtle)]">Installs the {p.blockName} block</span>
        </span>
        <span
          className="ml-auto shrink-0 rounded-full px-3 py-[4.5px] text-[11.5px] font-semibold"
          style={{ color: "var(--fam)", background: "color-mix(in oklab, var(--fam) 12%, transparent)" }}
        >
          {comps.length} components
        </span>
      </div>

      <p className="mt-3 px-[26px] text-[14px] leading-relaxed text-[var(--color-muted)]">{p.tagline}</p>

      {/* the block, as a product shot */}
      <div className="relative mx-[26px] mt-[18px]" aria-hidden>
        <span
          className="pointer-events-none absolute -inset-3.5 rounded-[20px]"
          style={{ background: "radial-gradient(70% 60% at 50% 20%, color-mix(in oklab, var(--fam) 13%, transparent), transparent 72%)" }}
        />
        <div className="relative overflow-hidden rounded-[15px] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)]">
          <div className="flex h-[30px] items-center border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_65%,var(--color-bg-elevated))] px-3">
            <span className="flex gap-[6px]">
              <i className="h-2 w-2 rounded-full bg-[var(--color-surface-strong)]" />
              <i className="h-2 w-2 rounded-full bg-[var(--color-surface-strong)]" />
              <i className="h-2 w-2 rounded-full bg-[var(--color-surface-strong)]" />
            </span>
            <span className="mx-auto rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-[2px] font-mono text-[9.5px] text-[var(--color-subtle)]">
              {art.addr}
            </span>
          </div>
          <div className="grid h-[208px] gap-[7px] p-[9px]" style={art.grid}>
            <PackShotRegions slug={p.slug} />
          </div>
        </div>
      </div>

      {/* legend — numbers → real component names */}
      <div className="mt-3.5 flex flex-wrap gap-1.5 px-[26px]">
        {comps.map((c, i) => (
          <span
            key={c.id}
            className="inline-flex items-center gap-[7px] rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-[5px] pl-[6px] pr-3 text-[12px] font-semibold text-[var(--color-fg-secondary)]"
          >
            <span
              aria-hidden
              className="grid h-[17px] w-[17px] place-items-center rounded-full text-[9.5px] font-bold"
              style={{ background: "color-mix(in oklab, var(--fam) 80%, var(--color-fg))", color: "var(--color-bg)" }}
            >
              {i + 1}
            </span>
            {c.name}
            {c.featured ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-label="Featured" style={{ color: "var(--fam)" }}>
                <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z" />
              </svg>
            ) : null}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-[var(--color-border)] px-[18px] pb-[18px] pt-[15px]">
        <InstallChip
          command={installCommand(p.packRegistryItem)}
          display={`${product.registryBaseUrl.replace(/^https?:\/\//, "")}/${p.packRegistryItem}`}
        />
        <Link
          href={`/packs/${p.slug}`}
          className="inline-flex h-10 shrink-0 items-center rounded-[11px] bg-[var(--color-accent)] px-[18px] text-[13.5px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          View pack
        </Link>
      </div>
    </div>
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
  const componentTotal = componentItems().length;
  const blockTotal = blockItems().length;

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
                <span className="text-[var(--color-muted)]">· Free &amp; open source ·</span>
                <Link href="/sponsor" className="text-[var(--color-muted)] underline-offset-2 hover:text-[var(--color-fg)] hover:underline">
                  Community supported
                </Link>
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

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                <StarButton source="hero" variant="outline" className="w-full sm:w-auto" />
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

                {/* Canonical formulation — the same three figures, counted the same
                    way, as the README, /sponsor, and the release notes. */}
                <div className="mt-3.5 grid grid-cols-3 gap-3">
                  <ProofStat value={`${componentTotal}`} label="released components" />
                  <ProofStat value={`${blockTotal}`} label="workflow blocks" />
                  <ProofStat value={`${packs.length}`} label="one-command packs" />
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

      {/* ===== 2.5 · Sponsorship — a wide two-column band: the ask on the left,
              a compact funding workflow (real component, communicates support
              moving toward a release) on the right. Full tier pricing lives on
              /sponsor only. ===== */}
      <section className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8" aria-label="Sponsorship">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 100% 0%, var(--color-card-glow), transparent 62%)" }} />
          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:p-10">
            <div className="max-w-xl">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-accent-text)]">Open source</p>
              <h2 className="mt-2 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-tight text-[var(--color-fg)]">
                Help keep {product.shortName} moving.
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--color-muted)]">
                Every component here is free and open source. Sponsorship funds new components, documentation,
                accessibility testing, and the long-term maintenance that keeps the catalog production-ready.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/sponsor"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-6 text-[15px] font-semibold text-[var(--color-accent-fg)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  Become a sponsor
                </Link>
                <a
                  href={fundingConfig.koFiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 text-[15px] font-semibold text-[var(--color-fg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
                >
                  Support on Ko-fi
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                How support becomes a release
              </p>
              <FundingPipeline compact />
            </div>
          </div>

          {/* Gold Sponsor logos — Ko-fi Gold tier promises prominent homepage
              placement. Empty-safe: renders nothing until a real Gold Sponsor exists. */}
          <GoldSponsors variant="strip" />
        </div>
      </section>

      {/* ===== 3 · The catalog, one unified animated grid (docs/61 §catalog).
              Formerly two sections ("Featured components" + "Backgrounds that
              carry product state"); merged so the page tells the catalog story
              once. Bento order: interactive lead → workflow surfaces →
              environments → the text finale. Cards rise in on scroll (Reveal),
              each scene carries one ambient loop, and hover adds lift + sheen. ===== */}
      <section className="relative isolate overflow-clip py-16 lg:py-[96px]">
        <SectionAtmo dots counter />
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="The catalog"
            title="Every surface your product ships"
            desc={`Workflow surfaces, animated environments, and text — ${categories.length} categories, each shown in one live state. Open a category to preview and install its ${componentTotal} components.`}
            href="/components"
            cta={`All ${categories.length} categories`}
          />

          <div className="grid grid-cols-12 items-stretch gap-5">
            {/* Lead card — the most kinetic surface in the catalog. */}
            <div className="col-span-12">
              <Reveal>
                <MediaGalleryHero count={categoryCount("media")} href={categoryHref("media")} />
              </Reveal>
            </div>

            {CATALOG_CARDS.map((c, i) => (
              <div key={c.cat} className={SPAN_CLASS[c.span ?? 4]}>
                {/* stagger resets per row so a wide card never delays the next row */}
                <Reveal delay={(i % 3) * 70} className="h-full">
                  <CategoryCard {...c} />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4 · Category index (docs/61). The showcase above presents six
              categories as full cards; repeating that card design here made the
              same names appear twice, so this is now the complete, compact
              browse surface — every category, one row of chips. ===== */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)]" />
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-[640px]">
              <p className="inline-flex items-center gap-2.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--color-accent-text)]">
                <span aria-hidden className="h-[1.5px] w-[22px] rounded-full bg-[var(--color-accent)]" />
                By workflow
              </p>
              <h2 className="mt-3 text-[clamp(1.5rem,2.6vw,2.05rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-fg)]">
                Built for real workflows
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
                Every category in the catalog — pick a surface, preview it live, install what you need.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={(i % 5) * 55} className="h-full">
                <CategoryIndexCard cat={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5 · Complete packs (docs/61) — product shots of the composed
              blocks, coral "ship faster" eyebrow, azure-lit band ===== */}
      <section className="relative isolate overflow-clip py-16 lg:py-[88px]">
        <SectionAtmo dots counter />
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <SectionHead
            eyebrow="Ship faster"
            signature
            title="Complete workflow packs"
            desc="Finished product outcomes — four components composed into one installable, app-controlled block. One command, editable source."
            href="/packs"
            cta="All packs"
          />
          <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
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
              <StarButton source="page" variant="outline" className="!border-[var(--color-border-strong)] !bg-[var(--color-surface)]" />
            </div>
            <p className="mt-5 text-[13px] text-[var(--color-muted)]">
              Motiq is free and MIT-licensed. If it saves you an afternoon, a star is the whole price.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
