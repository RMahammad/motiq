# ADR-0015: Semantic motion & choreography API

- Status: **Proposed**
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../27-product-differentiation.md`](../27-product-differentiation.md), [`../09-component-api-standard.md`](../09-component-api-standard.md), [`../06-animation-engine-decision.md`](../06-animation-engine-decision.md), [`../10-design-tokens.md`](../10-design-tokens.md)
- Supersedes: — · Superseded by: —

## Context
The moat ([ADR-0013](0013-product-moat.md)) requires authors to describe **intent** and **scenes**, not engine values. Today `Reveal`/`Stagger` accept semantic props (direction/distance/duration tokens) but there is no shared **intent vocabulary** or **choreography** primitive.

## Decision
Introduce a typed **semantic motion API** layered on the existing primitives:
- **Intent vocabulary** (typed union): `introduce`, `emphasize`, `confirm`, `dismiss`, `transition`, `reorder`, `expand`, `collapse`, `notify`, `progress`, `replace`, `focus`, `deemphasize` → each maps to token‑based duration/delay/easing/distance/scale/opacity/stagger/spring + reduced‑motion + mobile behavior.
- **Choreography primitives:** `MotionScene` + `MotionStep` (roles: `heading`/`supporting-content`/`product-preview`/`primary-action`/…) coordinating a section as one sequence; presets like `product-introduction`.
- Engine internals remain a **namespaced Level‑3 escape hatch** ([`09`](../09-component-api-standard.md#three-api-levels)); default API is intent‑first.
- Motion values come from `@scope/tokens` ([`10`](../10-design-tokens.md)); CSS‑first per the escalation rules ([`06`](../06-animation-engine-decision.md)).

## Decision drivers
Consistency across a team; safe‑by‑default; testable; themeable contract; no engine lock‑in at the surface.

## Alternatives considered
- **Expose Motion for React props directly** — rejected (the anti‑moat; couples the public API to the engine).
- **Per‑component timing props only** (status quo) — insufficient for choreography.

## Consequences
### Positive
The moat becomes real and typed; scenes replace ad‑hoc per‑child timing.
### Negative
New public surface to freeze before 1.0; intent→value mappings must be documented + tested.

## Risks and mitigations
- Vocabulary bikeshedding → start with the 13 listed intents; version the mapping ([H, `27`](../27-product-differentiation.md)).
- SSR/hydration flash → scenes render final/hidden state server‑side, animate after hydrate (existing pattern).

## Validation
Accept once `MotionScene`/`MotionStep` ship with SSR + reduced‑motion + choreography‑order tests and a documented intent→token mapping. A minimal `MotionScene`/`MotionStep` ships in the 2026‑07‑14 redesign as the first slice.

## Revisit conditions
If the intent set proves too coarse/fine in real recipes, or a spring‑based engine path is needed for a class of scenes.

## Sources
[`27`](../27-product-differentiation.md), [`09`](../09-component-api-standard.md), [`06`](../06-animation-engine-decision.md).
