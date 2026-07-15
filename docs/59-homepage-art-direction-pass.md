# 59 — Homepage art-direction & conversion pass

> **Type:** 🟡 Implementation record · 2026-07-15 · Builds on [`docs/58`](58-homepage-preview-alignment-and-height.md).
> Scope: turn the cleaner-but-documentation-like homepage into a modern, commercially-credible page with a clear visual story. **No new components. Inventory frozen.**

## Structure — seven distinct sections

The homepage (`apps/docs/app/page.tsx`) was rebuilt to a single narrative:

1. **Hero** — wider 44/56 copy·preview split (`items-start`, `lg:gap-10`), a balanced 4-line headline, two enlarged CTAs + a full wrapping install command (never truncated: `<wbr>` at slashes, Copy copies the complete `installCommand`). The preview is **one AI "Agent workspace" read top-to-bottom in five seconds**: header → short answer + one citation → a compact syntax-lit code well → one source row → a compact 3-chip run rail (Research ✓ · Draft ✓ · Cite ●). One surface with layered depth (hairline accent edge, restrained top light, gradient identity), accent reserved for the active step + citation; no separate sources panel, no competing side rail. Curated composition; the live AiResponseStream is featured in §3. (Superseded the earlier two-pane/side-rail hero, which combined too many concepts.)
2. **Product differentiation** — a distinct `bg-secondary` band, eyebrow + heading + four value props (state ownership, editable source, accessibility, composed blocks). Not a card grid.
3. **Featured components** — six of the strongest, span-packed (two 6/6 rows + two full-width **editorial split** cards for the complex Kanban/Kinetic). Lean cards: preview, name, one Access pill, one short line, single "Open component →". `items-start` so cards fit content.
4. **Workflow categories** — eight **bold family-colored covers** (gradient + glyph motif + name + count + value + Explore), a compact 4-up grid. Deliberately *not* live previews, so this section reads as a colored navigator — visually distinct from §3, and never a "dark dashboard grid".
5. **Complete packs** — four **product-offering** cards: a static layered "what's inside" composition (block + 4 numbered components with Free/Pro), outcome eyebrow, name, tagline, Free/Pro split + block name, and a solid **View pack** button.
6. **Free vs Pro** — two elevated cards, clear tier CTAs (Install the free registry / Request early access).
7. **Final CTA** — one focused closing band (Browse components / Explore packs).

### Removed / merged
- The old **15-card "Browse by category"** demo-grid (~3200px) → replaced by the 8 colored covers (~640px).
- The standalone **"Install the source, not a black box"** section → folded into the hero install + differentiation band.
- **Popular components** (repeated card grid) → became the leaner **Featured components** editorial grid.
- Clutter removed: kind badges, category-label rows, per-card install-copy buttons, two-line duplicate descriptions (now first-sentence only).

## Surfaces, color, typography
- Cards moved off flat near-black `--color-bg` onto elevated `--color-surface` / `--color-surface-raised` with `--shadow-sm/md/lg` — real separation and elevation hierarchy in both themes.
- Purple reliance reduced: category families each carry one controlled accent hue (violet / blue / amber / cyan / green / teal / orange / pink) on chrome only.
- Larger section headings (`clamp(1.8rem,3.4vw,2.7rem)`), shorter descriptions, fewer tiny gray metadata rows, stronger spacing rhythm.

## CTAs (fewer, stronger)
Browse components · Install the free registry · Explore packs · Request Pro access — repeated intentionally, no dead micro-links.

## Stage change (shared)
`CatalogStage` crop-fade now toggles on **measured overflow** (ResizeObserver), so a short top-anchored preview never fades into empty padding; only genuinely clipped workflows show the fade.

## Verified
- Typecheck clean; `/` and `/components` compile (200); console clean on a fresh server.
- Rendered dark + light at 1440; categories + hero at 320; packs at 768; featured full-width split confirmed activated.
- No page-level horizontal scroll at 320 (only code blocks scroll inside their own container).
- Page height ~6.5k px (was ~7.3k) with far less repetition and a clear visual story.

> ⚠️ Ops note: never `rm -rf .next` while the dev server is live — it corrupts Turbopack's persistent SST cache and throws phantom "defined multiple times" / Internal Server Error until the server is stopped and `.next` removed while down, then restarted.
