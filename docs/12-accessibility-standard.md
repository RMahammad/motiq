# 12 — Accessibility standard

> **Type:** 🟢 Canonical a11y contract (**release-blocking**) · **Implementation status:** 🔵 Planned · **Last reviewed:** 2026-07-14
> **Owns:** the WCAG target, per-component a11y requirements, release-blocking failures.
> **Related:** [ADR-0011](adrs/0011-accessible-primitives.md) (Radix) · [`14-testing-strategy.md`](14-testing-strategy.md) (axe) · [`accessibility-review` skill](../.claude/skills/accessibility-review/SKILL.md) · [`25-definition-of-done.md`](25-definition-of-done.md)

## Target

**WCAG 2.2 AA is a release blocker**, not a nice-to-have. An unresolved AA failure stops completion.

## Accessible primitives

**Radix** is the default for dialog, dropdown, popover, tooltip, tabs, accordion, toast (focus trapping, roving tabindex, ARIA). **React Aria** is added later for date pickers, tables, and complex grids. Rationale: [ADR-0011](adrs/0011-accessible-primitives.md). **Do not rebuild complex accessibility behavior from scratch.**

## Per-component requirements

- **Keyboard** — fully operable; no keyboard traps (except intentional, restorable focus traps in modals).
- **Focus** — visible `:focus-visible`; logical order; **trap + restore** in overlays.
- **Screen reader** — correct roles/states; state changes announced (e.g. `aria-live` for toasts, `aria-expanded` for disclosures).
- **Contrast** — ≥ 4.5:1 text (3:1 large text / UI components), re-checked per theme.
- **Reduced motion** — `prefers-reduced-motion: reduce` → components render **final state instantly** (opacity 1, no transform) but remain fully functional. App may force stricter via `MotionConfig` ([`10`](10-design-tokens.md#motion-intensity-modes)).
- **Forced colors** — `@media (forced-colors: active)` support; don't rely on removed backgrounds/shadows.
- **Motion, not the only signal** — no information conveyed by animation alone.
- **No attention traps** — no infinite auto-animation that captures focus/attention; provide pause/stop for anything auto-playing (marquee, carousel).
- **Flashing** — < 3 flashes/second.
- **Touch targets** — ≥ 24×24 CSS px (WCAG 2.2), aim for 44.
- **Text alternatives** — for icon-only controls and media.

## Overlay behavior (dialog / drawer / popover / menu)

Use Radix. Requirements: focus moves into the overlay on open, is trapped while open, and returns to the trigger on close; Escape closes; scroll lock where appropriate; `aria-modal` / correct roles; labelled by title/description.

## Motion-sickness safeguards

Parallax, scroll-scrub, and particle effects are **reduced-motion-gated by default** and flagged "vestibular caution" in their docs ([`02`](02-market-analysis.md#structural-insights), [`13`](13-performance-standard.md)).

## Testing

- **Automated:** every interactive component ships an **axe test with 0 violations** (Storybook a11y + Playwright/axe — [`14`](14-testing-strategy.md)).
- **Manual:** a keyboard/focus/SR/forced-colors checklist per component ([`templates/accessibility-checklist.md`](templates/accessibility-checklist.md)).
- **Reduced-motion:** a test asserting final-state render under `prefers-reduced-motion`.

## Release-blocking failures

- Any axe violation.
- Missing reduced-motion path.
- Keyboard-inoperable interactive control.
- Lost/unrestored focus in an overlay.
- Information conveyed by motion alone.

Per-category documentation (keyboard / focus / SR / reduced-motion / tests) is required on **every** component doc page ([`15-documentation-strategy.md`](15-documentation-strategy.md)).
