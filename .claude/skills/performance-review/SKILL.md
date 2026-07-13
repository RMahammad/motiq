---
name: performance-review
description: Performance review for effects, scroll components, complex sections, and release candidates. Covers bundle/tree-shaking, client boundaries, animation properties, layout thrashing, cleanup, scroll handlers, compositing, mobile + reduced-motion fallback, lazy-loading, and comparison against documented budgets.
allowed-tools: Read, Grep, Glob, Bash
---
# Performance review

## Use this skill when
- Reviewing effects, scroll components, complex sections, or a release candidate; or when a size/frame-rate budget is at risk.

## Do not use this skill when
- A trivial, non-visual change with no bundle or runtime impact.

## Required context
- [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md) (canonical budgets)
- [`docs/templates/performance-checklist.md`](../../../docs/templates/performance-checklist.md)
- [`docs/06-animation-engine-decision.md`](../../../docs/06-animation-engine-decision.md) (escalation)

## Inputs
- The component/section/package under review.

## Procedure
1. **Import & bundle analysis** — single-component import within budget; uses `m`+LazyMotion not full `motion`.
2. **Tree-shaking** — importing one export doesn't pull siblings.
3. **Client-boundary review** — no unnecessary `"use client"` on static content.
4. **Animation-property audit** — transform/opacity only, or justified; `will-change` transient.
5. **Layout-thrashing review** — no read-after-write layout in loops.
6. **Cleanup** — observers/timers/rAF/listeners removed on unmount.
7. **Scroll-handler review** — rAF-throttled or `useScroll`; no raw scroll spam.
8. **Blur/filter/compositing review** — bounded; no giant composited layers.
9. **Mobile fallback** — defined and tested for High-perf-risk components.
10. **Reduced-motion fallback** — present.
11. **Lazy-loading** — heavy effects dynamically imported.
12. **Frame-rate / profiling** — where appropriate (dev `useFrameRate`, Lighthouse, React Profiler).
13. **Compare against budgets** ([`13`](../../../docs/13-performance-standard.md#budgets)).

## Required validation
- `size-limit` within budget; tree-shaking verified.
- ⛔ Mobile + reduced-motion fallbacks for High-perf-risk components.
- Complete [`performance-checklist.md`](../../../docs/templates/performance-checklist.md).

## Expected outputs
A findings report vs budgets: bundle numbers, animation-property audit, cleanup/scroll issues, mobile/reduced-motion status, and fixes.

## Documentation updates
- Fill the performance section of the component doc page; if a budget changes, update [`13`](../../../docs/13-performance-standard.md) via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- A budget regression that can't be resolved → block release ([`22`](../../../docs/22-risk-register.md)).

## Prohibited actions
- Approving a High-perf-risk component with no mobile fallback.
- Animating layout-triggering properties by default without justification.
