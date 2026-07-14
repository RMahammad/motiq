---
name: animation-quality-review
description: Review an animation for quality and restraint — entrance/exit/state continuity, easing, duration, interruption, reversal, rapid-toggle, layout, hover/tap/keyboard, reduced-motion, mobile, and frame rate — and reject motion that is slow-without-purpose, bouncy, distracting, or harmful.
allowed-tools: Read, Grep, Glob, Bash
---

# Animation quality review

## Use this skill when
Reviewing the motion of a component, section, or demo before calling it done.

## Do not use this skill when
Reviewing raw runtime performance/bundle cost (use [`performance-review`](../performance-review/SKILL.md)) or accessibility semantics beyond motion (use [`accessibility-review`](../accessibility-review/SKILL.md)).

## Required context
- [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md) — performance/frame budget.
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md) — reduced motion + non‑harm.

## Inputs
The component/section under review and its intended interaction.

## Procedure
Evaluate each dimension:
1. **Entrance** — purposeful, not gratuitous.
2. **Exit** — actually plays; coordinated with unmount.
3. **State continuity** — transitions read as the same object changing state.
4. **Easing** — appropriate curve; no default‑linear where it hurts.
5. **Duration** — fast enough to feel responsive.
6. **Interruption** — a new input interrupts cleanly.
7. **Reversal** — reversing mid‑animation looks correct.
8. **Rapid toggle** — repeated fast toggling does not break or desync.
9. **Layout** — no unintended layout shift/jank.
10. **Hover** — meaningful and not jittery.
11. **Tap / press** — clear feedback on touch.
12. **Keyboard** — state changes triggered by keyboard animate correctly and are not disorienting.
13. **Reduced motion** — honored; state change stays legible.
14. **Mobile** — smooth and appropriate on touch/low‑power.
15. **Frame rate** — holds target within budget ([`docs/13`](../../../docs/13-performance-standard.md)).
16. **Does the animation help?** — if it does not clarify state or guide attention, cut it.

## Required validation
Verify interruption, reversal, and rapid‑toggle by exercising them; confirm reduced‑motion and keyboard paths; confirm frame rate within budget. Motion consistent with sibling components.

## Expected outputs
Per‑dimension findings · REJECT list with reasons · required changes · pass/fail decision.

## Documentation updates
None by default; if a motion behavior/token changes, record it in [`docs/06-animation-engine-decision.md`](../../../docs/06-animation-engine-decision.md) via [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
Reject (do not pass) when the animation is: slow‑without‑purpose, excessively bouncy, distracting, non‑interruptible, broken on rapid toggle, applied to everything, inconsistent with siblings, or harmful to keyboard/touch users.

## Prohibited actions
- Do not approve motion that fails reduced‑motion or harms keyboard/touch access.
- Do not approve animation that adds no clarity ("animation on everything").
- Do not approve motion inconsistent with the surrounding components.
