---
"@scope/motion": minor
---

Add the two timer-based text components (with a shared `prefersReducedMotion` helper):

- **`Counter`** (AnimatedNumber) — counts from `from` to `value` with a `requestAnimationFrame`
  ease-out when scrolled into view. `decimals`/`format` options; SSR-safe (renders the starting
  value); reduced motion jumps to the final value; frame cancelled on unmount.
- **`RotatingWords`** — cycles a list of words with a fade, announced via `aria-live="polite"`.
  Pauses on hover; **stops under reduced motion** (first word static); interval cleared on unmount.

Both ship subpath exports, `size-limit` entries, docs pages, and tests (Counter's rAF and
RotatingWords' interval are covered with fake timers). Also exports `prefersReducedMotion`.
