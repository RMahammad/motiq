# 13 — Performance standard

> **Type:** 🟢 Canonical for performance budgets · **Implementation status:** 🔵 Planned (budgets defined, not yet enforced) · **Last reviewed:** 2026-07-14
> **Owns:** bundle/runtime budgets, animation rules, the performance-review checklist.
> **Related:** [`14-testing-strategy.md`](14-testing-strategy.md) (size-limit CI) · [`06-animation-engine-decision.md`](06-animation-engine-decision.md) (escalation) · [`performance-review` skill](../.claude/skills/performance-review/SKILL.md)

## Budgets

| Budget | Target |
|---|---|
| `@scope/motion` core (min+gzip) | ≤ 8 kB (excl. peer `motion`) |
| `@scope/react` single component import (gzip) | ≤ 6 kB typical, ≤ 12 kB heavy |
| Compiled CSS fallback (gzip) | ≤ 20 kB |
| Added runtime JS for a landing page using 6 components | ≤ 45 kB gzip (excl. React) |
| Animation frame rate | 60fps desktop / ≥ 50fps mid mobile |
| Long tasks from our code on mount | none > 50 ms |
| CLS from our components | < 0.02 |
| DOM nodes per section | < 500 |
| Hydration | no measure-then-jump; SSR renders final state |

Budgets are enforced in CI via `size-limit` (bundle) + Lighthouse CI (runtime) + Playwright frame checks ([`14`](14-testing-strategy.md)).

## Rules

- **Transform/opacity animations by default.** `will-change` only transiently.
- **Lazy-load heavy effects** via dynamic `import()`; dynamic-import optional engines (GSAP adapter).
- **Share `IntersectionObserver`** where beneficial; **pause on background tabs** (`visibilitychange`); throttle scroll to `rAF`.
- **Cap blur/filter layers** and large composited layers.
- **No Remotion renderer in browser bundles** ([`03`](03-architecture.md)).
- **Dedupe React** (peer dep; consumer resolves).
- **Clean up** every observer/timer/rAF/listener in effect teardown.
- **Graceful low-power fallback** (feature-detect + reduced-motion).

## Scroll animation rules

Scroll-linked effects (`ScrollProgress`, `Parallax`, sticky/pinned) must: use `rAF`-throttled or `useScroll`-based reads (no unthrottled scroll listeners), degrade to static on `prefers-reduced-motion`, and ship a **mobile fallback** (heavy scroll effects are the top mobile-perf risk — [`22`](22-risk-register.md)). Treat `HorizontalScroll`, `ScrollScrub`, and `ParticleField` as V2/experimental with mandatory mobile fallbacks ([`21`](21-component-inventory.md)).

## Mobile fallback rules

Any effect with High perf risk must define its mobile behavior explicitly (disable, simplify, or static). Test on a real mid-tier device profile in CI (Playwright device emulation) plus at least one manual check.

## Tooling

`size-limit` + `@size-limit/preset-small-lib`, Rolldown/bundle visualizer, Lighthouse CI, React Profiler, a small `useFrameRate` dev monitor, and a CI job that fails on budget regression.

## Performance-review checklist

Used by the [`performance-review`](../.claude/skills/performance-review/SKILL.md) skill and [`templates/performance-checklist.md`](templates/performance-checklist.md):

1. Import/bundle analysis (single-component import stays within budget).
2. Tree-shaking verified (importing one component doesn't pull siblings).
3. Client-boundary review (no unnecessary `"use client"` on static content).
4. Animation-property audit (transform/opacity only, or justified).
5. Layout-thrashing review (no read-after-write layout in loops).
6. Listener/observer cleanup present.
7. Scroll-handler review (rAF-throttled / `useScroll`).
8. Blur/filter/compositing review.
9. Mobile fallback defined and tested.
10. Reduced-motion fallback present.
11. Lazy-loading assessed for heavy effects.
12. Frame-rate / profiling where appropriate.
13. Compared against the budgets above.
