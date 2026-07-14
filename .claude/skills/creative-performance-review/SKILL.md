---
name: creative-performance-review
description: Performance gate for heavy creative effects — canvas/WebGL/shader/particle/continuous-animation components. Enforces engine justification (CSS/SVG/Motion first), isolation + lazy-loading, offscreen pausing, pointer-event discipline, mobile frame-rate targets, and per-component budgets.
allowed-tools: Read, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Creative performance review

Signature creative components earn their visual richness only if they stay cheap. This review is **in addition to** the general [`performance-review`](../performance-review/SKILL.md) and runs for any component using canvas, WebGL, shaders, particles, per-frame JS animation loops, continuous background motion, or pointer-driven visual updates.

## Use this skill when

- A signature component uses (or proposes) Canvas/WebGL/shader/particle rendering or any `requestAnimationFrame` loop.
- A background/environment component runs continuous animation.
- A component updates visuals on pointer movement.
- A new creative dependency (e.g. a WebGL micro-lib) is proposed — run alongside `dependency-review`.

## Do not use this skill when

- The component animates only via Motion/CSS transitions on discrete state changes (general `performance-review` suffices).

## Engine-justification ladder (check in order; stop at the first sufficient level)

1. **CSS** (transforms, gradients, masks, `@property`) — default for ambient/simple effects.
2. **SVG** (filters, paths, gradients) — structured graphics.
3. **Motion for React / WAAPI** — interactive, interruptible choreography.
4. **Canvas 2D** — many independently-moving elements where DOM would be heavier.
5. **Isolated WebGL** — only when the concept *requires* it, CSS/SVG cannot produce a comparable result, and every isolation requirement below is met.

A heavier engine than necessary is a finding. Globally installing Three.js or a shader framework for one background is **prohibited** — evaluate smaller isolated solutions first, and keep any such dependency component-local (`dependency-review` + license check required).

## Hard requirements for canvas/WebGL/loop components

- **Isolation:** dependency and GL context live only in the component's own registry item; never in shared/core packages or normal UI bundles.
- **Lazy-load:** the heavy path loads on demand (dynamic import / intersection), with a lightweight CSS/static fallback while loading and when unsupported.
- **Offscreen pause:** IntersectionObserver + `document.visibilityState` stop all per-frame work when not visible. Verify with instrumentation, not by reading the code.
- **Reduced motion:** a real static/simplified fallback, not a slower version of the same loop.
- **Cleanup:** context, observers, listeners, and rAF handles all released on unmount (verify with repeated mount/unmount).
- **Pointer discipline:** no layout reads in pointer handlers; pointer state written to refs/CSS variables and consumed in a single rAF; no React setState per pointer move.
- **DPR cap:** full-screen canvases cap devicePixelRatio (≤ 2 by default) and justify anything higher.

## Budgets (record actuals in `performance.json` + `bundle-report.json`)

Per-component budgets are set in the design brief; defaults when unspecified:

- 60fps typical desktop; **stable ≥ 50fps on a representative mid-range mobile** (or 4× CPU throttle proxy).
- JS ≤ 8 KB min+gz for CSS/SVG/Motion components; ≤ 30 KB including deps for canvas/WebGL items — larger requires explicit sign-off in the brief.
- Zero per-frame work when offscreen, hidden, or reduced-motion-static.
- Bounded DOM (no unbounded particle DOM nodes), bounded listeners, no per-frame allocation churn in steady state.
- No excessive `filter: blur()` layers or massive stacked shadows on animated elements; animate `transform`/`opacity` (compositor) — width/height/top/left animation is a finding.

## Procedure

1. Confirm the engine choice against the ladder; record the justification.
2. Static pass: dependency weight, isolation, lazy-load path, cleanup code, pointer discipline.
3. Instrumented pass in the rendered app: frame rate (normal + 4× CPU throttle), long tasks, offscreen/hidden pause verification, mount/unmount leak check, reduced-motion behavior.
4. Bundle pass: measure the registry item's install footprint (min+gz) including component-local deps.
5. Write `performance.json` (fps desktop/throttled, long tasks, pause verification, listener/node counts) and `bundle-report.json` into `artifacts/signature-components/<slug>/`.
6. Verdict: pass / conditional (minor findings listed) / fail (budget or hard requirement broken).

## Stop conditions

Escalate only for a licensing question on a creative dependency or a genuine need for real-device testing that cannot be approximated with throttling.

## Prohibited

- Passing a component whose offscreen/pause behavior was asserted but not observed.
- Accepting "it feels smooth" without measured numbers.
- Letting a heavy dependency into a shared package or the default bundle path.
- Shipping a WebGL component with no fallback for unsupported/reduced-motion/loading states.
