---
name: preview-authoring
description: Build and iterate live previews across the docs site — large working preview, controls mapped to real props, generated install command, and the render/critique/fix loop until no critical or major visual issues remain.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Preview authoring

Single skill for building and iterating live previews: component showcase/detail pages, homepage stages, playgrounds, blocks, and packs. Canonical standard: [`../../../docs/preview-authoring.md`](../../../docs/preview-authoring.md). Showcase identity: [`../../../docs/30-showcase-visual-system.md`](../../../docs/30-showcase-visual-system.md). Do not duplicate those docs — follow them.

## When to use
Building or reworking any live preview: a component detail page, a catalog card preview, a homepage stage, an interactive playground, a block, or a pack overview. Also use for the render-and-critique loop after any change to a component's rendered output.

## Do not use when
Authoring the component implementation itself (use the authoring skill), or writing static prose docs with no interactive/rendered surface.

## Inputs
- The component/recipe/block to preview + its real props, variants, and states.
- The preview type (see table in the canonical doc): homepage · catalog card · detail · block · pack.
- The controls to expose (intent, intensity, reduced-motion, theme, viewport, replay).
- `product.config.json` (brand/namespace + install command), `packages/registry/registry.json` (metadata/dependencies).

## Steps
1. Pick the preview **type** and size it per the canonical doc — never reuse a full detail preview inside a small card; cards get a purpose-built compact preview where the component dominates.
2. Author the adapter in `apps/docs/app/_previews/`; render the **real** component — never a screenshot, fake dashboard, or fake metric.
3. Use **deterministic data** — no `Math.random()`/`Date.now()` in render; seed fixed data so SSR and CSR match.
4. Wire **working controls**: every visible control maps to a real prop and changes real output. No control unless it is functional.
5. For detail pages, present **preview + code together**; sync the code panel to the active control state.
6. Generate the **install command from `product.config.json`** — never hardcode the brand or a placeholder `@scope/*` in visitor-facing output.
7. Make it **accessible**: keyboard operable, visible focus, reduced-motion path reflects the real reduced behavior; give the preview its own Light/Dark toggle. Add a **replay** control for animated previews.
8. Make it **responsive** (preview + controls usable at mobile widths) and **theme-correct** in light and dark.
9. **Pause continuous animation when offscreen**; **lazy-load** heavy/complex previews as client islands with cleanup — no preview-only dependency loads globally.
10. Keep the page mostly server-rendered; keep preview code out of the component's registry source.
11. **Render-critique-fix loop:** run `apps/docs`, open the route, capture states across desktop/mobile × light/dark plus interaction/focus/reduced-motion, critique (hierarchy, motion, spacing, typography, responsiveness, theme, keyboard), fix the highest-impact issues, re-render, and repeat until no critical or major visual issue remains.

## Completion criteria
Real component rendered · deterministic data · every control mutates real output · code synced to controls (detail) · install command from `product.config.json` · keyboard + visible focus + reduced-motion + Light/Dark toggle · responsive · offscreen-pause · heavy previews lazy · no critical/major visual issues outstanding.

## Required validation
- Preview understandable with animation disabled; `prefers-reduced-motion` respected.
- Every control verified to change real output; no fake controls or metrics.
- No hardcoded brand/namespace or placeholder `@scope/*` shown to visitors.
- Cleanup verified (no leaked observers/timers/listeners); offscreen animation pauses.
- Screenshots persisted to `artifacts/component-reviews/<slug>/` (e.g. via `node scripts/shoot.mjs <slug>`) — desktop/mobile × light/dark, interaction, focus, reduced-motion; keep `before-*` to diff. Confirm with `visual-quality-gate`.

## Output format
Preview adapter in `apps/docs/app/_previews/` · control schema mapped to real props · synced code (detail) · generated install command · a11y/reduced-motion/responsive behavior notes · persisted screenshots. Keep the registry entry and component inventory in sync via `documentation-maintenance`.

## Non-goals
No fake controls, metrics, or previews. No static image where a live preview is expected. No hardcoded install command, brand, or namespace. No page-wide `"use client"` to serve one island. No motion that delays access to content or cannot be interrupted. Do not mark a preview reviewed without persisted screenshots or without mobile and reduced-motion captures.
