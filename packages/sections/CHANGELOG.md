# @scope/sections

## 0.1.0

### Minor Changes

- 81d6f85: Introduce the `@scope/sections` package with **`HeroSection`** — a landing hero composed from
  motion primitives. **Server-safe** (no `"use client"`; composes `Stagger`/`Reveal` as client leaves —
  the ideal RSC pattern), **content entirely via props/slots** (no hard-coded marketing copy), semantic
  `<section>` + configurable heading level, responsive (stacks on mobile, two columns with media on
  ≥768px), reduced-motion-safe. Ships `@scope/sections/styles.css`; slots + SSR + axe tests;
  `size-limit`-green (< 1.5 kB brotli, excl. deps).
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

- Updated dependencies [67d25aa]
- Updated dependencies [d6911df]
- Updated dependencies [ed4e9c2]
- Updated dependencies [5944786]
- Updated dependencies [ac99225]
- Updated dependencies [343a4cd]
- Updated dependencies [85dae59]
- Updated dependencies [db9de5e]
- Updated dependencies [5f7b629]
  - @scope/react@0.1.0
  - @scope/motion@0.1.0
  - @scope/tokens@0.1.0
