# @scope/motion

## 0.1.0

### Minor Changes

- d6911df: Add the two timer-based text components (with a shared `prefersReducedMotion` helper):

  - **`Counter`** (AnimatedNumber) — counts from `from` to `value` with a `requestAnimationFrame`
    ease-out when scrolled into view. `decimals`/`format` options; SSR-safe (renders the starting
    value); reduced motion jumps to the final value; frame cancelled on unmount.
  - **`RotatingWords`** — cycles a list of words with a fade, announced via `aria-live="polite"`.
    Pauses on hover; **stops under reduced motion** (first word static); interval cleared on unmount.

  Both ship subpath exports, `size-limit` entries, docs pages, and tests (Counter's rAF and
  RotatingWords' interval are covered with fake timers). Also exports `prefersReducedMotion`.

- ed4e9c2: Add two more motion primitives: `InView` (behavioral viewport primitive — `data-inview`,
  `onChange`, render-prop; SSR-safe, observer cleanup) and `Stagger`/`StaggerItem` (CSS-driven
  staggered reveal with token gap + incremental index; SSR-safe, reduced-motion aware). Both ship
  unit + SSR + axe tests, are `publint`-clean, and stay within `size-limit` budgets. Consolidated the
  companion CSS into `@scope/motion/styles.css` (replaces `reveal.css`).
- ac99225: Phase-1 spike scaffolds: add `@scope/tokens` (motion tokens + `cn()`), the `Reveal` motion
  primitive in `@scope/motion` (CSS + IntersectionObserver, SSR-safe, reduced-motion, ref-forwarded,
  with unit + SSR tests), and a demo `AnimatedButton` in `@scope/react`. Builds with tsdown preserving
  `"use client"`; verified consumable in Next.js 16 App Router and Vite. Not yet DoD-complete.
- 85dae59: Add a batch of CSS-driven text/media primitives:

  - **`GradientText`** (`@scope/motion`, free) — gradient-clipped text, optional animation; **server-safe**, forced-colors fallback.
  - **`BlurReveal`** (`@scope/motion`, premium) — fade + de-blur entrance (on `useInView`); SSR-safe, reduced-motion aware.
  - **`Marquee`** (`@scope/motion`, premium) — seamless infinite scroll; **server-safe**, duplicate copy `aria-hidden`, pauses on hover/focus, stops under reduced motion.
  - **`Skeleton`** (`@scope/react`, free) — shimmer loading placeholder; **server-safe**, `aria-hidden`, shimmer stops under reduced motion.

  Each ships CSS in the package stylesheet, unit + SSR (+ axe where applicable) tests, subpath exports, `size-limit` entries (all < 750 B brotli), and docs pages.

- db9de5e: Extend the catalog with a text primitive and two marketing sections:

  - **`TextReveal`** (`@scope/motion`, premium) — reveals text by word or character with a stagger.
    **Accessible split**: the full string is exposed to screen readers (visually-hidden copy) while the
    animated units are `aria-hidden`. CSS + `useInView`; SSR-safe, reduced-motion aware.
  - **`FeatureGrid`** (`@scope/sections`, premium) — a features section (heading block + responsive
    `BentoGrid` of features). Content prop-driven; server-safe. Adds `@scope/react` as a dependency.
  - **`CTASection`** (`@scope/sections`, premium) — a call-to-action band (title/subtitle/actions slot),
    server-safe with a `Reveal` entrance.

  Each ships CSS in its package stylesheet, unit + SSR + axe tests, subpath exports, `size-limit`
  entries, and docs pages.

### Patch Changes

- Updated dependencies [5944786]
- Updated dependencies [ac99225]
  - @scope/tokens@0.1.0
