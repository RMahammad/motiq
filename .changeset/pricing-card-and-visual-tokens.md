---
"@scope/tokens": minor
"@scope/react": minor
---

Add semantic **visual tokens** to `@scope/tokens` (`--color-*`, `--space-*`, `--radius-*`,
`--shadow-*`, `--font-sans`) with a `[data-theme="dark"]` / `.dark` override, and the first paid
component: **`PricingCard`** in `@scope/react` (prop-driven content, token-themed visuals, optional
`Reveal` entrance, `role="group"` labelled by its heading, real list + button/link CTA). Ships
`@scope/react/styles.css` structural CSS. Full unit + SSR + axe test coverage; `size-limit`-green.

Also extract a shared `useInView` hook in `@scope/motion` (now backing Reveal/InView/Stagger)
and export it (`@scope/motion/use-in-view`).
