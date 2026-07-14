---
"@scope/motion": minor
"@scope/react": minor
---

Add a batch of CSS-driven text/media primitives:

- **`GradientText`** (`@scope/motion`, free) — gradient-clipped text, optional animation; **server-safe**, forced-colors fallback.
- **`BlurReveal`** (`@scope/motion`, premium) — fade + de-blur entrance (on `useInView`); SSR-safe, reduced-motion aware.
- **`Marquee`** (`@scope/motion`, premium) — seamless infinite scroll; **server-safe**, duplicate copy `aria-hidden`, pauses on hover/focus, stops under reduced motion.
- **`Skeleton`** (`@scope/react`, free) — shimmer loading placeholder; **server-safe**, `aria-hidden`, shimmer stops under reduced motion.

Each ships CSS in the package stylesheet, unit + SSR (+ axe where applicable) tests, subpath exports, `size-limit` entries (all < 750 B brotli), and docs pages.
