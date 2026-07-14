---
"@scope/react": minor
---

Add the remaining hero cards:

- **`SpotlightCard`** (premium) — a card with a radial spotlight that follows the pointer on hover.
  Pointer handler writes CSS vars only (no re-render); decorative `::before` gradient. Hidden on
  touch (`hover: none`); fade removed under reduced motion.
- **`BentoGrid` + `BentoGridItem`** (premium) — a responsive bento layout with per-item col/row
  spans, content slots (icon/title/description/media), configurable heading level, and optional
  `revealOnView`. **Server-safe** (composes `Reveal` as a client leaf). Collapses to one column on
  mobile.

Both ship structural CSS in `@scope/react/styles.css`, unit + SSR + axe tests, subpath exports,
`size-limit` entries (≈1 kB brotli each), and docs pages.
