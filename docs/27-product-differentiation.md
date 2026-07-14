# 27 — Product differentiation & moat

> **Type:** 🟢 Canonical for product positioning & the moat · **Status:** primary moat **Proposed → in build** (2026-07-14) · **Related:** [ADR-0013](adrs/0013-product-moat.md), [ADR-0015](adrs/0015-semantic-motion-api.md) · [`01-product-strategy.md`](01-product-strategy.md) · [`06-animation-engine-decision.md`](06-animation-engine-decision.md) · [`21-component-inventory.md`](21-component-inventory.md)
> **[REC]** = recommendation; **[FACT]** = already implemented at v0.1.0.

## What we are NOT

Not another animated‑button library, glowing‑card collection, shadcn clone, "more components than X" kit, gallery of copied effects, screenshot‑only effects, a thin wrapper around Motion for React, or a Remotion template dump. We compete on **how motion is authored, made safe, and proven** — not count.

## The problem other animated collections leave to the buyer

Free/copy‑paste animated kits hand you an *effect* and walk away. The buyer is then stuck implementing the boring‑but‑hard 80% themselves, on every component, forever:

- Translating "this should feel like it's *introducing* the product" into duration/delay/easing/distance/stagger/spring values — and keeping them consistent across a team.
- **Coordinating** a heading → copy → media → CTA so they enter as one *scene*, not four independent fades.
- Getting **reduced‑motion, mobile, pointer‑capability, SSR‑no‑flash, and interruption** right — per component.
- **Testing** motion deterministically (in‑view, timelines, cleanup, SSR).
- Making motion a **themeable, versioned contract** a design system can adopt org‑wide.

That recurring, cross‑cutting work is the moat surface.

## Differentiation ideas (evaluated)

### A. Semantic motion system — **[MOAT]**
Users describe **intent**, not engine values. A typed vocabulary (`introduce`, `emphasize`, `confirm`, `dismiss`, `transition`, `reorder`, `expand`, `collapse`, `notify`, `progress`, `replace`, `focus`, `deemphasize`) compiles to duration/delay/easing/distance/scale/opacity/stagger/spring + reduced‑motion + mobile + pointer + layout behavior. Engine internals are **not** the primary API — they're a namespaced Level‑3 escape hatch ([`09`](09-component-api-standard.md#three-api-levels)).

```tsx
<Reveal intent="introduce" emphasis="primary" sequence="after-heading"
        responsiveMotion={{ mobile: "reduced", desktop: "expressive" }}>
  <ProductPreview />
</Reveal>
```

### B. Choreography instead of isolated effects — **[SUPPORTING]**
Orchestration primitives (`MotionScene`, `MotionSequence`, `MotionStep`, `MotionGroup`, `MotionTimeline`, `SharedTrigger`, `StateTransition`, `MotionBoundary`) let a section coordinate heading/copy/media/actions/exit/state — without every child inventing timing.

```tsx
<MotionScene preset="product-introduction">
  <MotionStep role="heading"><Heading /></MotionStep>
  <MotionStep role="supporting-content"><Description /></MotionStep>
  <MotionStep role="product-preview"><ProductPreview /></MotionStep>
  <MotionStep role="primary-action"><CTA /></MotionStep>
</MotionScene>
```

### C. Adaptive motion policies — **[SUPPORTING, partly [FACT]]**
`MotionProvider` + `MotionPolicy` with modes None/Reduced/Standard/Expressive; safe defaults; mobile/pointer/hover‑capability awareness; **server‑safe initial render, no hydration flash, no fingerprinting/device scoring**. Reduced‑motion + `prefersReducedMotion()` + intensity modes already ship ([FACT], [`10`](10-design-tokens.md#motion-intensity-modes)); the policy provider + responsive mapping is the [REC] extension.

### D. Motion Inspector (dev‑only) — **[DEFER]**
Overlay showing component/intent/preset/timing/trigger/sequence‑step/reduced‑motion result/policy/animation‑state + layout‑shift/long‑animation/leaked‑observer/hydration warnings. Optional, tree‑shaken from prod, no data collection, no hosted service. High value, higher build cost → **defer to first premium dev‑tools release.**

### E. Verifiable production quality — **[SUPPORTING]**
Every component page *shows* a11y/keyboard/focus/reduced‑motion/theme/mobile/bundle/deps/package/import/SSR/boundary/install/browser/limitations/tests/policy/supported‑intents — as **live panels, not badges**.

### F. Complete motion recipes — **[SUPPORTING]**
Sell **workflows**, not effects: product hero, product tour, pricing selection, search/filter transition, empty→populated, optimistic submit, error recovery, success, notification choreography, checkout progress, file‑upload lifecycle, route/tab transitions, command‑palette, dashboard state, data refresh, comparison, mobile nav. Each solves a real implementation problem.

### G. Animation testing utilities — **[DEFER → then premium]**
`renderWithReducedMotion`, `mockInView`, `replaySequence`, `advanceTimeline`, `awaitMotionComplete`, `disableMotion`, keyboard‑interruption/route/choreography/SSR/hydration/cleanup assertions. We already prove the *pattern* (fake‑timer + IO‑mock tests across the suite — [FACT]); packaging it as `@scope/test-utils` is the [REC] follow‑on.

### H. Motion presets as a typed contract — **[MOAT‑adjacent]**
Presets are typed, semantic, themeable, composable, responsive, accessible, reduced‑motion aware, versioned, documented, testable, shareable. A team defines a **company‑wide motion theme once** (via `MotionProvider`) instead of editing every component.

## Selected moat (decision)

- **Primary moat:** a **production‑grade semantic‑motion + choreography system** for React/Next.js (A + B + H). You author *intent* and *scenes*; the system compiles safe, consistent, themeable, testable motion.
- **Supporting differentiator 1:** accessibility, reduced‑motion, responsive, pointer, and interruption behavior are **built into every preset** (C) — not the buyer's problem.
- **Supporting differentiator 2:** every component ships an **interactive production‑readiness panel** (E) — code, motion policy, a11y, SSR/boundary, bundle, install, testing — all live and verifiable.

### Defer (3)
1. **Motion Inspector** (D) — premium dev‑tools release.
2. **`@scope/test-utils` package** (G) — after the API stabilizes.
3. **`MotionTimeline` / scrubbable route choreography** — advanced; validate demand first.

### Reject (3)
1. **WebGL/particle/scroll‑hijack "hero effects"** — motion‑sickness, mobile/perf cost, no production use ([`13`](13-performance-standard.md)).
2. **A parallel GSAP‑powered effect gallery** — engine sprawl + license review for no moat gain ([`06`](06-animation-engine-decision.md)).
3. **"Novelty effect of the week" components** whose only justification is a good screenshot (blocked by [`product-differentiation-review`](../.claude/skills/product-differentiation-review/SKILL.md)).

## First bundles

**Free (funnel):** `MotionProvider`, `MotionPolicy`/`ResponsiveMotion`, `Reveal`, `Stagger`, `InView`, core semantic presets, reduced‑motion utilities (`prefersReducedMotion`, `ReducedMotionBoundary`), basic testing helpers. (Most already [FACT] at v0.1.0.)

**Paid (premium):** `MotionScene`/`MotionSequence`/`MotionStep`/`StateTransition`, advanced choreography presets, **signature workflow recipes**, the Motion Inspector (when it lands), the interactive production‑readiness catalog, and **source‑registry access** ([`16`](16-commercial-packaging.md)).

## Why pay for this instead of Motion for React (free) or copying components?

- **Motion for React is an engine, not a system.** It gives you `motion.div` + springs; you still design the vocabulary, coordinate scenes, and hand‑roll reduced‑motion/mobile/SSR/interruption/testing on every component. We sell **that system** — typed intents, choreography, safe defaults, a themeable contract, and tests — so a team ships consistent motion in minutes, not sprints. (We *use* the engine only where CSS can't — [`06`](06-animation-engine-decision.md); the value is the layer above it.)
- **Copying a free animated component gives you one effect with none of the 80%.** No reduced‑motion, no mobile fallback, often broken in the App Router, untyped, untested, unmaintained ([`02`](02-market-analysis.md)). We sell **verifiable production‑readiness** and **maintenance** — proven on a live panel, not asserted.
- **The recipes sell outcomes, not parts.** "Pricing selection with optimistic state + reduced‑motion + mobile fallback, tested" is a workflow a buyer would otherwise spend days assembling.

## Do not build everything at once

Ship the **semantic + choreography core** (`MotionScene`/`MotionStep` land this cycle) and the **production‑readiness panels**; layer recipes; defer the Inspector and test‑utils package. Each addition passes [`product-differentiation-review`](../.claude/skills/product-differentiation-review/SKILL.md).
