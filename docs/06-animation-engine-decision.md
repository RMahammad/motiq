# 06 — Animation engine decision

> **Type:** 🟢 Canonical for engine choice & escalation rules · **Implementation status:** 🔵 Planned · **Last reviewed:** 2026-07-14
> **Related:** [ADR-0002](adrs/0002-animation-engine.md) (the decision record) · [`05-dependency-decisions.md`](05-dependency-decisions.md) (versions/licenses) · [`07-remotion-strategy.md`](07-remotion-strategy.md) · [`13-performance-standard.md`](13-performance-standard.md)
> Scores are **[REC]** on a 1–5 scale (5 = best for a paid, accessible React/Next library). Version/license facts are cited in [`05`](05-dependency-decisions.md#sources).

## Decision

- **Default engine: Motion for React** (MIT), used via the `m` component + `LazyMotion`, always wrapped in our own primitives so buyers never touch Motion internals directly.
- **Cheap effects (fades, hovers, simple reveals): plain CSS / transitions** — zero runtime, best on low-end devices.
- **WAAPI** — used internally by some primitives for one-shot imperative animations; not a public surface.
- **GSAP** — optional `@scope/gsap-adapter` package only, for rare complex timelines (see anti-compete note below).
- **View Transitions API** — progressive enhancement for `PageTransition`/route morphs, with a Motion fallback (support still uneven).
- **Remotion** — video only; never the browser-UI engine. See [`07`](07-remotion-strategy.md).

## Comparison matrix

| Criterion | Motion for React | CSS anim/trans | WAAPI | GSAP | React Spring | Remotion | Custom rAF | View Transitions |
|---|---|---|---|---|---|---|---|---|
| Runtime bundle | 3 (~34kb→4.6kb) | 5 | 5 | 3 | 4 | 1 | 5 | 5 |
| Tree-shaking | 4 | 5 | 5 | 3 | 4 | 1 | 5 | 5 |
| React integration | 5 | 3 | 3 | 3 | 5 | 5 | 3 | 3 |
| Next App Router / RSC | 4 | 5 | 4 | 3 | 4 | 2 | 4 | 4 |
| SSR/hydration | 4 | 5 | 4 | 3 | 4 | 2 | 4 | 4 |
| Reduced-motion a11y | 5 | 4 | 3 | 2 | 3 | 2 | 2 | 3 |
| Layout animation | 5 | 1 | 1 | 3 | 2 | n/a | 1 | 4 |
| Gestures | 5 | 2 | 1 | 3 | 3 | n/a | 2 | 1 |
| Scroll-linked | 5 | 3 | 3 | 5 | 3 | n/a | 3 | 2 |
| Timeline sequencing | 3 | 2 | 3 | 5 | 2 | 5 | 2 | 1 |
| Deterministic frames | 1 | 1 | 1 | 2 | 1 | 5 | 1 | 1 |
| Video export | 1 | 1 | 1 | 1 | 1 | 5 | 1 | 1 |
| License (paid resale) | 5 (MIT) | 5 | 5 | 4 (anti-compete) | 5 (MIT) | 2 (ambiguous) | 5 | 5 |
| Learning curve | 4 | 5 | 3 | 3 | 3 | 2 | 2 | 4 |
| Maintenance | 4 | 5 | 4 | 4 | 3 | 3 | 2 | 4 |
| Low-powered devices | 4 | 5 | 4 | 4 | 3 | 1 | 3 | 4 |
| Browser support | 4 | 5 | 4 | 5 | 4 | n/a | 4 | 2 |
| **Fit for paid lib** | **5** | 5 | 4 | 4 | 3 | 2 (video) | 2 | 3 |

## Escalation rules — when each engine is allowed

Apply in order; use the lowest tier that satisfies the requirement.

1. **CSS transitions / keyframes** — default for opacity/transform entrances, hovers, simple reveals, marquee. No JS animation runtime. This is what protects the [performance budget](13-performance-standard.md).
2. **WAAPI (internal)** — one-shot imperative animations where CSS can't express the sequence but a spring isn't needed. Not exposed publicly.
3. **Motion for React** — required when you need **springs, layout/shared-layout animation, gestures (drag/hover physics), scroll-linked values, or `AnimatePresence` exit animations.** Use `m` + `LazyMotion` (never the full `motion` import) to stay within budget.
4. **GSAP adapter (opt-in package)** — only for **unusually complex, tightly-sequenced timelines** that Motion expresses poorly. Must live in `@scope/gsap-adapter`, never a core dep.
5. **View Transitions API** — progressive enhancement for route/page morphs; always ship a Motion/CSS fallback because support is uneven.
6. **Remotion** — **never** for browser UI. Video/timeline compositions only, in the separate package ([`07`](07-remotion-strategy.md)).

> **Rule:** the public API of a primitive/component never exposes engine-specific objects at the default level. Advanced users reach the engine only through a namespaced escape hatch (`motionProps`) — see [`09-component-api-standard.md`](09-component-api-standard.md#level-3--escape-hatch).

## Why Remotion is not the browser UI engine

Remotion renders its own React tree for deterministic frame output; it is the wrong tool for interactive DOM UI, and it would poison the bundle and the license story. It scores 1–2 on every browser-UI criterion above. It earns its place only for video export (score 5). Boundary rationale: [ADR-0003](adrs/0003-remotion-boundary.md).

## GSAP anti-compete note

GSAP is free including all plugins, but its license prohibits building tools that **compete with Webflow's no-code visual animation builder**. A code-first component library is a permitted use. We must document that this product is **not** a no-code animation builder. Kept optional and quarantined. Source: [`05`](05-dependency-decisions.md#sources).
