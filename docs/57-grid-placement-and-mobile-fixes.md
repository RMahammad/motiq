# 57 — Grid placement + mobile preview fixes (production pass)

> **Type:** 🟡 Implementation record · 2026-07-15 · Builds on [`docs/55`](55-catalog-preview-rehabilitation.md)/[`docs/56`](56-product-ui-stabilization.md).
> Scope: eliminate grid-placement holes, give large components full width, fix mobile-preview width. **No new components. Inventory frozen. No Batch 9.**

## Grid placement (the "8/12 alone, empty 4/12" bug)

**Root cause:** a `col-span-8` card followed by a `col-span-6` card can't share a 12-col row (8+6=14), so the 8 sat alone leaving a 4-col hole; other span pairings left similar accidental holes.

**Fix (two parts):**
1. **Span policy** (`resolvePresentation`, `lib/catalog.ts`): the catalog uses only **4 / 6 / 12** spans. Any computed span of `8` collapses to `6` (pairs cleanly as 6+6). Spatial / large-table / large-workflow / block / ambient items are `12` (full width) via explicit overrides — Kanban, Task Dependency Map, Project Timeline, Streaming Data Rows, blocks, packs, backgrounds, signature text.
2. **Row packer** (`packSpans` in `catalog-browser.tsx`): greedy first-fit into 12-col rows; leftover columns are distributed to the smallest item(s) in each row so **every row sums to exactly 12**. Full (12) items always take their own row. Because inputs are 4/6/12, outputs are only ever 4, 6, or 12 → the existing static responsive classes still apply. Both grouped (per-category) and flat (search/recent) grids pack independently.

**Verified:** Playwright row-gap detector — **0 hole rows** across all 15 category grids and the flat "recent" view (34 rows).

Responsive: mobile → 1 col; tablet (`sm`) → 2-up for small/standard, full-width for `12` items; desktop (`lg`) → packed spans.

## Mobile preview width

**Root cause:** the detail `PreviewStage` used `px-6` (24px each side); at a 375px viewport a mobile component rendered at only ~259px, forcing aggressive truncation (sender names shown as "A…").

**Fix:** stage padding is now `px-2 sm:px-6` — mobile components render at ~291px (was 259) with far less truncation; full desktop padding preserved. Benefits every detail preview on small screens.

## Mobile interaction components (§4) — verified at 320

- **Keyboard-safe Form:** full-width fields, visible Cancel/Add buttons, no overflow.
- **Swipe Action Row:** readable rows ("Ada Lo…", "Kit Marlo…"), kebab overflow menu gives swipe-free action access, no overflow.
- **Mobile Filter Sheet:** header + close visible; Status/Category groups scroll; **sticky Reset/Cancel/Apply footer fully visible (bottom 641 < 700)**; active chips don't overflow.

## Remaining (Moderate)
- At 320px, inbox/product rows still truncate long content — normal, correct mobile behaviour at that width (not a defect).
- Lone wide-workflow cards at a category tail render full-width (12) with centered content (generous padding, not a hole).
- Full per-component 200%-zoom + keyboard-interaction matrix is partial (no Critical/Major outstanding).
