---
name: catalog-consistency-review
description: Checklist review of the component catalog for consistency — category, naming, preview quality, metadata completeness, API structure, docs, install command, registry entry, accurate dependencies, search indexing, free/Pro classification, and visual/responsive consistency.
allowed-tools: Read, Grep, Glob, Bash
---

# Catalog consistency review

## Use this skill when
Auditing the catalog for consistency — after adding several components, before a release, or when catalog entries have drifted.

## Do not use this skill when
Deciding whether an item should exist (use [`product-differentiation-review`](../product-differentiation-review/SKILL.md)) or planning tiers/balance (use [`component-portfolio-review`](../component-portfolio-review/SKILL.md)).

## Required context
- [`docs/21-component-inventory.md`](../../../docs/21-component-inventory.md) — canonical inventory.
- [`packages/registry/registry.json`](../../../packages/registry/registry.json) — registry entries.

## Inputs
The catalog scope to review (all components, or a named subset).

## Procedure
For each component, check:
1. **Category** — correct and consistent with siblings.
2. **Naming** — follows the naming convention used across the catalog.
3. **Preview quality** — real live preview, comparable polish to peers.
4. **Metadata completeness** — all required registry fields present.
5. **API structure** — consistent with the component API standard.
6. **Docs completeness** — usage, props, a11y/perf notes present.
7. **Install command** — present and generated from config (not hardcoded).
8. **Registry entry** — exists and matches the component.
9. **Dependencies accuracy** — listed deps are correct; **no `motion` listed on CSS‑only items**.
10. **Search indexing** — discoverable via catalog search/filters.
11. **Free / Pro classification** — set and consistent.
12. **Visual consistency** — tokens, spacing, states match siblings.
13. **Responsive behavior** — usable and consistent at mobile widths.

## Required validation
Reconcile every component against BOTH [`registry.json`](../../../packages/registry/registry.json) and [`docs/21-component-inventory.md`](../../../docs/21-component-inventory.md); no entry appears in one and not the other; dependency lists match actual imports.

## Expected outputs
Per‑component pass/fail table across the 13 checks · list of drift/inconsistencies · concrete fixes (or fix them where in scope).

## Documentation updates
Correct rows in [`docs/21-component-inventory.md`](../../../docs/21-component-inventory.md) and entries in [`registry.json`](../../../packages/registry/registry.json) via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- Stop if a component exists in the registry but not the inventory (or vice versa) — resolve the source of truth before continuing.
- Stop if a dependency list cannot be reconciled with actual imports.

## Prohibited actions
- Do not list `motion` (or any unused dependency) on a CSS‑only component.
- Do not mark an item Free/Pro inconsistently with its inventory row.
- Do not paste inventory content into other files; keep one canonical owner.
