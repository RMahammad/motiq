# Component authoring checklist

Canonical DoD: [`docs/25-definition-of-done.md`](../../../docs/25-definition-of-done.md#interactive-component). ⛔ = release-blocking.

- [ ] Proposal written; reuse gate answered (not a duplicate; not better as a variant)
- [ ] Three-level API per [`09`](../../../docs/09-component-api-standard.md); `forwardRef`; semantic HTML
- [ ] ⛔ `"use client"` correct and preserved in build
- [ ] Radix for overlay/menu/tabs/tooltip a11y
- [ ] ⛔ Reduced-motion fallback (final-state render, functional)
- [ ] Styling via CVA + `data-slot` + CSS vars; no dynamic Tailwind classes
- [ ] Stories: default / dark / custom-theme / reduced-motion
- [ ] Tests: interaction · ⛔ axe=0 · ⛔ SSR/hydration · reduced-motion
- [ ] ⛔ Size within budget
- [ ] Exports updated (+ subpath)
- [ ] Docs page created ([template](../../../docs/templates/component-documentation-template.md))
- [ ] Inventory updated ([`21`](../../../docs/21-component-inventory.md))
- [ ] Changeset added
- [ ] Review skills run: api-consistency, accessibility, testing (+ performance if effect-heavy)
