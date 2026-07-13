---
name: motion-primitive-authoring
description: Author a low-level motion primitive in @scope/motion (e.g. Reveal, Stagger, InView, ScrollProgress). Enforces a stable engine-agnostic API, token-based timing, SSR safety, cleanup, reduced motion, and a performance benchmark.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---
# Motion primitive authoring

## Use this skill when
- Creating or changing a low-level primitive in `@scope/motion` that other components build on.

## Do not use this skill when
- Building a full interactive component → [`component-authoring`](../component-authoring/SKILL.md).
- Building a section → [`animated-section-authoring`](../animated-section-authoring/SKILL.md).

## Required context
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md) (the `Reveal` reference)
- [`docs/10-design-tokens.md`](../../../docs/10-design-tokens.md)
- [`docs/06-animation-engine-decision.md`](../../../docs/06-animation-engine-decision.md) (escalation rules)
- [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md)

## Inputs
- The primitive's purpose and the higher-level components it will power.

## Procedure
1. Define a **stable semantic API** — no engine-specific object at the default (Level-1) surface. Expose the engine only via a namespaced Level-3 hatch.
2. Use the **lowest engine tier** that satisfies the need (CSS → WAAPI → Motion) per the [escalation rules](../../../docs/06-animation-engine-decision.md#escalation-rules--when-each-engine-is-allowed).
3. **Token-based timing** — durations/easings/distances/staggers from `@scope/tokens`, never raw values.
4. **SSR-safe initial output** — render final state; do not measure layout on first render; animate after hydrate.
5. **Cleanup** — every `IntersectionObserver`/timer/listener/`requestAnimationFrame` is torn down in the effect cleanup. Share observers where beneficial.
6. **Reduced motion** — honor `prefers-reduced-motion` automatically; respect the stricter of OS vs app intensity ([`10`](../../../docs/10-design-tokens.md#motion-intensity-modes)).
7. **Unit tests** for timing and visibility logic (mock IO/timers).
8. **Performance benchmark** against the motion-package budget.
9. Document **when NOT to use** the primitive.

## Required validation
- Unit tests pass (timing + visibility).
- SSR test: `renderToString` produces final markup; no hydration warning.
- Reduced-motion test: transform/opacity neutralized.
- Size within the `@scope/motion` budget ([`13`](../../../docs/13-performance-standard.md)).
- Run [`performance-review`](../performance-review/SKILL.md) and [`api-consistency-review`](../api-consistency-review/SKILL.md).

## Expected outputs
Primitive + public types + unit tests + SSR/reduced-motion tests + benchmark note + export update + docs ("when not to use").

## Documentation updates
- Update the primitives list in [`21-component-inventory.md`](../../../docs/21-component-inventory.md) and, if it changes the contract, [`09`](../../../docs/09-component-api-standard.md). Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- The primitive needs a higher engine tier than justified → reconsider ([`06`](../../../docs/06-animation-engine-decision.md)).
- It requires Node/Remotion/Next → stop (boundary violation).

## Prohibited actions
- Engine-specific public API at the default level.
- Raw timing values instead of tokens.
- Leaked observers/timers/rAF.
- Measuring layout on first render (SSR hazard).
