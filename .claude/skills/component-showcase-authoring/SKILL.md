---
name: component-showcase-authoring
description: Build a component doc/preview page — large live preview, working controls mapped to real props, preview+code presentation, an install command generated from product.config.json, responsive + theme + replay, metadata, free/Pro status, and a11y/perf notes.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

# Component showcase authoring

## Use this skill when
Building or substantially reworking a component's documentation/preview page in the docs site.

## Do not use this skill when
Authoring the component's implementation (use the relevant authoring skill) or building a multi‑control homepage stage/playground (use [`interactive-demo-authoring`](../interactive-demo-authoring/SKILL.md)).

## Required context
- [`product.config.json`](../../../product.config.json) — canonical brand/namespace + install command source.
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md), [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md), [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md), [`packages/registry/registry.json`](../../../packages/registry/registry.json).

## Inputs
Component name + its real props/variants.

## Procedure
1. Add a **large live preview** that renders the real component.
2. Add **working controls** mapped to REAL props — every control changes real output.
3. Present **preview + code** together (the code reflects the current control state).
4. Generate the **install command FROM `product.config.json`** — never hardcode a brand/namespace.
5. Make the page **responsive** (preview and controls usable at mobile widths).
6. Support **theme** switching (light/dark, tokens).
7. Add a **replay** control for animated components.
8. Show **component metadata** (category, dependencies) sourced from the registry.
9. Show **free / Pro status**.
10. Add **accessibility notes** (keyboard, reduced‑motion behavior).
11. Add **performance notes** (cost, mobile behavior) per [`docs/13`](../../../docs/13-performance-standard.md).

## Required validation
Every control mutates real output; install command matches `product.config.json`; no hardcoded `@scope/*` or placeholder brand shown to visitors; responsive + theme + replay verified. Confirm rendered result with [`visual-quality-gate`](../visual-quality-gate/SKILL.md).

## Expected outputs
Live preview · real working controls · synced preview+code · generated install command · responsive layout · theme support · replay · metadata · free/Pro status · a11y + perf notes.

## Documentation updates
Update the component doc page and its [component inventory](../../../docs/21-component-inventory.md) row; keep the registry entry ([`registry.json`](../../../packages/registry/registry.json)) in sync via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- **Stop** if any control does not change real output (no fake controls, no cosmetic sliders).
- **Stop** if any hardcoded brand/namespace or placeholder `@scope/*` would be shown to visitors — read it from `product.config.json`.

## Prohibited actions
- Do not fake controls, metrics, or previews.
- Do not hardcode the install command, brand, or namespace.
- Do not present a static image where a live preview is expected.
