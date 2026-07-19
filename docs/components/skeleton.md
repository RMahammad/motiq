# Skeleton

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Free · **Package:** `@scope/react` · **Version introduced:** v0.0.0
> Source: [`skeleton.tsx`](../../packages/react/src/skeleton.tsx) · Tests: [`skeleton.test.tsx`](../../packages/react/src/skeleton.test.tsx) · Standards: [A11y](../12-accessibility-standard.md)

A loading placeholder with a shimmer. **Server-safe** (no hooks; import from `@scope/react/skeleton` for RSC). Decorative — marked `aria-hidden`; put `aria-busy`/a status message on the surrounding region.

```tsx
import { Skeleton } from "@scope/react/skeleton";
import "@scope/react/styles.css";

<div role="status" aria-busy="true" aria-label="Loading">
  <Skeleton variant="text" width="60%" />
  <Skeleton variant="text" width="90%" />
  <Skeleton variant="circle" width={40} height={40} />
</div>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `"text" \| "rect" \| "circle"` | `"rect"` | Shape preset |
| `width` / `height` | `number \| string` | — | Dimensions |
| `radius` | `number \| string` | — | Corner radius override |

**A11y/perf:** `aria-hidden` so screen readers announce the region's `aria-busy`, not the placeholder; shimmer stops under `prefers-reduced-motion` (solid block). ~368 B brotli.

Related: [Inventory](../21-component-inventory.md)
