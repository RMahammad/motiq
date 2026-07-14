# InView

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Free · **Package:** `@scope/motion`
> **Related primitives:** [`Reveal`](reveal.md), [`Stagger`](stagger.md), `useInView` hook · **Canonical standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/motion/src/in-view.tsx`](../../packages/motion/src/in-view.tsx) · Hook: [`use-in-view.ts`](../../packages/motion/src/use-in-view.ts) · Tests: [`in-view.test.tsx`](../../packages/motion/src/in-view.test.tsx)

Behavioral primitive that reports when its wrapper enters the viewport. Unlike [`Reveal`](reveal.md) it applies **no animation** — it just exposes visibility so you can drive counters, lazy-loading, analytics, or your own effects. Built on the shared `useInView` hook.

## Import

```tsx
import { InView, useInView } from "@scope/motion"; // or "@scope/motion/in-view"
```

## Examples

```tsx
// data attribute + callback
<InView once onChange={(v) => v && track("hero_seen")}>
  <Hero />
</InView>

// render-prop
<InView>{(inView) => (inView ? <Counter to={1200} /> : <span>0</span>)}</InView>

// the hook, for full control
function Chart() {
  const [ref, inView] = useInView({ amount: 0.5 });
  return <div ref={ref}>{inView ? <AnimatedBars /> : null}</div>;
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `once` | `boolean` | `true` | Stop observing after the first time it enters view |
| `rootMargin` | `string` | `"0px 0px -10% 0px"` | `IntersectionObserver` `rootMargin` |
| `amount` | `number` | `0` | Threshold 0–1 (fraction visible to count as in-view) |
| `onChange` | `(inView: boolean) => void` | — | Fires on visibility changes (overrides the native DOM `onChange`) |
| `children` | `ReactNode \| (inView) => ReactNode` | — | Static children or a render-prop |
| `className` / `style` / `ref` | — | — | Forwarded to the wrapper `div` |

`useInView(options)` returns `[ref, inView]`; options: `once`, `rootMargin`, `amount`, `enabled`, `onChange`.

## Accessibility notes

Transparent wrapper `div` — adds no `role`/`aria-*` and doesn't alter semantics or focus. axe: 0 violations at WCAG 2.2 AA scope (automated test). Children keep their own semantics.

## Reduced-motion behavior

`InView` has no animation of its own; whatever you render in response should honor `prefers-reduced-motion` (e.g. use [`Reveal`](reveal.md)/[`Stagger`](stagger.md), which do).

## Performance notes

One `IntersectionObserver` per instance, **disconnected on first hit** (`once`) and on unmount (asserted by test). No scroll listeners. Negligible bundle cost (~489 B brotli, [`13`](../13-performance-standard.md)).

## SSR

Renders `data-inview="false"` on the server; the render-prop receives `false`. The observer only runs after hydration — no `window`/`IntersectionObserver` access during render (SSR test).

## Known limitations

- Boolean visibility only; for scroll-progress values use the planned `ScrollProgress`.

## Related

- [`Reveal`](reveal.md) · [`Stagger`](stagger.md) · Inventory: [`21-component-inventory.md`](../21-component-inventory.md)
