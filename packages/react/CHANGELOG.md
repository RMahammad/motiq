# @scope/react

## 0.1.0

### Minor Changes

- 67d25aa: Add `AnimatedDialog` — the first accessible overlay, built on **Radix Dialog** with a **CSS-keyframe**
  enter/exit (no animation-engine dependency; Radix waits for the exit animation). Focus trap + restore,
  Escape-to-close, `role="dialog"` labelled by its title, optional description, controlled/uncontrolled
  open state, and an accessible close button. Reduced motion disables the animation. Ships structural CSS
  in `@scope/react/styles.css`. Verified by focus/keyboard/SSR/axe tests. Adds `@radix-ui/react-dialog`
  as a dependency (kept external in the build).
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
- 343a4cd: Add the remaining hero cards:

  - **`SpotlightCard`** (premium) — a card with a radial spotlight that follows the pointer on hover.
    Pointer handler writes CSS vars only (no re-render); decorative `::before` gradient. Hidden on
    touch (`hover: none`); fade removed under reduced motion.
  - **`BentoGrid` + `BentoGridItem`** (premium) — a responsive bento layout with per-item col/row
    spans, content slots (icon/title/description/media), configurable heading level, and optional
    `revealOnView`. **Server-safe** (composes `Reveal` as a client leaf). Collapses to one column on
    mobile.

  Both ship structural CSS in `@scope/react/styles.css`, unit + SSR + axe tests, subpath exports,
  `size-limit` entries (≈1 kB brotli each), and docs pages.

- 85dae59: Add a batch of CSS-driven text/media primitives:

  - **`GradientText`** (`@scope/motion`, free) — gradient-clipped text, optional animation; **server-safe**, forced-colors fallback.
  - **`BlurReveal`** (`@scope/motion`, premium) — fade + de-blur entrance (on `useInView`); SSR-safe, reduced-motion aware.
  - **`Marquee`** (`@scope/motion`, premium) — seamless infinite scroll; **server-safe**, duplicate copy `aria-hidden`, pauses on hover/focus, stops under reduced motion.
  - **`Skeleton`** (`@scope/react`, free) — shimmer loading placeholder; **server-safe**, `aria-hidden`, shimmer stops under reduced motion.

  Each ships CSS in the package stylesheet, unit + SSR (+ axe where applicable) tests, subpath exports, `size-limit` entries (all < 750 B brotli), and docs pages.

- 5f7b629: Complete the MVP overlay set on Radix + CSS: **`Tooltip`** (Radix Tooltip, `role="tooltip"`,
  focus + hover, Escape), **`Popover`** (Radix Popover, focus move/restore, Escape, outside-click,
  optional close), and **`Sheet`**/Drawer (Radix Dialog with a per-`side` CSS slide; full modal a11y).
  Each ships structural CSS in `@scope/react/styles.css`, interaction + axe tests (SSR for the modal
  ones), `size-limit` entries (all < 600 B brotli), and docs pages. Adds `@radix-ui/react-tooltip` and
  `@radix-ui/react-popover` dependencies (kept external in the build).

### Patch Changes

- Updated dependencies [d6911df]
- Updated dependencies [ed4e9c2]
- Updated dependencies [5944786]
- Updated dependencies [ac99225]
- Updated dependencies [85dae59]
- Updated dependencies [db9de5e]
  - @scope/motion@0.1.0
  - @scope/tokens@0.1.0
