# Marquee

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/motion` · **Version introduced:** v0.0.0
> Source: [`marquee.tsx`](../../packages/motion/src/marquee.tsx) · Tests: [`marquee.test.tsx`](../../packages/motion/src/marquee.test.tsx) · Standards: [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)

Seamless infinite horizontal scroll (e.g. a logo cloud). **Server-safe** (no hooks; import from `@scope/motion/marquee` for RSC). Duplicates children with the copy `aria-hidden`; pure CSS animation.

```tsx
import { Marquee } from "@scope/motion/marquee";
import "@scope/motion/styles.css";

<Marquee speed={24} aria-label="Trusted by">
  <img alt="Acme" src="/acme.svg" />
  <img alt="Globex" src="/globex.svg" />
</Marquee>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `speed` | `number` | `20` | Seconds per loop |
| `reverse` | `boolean` | `false` | Reverse direction |
| `pauseOnHover` | `boolean` | `true` | Pause on hover/focus-within |

**A11y/perf:** duplicate copy is `aria-hidden`; **pauses on hover and keyboard focus, and stops entirely under `prefers-reduced-motion`** (renders static). ⚠️ For strict WCAG on long-running motion, also add a **visible pause control** in your layout — the built-in hover/focus pause is a partial mitigation. ~432 B brotli.

Related: [Inventory](../21-component-inventory.md)
