# TextReveal

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/motion` · **Version introduced:** v0.0.0
> Source: [`text-reveal.tsx`](../../packages/motion/src/text-reveal.tsx) · Tests: [`text-reveal.test.tsx`](../../packages/motion/src/text-reveal.test.tsx) · Standards: [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)

Reveals text by **word or character** with a stagger — a headline effect. **Accessible split:** the full string is exposed to screen readers via a visually‑hidden copy while the animated units are `aria-hidden`, so assistive tech never reads fragmented spans. CSS + IntersectionObserver; SSR‑safe, reduced‑motion aware.

```tsx
import { TextReveal } from "@scope/motion";
import "@scope/motion/styles.css";

<h1><TextReveal text="Ship faster" by="word" /></h1>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `text` | `string` | — (required) | The text to reveal (kept intact for screen readers) |
| `by` | `"word" \| "character"` | `"word"` | Split granularity |
| `gap` | `"sm" \| "md"` | `"sm"` | Per-unit delay step (token) |
| `trigger` | `"mount" \| "in-view"` | `"in-view"` | — |
| `once` | `boolean` | `true` | — |
| `reducedMotion` | `"respect" \| "force-reduce" \| "allow"` | `"respect"` | — |

**A11y/perf:** SR reads the whole string once (visually-hidden); animated units are `aria-hidden`. axe 0. CSS-only stagger; character mode on long text produces many nodes — prefer `by="word"` for long copy ([`13`](../13-performance-standard.md)). Wrap in your own heading for semantics. Under `prefers-reduced-motion` the text shows instantly.

Related: [Reveal](reveal.md) · [Stagger](stagger.md) · [Inventory](../21-component-inventory.md)
