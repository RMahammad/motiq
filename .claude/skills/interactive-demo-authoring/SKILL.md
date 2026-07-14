---
name: interactive-demo-authoring
description: Author live, controllable demos (homepage stages, doc previews, playgrounds, the Motion Laboratory, recipe previews) using real components and real controls that all work — with reduced-motion, keyboard access, responsive preview, synced code, and tests.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Interactive demo authoring

## Use this skill when
Building homepage live stages, documentation previews, interactive playgrounds, the Motion Laboratory, component examples, or recipe previews.

## Do not use this skill when
Writing static prose docs, or a non-interactive component.

## Required context
[`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md), [`docs/12`](../../../docs/12-accessibility-standard.md), [`docs/13`](../../../docs/13-performance-standard.md), [`docs/28-visual-direction.md`](../../../docs/28-visual-direction.md). Compose real components from `@scope/*`.

## Inputs
The component/recipe to demo + the controls to expose (intent, intensity, reduced‑motion, theme, viewport, replay).

## Procedure
1. Use a **real production component** on the stage — never a screenshot or fake dashboard.
2. Define a **control schema**; every control must **actually work** (no control present unless functional).
3. Deterministic initial state; **replay** re‑runs the sequence; **reduced‑motion** mode reflects the real reduced path; keyboard‑accessible controls with visible focus.
4. Responsive + mobile preview; theme preview.
5. **Synchronize the code panel to the active controls** (the code is the readout).
6. Show real install/package/import/SSR/boundary/bundle info — no fake metrics.
7. Keep the page mostly server‑rendered; the interactive demo is a **lazy client island** with a safe boundary and cleanup.
8. Add Storybook coverage + interaction/a11y/reduced‑motion/cleanup tests.

## Required validation
The demo must remain understandable **with animation disabled**. Controls verified to work. axe = 0. `prefers-reduced-motion` respected. Cleanup verified (no leaked observers/timers/listeners).

## Expected outputs
Demo implementation · control schema · code‑generation mapping · a11y behavior · reduced‑motion behavior · responsive behavior · test coverage · performance findings · documentation updates.

## Documentation updates
Update the component page / homepage section + [`docs/15-documentation-strategy.md`](../../../docs/15-documentation-strategy.md) if the pattern changes.

## Stop conditions
Stop if any control is decorative (non‑functional), the demo breaks under reduced motion, or it forces the whole page into a client component.

## Prohibited actions
No fake controls, no fake metrics, no unnecessary `"use client"` on the whole page, no motion that delays access to content or can't be interrupted.
