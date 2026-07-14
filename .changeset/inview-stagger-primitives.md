---
"@scope/motion": minor
---

Add two more motion primitives: `InView` (behavioral viewport primitive — `data-inview`,
`onChange`, render-prop; SSR-safe, observer cleanup) and `Stagger`/`StaggerItem` (CSS-driven
staggered reveal with token gap + incremental index; SSR-safe, reduced-motion aware). Both ship
unit + SSR + axe tests, are `publint`-clean, and stay within `size-limit` budgets. Consolidated the
companion CSS into `@scope/motion/styles.css` (replaces `reveal.css`).
