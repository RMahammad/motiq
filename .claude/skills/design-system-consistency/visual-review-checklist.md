# Visual review checklist

Mirror of [`docs/templates/design-review-checklist.md`](../../../docs/templates/design-review-checklist.md) for in-skill use. Canonical tokens: [`docs/10-design-tokens.md`](../../../docs/10-design-tokens.md).

- [ ] Reuses semantic tokens (color/space/radius/border/shadow/typography)
- [ ] Reuses motion tokens (duration/easing/distance/intensity)
- [ ] No one-off values where a token exists
- [ ] New token (if any) expresses a reusable concept + documented scope
- [ ] Did not mutate a shared token for a single component
- [ ] All states covered ([state-matrix.md](./state-matrix.md))
- [ ] Light / dark (contrast re-checked) / forced-colors / reduced-motion
- [ ] Responsive across breakpoints
- [ ] Composes cleanly with siblings (spacing/alignment rhythm)
- [ ] Animation is not the only signal of state
- [ ] Visual-regression coverage added where appropriate
