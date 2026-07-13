# Accessibility checklist

> Canonical standard: [`12-accessibility-standard.md`](../12-accessibility-standard.md). Skill: [`accessibility-review`](../../.claude/skills/accessibility-review/SKILL.md). Target: **WCAG 2.2 AA**. ⛔ = release-blocking.

## Automated
- [ ] ⛔ axe = 0 violations (Storybook a11y + Playwright/axe)
- [ ] Reduced-motion test asserts final-state render

## Keyboard
- [ ] ⛔ All interactive controls operable by keyboard
- [ ] Logical focus order
- [ ] No keyboard trap (except intentional, restorable modal traps)
- [ ] Shortcuts documented (e.g. ⌘K, Esc)

## Focus
- [ ] Visible `:focus-visible`
- [ ] ⛔ Overlays: focus moves in, trapped, restored to trigger on close

## Screen reader
- [ ] Correct roles/states (`aria-expanded`, `aria-modal`, etc.)
- [ ] State changes announced (`aria-live` where needed)
- [ ] Icon-only controls have accessible names

## Visual
- [ ] Contrast ≥ 4.5:1 text (3:1 large/UI), re-checked per theme
- [ ] Forced-colors (`forced-colors: active`) behaves
- [ ] Touch targets ≥ 24×24 CSS px (aim 44)

## Motion
- [ ] ⛔ Reduced-motion fallback present and functional
- [ ] ⛔ No information conveyed by motion alone
- [ ] Pause/stop for auto-playing motion (marquee/carousel)
- [ ] Flashing < 3/second

## Manual findings
Record anything not caught by automation.
