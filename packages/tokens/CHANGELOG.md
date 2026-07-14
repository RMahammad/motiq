# @scope/tokens

## 0.1.0

### Minor Changes

- 5944786: Add semantic **visual tokens** to `@scope/tokens` (`--color-*`, `--space-*`, `--radius-*`,
  `--shadow-*`, `--font-sans`) with a `[data-theme="dark"]` / `.dark` override, and the first paid
  component: **`PricingCard`** in `@scope/react` (prop-driven content, token-themed visuals, optional
  `Reveal` entrance, `role="group"` labelled by its heading, real list + button/link CTA). Ships
  `@scope/react/styles.css` structural CSS. Full unit + SSR + axe test coverage; `size-limit`-green.

  Also extract a shared `useInView` hook in `@scope/motion` (now backing Reveal/InView/Stagger)
  and export it (`@scope/motion/use-in-view`).

- ac99225: Phase-1 spike scaffolds: add `@scope/tokens` (motion tokens + `cn()`), the `Reveal` motion
  primitive in `@scope/motion` (CSS + IntersectionObserver, SSR-safe, reduced-motion, ref-forwarded,
  with unit + SSR tests), and a demo `AnimatedButton` in `@scope/react`. Builds with tsdown preserving
  `"use client"`; verified consumable in Next.js 16 App Router and Vite. Not yet DoD-complete.
