---
name: rendered-preview-iteration
description: The mandatory implementation loop after every meaningful visual change — run the docs app, render the real component, capture and persist screenshots across themes/viewports/states, critique, fix the highest-impact issues, and repeat until no critical or major visual issues remain.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Rendered preview iteration

Source-code review is never sufficient. This loop runs after every meaningful visual change to a component, and its persisted screenshots feed [`component-sellability-review`](../component-sellability-review/SKILL.md).

## Use this skill when

- After any change to a component's rendered output (visual, motion, layout, state).
- Before invoking `component-sellability-review`.

## Do not use this skill when

- The change has no rendered-output effect (pure docs, types, comments).

## Required workflow

1. Run the docs app (`apps/docs`) — `next dev` or a built `next start`.
2. Open the correct component route (`/components/<slug>`).
3. Capture the initial screenshot.
4. Interact with the component (open/close, switch, load, hover, focus, add/remove).
5. Capture important states.
6. Review visual hierarchy · 7. motion · 8. spacing · 9. typography · 10. responsiveness · 11. theme behavior · 12. reduced motion · 13. keyboard behavior.
14. Record issues (severity-ranked). 15. Fix the highest-impact issues. 16. Re-render. 17. Capture new screenshots. 18. Compare to previous. 19. Repeat until no critical or major visual issues remain.

## Required screenshots per component

Desktop light · desktop dark · mobile light · mobile dark · default state · primary interaction state · focus-visible (where relevant) · reduced-motion (where visually relevant) · disabled/loading/selected/open/error/empty states where supported.

## Persisting screenshots (required — not just ephemeral browser images)

Persist to `artifacts/component-reviews/<component-name>/`. This repo provides a deterministic harness:

```
# start the server, then:
node scripts/shoot.mjs <slug> [--base http://localhost:3210]
```

`scripts/shoot.mjs` (Playwright + the cached chromium) writes: `after-desktop-dark.png`, `after-desktop-light.png`, `after-mobile-dark.png`, `after-mobile-light.png`, `interaction-*.png`, `focus.png`, `reduced-motion.png`. Keep a `before-*.png` from the prior version to compare. Do **not** rely only on ephemeral browser-tool images that vanish after the session.

## Review dimensions each pass

Visual hierarchy, motion purpose/continuity/interruption, spacing rhythm, typographic scale, responsive reflow, light/dark parity, reduced-motion final-state, and keyboard focus order + visible ring.

## Stop conditions

Stop iterating when no critical or major visual issue remains, or when the component clearly needs a fundamentally different design (mark **Needs redesign** in [`docs/32`](../../../docs/32-component-quality-tracker.md)). Escalate only for the blockers listed in `component-sellability-review`.

## Prohibited

Do not mark a component reviewed without persisted screenshots. Do not compare only in your head — save before/after and diff visually. Do not skip mobile or reduced-motion captures.
