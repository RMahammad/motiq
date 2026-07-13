---
name: design-system-consistency
description: Enforce visual and motion consistency when creating/modifying a visual component, adding a variant or token, or changing typography/spacing/radius/color/shadow/motion, or building a marketing section. Ensures token reuse, full state coverage, and theme correctness.
allowed-tools: Read, Edit, Grep, Glob, Bash
---
# Design-system consistency

## Use this skill when
- Creating or modifying a visual component; adding a variant; adding tokens; changing typography, spacing, radius, color, shadow, or motion; creating a marketing section; reviewing visual inconsistencies.

## Do not use this skill when
- The change is purely logical/behavioral with no visual or motion surface.

## Required context
- [`docs/10-design-tokens.md`](../../../docs/10-design-tokens.md)
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md)
- [`docs/11-tailwind-strategy.md`](../../../docs/11-tailwind-strategy.md)
- Existing tokens (`packages/tokens` once it exists).
- At least **two similar existing components** and the reference component ([`Reveal`/`AnimatedDialog`](../../../docs/09-component-api-standard.md)).
- Supporting: [`state-matrix.md`](./state-matrix.md), [`visual-review-checklist.md`](./visual-review-checklist.md).

## Inputs
- The component/section/token being added or changed.

## Procedure
1. Identify the **existing visual pattern** being extended; match it.
2. **Reuse existing semantic tokens** (color, space, radius, border, shadow, typography).
3. Check **motion** — duration, easing, distance, intensity — all from tokens ([`10`](../../../docs/10-design-tokens.md)).
4. Check **light, dark, high-contrast (forced-colors), reduced-motion** behavior.
5. Check **all component states** (see [`state-matrix.md`](./state-matrix.md)): default, hover, focus-visible, active, disabled, loading, error, selected/expanded where relevant.
6. Check **responsive behavior** across breakpoints.
7. Check **composition** with surrounding components (spacing rhythm, alignment).
8. **Add a token only** when an existing semantic token cannot express the design.
9. **Document any new token** and its intended scope in [`10-design-tokens.md`](../../../docs/10-design-tokens.md).
10. **Add visual-regression coverage** where appropriate.

## Required validation
- Run through [`visual-review-checklist.md`](./visual-review-checklist.md).
- No dynamically constructed Tailwind classes ([`11`](../../../docs/11-tailwind-strategy.md)).
- Dark mode is not a naive inversion — contrast re-checked ([`12`](../../../docs/12-accessibility-standard.md)).

## Expected outputs
- Consistency review notes.
- Token changes (with scope docs).
- State-coverage confirmation.
- Responsive + accessibility findings.
- Visual-test updates.
- Documentation updates (hand off to [`documentation-maintenance`](../documentation-maintenance/SKILL.md) if tokens changed).

## Stop conditions
- A design requires a genuinely new token category not in [`10`](../../../docs/10-design-tokens.md) → stop and propose it via an ADR update ([ADR-0012](../../../docs/adrs/0012-design-token-contract.md)).
- A change would mutate a shared token to fix one component → stop.

## Prohibited actions
- One-off hex colors when a semantic token exists.
- Arbitrary radius, shadow, spacing, duration, or easing values.
- Creating a token named after one component when the concept is reusable.
- Changing shared tokens merely to fix one component.
- Using animation as the only way to communicate state.
- Making dark mode a simple color inversion without reviewing contrast.
- Adding a visual variant with no real buyer use case.
