# BlurReveal

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/motion` · **Version introduced:** v0.0.0
> Source: [`blur-reveal.tsx`](../../packages/motion/src/blur-reveal.tsx) · Tests: [`blur-reveal.test.tsx`](../../packages/motion/src/blur-reveal.test.tsx) · Standards: [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)

Entrance that fades **and de-blurs** its children into focus — a headline effect. CSS + IntersectionObserver (via `useInView`); SSR‑safe, reduced‑motion aware, ref‑forwarded. Sibling of [`Reveal`](reveal.md).

```tsx
import { BlurReveal } from "@scope/motion";
import "@scope/motion/styles.css";

<BlurReveal amount="md" duration="slow"><h2>Focus</h2></BlurReveal>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `amount` | `"sm" \| "md" \| "lg"` | `"md"` | Blur strength (4/8/16px) |
| `duration` | `"fast" \| "normal" \| "slow"` | `"normal"` | Token-based |
| `trigger` | `"mount" \| "in-view"` | `"in-view"` | — |
| `once` | `boolean` | `true` | — |
| `reducedMotion` | `"respect" \| "force-reduce" \| "allow"` | `"respect"` | — |
| `onVisibilityChange` | `(v: boolean) => void` | — | — |

**A11y/perf:** under `prefers-reduced-motion` renders sharp/visible instantly (no filter). Keep `amount` modest — large `filter: blur()` is GPU-heavy on low-end devices ([`13`](../13-performance-standard.md)). ~721 B brotli.

Related: [Reveal](reveal.md) · [Inventory](../21-component-inventory.md)
