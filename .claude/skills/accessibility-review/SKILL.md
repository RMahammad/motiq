---
name: accessibility-review
description: Accessibility review before completing any interactive component or section. Covers keyboard, focus order/visibility/trap/restore, screen-reader semantics, contrast, forced-colors, touch targets, reduced motion, pause controls, axe tests, and manual findings. WCAG 2.2 AA failures block completion.
allowed-tools: Read, Grep, Glob, Bash
---
# Accessibility review

## Use this skill when
- Before completing any interactive component or section, and for any change to focus/keyboard/ARIA/motion behavior.

## Do not use this skill when
- Purely non-interactive, non-visual utility code with no rendered output.

## Required context
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md) (canonical, release-blocking)
- [`docs/templates/accessibility-checklist.md`](../../../docs/templates/accessibility-checklist.md)
- The component's stories and tests.

## Inputs
- The component/section under review.

## Procedure
1. **Keyboard walkthrough** — every control operable; document the key map (Tab/Shift-Tab/Enter/Space/Esc/arrows).
2. **Focus order** — logical and predictable.
3. **Focus visibility** — `:focus-visible` present and clear.
4. **Focus trap & restoration** — overlays trap focus while open and restore to the trigger on close.
5. **Screen-reader semantics** — roles/states correct; state changes announced (`aria-live`, `aria-expanded`, `aria-modal`).
6. **Contrast** — ≥ 4.5:1 text (3:1 large/UI), re-checked per theme.
7. **Forced-colors** — behaves under `forced-colors: active`.
8. **Touch targets** — ≥ 24×24 CSS px (aim 44).
9. **Reduced motion** — final-state render; still functional.
10. **Pause controls** — for auto-playing motion (marquee/carousel).
11. **axe** — run axe on all relevant stories; **0 violations**.
12. **Manual findings** — record anything automation can't catch.

## Required validation
- ⛔ axe = 0 violations.
- ⛔ Keyboard-operable; ⛔ overlay focus trap+restore; ⛔ no info by motion alone; ⛔ reduced-motion path.
- Complete [`accessibility-checklist.md`](../../../docs/templates/accessibility-checklist.md).

## Expected outputs
Automated results (axe) + a completed manual checklist + a list of release-blocking failures (if any) with fixes.

## Documentation updates
- Fill the a11y section of the component's doc page ([template](../../../docs/templates/component-documentation-template.md)).

## Stop conditions
- **Any WCAG 2.2 AA failure defined as release-blocking stops completion** ([`12`](../../../docs/12-accessibility-standard.md#release-blocking-failures)).

## Prohibited actions
- Marking a component done with an open axe violation or missing reduced-motion path.
- Weakening semantics to make a test pass.
