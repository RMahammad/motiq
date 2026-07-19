# Counter (AnimatedNumber)

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/motion` · **Version introduced:** v0.0.0
> Source: [`counter.tsx`](../../packages/motion/src/counter.tsx) · Tests: [`counter.test.tsx`](../../packages/motion/src/counter.test.tsx) · Standards: [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)

Counts from `from` up to `value` with a `requestAnimationFrame` ease‑out when it scrolls into view — for KPI/stat blocks. SSR‑safe (renders the starting value); **reduced motion jumps straight to the final value**; the frame is cancelled on unmount.

```tsx
import { Counter } from "@scope/motion";

<p><Counter value={1200} /> projects shipped</p>
<p><Counter value={99.9} decimals={1} />% uptime</p>
<p><Counter value={4200} format={(n) => `$${Math.round(n).toLocaleString()}`} /></p>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `number` | — (required) | Target number |
| `from` | `number` | `0` | Starting number |
| `duration` | `number` | `1200` | Animation length (ms) |
| `decimals` | `number` | `0` | Fixed decimals (ignored if `format` set) |
| `format` | `(n: number) => string` | — | Custom formatter (currency, locale, …) |
| `startOnView` | `boolean` | `true` | Count when in view (else on mount) |
| `reducedMotion` | `"respect" \| "force" \| "off"` | `"respect"` | `respect` reads the OS setting |

**A11y/perf:** the number is real text (screen readers read the final value); no layout thrash (single text node). Under `prefers-reduced-motion` it shows the final value immediately. rAF is cancelled on unmount. ~1 kB brotli.

Related: [RotatingWords](rotating-words.md) · [Inventory](../21-component-inventory.md)
