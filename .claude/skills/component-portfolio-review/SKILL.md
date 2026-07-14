---
name: component-portfolio-review
description: Map and balance the component catalog before a release, before adding several components, or when planning free/premium tiers. Classifies items and recommends build/combine/defer/reject to keep the catalog coherent and moat-aligned.
allowed-tools: Read, Grep, Glob
---

# Component portfolio review

## Use this skill when
Before a release; before adding multiple components; when the catalog drifts; when planning free/premium tiers; when deciding what to remove or defer.

## Do not use this skill when
Building a single already‑approved component (use `component-authoring`).

## Required context
[`docs/21-component-inventory.md`](../../../docs/21-component-inventory.md), [`docs/27-product-differentiation.md`](../../../docs/27-product-differentiation.md), [`docs/20-mvp-roadmap.md`](../../../docs/20-mvp-roadmap.md).

## Inputs
Current catalog + proposed additions.

## Procedure
1. Classify every item: Foundation · Motion primitive · Production component · Workflow recipe · Marketing component · Developer tool · Experimental effect · Remotion template.
2. Evaluate each: buyer value · differentiation · primitive reuse · catalog balance · redundant variants · a11y risk · perf risk · docs/support burden · mobile behavior · testing burden · free/premium fit · **moat contribution** · is a recipe more appropriate than a component? · can an existing component absorb it?
3. Identify gaps, redundancies, and rebalancing (combine variants; convert effects to recipes).

## Required validation
The recommended catalog must skew toward semantic motion, choreography, recipes, and tooling — not isolated effects or count‑padding.

## Expected outputs
Catalog map · gaps · redundancies · build · combine · defer · reject · free‑tier recommendation · premium‑tier recommendation · next‑release recommendation.

## Documentation updates
Update [`docs/21-component-inventory.md`](../../../docs/21-component-inventory.md) and the free/premium split in [`docs/20-mvp-roadmap.md`](../../../docs/20-mvp-roadmap.md).

## Stop conditions
Stop if additions would make the catalog a generic effect gallery or duplicate existing primitives.

## Prohibited actions
Do not recommend components purely for count or competitor parity. Do not leave redundant variants unconsolidated.
