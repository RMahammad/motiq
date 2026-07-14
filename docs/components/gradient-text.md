# GradientText

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Free · **Package:** `@scope/motion` · **Version introduced:** v0.0.0
> Source: [`gradient-text.tsx`](../../packages/motion/src/gradient-text.tsx) · Tests: [`gradient-text.test.tsx`](../../packages/motion/src/gradient-text.test.tsx) · Standards: [Tokens](../10-design-tokens.md) · [A11y](../12-accessibility-standard.md)

Text painted with a gradient (`background-clip: text`), optionally animated. **Server-safe** (no `"use client"`; import from `@scope/motion/gradient-text` for RSC). The text stays real, selectable, and screen‑reader‑readable; forced‑colors falls back to system text.

```tsx
import { GradientText } from "@scope/motion/gradient-text";
import "@scope/motion/styles.css";

<h1><GradientText from="#6366f1" via="#ec4899" to="#f59e0b" animate>Ship it</GradientText></h1>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `from` / `via` / `to` | `string` | token default | Gradient stops; omit all for the token gradient |
| `animate` | `boolean` | `false` | Moving gradient (CSS; off under reduced motion) |
| `className` / `style` / `ref` | — | — | Forwarded to the `<span>` |

**A11y/perf:** wrap in your own heading for semantics; text content is preserved (axe 0). Animation disabled under `prefers-reduced-motion` and neutralized under `forced-colors`. ~405 B brotli.

Related: [Reveal](reveal.md) · [Inventory](../21-component-inventory.md)
