---
"@scope/motion": minor
"@scope/sections": minor
---

Extend the catalog with a text primitive and two marketing sections:

- **`TextReveal`** (`@scope/motion`, premium) — reveals text by word or character with a stagger.
  **Accessible split**: the full string is exposed to screen readers (visually-hidden copy) while the
  animated units are `aria-hidden`. CSS + `useInView`; SSR-safe, reduced-motion aware.
- **`FeatureGrid`** (`@scope/sections`, premium) — a features section (heading block + responsive
  `BentoGrid` of features). Content prop-driven; server-safe. Adds `@scope/react` as a dependency.
- **`CTASection`** (`@scope/sections`, premium) — a call-to-action band (title/subtitle/actions slot),
  server-safe with a `Reveal` entrance.

Each ships CSS in its package stylesheet, unit + SSR + axe tests, subpath exports, `size-limit`
entries, and docs pages.
