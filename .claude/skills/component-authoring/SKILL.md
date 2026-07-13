---
name: component-authoring
description: Author or substantially change an interactive component in @scope/react or @scope/sections to project standards. Requires a proposal, primitive reuse, three-level API, accessibility, tests, stories, docs, exports, and a changeset.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---
# Component authoring

## Use this skill when
- Creating a new interactive component, or changing a component's public API.

## Do not use this skill when
- Building a low-level motion primitive → use [`motion-primitive-authoring`](../motion-primitive-authoring/SKILL.md).
- Building a marketing section → use [`animated-section-authoring`](../animated-section-authoring/SKILL.md).
- Making an internal refactor with no public-API/behavior change.

## Required context
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md) (the contract)
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md)
- [`docs/10-design-tokens.md`](../../../docs/10-design-tokens.md) + [`docs/11-tailwind-strategy.md`](../../../docs/11-tailwind-strategy.md)
- `packages/motion` — reuse existing primitives; do NOT reinvent `Reveal`/`Stagger`/`InView`.
- The nearest existing sibling component for house style.
- Supporting: [`component-checklist.md`](./component-checklist.md), [`proposal-template.md`](./proposal-template.md).

## Inputs
- A filled-out [proposal](./proposal-template.md).

## Answer before implementing (gate)
- Does an existing component already solve this? (If yes — stop and reuse.)
- Can this be a **variant** instead of a new component?
- Can an existing **motion primitive** provide the behavior?
- Is it production-useful or merely visually novel?
- Which tier/package: free, premium, experimental, or Remotion?

## Procedure
1. Write the proposal ([template](./proposal-template.md)); confirm the gate answers.
2. Implement: `"use client"` if it uses hooks/motion; `forwardRef` to the primary node; semantic HTML; three-level API with a namespaced `motionProps` escape hatch ([`09`](../../../docs/09-component-api-standard.md#three-api-levels)).
3. Reduced-motion fallback: final-state render, still functional.
4. Use **Radix** for any overlay/menu/tabs/tooltip behavior ([ADR-0011](../../../docs/adrs/0011-accessible-primitives.md)).
5. Style via CVA (no dynamic class strings) + `data-slot` hooks + CSS vars ([`11`](../../../docs/11-tailwind-strategy.md)); run [`design-system-consistency`](../design-system-consistency/SKILL.md).
6. Storybook stories: default, dark, custom-theme, reduced-motion.
7. Tests: interaction (RTL/`play`), axe (0 violations), SSR render, reduced-motion.
8. Update package `exports` (+ subpath).
9. Bundle-size check within budget ([`13`](../../../docs/13-performance-standard.md)).
10. Add a docs page ([template](../../../docs/templates/component-documentation-template.md)); update [`21-component-inventory.md`](../../../docs/21-component-inventory.md).
11. `pnpm changeset`.

## Required validation
Run [`component-checklist.md`](./component-checklist.md). Then run the review skills: [`api-consistency-review`](../api-consistency-review/SKILL.md), [`accessibility-review`](../accessibility-review/SKILL.md), [`testing-review`](../testing-review/SKILL.md), and [`performance-review`](../performance-review/SKILL.md) for anything effect-heavy. Confirm the [interactive-component Definition of Done](../../../docs/25-definition-of-done.md#interactive-component).

## Expected outputs
Component + public types + story + tests + docs page + export update + inventory update + changeset.

## Documentation updates
- Component doc page + [`21-component-inventory.md`](../../../docs/21-component-inventory.md) status (🔵→🟢). Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- Needs a new runtime dependency → [`dependency-review`](../dependency-review/SKILL.md).
- Needs a new animation engine or Remotion → stop; that's an architectural decision (ADR).
- Would weaken accessibility to ship → stop.

## Prohibited actions
- Reinvent primitives; expose raw Motion internals as the only API; skip reduced-motion; add dynamic Tailwind classes; import Remotion/node/next into `@scope/react`; ship without tests+stories+docs.
