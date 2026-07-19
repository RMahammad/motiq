# Stagger / StaggerItem

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Free · **Package:** `@scope/motion`
> **Related primitives:** [`Reveal`](reveal.md), [`InView`](in-view.md) · **Canonical standards:** [API](../09-component-api-standard.md) · [Tokens](../10-design-tokens.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/motion/src/stagger.tsx`](../../packages/motion/src/stagger.tsx) · Tests: [`stagger.test.tsx`](../../packages/motion/src/stagger.test.tsx)

Reveals a group of children with an incremental delay when the group scrolls into view — the classic "list cascades in" effect. **CSS-driven** (`transition-delay = gap × index`), so it's cheap and reduced-motion-safe.

## Import

```tsx
import { Stagger, StaggerItem } from "@scope/motion"; // or "@scope/motion/stagger"
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
```

## Examples

```tsx
// auto-wraps children
<Stagger gap="md">
  <FeatureCard title="Fast" />
  <FeatureCard title="Accessible" />
  <FeatureCard title="Typed" />
</Stagger>

// explicit items (extra className/props per item)
<Stagger gap="sm">
  <StaggerItem className="col-span-2"><Logo /></StaggerItem>
  <StaggerItem><Logo /></StaggerItem>
</Stagger>
```

## Props

**`Stagger`**

| Prop | Type | Default | Description |
|---|---|---|---|
| `gap` | `"sm" \| "md"` | `"md"` | Per-item delay step (`--motion-stagger-*` token) |
| `trigger` | `"mount" \| "in-view"` | `"in-view"` | Cascade on mount or when scrolled into view |
| `once` | `boolean` | `true` | Cascade only the first time |
| `rootMargin` | `string` | `"0px 0px -10% 0px"` | Viewport margin for the trigger |
| `reducedMotion` | `"respect" \| "force-reduce" \| "allow"` | `"respect"` | Reduced-motion override |
| `className` / `style` / `ref` | — | — | Forwarded to the container |

**`StaggerItem`** — a styled wrapper (`.scope-stagger-item`) accepting all `div` props. Only animates inside a `Stagger`, which injects its `--stagger-index`. Non-`StaggerItem` children are wrapped automatically.

## Accessibility notes

Items are presentational `div`s; interactive/list children keep their own semantics — use real `<ul>/<li>` inside if the content is a list. axe: 0 violations wrapping interactive items (automated test). No information is conveyed by the cascade alone.

## Reduced-motion behavior

Under `prefers-reduced-motion: reduce`, items render at final state (opacity 1, no transform, no transition, no delay) — the group appears at once, fully usable. `reducedMotion="force-reduce"` forces this. See [`12`](../12-accessibility-standard.md).

## Performance notes

Pure CSS transitions (opacity/transform) with a computed `transition-delay`; one shared observer for the whole group (via `useInView`), disconnected after reveal. ~738 B brotli ([`13`](../13-performance-standard.md)). For very long lists, cap the visible count or the cumulative delay grows large.

## SSR

Container SSRs `data-motion="hidden"`; items carry their `--stagger-index`. Animates only after hydration (SSR test).

## Known limitations

- Delay is `gap × index` linearly; no easing of the stagger curve itself.
- Only the group-level in-view trigger; individual items don't self-trigger.

## Related

- [`Reveal`](reveal.md) (single element) · [`InView`](in-view.md) · Inventory: [`21-component-inventory.md`](../21-component-inventory.md)
