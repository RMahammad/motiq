# 58 — Homepage preview alignment, content-fit heights & grid balance

> **Type:** 🟡 Implementation record · 2026-07-15 · Builds on [`docs/55`](55-catalog-preview-rehabilitation.md)/[`docs/56`](56-product-ui-stabilization.md)/[`docs/57`](57-grid-placement-and-mobile-fixes.md).
> Scope: kill the "unfinished technical-demo grid" feel on the homepage — previews floated in the middle of tall cards, oversized empty regions, full components crammed into 1/3 columns, and a full-bleed category card with horizontal voids. **No new components. Inventory frozen.**

## 1. Alignment — top-anchor by content family, not by size

`CatalogStage` (`apps/docs/app/_components/catalog-stage.tsx`) previously derived vertical anchoring from **preview size** (small/standard/mobile centered). That vertically centered every functional preview — forms, workflows, lists, tables, security, messaging, commerce, files — leaving empty bands above *and* below and making content "start too low".

**Fix:** anchoring is now a function of **`stageFamily`**. Only intentionally-centered surfaces center vertically:

```
const CENTER_FAMILIES = new Set(["editorial", "creative"]); // headline text + decorative cards
const topAnchored = !(ambient || CENTER_FAMILIES.has(family));
```

Everything else (ai, console, collab, data, commerce, security, productivity, mobile, neutral) is **top-anchored** — content starts under a consistent top padding. Ambient backgrounds keep their own full-bleed branch.

## 2. Height — fit content between a floor and a cap (no fixed heights)

Fixed `h-[Npx]` stages left large empty regions whenever a compact preview sat in a tall box. Stages now **size to content + padding**, bounded by a per-size `min`/`max`:

| size | min | max |
| --- | --- | --- |
| small | 200 | 300 |
| standard | 220 | 380 |
| wide | 260 | 460 |
| full | 320 | 520 |
| mobile | 480 | 580 (device frame) |
| ambient | 360 | 380 (fixed, full-bleed) |

`min` is only a floor for genuinely tiny content (a lone button/icon); a normal preview stays under it, so no empty band appears. `max` crops tall workflows (Kanban, timelines, long threads) honestly — the bottom crop-fade shows **only** on top-anchored `wide`/`full` stages that actually overflow, never on short content fading into empty space. Grid rows use `items-start` so content-fit cards don't stretch to a neighbour.

**Verified (1440, Popular grid):** Deployment Pipeline 261px box / 213 content / 0 empty; Live Presence 220 / 161 / 11; File Upload 460 (cap) / 447 / honest crop; Passkey 452 / 404 / 0.

## 3. Grid composition

- **Popular components** (homepage) now uses the shared 12-column **`packSpans`** packer + `SPAN_CLASS` (hoisted from `catalog-browser.tsx` into `lib/catalog.ts`, so the homepage and the components browser share one implementation). Large components (Kanban, Kinetic — span 12) take the full row; the rest pair as 6/6. No full component crammed into a 1/3 column.
- **Category showcase** feature card is now a width-filling **split** — the representative preview beside a category intro (label, blurb, count, "Explore →") — so the full-bleed row never shows the horizontal voids a single centered narrow preview left. The other 14 cards are compact, top-anchored, content-fit, with a consistent header divider between preview and label.

## Verified
- Typecheck clean; `/components` packed grid renders (shared packer); no page-level horizontal scroll at 320 (only code blocks scroll inside their own `overflow-x:auto`).
- Light + dark + mobile (390/320) checked for hero, category and Popular sections.

## Not changed / follow-ups
- The category showcase remains a 15-card browse aid (long but polished); it is a nav aid, not the product proof.
- Homepage still mounts many live previews; `LazyPreview` defers them, but a dense scroll can still be work-heavy. Converting decorative category thumbnails to lighter representations is a possible future perf pass (out of scope here).
