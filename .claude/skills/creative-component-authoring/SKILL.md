---
name: creative-component-authoring
description: Author an original creative component — text effect, animated background, creative card, or cursor/canvas effect — with an original implementation, dependency + license + performance review, correct cleanup, resize/mobile/reduced-motion behavior, and heavy deps isolated component-local.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

# Creative component authoring

## Use this skill when
Building an original creative effect with no accessible primitive underneath: text effects, animated backgrounds, creative cards, cursor effects, canvas/WebGL visuals.

## Do not use this skill when
Wrapping an accessible primitive (use [`animated-shadcn-authoring`](../animated-shadcn-authoring/SKILL.md)) or authoring a reusable low‑level motion primitive (use [`motion-primitive-authoring`](../motion-primitive-authoring/SKILL.md)).

## Required context
- [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md) — performance budgets.
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md), [`packages/registry/registry.json`](../../../packages/registry/registry.json).

## Inputs
Effect name, intended use, and any candidate dependency.

## Procedure
1. Write an **original implementation** — do not port a competitor's effect code.
2. Run a **dependency review** for anything added (hand to [`dependency-review`](../dependency-review/SKILL.md)).
3. Run a **license review** for any dependency or borrowed technique; record attribution needs.
4. Set and meet a **performance budget** per [`docs/13`](../../../docs/13-performance-standard.md).
5. **Clean up** every listener, `requestAnimationFrame`, timer, and observer on unmount.
6. Handle **resize** correctly (canvas/DPR, layout recompute, debounced where needed).
7. Provide a **mobile fallback** (lighter or static path where the full effect is too costly).
8. Provide **reduced‑motion** behavior (static or minimal state).
9. Expose **configurable props** (intensity, colors via tokens, speed) instead of hard‑coded values.
10. Add a **live preview** with real controls.
11. Keep the effect **isolated in the registry** — heavy deps (WebGL/canvas/three) stay component‑local, never hoisted into a core package.
12. Add **documentation** (usage, props, perf caveats, mobile/reduced‑motion behavior).
13. Add **attribution** wherever a license or technique requires it.

## Required validation
No leaked listeners/rAF/observers (mount→unmount clean); resize + mobile + reduced‑motion paths verified; measured against the performance budget; dependency + license cleared. Hand perf to [`performance-review`](../performance-review/SKILL.md).

## Expected outputs
Original component · dependency + license clearance · perf measurement · cleanup proof · resize/mobile/reduced‑motion paths · configurable props · live preview · docs · attribution.

## Documentation updates
Add the component doc page + [component inventory](../../../docs/21-component-inventory.md) row; record any new dependency in [`docs/05-dependency-decisions.md`](../../../docs/05-dependency-decisions.md) via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- **Stop** if a heavy dependency (WebGL, canvas engine, three.js, physics) is added without component‑local isolation **and** a completed [`dependency-review`](../dependency-review/SKILL.md).
- Stop if the effect cannot meet the performance budget on mobile without a fallback.

## Prohibited actions
- Do not port competitor effect code or assets.
- Do not hoist a heavy dependency into a core package.
- Do not ship without cleanup, reduced‑motion behavior, and a performance measurement.
- Do not use arbitrary color/timing values where tokens exist.
