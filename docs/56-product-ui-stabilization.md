# 56 — Product UI stabilization sprint (canonical tracker)

> **Type:** 🟡 Implementation tracker (sprint) · **Started:** 2026-07-15 · Builds on [`docs/55`](55-catalog-preview-rehabilitation.md).
> Scope: usability / responsiveness / navigation / preview / bug-fix sprint across homepage, catalog, nav, sidebar, detail pages, previews, Released components, blocks. **No new components. Inventory frozen. No Batch 9.**

Rule: **do not mark the sprint complete while any Critical or Major issue remains open.** Severities: Critical · Major · Moderate · Minor. Issues use: Route · Surface · Viewport · Problem · Severity · Root cause · Fix · Status · Before · After.

Baseline evidence: `artifacts/product-ui-stabilization/before/`. After: `.../after/`. Summary: `.../summary.md`.

---

## Global shell
| # | Route | Surface | VP | Problem | Sev | Root cause | Fix | Status |
|---|---|---|---|---|---|---|---|---|
| G1 | all | top nav | ≥md | 15 category links + Packs + Docs crammed into the bar; scrolls horizontally; tiny, hard to scan | Major | header enumerates every `categories[]` | Reduce to Components/Blocks/Packs/Docs + **Explore** mega-menu + Search + CTA | done |
| G2 | all | width | ≥1600 | homepage `max-w-[1440px]` leaves wide displays empty | Moderate | one global max-width | Homepage → `max-w-[1536px]`; catalog stays `1680`; prose narrower | done |

## Top navigation
| N1 | all | desktop nav | md–lg | no clear active route; every category a persistent link | Major | flat category list | grouped Explore menu, active-route styling, one CTA | done |
| N2 | all | Explore menu | desktop | (new) discovery menu: Product workflows / Creative / Products groups, name + count only | — | — | built `SiteNav` client component | done |

## Mobile navigation
| M1 | all | mobile menu | <md | only search+theme+CTA; no nav/categories on mobile | Major | no mobile menu | drawer: focus trap, Esc, scroll-lock, search, grouped collapsible categories, primary links | done |

## Category sidebar
| S1 | /components | sidebar | desktop | long/dense; single flat group split only 2 ways | Moderate | `NAV_GROUPS` coarse | regroup Product Workflows / Creative / Foundations / Mobile / Blocks&Packs; keep counts, collapse, drawer | done |

## Homepage
| H1 | / | category showcase | all | mounts **all 15** heavy category previews on load (perf + crowded) | Major | `PreviewStage`+`Preview` per category, eager | switch to compact `CatalogPreview` in a lazy `CatalogStage`; feature 1 wide + rest standard | done |
| H2 | / | hero montage | all | hero mounts 3 heavy previews that compete; KPI/AI fragments dense | Moderate | 3 eager `PreviewStage` | reduce to 1 anchor + 1 supporting fragment, lazy | done |
| H3 | / | hero width split | lg | copy/preview split ok but preview compresses | Minor | grid ratio | keep 1.05fr/1fr, bounded preview | done |

## Components catalog
(covered by docs/55; this sprint refines sidebar groups + verifies no regressions)

## Component detail template
| D1 | /components/[slug] | preview stage | all | large/full components constrained to prose-column stage | Major | `PreviewStage` fixed min-h, centered | wide/full detail stage by presentation size | audit |

## Preview system
(11 stage families + 44 compact adapters from docs/55; this sprint fixes overflow/long-content defects surfaced by the component audit)

## Released component audit
See §"Component bug audit" table below (populated during rendered review at 375/320 + long-content).

## Block audit
(4 blocks — verify full-width detail render, no overflow at 768/390)

## Responsive / Accessibility / Visual consistency / Performance / Remaining limitations
(populated as work lands)

---

## Critical / Major bugs found & fixed (rendered review)

| # | Route/Surface | VP | Problem | Sev | Root cause | Fix | Status |
|---|---|---|---|---|---|---|---|
| B1 | / (homepage) | 320/375/390/430 | Page-wide horizontal overflow (scrollWidth 655 > vp) | **Critical** | `InstallCommand` `<code whitespace-nowrap>` is a flex child without `min-w-0`; its min-content expanded the install-section + hero grid tracks (grid items default `min-width:auto`) | `min-w-0 flex-1` on the code element + `min-w-0` on the hero & install grid columns | **fixed** (verified scrollWidth 320 @320) |
| B2 | / category showcase | all | Category previews never load (stuck skeleton) for real users | **Critical** | `IntersectionObserver` does not fire inside an `inert` subtree; the decorative preview wrapper was `inert`, so lazy activation never triggered | `LazyPreview` `decorative` mode: observed wrapper is never inert; `inert` applied only to activated content; skeleton made non-focusable | **fixed** (Playwright: 18→4 shells on scroll) |
| B3 | mobile nav drawer | <md | Drawer panel collapsed to 56px (header height); menu unusable | **Critical** | header's `backdrop-blur-md` establishes a containing block for `position:fixed`, so `fixed inset-0` resolved against the 56px header | portal the drawer to `document.body` (escapes the backdrop-filter ancestor) | **fixed** (panel now 844px full height) |
| B4 | /components/[slug] | all | Large/complex components squeezed into the 1100px prose column | **Major** | single page `max-w-[1100px]` wraps the preview too | width-tiered preview stage (`full`/`ambient`→1360, `wide`→1200, else 1000); prose kept at 920 reading width | **fixed** (task-dependency-map renders wide) |
| B5 | top nav | ≥md | 15 category links crammed + horizontally scrolling; hard to scan | **Major** | header enumerated every category | new `SiteNav`: Components/Explore▾/Packs/Access + Explore mega-menu (grouped, counts) + Search + CTA | **fixed** |
| B6 | production build | — | `next build` failed prerendering `/_not-found` | **Critical (build)** | `SiteNav` used `useSearchParams()` in the root-layout header → static-prerender bailout | read `window.location.search` client-side instead | **fixed** (build 74/74) |
| B7 | /packs/[slug] | 320/390 | Page overflow (695px) | **Major** | `InstallCommand` inside a non-shrinking `grid sm:grid-cols-2` card | `min-w-0` on the pack grid card + text column | **fixed** (320 @320) |
| B8 | /components/[slug] | 320 | Page overflow on 5 pages (message-delivery-states 536, +4 by 7–47px) | **Major** (worst) / Moderate | detail description + prose `<li>` bullets + "Installs to …" path contain long unbreakable slash/path tokens (`draft/sending/sent/…`, `components/motionkit/blocks/…`) that don't wrap | `break-words` on the description `<p>` and the `Section` wrapper | **fixed** (all 320 @320) |

## Component overflow audit (§20/§22)

Playwright page-overflow sweep at **320 / 768** across all component detail pages + pack pages. High-risk set (task-dependency-map, project-timeline, kanban, api-request-inspector, streaming-data-rows, ai-response-stream, comment-thread, session-security-center, checkout-progress) verified individually at **320**: **all clean** (no page overflow) — the components already contain their own overflow (internal `overflow-x-auto` on boards/tables/code). Full sweep result recorded in the summary.

## Remaining (Moderate / follow-up)
- Full per-component matrix audit (long-content stress, 200% zoom, keyboard, empty/loading/error states) across all 50 components at all 10 viewports is **partially** done (high-risk overflow + homepage/nav complete). Remaining components carry no known Critical/Major defect from the sweep; deeper long-content/zoom audit is follow-up.
- Density variants (§24) not added this pass (comfortable default already used).
- Detail-page control refinements (§19 reduced-motion/reset per component) unchanged from prior sprint.
