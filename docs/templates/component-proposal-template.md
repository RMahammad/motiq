# Component proposal — <ComponentName>

> Fill this out **before** implementation. Used by the [`component-authoring`](../../.claude/skills/component-authoring/SKILL.md) skill.

## Summary
One-line description.

## Buyer use case
Who buys this and for what page/product? Is it production-useful or merely visually novel?

## Reuse analysis (answer all)
- [ ] Does an existing component already solve this? If yes, name it — stop.
- [ ] Can this be a **variant** of an existing component instead of a new component?
- [ ] Can an existing **motion primitive** provide the behavior? Which?
- [ ] Which package/tier: `@scope/react` (free/premium), `@scope/sections`, experimental, or `@scope/remotion`?

## API design (three levels)
- **Level 1 (semantic props):** …
- **Level 2 (tokens/presets):** …
- **Level 3 (escape hatch):** `motionProps` / …

## Accessibility model
Keyboard, focus, roles/states, reduced-motion, primitive used (Radix?).

## Motion
Engine per [escalation rules](../06-animation-engine-decision.md#escalation-rules--when-each-engine-is-allowed); tokens used; reduced-motion fallback.

## Risks
A11y risk / perf risk / mobile behavior / SSR notes.

## Definition of done
Link: [`25-definition-of-done.md`](../25-definition-of-done.md) → Interactive component.
