---
name: component-sellability-review
description: Review a rendered component for commercial visual quality, motion quality, usability, accessibility, responsiveness, originality, and production readiness before it can be marked sellable.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Component sellability review

The gate a component must pass before it can be marked **Sellable** in [`docs/32-component-quality-tracker.md`](../../../docs/32-component-quality-tracker.md). Free and premium components pass the **same** gate — free components are the trust/acquisition channel and a weak free component damages the whole library.

## Use this skill when

- After implementing a new component, or redesigning an existing one.
- Before marking any component (free or premium) complete/Sellable.
- Before adding a component to the homepage or the popular-components section.
- Before release.

## Do not use this skill when

- The change is docs-only or a non-visual refactor with no rendered-output change.
- You are still mid-implementation and the component does not yet render.

## Required context

- The catalog entry ([`apps/docs/lib/catalog.ts`](../../../apps/docs/lib/catalog.ts)) and preview ([`apps/docs/app/_previews`](../../../apps/docs/app/_previews/)).
- The registry source ([`packages/registry/registry/**`](../../../packages/registry/)).
- Standards: [`docs/12`](../../../docs/12-accessibility-standard.md) (a11y), [`docs/13`](../../../docs/13-performance-standard.md) (perf), [`docs/30`](../../../docs/30-showcase-visual-system.md) (visual system).
- The [`rendered-preview-iteration`](../rendered-preview-iteration/SKILL.md) loop — this skill **consumes its persisted screenshots**.

## Required rendered states

You MUST have persisted, reviewed screenshots (in `artifacts/component-reviews/<name>/`) covering, where applicable: desktop light, desktop dark, mobile light, mobile dark, default, primary interaction (open/loading/selected), focus-visible, reduced-motion, and any disabled/error/empty states the component supports.

## Visual inspection procedure

Review against the scorecard: typography, spacing, alignment, surface + border + radius treatment, color, focus state, visual hierarchy, detail quality, modernity, professional finish — in **both** themes. Reject default-shadcn-with-a-fade.

## Motion inspection procedure

Entrance, exit, state transition, continuity, easing, duration, interruption, reversal, rapid interaction, hover, tap, keyboard-triggered, reduced motion. Motion must improve understanding, not decorate. Use the shared motion personalities (precise / smooth / spring / expressive) — no arbitrary easing+duration combos.

## Accessibility inspection procedure

Keyboard, focus visibility, semantics, screen-reader behavior, reduced motion, touch targets, contrast, forced-colors, focus preservation during animation, state announcement. Run axe where a test exists. **Minimum 9/10** — no exceptions.

## Responsive inspection procedure

Mobile, tablet, laptop, wide desktop, touch, pointer, narrow containers, long content, large text, localization pressure. Must not require a mouse.

## Production inspection procedure

Tests, registry install into a clean fixture, docs, error/edge states, no console warnings, no hydration errors, stable source, documented limitations.

## Sellability scorecard

Score 1–10 in each; record in the tracker. Minimums: **A Product value 8 · B Visual 8 · C Motion 8 · D Originality 7 · E Accessibility 9 · F Responsive 8 · G Performance 8 · H API 8 · I Showcase 8 · J Production 9.** Do **not** average away a failing category — a 10 in visual does not offset a 5 in accessibility.

## Required fixes

List every issue found by severity (critical / major / minor). Fix all critical and major before re-review. Re-render and re-screenshot after fixes.

## Final approval rules

Mark **Sellable** only when: every category meets its minimum; no critical or unresolved major issue; screenshots reviewed; required tests pass; clean-fixture install works; docs complete. Otherwise mark **Functional**, **Needs redesign**, or keep **Draft** honestly.

## Documentation updates

Update the component's row in [`docs/32`](../../../docs/32-component-quality-tracker.md) (scores, status, screenshot paths, blockers) and the catalog `status`/notes if changed.

## Stop conditions

Stop and mark **Needs redesign** (do not force Sellable) if the component would require a fundamentally different design to pass. Escalate only for: destructive architecture change, license decision, credential, paid service, final brand decision, or an unresolvable technical blocker.

## Prohibited approvals

Never approve: from source code alone; because tests pass; because it uses Motion; a component that still looks like default shadcn with a fade; a preview too small to understand; fake controls; weak reduced-motion behavior; visually attractive but impractical; mouse-only; broken rapid state transitions; a component that looks copied from another library. **Never lower the gate for free components.**
