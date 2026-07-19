# RotatingWords

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/motion` · **Version introduced:** v0.0.0
> Source: [`rotating-words.tsx`](../../packages/motion/src/rotating-words.tsx) · Tests: [`rotating-words.test.tsx`](../../packages/motion/src/rotating-words.test.tsx) · Standards: [A11y](../12-accessibility-standard.md)

Cycles through a list of words with a fade — for hero copy like "Build **fast / accessible / typed** apps". Announces the current word to screen readers (`aria-live="polite"`).

```tsx
import { RotatingWords } from "@scope/motion";
import "@scope/motion/styles.css";

<h1>Build <RotatingWords words={["fast", "accessible", "typed"]} /> apps</h1>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `words` | `string[]` | — (required) | Words to cycle |
| `interval` | `number` | `2200` | ms between words |
| `pauseOnHover` | `boolean` | `true` | Pause cycling on hover |
| `reducedMotion` | `"respect" \| "force" \| "off"` | `"respect"` | Reduced → shows the first word, no rotation |

**A11y:** the current word is announced via `aria-live="polite"`. **Pauses on hover** and **stops entirely under `prefers-reduced-motion`** (first word static). axe 0. ⚠️ For strict WCAG on auto‑updating content (>5s), also provide a **visible pause control** in your layout — hover‑pause is a partial mitigation. Interval cleared on unmount. ~1 kB brotli.

Related: [Counter](counter.md) · [TextReveal](text-reveal.md) · [GradientText](gradient-text.md) · [Inventory](../21-component-inventory.md)
