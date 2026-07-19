# Product UI stabilization — before / after

Tracker: [`docs/56`](../../docs/56-product-ui-stabilization.md). Evidence: `before/` and `after/` (full-page, `scripts/shoot-stabilization.mjs`), diagnostics via `scripts/_probe.mjs`.

## Viewport matrix (full pages, dark)
Homepage + Components captured at 1920/1536/1440/1280/1024/768/430/390/375/320 →
`before/before-{home,catalog}-<w>-dark.png` and `after/after-{home,catalog}-<w>-dark.png`.
Detail/block/pack pages at 1440/390/320 → `{before,after}/*-detail-*`, `*-block-*`, `*-pack-*`.

## Critical bugs fixed

| # | Where | Problem | Fix | Verified |
|---|---|---|---|---|
| B1 | Homepage @≤430 | Page-wide horizontal overflow (655px) | `min-w-0` on `InstallCommand` code + hero/install grid columns | scrollWidth 320 @320 |
| B2 | Homepage categories | Lazy previews never load (IntersectionObserver dead inside `inert`) | `LazyPreview` `decorative` mode — observed node never inert | Playwright 18→4 shells on scroll |
| B3 | Mobile nav | Drawer collapsed to 56px (header `backdrop-blur` = containing block for `fixed`) | portal drawer to `document.body` | panel 844px full height |
| B6 | Build | `next build` failed on `/_not-found` (root-layout `useSearchParams`) | read `window.location.search` client-side | build 74/74 |
| B7 | Pack pages @≤390 | Page overflow (695px) — `InstallCommand` in a non-shrinking grid card | `min-w-0` on the pack grid card + text column | scrollWidth 320 @320 |

## Major bugs fixed
| B4 | Detail pages | Large components squeezed into 1100px prose column | width-tiered preview stage (full 1360 / wide 1200 / else 1000), prose at 920 | task-dependency-map renders wide |
| B5 | Top nav | 15 category links crammed, scrolling, unscannable | `SiteNav`: Components/Explore▾/Packs/Access + Explore mega-menu + Search + CTA | rendered |

## Navigation rebuild
- **Top nav** reduced to 4 primary items + Explore mega-menu (Product workflows / Creative / Products groups, name + released count only) + Search + one CTA. Active-route styling. No horizontal overflow.
- **Mobile nav** rebuilt independently: right drawer, focus trap, Esc, body-scroll-lock, portal, Browse CTA, primary links, collapsible category groups with counts, large touch targets, safe-area padding. Works at 320px.

## Homepage
- Hero → one creative anchor (Kinetic Emphasis, no controls) + one supporting fragment (AI Response Stream, no controls), lazy. Copy/preview split preserved.
- Category browsing → one representative **compact** preview per category (was 15 eager full previews), AI as a full-width feature card, rest 2-up, all lazy (no longer mounts 15 heavy previews on load — §36).
- Content width 1440→1536.

## Component overflow audit
Final Playwright sweep: **ALL CLEAN across 58 routes × 320/768** (homepage, Components, every component detail page, every pack page — no page-wide horizontal overflow). Bugs found & fixed en route: homepage (B1), pack pages (B7), and 5 detail pages with long-token prose (B8).

## Validation
typecheck 0 · production build 74/74 · catalog-quality OK · pro-exposure 0 exposed · registry build OK (source untouched, no diff) · docs link/inventory/adr/title/date all pass · tests 238/239 (1 pre-existing flaky `cart-item-transition` async test; `git status packages/` clean — not a regression).

## Remaining
- Deeper per-component long-content / 200%-zoom / keyboard / empty-loading-error matrix across all 50 components is partial (high-risk + overflow complete; no Critical/Major outstanding).
- Density variants (§24) not added; detail-page per-component control refinements unchanged.
- Light-mode full-page after capture: dark matrix captured; light spot-checked (collaboration section) — full light matrix is follow-up.
