---
name: responsive-review
description: Rendered responsive and visual review of a component, block, or page across breakpoints, themes, and reduced motion. Run after any layout/visual change and before completion.
---

# Responsive review

Approve on rendered evidence, not source inspection. The standard is [`responsive-standard.md`](../../../docs/responsive-standard.md).

## When to use

After implementing or changing a component, block, section, page, theme, or any responsive layout — before calling it done.

## Inputs

- The rendered target in the docs app (`apps/docs`).
- The list of breakpoints and states to cover.

## Steps

1. Render the target in the docs app.
2. Check each breakpoint: 320 · 375 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1920 px.
3. At each, confirm: no horizontal page overflow; wide content scrolls inside its own container; long labels/URLs/file names/large numbers wrap or truncate with an accessible full value; the layout reflows (not a scaled-down desktop); touch targets ≥24px; safe areas respected.
4. Check light and dark, and 200% zoom.
5. Confirm continuous animation still pauses offscreen at every size and settles under reduced motion.
6. Capture screenshots of any failure. Fix the highest-impact issues in source, then re-render and re-check.

## Completion criteria

No horizontal overflow, clipping, or unreadable text pressure at any listed width; light/dark and 200% zoom correct; reduced motion settles. No critical or major visual issue remains.

## Required validation

Rendered screenshots at the failing/edge breakpoints and in both themes. Note any deferred minor issue with a reason.

## Output format

A short list: breakpoint/state → observation → action taken (or deferred + reason), with screenshots for failures.

## Non-goals

Not an accessibility audit (use [`accessibility-review`](../accessibility-review/SKILL.md)), not a motion-quality or performance review (use [`component-review`](../component-review/SKILL.md)), not a subjective visual score.
