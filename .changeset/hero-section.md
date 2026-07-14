---
"@scope/sections": minor
---

Introduce the `@scope/sections` package with **`HeroSection`** — a landing hero composed from
motion primitives. **Server-safe** (no `"use client"`; composes `Stagger`/`Reveal` as client leaves —
the ideal RSC pattern), **content entirely via props/slots** (no hard-coded marketing copy), semantic
`<section>` + configurable heading level, responsive (stacks on mobile, two columns with media on
≥768px), reduced-motion-safe. Ships `@scope/sections/styles.css`; slots + SSR + axe tests;
`size-limit`-green (< 1.5 kB brotli, excl. deps).
