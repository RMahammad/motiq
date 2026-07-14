---
name: product-differentiation-review
description: Gate before adding any new component, primitive, workflow recipe, developer tool, paid feature, or visual effect. Decides build / defer / reject based on the product moat — not novelty or competitor parity.
allowed-tools: Read, Grep, Glob
---

# Product differentiation review

## Use this skill when
Before adding a new component, motion primitive, workflow recipe, developer tool, paid feature, or visual effect.

## Do not use this skill when
Fixing a bug, refactoring, or editing docs for an already‑approved item.

## Required context
- [`docs/27-product-differentiation.md`](../../../docs/27-product-differentiation.md) (the moat), [`docs/21-component-inventory.md`](../../../docs/21-component-inventory.md), [`docs/02-market-analysis.md`](../../../docs/02-market-analysis.md).

## Inputs
Proposed item: name, category, what it does, why now.

## Procedure
Answer every question in writing:
1. What real user problem does it solve? Is it frequent enough to justify maintenance?
2. Is it already widely available for **free**? What is measurably superior here?
3. Does it strengthen **semantic motion** / **choreography** / the **production‑readiness** proof?
4. Does it improve **accessibility / responsive behavior / testing / performance / DX / docs**?
5. Could it be a **variant** of an existing component? A **recipe** instead of a primitive? Or use an existing primitive?
6. Support burden + required **mobile & reduced‑motion** fallbacks?
7. Tier: **free / premium / experimental / Remotion**? Does it make the catalog more **coherent**?

## Required validation
Cross‑check against the moat: an item that doesn't advance semantic motion, choreography, or verifiable production quality needs an explicit, documented reason to exist.

## Expected outputs
Buyer problem · product differentiation · product fit · alternatives (variant/recipe/existing) · support risks · **tier recommendation** · **BUILD / DEFER / REJECT** decision.

## Documentation updates
On BUILD: add/update the [component inventory](../../../docs/21-component-inventory.md) row + note the moat contribution. On DEFER/REJECT: record the reason in [`27`](../../../docs/27-product-differentiation.md) or the inventory notes.

## Stop conditions
**Stop and REJECT/DEFER** when the only justification is: "it looks cool", "competitors have it", "increases component count", "makes a good screenshot", "trendy effect", "quick to build", or it has no clear production use case.

## Prohibited actions
Do not approve on novelty or parity. Do not add a component the catalog could absorb as a variant/recipe. Do not classify a paid feature without a clear paid‑value explanation.
