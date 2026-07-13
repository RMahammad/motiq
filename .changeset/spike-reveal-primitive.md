---
"@scope/tokens": minor
"@scope/motion": minor
"@scope/react": minor
---

Phase-1 spike scaffolds: add `@scope/tokens` (motion tokens + `cn()`), the `Reveal` motion
primitive in `@scope/motion` (CSS + IntersectionObserver, SSR-safe, reduced-motion, ref-forwarded,
with unit + SSR tests), and a demo `AnimatedButton` in `@scope/react`. Builds with tsdown preserving
`"use client"`; verified consumable in Next.js 16 App Router and Vite. Not yet DoD-complete.
