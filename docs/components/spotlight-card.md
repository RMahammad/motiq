# SpotlightCard

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/react` · **Version introduced:** v0.0.0
> Source: [`spotlight-card.tsx`](../../packages/react/src/spotlight-card.tsx) · Tests: [`spotlight-card.test.tsx`](../../packages/react/src/spotlight-card.test.tsx) · Standards: [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)

A card with a radial **spotlight that follows the pointer** on hover — a high‑impact marketing effect. The pointer handler only writes two CSS variables (no React re‑render); a `::before` gradient does the rest.

```tsx
import { SpotlightCard } from "@scope/react/spotlight-card";
import "@scope/react/styles.css";

<SpotlightCard radius={240}>
  <h3>Pro</h3>
  <p>Everything you need to ship.</p>
</SpotlightCard>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `spotlightColor` | `string` | token accent @ 22% | Any CSS color |
| `radius` | `number` | `200` | Spotlight diameter (px) |
| `className` / `style` / `ref` | — | — | Forwarded; `onMouseMove` is composed, not overridden |

**A11y / perf / mobile:** the spotlight is a decorative `::before` — content is unaffected (axe 0). **Hidden on `hover: none` (touch) devices**; the fade is removed under `prefers-reduced-motion`. Pointer moves mutate CSS vars only (no re‑render), so it stays cheap. `"use client"`. ~1 kB brotli.

Related: [BentoGridItem](bento-grid.md) · [PricingCard](pricing-card.md) · [Inventory](../21-component-inventory.md)
