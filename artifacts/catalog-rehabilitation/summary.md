# Catalog preview & layout rehabilitation — before / after

Tracker: [`docs/55`](../../docs/55-catalog-preview-rehabilitation.md). Evidence captured with `scripts/shoot-catalog.mjs` (Playwright, full-page).

## Viewport matrix (full `/components` page)

| Viewport | Before | After |
|---|---|---|
| 1920×1080 | `before/before-1920x1080-{dark,light}.png` | `after/after-1920x1080-{dark,light}.png` |
| 1536×960 | `before/before-1536x960-{dark,light}.png` | `after/after-1536x960-{dark,light}.png` |
| 1440×900 | `before/before-1440x900-{dark,light}.png` | `after/after-1440x900-{dark,light}.png` |
| 1280×800 | `before/before-1280x800-{dark,light}.png` | `after/after-1280x800-{dark,light}.png` |
| 1024×768 | `before/before-1024x768-{dark,light}.png` | `after/after-1024x768-{dark,light}.png` |
| 768×1024 | `before/before-768x1024-{dark,light}.png` | `after/after-768x1024-{dark,light}.png` |
| 390×844 | `before/before-390x844-{dark,light}.png` | `after/after-390x844-{dark,light}.png` |

## Category sections (1440, dark)

`sections/before-section-<cat>.png` → `sections/after-section-<cat>.png` for:
ai · developer-tools · collaboration · data · mobile · file · commerce · security · communication · productivity · creative

## Headline result — Collaboration section (the worst "before" offender)

| Metric | Before | After |
|---|---|---|
| Section height (1440) | ~6,585px | ~3,538px (**≈46% shorter**) |
| Grid | 3 equal narrow columns | adaptive 12-col: 6+6 two-up, 8-wide workflows, 12-full block |
| Approval Workflow card | stretched to tallest-in-row, control panel visible | `wide` (8), readable flow, no controls |
| Collaborative Review Workspace (block) | ~60% blank vertical region | `full` (12), populated workspace, cropped cleanly |
| Neighbor cards (Live Presence / Activity) | empty stretch beside the tall card | equal-height two-up compact adapters |

## What changed (system)

- **Grid:** equal-width `sm:grid-cols-2 xl:grid-cols-3` → adaptive **12-column** placement from catalog metadata (`resolvePresentation`), `items-start` (no row stretch), category sections with restrained separators.
- **Container:** `max-w-[1440px]` → `max-w-[1680px]`; sidebar `240px`, sticky, own bounded scroll.
- **Sidebar:** flat chip list → grouped nav (Product & workflow / Creative & primitives), counts, active highlight, collapsible groups, Tier/Type/Sort filters, mobile drawer.
- **Preview stages:** one dark gradient panel (5 near-identical variants) → **11 controlled family surfaces** (ai/console/collab/data/mobile/commerce/security/productivity/creative/editorial/neutral), light+dark, shared chrome.
- **Catalog ≠ detail:** catalog cards render **44 bespoke compact adapters** (real component, one representative state, **no control panels**, trimmed data) + 10 bounded fallbacks; detail pages keep the full interactive stage.
- **Sizing:** every card gets a deliberate `previewSize` (small/standard/wide/full/mobile/ambient) with bounded height + honest crop — no `min-h-screen`, no shared tallest-row heights, no giant empty space.
- **Mobile:** single column, device frame full-bleeds below `sm` (no nested phone), Filters drawer, no horizontal overflow.
- **Fixes surfaced by rendered review:** mobile-complexity mis-sizing, nested phone frame, site-header horizontal overflow (page-level scrollbar), light-mode lazy-shell white flash → theme-aware skeleton + synchronous above-the-fold activation.

## Validation

typecheck ✅ · docs production build ✅ (74/74) · catalog-quality ✅ · pro-exposure ✅ (0 exposed) · registry build ✅ (source-protection OK) · docs link/adr/title/date/inventory ✅ · desktop/tablet/mobile/light/dark renders ✅ · no horizontal overflow ✅.
