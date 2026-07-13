# Design review checklist

> Canonical standards: [`10-design-tokens.md`](../10-design-tokens.md) · [`11-tailwind-strategy.md`](../11-tailwind-strategy.md) · [`09-component-api-standard.md`](../09-component-api-standard.md). Skill: [`design-system-consistency`](../../.claude/skills/design-system-consistency/SKILL.md).

## Token consistency
- [ ] Reuses existing **semantic tokens** (color, space, radius, border, shadow, typography)
- [ ] Reuses existing **motion tokens** (duration, easing, distance, intensity)
- [ ] No one-off hex/radius/shadow/spacing/duration/easing where a token exists
- [ ] Any new token expresses a **reusable** concept (not named after one component)
- [ ] Did NOT mutate a shared token to fix one component

## State coverage
- [ ] Default
- [ ] Hover
- [ ] Focus-visible
- [ ] Active
- [ ] Disabled
- [ ] Loading
- [ ] Error
- [ ] Selected / expanded (where relevant)

## Theme & modes
- [ ] Light
- [ ] Dark (contrast re-checked, not a naive inversion)
- [ ] High-contrast / forced-colors
- [ ] Reduced-motion

## Layout
- [ ] Responsive across breakpoints
- [ ] Composes cleanly with surrounding components
- [ ] Alignment/spacing rhythm consistent with siblings

## Follow-ups
- [ ] Visual-regression coverage added where appropriate
- [ ] New tokens documented with intended scope ([`10`](../10-design-tokens.md))
- [ ] Animation is not the only signal of state
