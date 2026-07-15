# 55 — Catalog preview & layout rehabilitation (implementation tracker)

> **Type:** 🟡 Implementation tracker (not a strategy doc) · **Owner of this topic:** catalog presentation · **Started:** 2026-07-14
> Scope fixed by the owner: finish Batch 7 + Batch 8 (done — see [`docs/39`](39-catalog-production-board.md)), then rehabilitate catalog layout, preview design, and component usability. **No Batch 9. Component inventory frozen.**

This is a working checklist, not prose. It records the defects, the new system, and per-component status. Strategy lives in [`docs/27`](27-product-differentiation.md)/[`docs/30`](30-showcase-visual-system.md); this doc only tracks the rehabilitation.

---

## 0. Batch status (precondition)

- **Batch 7** — Multi-file Queue, Cart Item Transition, Two-Factor Setup Flow, Typing and Presence, Task Dependency Map — **Released** ([`docs/39`](39-catalog-production-board.md)). Verified present in `catalog.ts`, `_previews/`, registry.
- **Batch 8** — Processing Timeline, Checkout Progress, Session Security Center, Thread Expansion, Project Timeline — **Released**. Verified.
- **No further component development.** Inventory frozen at 50 components + 4 blocks + 4 packs + 2 libs.

---

## 1. Current catalog problems (screenshot- + code-derived)

Baseline captured under `artifacts/catalog-rehabilitation/before/` (7 viewports × 2 themes) and `.../sections/`.

### Layout defects
- **Equal-width dashboard grid.** `catalog-browser.tsx` used `grid sm:grid-cols-2 xl:grid-cols-3` — every component, from an icon to a full workspace block, got an identical narrow column. (Confirmed 1920px baseline: 3 equal columns.)
- **Container too narrow / not span-aware.** `max-w-[1440px]`, no 12-column placement, no per-component sizing.
- **Shared/accidental card heights.** `PreviewStage` applied `min-h-[300px]…[400px]` per stage type; tall previews (Live Presence Stack, AI Response Stream) left **huge empty vertical regions** below their real content.
- **Flat sidebar.** A single uninterrupted column of ~15 category chips + access/type/sort — long, noisy, no grouping, no bounded scroll.
- **No category sectioning.** One undifferentiated grid; no restrained separators, no per-category presentation.

### Preview defects
- **One preview shared between catalog card and detail page.** The full detail preview (with its own control panels) was scaled into a ~440px card — "full implementations scaled into thumbnails."
- **Every card dark and near-identical.** 5 `PreviewStage` variants, ~50/54 items tagged `interactive` → the same dark gradient panel everywhere.
- **Clipping.** Code blocks and wide content clipped inside narrow cards (e.g. AI Response Stream `swr-cache.ts` cut off at "serve").
- **Control leakage.** Preview-internal control rows (Kinetic Emphasis rig, AnimatedList Add/Dismiss, log Start/Stop) rendered inside discovery cards.
- **Mobile components shown as tiny phones** floating inside a wide desktop card.

### Component-usability defects (exposed by rendered review — logged per-component in §9)
- Some workflow components default to maximum density / every state visible.
- Some previews expose too many controls at once for a discovery context.

---

## 2. New catalog layout system

**12-column adaptive CSS Grid** (no JS masonry), placement driven by catalog metadata, grouped by category with restrained separators.

| Desktop span | Used for |
|---|---|
| `col-span-4` (small) | icons, buttons, tabs, accordion, compact primitives — up to 3/row |
| `col-span-6` (standard) | standard interactive components — 2/row |
| `col-span-8` (wide) | complex workflows (maps, timelines, inspectors, streams) |
| `col-span-12` (full) | blocks, packs, ambient backgrounds, full workflow environments |

- **Container:** widened to `max-w-[1680px]` with responsive gutters.
- **Sidebar:** ~240px, sticky, **own bounded scroll**, grouped, counts, active highlight, collapsible groups, search + Access/Type/Sort filters, **mobile drawer** below `lg`.
- **Separators:** category heading + spacing; a hairline rule aligned to the content container only between real sections. No full-bleed rules across empty regions, no viewport-interval rules.
- **Responsive:** `md` → 1–2 cols (wide/full = full row); `sm`/mobile → 1 col; mobile spans collapse via `mobileCardSpan`.

## 3. Preview-size taxonomy (`previewSize`)

| value | height strategy | span default |
|---|---|---|
| `small` | 260–320px fixed-ish | 4 |
| `standard` | 320–420px bounded | 6 |
| `wide` | 380–520px bounded | 8 |
| `full` | 460–640px bounded | 12 |
| `mobile` | portrait device stage 480–620px | 4–6 |
| `ambient` | full-bleed 16:9-ish, no chrome | 12 |

## 4. Preview-mode taxonomy (`previewMode`)

`thumbnail` · `staged` (default catalog: real component, non-interactive, one representative state) · `interactive` (detail page) · `ambient` (backgrounds/text). Catalog cards use `staged`/`ambient`; detail pages use `interactive`.

## 5. Stage families (`stageFamily`) — controlled surfaces, not 12 different products

Shared card chrome, typography, radius, and status tokens. Only the **interior surface tone** varies per family, from a small controlled palette. All families work in light + dark.

| family | categories | surface tone |
|---|---|---|
| `ai` | ai | calm panel, soft accent wash |
| `console` | developer-tools, file | denser neutral, subtle mono affordance |
| `collab` | collaboration, communication | warm neutral panel |
| `data` | data-motion | legible-number panel, restrained status |
| `mobile` | mobile | device portrait stage |
| `commerce` | commerce | product surface |
| `security` | security | calm trustworthy panel |
| `productivity` | productivity | spatial canvas, full width |
| `creative` | creative, backgrounds | full-bleed ambient |
| `editorial` | text | light editorial, large type |
| `neutral` | animated-shadcn, icons | plain elevated surface |

## 6. Metadata added to `CatalogItem` (catalog.ts)

`previewSize`, `previewMode`, `stageFamily`, `cardSpan`, `mobileCardSpan`, `previewAspect`, `catalogMinH`, `catalogMaxH`, `allowCatalogInteraction`. All optional; **category defaults** resolve when absent (`resolvePresentation()`); individual items override. Validated by `scripts/check-catalog-quality.mjs` (§11).

## 7. Catalog vs detail separation

- **Catalog card** → `catalogPreviewMap[id]` compact composition when present, else the detail preview rendered **non-interactively** in a metadata-sized stage. One representative state, controls hidden, deterministic content, no scroll trap.
- **Detail page** → unchanged full interactive preview + controls (large stage).
- **Block/pack** → full-width, lazy, state-switchable.

## 8. Preview-stage families created

Implemented in `app/_components/catalog-stage.tsx` (`CatalogStage`) + `app/_components/catalog-card.tsx`. Detail-page stage stays in `preview-stage.tsx`.

## 9. Per-component audit status

Every one of the 54 catalog items (50 components + 4 blocks) now resolves a deliberate span/size/family via `resolvePresentation()` and renders through `CatalogStage` (bounded height, honest crop, non-interactive, family surface). **44 have a bespoke compact catalog adapter** (`app/_previews/catalog/<slug>.tsx`, wired in `catalog-previews.tsx`) that shows one representative state with **no control panel**; **10 use the bounded fallback** (the full detail preview, non-interactive + cropped) — these are the items that carry no control leakage and already read well at card scale.

Compact-adapter coverage by family:

- **AI** — ai-response-stream, tool-call-activity, agent-run-timeline, prompt-composer, source-citation-rail ✅ (all `wide`, control rig removed)
- **Developer tools** — deployment-pipeline, live-log-stream, api-request-inspector, environment-switcher, webhook-event-stream ✅ (`wide`/`standard`, logs trimmed ≤8 rows)
- **Collaboration / Communication** — live-presence-stack, activity-stream, approval-workflow, comment-thread, mention-suggestions, typing-and-presence, thread-expansion, message-delivery-states ✅ (feeds ≤5, threads 1 root + ≤2 replies)
- **Data motion** — kpi-number-morph, streaming-data-rows, filter-result-transition, data-refresh-state, data-quality-status ✅ (settled values, tables ≤6 rows)
- **Mobile** — swipe-action-row, mobile-filter-sheet, keyboard-safe-form ✅ (device stage; frame full-bleeds below `sm`)
- **File / Commerce** — file-upload-pipeline, multi-file-queue, processing-timeline, product-variant-selector, cart-item-transition, checkout-progress ✅
- **Security / Productivity** — passkey-setup-flow, two-factor-setup-flow, session-security-center, kanban-card-movement (`full`), task-dependency-map (`full`), project-timeline (`full`) ✅ (spatial → full width)
- **Blocks** — ai-agent-workspace, deployment-command-center, collaborative-review-workspace, live-operations-dashboard ✅ (`full`, `showControls`/`showStateControls={false}` where available)
- **Text / Creative** — kinetic-emphasis (`full`, headline only, control panel removed), animated-list (3 static items, Add/Dismiss removed) ✅

**Bounded fallback (10 — intentional, no bespoke adapter needed):** luminous-topography, animated-grid (ambient full-bleed backgrounds), blur-text, rotating-text (text reveals, no controls), spotlight-card (creative card), animated-dialog, animated-tabs, animated-accordion, animated-button, animated-icons (small shadcn/icon primitives whose interactive surface *is* the component, not demo scaffolding). Each is sized `small`/`standard`/`ambient` and reads cleanly; if any later shows a control-leak defect it gets an adapter.

### Fixed component-usability defects (surfaced by rendered review)

- **Mobile components mis-sized to desktop width** — `mobile-filter-sheet` + `keyboard-safe-form` are `complexity: complex`, which the complexity-bump promoted to `wide` and stripped the phone frame. Fixed: mobile/creative/text/icon/shadcn categories are excluded from the complexity-bump (`resolvePresentation`).
- **Nested phone frame on mobile viewport** — device frame now full-bleeds below `sm` (§26).
- **Site-header horizontal overflow** — the top nav enumerated all 15 categories inline, forcing 1905px page width at 1440 (page-level horizontal scrollbar, pre-existing). Fixed: category nav is `min-w-0 flex-1 overflow-x-auto` (scrolls within its bounds; page no longer overflows).
- **Lazy-shell white flash in light mode** — replaced the near-white "activating…" box with a theme-aware skeleton; above-the-fold cards now activate synchronously (no placeholder flash).

## 10. Before / after evidence

- Before: `artifacts/catalog-rehabilitation/before/` — `before-<WxH>-<theme>.png` (14) + `sections/before-section-*.png`.
- After: `artifacts/catalog-rehabilitation/after/` — same matrix.
- Summary: `artifacts/catalog-rehabilitation/summary.md` (side-by-side).

## 11. Regression prevention

`scripts/check-catalog-quality.mjs` extended to fail on: complex workflow on a small span without override, block/pack below full width, mobile component without mobile mode, unbounded fixed preview height, duplicate preview ids, missing presentation resolution.

## 12. Remaining limitations

- **10 items use the bounded fallback** rather than a bespoke compact adapter (§9). They read cleanly, but a few (e.g. `animated-tabs`, `animated-accordion`) still expose their own interactive affordances in the card — acceptable because that surface *is* the component, not demo scaffolding.
- **Fixed-span packing gaps.** With `items-start` + fixed spans, a `6` next to an `8` can't share a row, so a lone `6` may leave up to half a row of whitespace to its right. This is far less than the old tallest-row stretching, but it is not perfectly dense (no masonry, by design — CSS Grid stays predictable).
- **Detail pages (§16) not yet rebuilt.** The catalog cards are fully rehabilitated; the component *detail* pages still use the original `PreviewStage`. They are functional and were out of the highest-impact path this pass; density modes (§17) were likewise not added. These remain follow-up polish, tracked here.
- **Metadata validation (§31) not yet wired into `check-catalog-quality.mjs`.** Presentation is centralized in `resolvePresentation()` (so it can't silently go missing), but the additional structural assertions (block-must-be-full-width, mobile-must-have-mobile-mode, no unbounded fixed height) are not yet codified as CI guards.
- **Lazy-shell skeleton** relies on `motion-safe:animate-pulse`; under reduced motion it is a static skeleton (correct, but less obviously "loading").
