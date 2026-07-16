---
name: rapid-component-release
description: The default lightweight workflow for shipping a catalog component fast — one short brief, build, wire registry + preview + concise docs, run the 12-point release gate (renders, interactions work, responsive, light/dark, reduced motion, semantics/keyboard, typecheck, docs build, registry validates, clean-fixture install, no console/hydration errors, original + safe), mark Released or Experimental, move on. Replaces the heavy per-component signature process for ordinary catalog items.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Rapid component release

The **default** production path for catalog components. Use it to grow a broad, original, useful catalog quickly on a lightweight production baseline. Reserve the heavy gates (three concepts, independent originality + `premium-visual-review`, exhaustive evidence) for **homepage centerpieces and complex Pro creative pieces** ([`docs/36`](../../../docs/36-premium-creative-component-strategy.md)). Plan/waves: [`docs/38`](../../../docs/38-component-expansion-plan.md) · board: [`docs/39`](../../../docs/39-catalog-production-board.md).

## Use this skill when

- Building a workflow/product component (AI, dev-tools, collaboration, data, commerce, file, security, productivity, communication, spatial, mobile, onboarding, marketing).
- Building a supporting/foundation component that just needs to be polished, useful, and safe.

## Do not use this skill when

- The component is a homepage hero centerpiece or a complex Pro creative visual effect → use the signature pipeline (`signature-component-conception` → `originality-review` → `premium-visual-review`).

## Fast brief (≤ 1 page, before coding)

Name · Problem · Use case · Main states · Main animation · Accessibility requirement · Mobile behavior · API sketch · Dependencies · Similarity concern · Free/Pro. **Do not** produce three concepts unless it's a major Pro visual effect or homepage centerpiece.

## Build steps

1. Read the short brief.
2. Implement the original component in `packages/registry/registry/<category>/<slug>.tsx` (`"use client"` if it uses hooks/motion). Reuse the shared foundations (`@/lib/motionstack`: `useReducedMotion`, `useVisibilityPause`, `formatNumber`, `useAnimatedNumber`) and `@/lib/utils` `cn` instead of re-implementing them. Keep heavy/creative deps component-local; core boundary rules still apply (no `next/*`, Node built-ins, or `remotion`).
3. Add realistic **clearly-fictional** sample content.
4. Create the live preview `apps/docs/app/_previews/<slug>.tsx` (self-contained, imports the component, component dominates the stage) and register it in `_previews/index.tsx` (`previewMap`).
5. Add practical, working controls to the preview (every control must do something real).
6. Add registry metadata to `packages/registry/registry.json` (+ regenerate) and a catalog entry in `apps/docs/lib/catalog.ts`.
7. Add concise docs in `apps/docs/lib/docs-content.ts` (`usage`, `api`, `accessibility`, `performance`).

## The release gate (all 12 required for **Released**)

1. Renders correctly in the real docs app.
2. Its main interactions work.
3. Works in desktop **and** mobile layouts.
4. Light **and** dark mode where applicable.
5. Reasonable reduced-motion fallback.
6. Correct basic semantics + keyboard behavior where interactive.
7. `pnpm typecheck` passes.
8. The docs app builds (`next build`).
9. The registry item validates (`node packages/registry/scripts/validate-registry.mjs`).
10. Installs into a clean fixture with **no internal imports** (`next/*`, Node built-ins, `remotion`).
11. No console or hydration errors.
12. Implementation is original and commercially safe (quick check vs major libraries; record any similarity concern; clean-room only).

Verify 1–6 and 11 by **rendered interaction** in the docs app (Playwright/`scripts/shoot.mjs` is enough — no full browser matrix, no dozens of screenshots). Run 7–10 as commands.

## Tests — targeted, not exhaustive

Write automated tests **only** when the component has: complex state logic, focus management, async behavior, drag/reorder, financial/destructive actions, is a shared primitive, or has already regressed. Then test the **critical logic only** (plus one axe pass). For ordinary visual components, rendered interaction verification replaces a large test suite. Do not write tests to chase coverage numbers.

## Documentation standard (concise)

Large live preview · short description · real use case · install command · minimal example · API table · main states · accessibility note · reduced-motion note · dependency note · Free/Pro. Complex workflow components may add: state model, integration example, controlled usage, events, error handling. No long essays for small components.

## Finish

- Mark **Released** (passes the gate) or **Experimental** (shipped but rough/flagged) in [`docs/39`](../../../docs/39-catalog-production-board.md).
- Do **not** assign subjective Category-leading / Strongly-Sellable labels here.
- Move immediately to the next component. Parallel development across unrelated categories is allowed when components don't edit the same shared primitive, registry entry, or unfinished shared API — run a `catalog-consistency-review` after each batch.

## Prohibited

- Calling a component Released without the 12-point gate (esp. clean-fixture install + no forbidden imports).
- Deceptive content: fake AI-capability claims, manipulative scarcity/fake countdowns, fake security guarantees, fake testimonials/logos/metrics, or triggering device haptics without app control.
- Copying competitor implementations, names, or exact effects.
- Letting one component's weakness block unrelated catalog work.
