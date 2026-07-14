---
name: competitive-library-review
description: Research a reference component/motion library from its official sources before deciding what to adopt — captures product model, taxonomy, install, preview UX, and licensing, and separates patterns to adopt from patterns not to copy.
allowed-tools: Read, Grep, Glob, WebFetch, WebSearch
---

# Competitive library review

## Use this skill when
Studying a reference product (component library, motion kit, template marketplace) to inform our product model, taxonomy, install flow, preview UX, or pricing — before a homepage/catalog decision or a differentiation review.

## Do not use this skill when
Building or copying a specific component, or evaluating a runtime dependency (use [`dependency-review`](../dependency-review/SKILL.md)).

## Required context
- [`docs/31-competitive-product-review.md`](../../../docs/31-competitive-product-review.md) — canonical output location for this research.
- [`docs/27-product-differentiation.md`](../../../docs/27-product-differentiation.md) (the moat), [`docs/02-market-analysis.md`](../../../docs/02-market-analysis.md).

## Inputs
Reference product name + its official URLs (site, docs, pricing, license, repo).

## Procedure
1. Confirm the **official** sources only (product's own site/docs/repo/pricing/license). Discard third‑party rehosts and mirrors.
2. Capture the **product model**: free vs paid, open‑source vs commercial, one‑off vs subscription, what the buyer actually pays for.
3. Capture the **taxonomy**: how components/effects are categorized, named, and grouped.
4. Capture the **install approach**: copy‑paste, CLI/registry, npm package, or template download.
5. Capture the **preview UX**: live demo vs static, controls, code display, theming, responsiveness.
6. Capture the **licensing terms** verbatim (quote sparingly, attribute, link) — note redistribution/resale limits.
7. Separate **patterns to adopt** (mechanics, DX, structure) from **patterns NOT to copy** (their code, branding, copy, proprietary assets).
8. Write **recommendations** tied to our moat: what strengthens semantic motion / choreography / production‑readiness, and what to explicitly avoid.

## Required validation
Every claim is sourced to an official URL with a verification date. Adopt‑vs‑avoid list distinguishes mechanics (fair to learn from) from expression (do not copy).

## Expected outputs
Product model · taxonomy · install approach · preview UX · licensing summary · adopt vs NOT‑copy patterns · recommendations — recorded in [`docs/31-competitive-product-review.md`](../../../docs/31-competitive-product-review.md).

## Documentation updates
Add/update the reviewed product's entry in [`docs/31-competitive-product-review.md`](../../../docs/31-competitive-product-review.md); cross‑link any moat implication into [`docs/27-product-differentiation.md`](../../../docs/27-product-differentiation.md).

## Stop conditions
- Stop if the only available source is a third‑party rehost — find the official source or mark the claim unverified.
- Stop if a licensing term is ambiguous — record the ambiguity, do not guess.

## Prohibited actions
- Do not copy competitor code, markup, class names, copy, or branding.
- Do not present license interpretations as legal advice; summarize terms and link to the source.
- Do not record unsourced claims or third‑party summaries as fact.
