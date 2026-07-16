---
name: catalog-integration
description: Integrate a component into the shared catalog and keep the catalog internally consistent — reconcile registry/inventory/docs/previews, confirm moat fit and free/Pro tier, and validate.
allowed-tools: Read, Grep, Glob, Bash
---

# Catalog integration

Single skill for wiring an already-built component into the shared catalog and reconciling the catalog against its sources of truth. Merges consistency review (core), differentiation fit, and portfolio/tier balance.

## When to use
- Integrating a built component's shared entries (registry, catalog data, docs, previews, tsconfig aliases, pack/block defs).
- Auditing the catalog for drift after a batch — an entry present in one index and missing from another, wrong deps, wrong tier, or stale status.
- Confirming an item's moat fit and free/Pro placement as part of integration.

> The component inventory is **FROZEN**. This skill integrates and reconciles existing items; it does not propose or greenlight new ones. If a differentiation question arises, record it as a finding — do not add or remove catalog items here.

## Inputs
- Component name/slug, category, tier intent, and release status.
- Its isolated files (source, targeted test, brief, preview module) already present.
- Canonical docs: [`../../../docs/21-component-inventory.md`](../../../docs/21-component-inventory.md) (frozen inventory), [`../../../docs/39-catalog-production-board.md`](../../../docs/39-catalog-production-board.md) (status board), [`../../../docs/27-product-differentiation.md`](../../../docs/27-product-differentiation.md) (moat), [`../../../docs/registry-authoring.md`](../../../docs/registry-authoring.md) (registry rules).

## Steps
1. **Moat & tier fit.** Confirm the item advances semantic motion / choreography / production quality per [`27`](../../../docs/27-product-differentiation.md), and that its free/Pro tier and category match its inventory row. Record mismatches as findings; do not re-litigate whether it should exist (inventory frozen).
2. **Integrate shared indexes (orchestrator only).** Wire each, once, avoiding racing edits: `packages/registry/registry.json`, `apps/docs/lib/catalog.ts`, `apps/docs/lib/docs-content.ts`, `apps/docs/app/_previews/index.tsx`, both tsconfig `paths` maps (`apps/docs/tsconfig.json` + `packages/registry/tsconfig.json`), and any pack/block defs. Follow [`registry-authoring.md`](../../../docs/registry-authoring.md).
3. **Per-item consistency checks.** For the integrated item(s) verify: correct **category**; **naming** matches convention; real live **preview** present and comparable to peers; **metadata** complete; **API** consistent with the standard; **docs entry** (usage, props, a11y/perf) present; **install command** generated from config, not hardcoded; **registry entry** exists and matches; **dependencies accurate** (no `motion` on CSS-only items); **tier** set and consistent; **release status** on the board matches reality; **search indexing** discoverable via catalog filters.
4. **Cross-index reconciliation.** Every item appears in registry.json, catalog.ts, docs-content.ts, and the previews index — none in one and absent from another. Dep lists match actual imports. Block/pack `registryDependencies` resolve.
5. **Balance pass.** Note redundant variants or category gaps as findings for the frozen board; do not consolidate or add items in this skill.

## Completion criteria
- Integrated item passes every per-item check in step 3.
- No index-membership drift; every catalog surface agrees.
- Tier and release status match the inventory row and board.
- Validation commands below pass.

## Required validation
- `node scripts/check-catalog-quality.mjs`
- `node packages/registry/scripts/build-registry.mjs`
- `pnpm docs:check`

## Output format
- Per-item pass/fail table across the step-3 checks.
- Drift list: index-membership mismatches, dep inaccuracies, tier/status/category conflicts.
- Concrete fixes applied (or precise fixes required, with file paths).
- Validation command results.

## Non-goals
- Proposing, adding, or removing catalog items (inventory frozen — record as findings).
- Building or redesigning a component (`rapid-component-release`, authoring skills).
- Visual/motion approval (`component-sellability-review`, `premium-visual-review`).
- Duplicating inventory/board content into other files — one canonical owner; update via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).
