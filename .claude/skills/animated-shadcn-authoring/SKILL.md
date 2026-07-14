---
name: animated-shadcn-authoring
description: Wrap a shadcn/Radix primitive with Motion the right way — a 15-step workflow that preserves accessibility, adds meaningful entrance/exit/state animation with reduced-motion, and ships registry metadata, a live preview, working controls, tests, and docs.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---

# Animated shadcn authoring

## Use this skill when
Building a component whose behavior belongs to an accessible shadcn/Radix primitive (dialog, popover, dropdown, tabs, accordion, tooltip, etc.) and you are adding motion on top of it.

## Do not use this skill when
Authoring an original creative effect with no accessible primitive underneath (use [`creative-component-authoring`](../creative-component-authoring/SKILL.md)), or a low‑level motion primitive (use [`motion-primitive-authoring`](../motion-primitive-authoring/SKILL.md)).

## Required context
- [`docs/adrs/0017-shadcn-primitive-foundation.md`](../../../docs/adrs/0017-shadcn-primitive-foundation.md) — Radix/shadcn foundation.
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md), [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md).
- [`packages/registry/registry.json`](../../../packages/registry/registry.json) — registry metadata + install source.

## Inputs
Target component name, the primitive it wraps, and the interaction it should animate.

## Procedure
1. **Identify the correct primitive** for the behavior (per ADR‑0017); do not hand‑roll one that Radix already provides.
2. **Reuse or install** that primitive rather than re‑implementing it.
3. **Preserve accessibility**: focus management, keyboard interaction, ARIA/semantics, and portal behavior stay intact.
4. **Identify the meaningful animated states** (open/closed, selected, expanded) — animate state, not decoration.
5. **Add an entrance** animation tied to the real state transition.
6. **Add an exit** animation (mount/unmount coordinated so exit actually plays).
7. **Add state / interaction** animation (hover, press, selected) where it clarifies the state change.
8. **Add reduced‑motion** behavior for every animation (no motion → instant, legible state change).
9. **Avoid unnecessary wrappers** — no extra DOM nodes that break the primitive's focus/portal/layout.
10. **Add registry metadata** to [`registry.json`](../../../packages/registry/registry.json) (name, category, dependencies, free/Pro).
11. **Add a live preview** on the component page.
12. **Add working controls** mapped to real props (no fake controls).
13. **Add tests** (interaction, accessibility, reduced‑motion, SSR as applicable).
14. **Add docs** (usage, props, a11y notes, install command).
15. **Validate a clean install** from the registry into a fresh consumer.

## Required validation
Keyboard + focus + screen‑reader behavior unchanged from the base primitive; exit animation plays; reduced‑motion path verified; `pnpm test` / `pnpm typecheck` / `pnpm lint` pass; clean‑install check succeeds. Hand a11y depth to [`accessibility-review`](../accessibility-review/SKILL.md) and motion to [`animation-quality-review`](../animation-quality-review/SKILL.md).

## Expected outputs
Animated component + preserved‑a11y proof · registry entry · live preview · working controls · tests · docs · clean‑install confirmation.

## Documentation updates
Update the component doc page and the [component inventory](../../../docs/21-component-inventory.md) row; if the primitive foundation choice changes, update [ADR‑0017](../../../docs/adrs/0017-shadcn-primitive-foundation.md) via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- **Stop** if you begin re‑implementing accessible primitive behavior (focus trap, roving tabindex, typeahead, dismiss‑on‑escape) without a documented reason — reuse the primitive instead.
- Stop if animation requires removing the portal or breaking focus restoration.

## Prohibited actions
- Do not reduce or bypass the primitive's accessibility to make an animation easier.
- Do not add wrapper elements that alter focus order or portal placement.
- Do not ship without a reduced‑motion path, tests, and a verified install.
