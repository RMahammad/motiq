# Reveal

> **Status:** 🟡 In progress (spike + tests + a11y) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Free · **Package:** `@scope/motion`
> **Related primitives:** `InView`, `Stagger`, `Fade/Slide/Scale` (planned) · **Canonical standards:** [API](../09-component-api-standard.md) · [Tokens](../10-design-tokens.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/motion/src/reveal.tsx`](../../packages/motion/src/reveal.tsx) · Tests: [`reveal.test.tsx`](../../packages/motion/src/reveal.test.tsx), [`reveal.ssr.test.tsx`](../../packages/motion/src/reveal.ssr.test.tsx), [`reveal.a11y.test.tsx`](../../packages/motion/src/reveal.a11y.test.tsx) · Story: [`reveal.stories.tsx`](../../packages/motion/src/reveal.stories.tsx)

Entrance primitive that fades/translates its children into view. Pure **CSS transition + IntersectionObserver** (no JS animation runtime), so it stays within the [performance budget](../13-performance-standard.md) and degrades gracefully. Use it to reveal cards, sections, and headlines on scroll or on mount.

## Install / import

```bash
# compiled edition
pnpm add @scope/motion @scope/tokens
# source edition (planned)
npx <name> add reveal
```
```tsx
import { Reveal } from "@scope/motion";           // or "@scope/motion/reveal"
import "@scope/tokens/styles.css";                 // token CSS variables
import "@scope/motion/styles.css";                 // .scope-reveal transitions
```

## Example (real, runnable — this is the fixture code)

```tsx
<Reveal direction="up" distance="md" duration="normal" trigger="in-view" once>
  <PricingCard />
</Reveal>
```

## Props

| Prop | Type | Default | Level | Description |
|---|---|---|---|---|
| `direction` | `"up" \| "down" \| "left" \| "right" \| "none"` | `"up"` | 1 | Entry translation axis/sign |
| `distance` | `"sm" \| "md" \| "lg"` | `"md"` | 1/2 | Maps to `--motion-distance-*` tokens |
| `duration` | `"instant" \| "fast" \| "normal" \| "slow"` | `"normal"` | 1/2 | Maps to `--motion-duration-*` tokens (no raw ms) |
| `delay` | `"none" \| "sm" \| "md"` | `"none"` | 1/2 | Token-based delay |
| `trigger` | `"mount" \| "in-view"` | `"in-view"` | 1 | Animate on mount or when scrolled into view |
| `once` | `boolean` | `true` | 1 | Reveal only the first time it enters the viewport |
| `viewportMargin` | `string` | `"0px 0px -10% 0px"` | 2 | `IntersectionObserver` `rootMargin` |
| `reducedMotion` | `"respect" \| "force-reduce" \| "allow"` | `"respect"` | 2 | Override reduced-motion handling |
| `onVisibilityChange` | `(visible: boolean) => void` | — | 2 | Fires on intersection changes |
| `className` | `string` | — | 1 | Merged last via `cn()` (yours wins) |
| `style` | `CSSProperties` | — | 1 | Merged after the reveal CSS vars |
| `ref` | `Ref<HTMLDivElement>` | — | — | Forwarded to the wrapper element |

Level 3 (escape hatch): none needed — the CSS path has no engine object to expose. A Motion-backed variant (springs) would add a namespaced `motionProps` (see [API standard](../09-component-api-standard.md#three-api-levels)).

## Accessibility notes

- **Keyboard / focus:** the wrapper is a presentational `div` — it adds **no** `role`/`aria-*` and does not intercept focus or tab order. Interactive children keep their own semantics. (Asserted in [`reveal.a11y.test.tsx`](../../packages/motion/src/reveal.a11y.test.tsx).)
- **Screen reader:** content is always in the DOM (only visually transformed), so it is announced normally.
- **axe:** 0 violations at WCAG 2.2 AA scope (automated test).

## Reduced-motion behavior

Under `prefers-reduced-motion: reduce`, `.scope-reveal` renders at **opacity 1, no transform, no transition** — content appears instantly and remains fully functional. `reducedMotion="force-reduce"` forces this regardless of OS setting; `"allow"` opts a specific instance out. No information is conveyed by motion alone. See [`12-accessibility-standard.md`](../12-accessibility-standard.md).

## Performance notes

- Animates **opacity + transform only** (compositor-friendly); `will-change` is set on the transition properties.
- One shared-free `IntersectionObserver` per instance, **disconnected on reveal** (`once`) and on unmount (asserted by test). No scroll listeners.
- No JS animation runtime on the CSS path → negligible bundle cost. Budget: [`13-performance-standard.md`](../13-performance-standard.md).

## Responsive behavior

Layout-neutral: `Reveal` wraps children in a block `div` and does not change their flow. Distances are fixed token px; for large hero moves prefer `distance="lg"` and test on mobile.

## Dark mode & custom theme

`Reveal` has no colors of its own — it inherits from children and tokens. Duration/distance/easing come from `--motion-*` variables, so a theme override (`[data-theme="dark"]` or intensity mode) changes its motion without touching the component. See [`10-design-tokens.md`](../10-design-tokens.md).

## Common recipes

- **Stagger a list:** wrap items in the planned `Stagger`/`StaggerItem`, each rendering a `Reveal`.
- **Headline:** `<Reveal direction="up" distance="lg" duration="slow">`.
- **Replay on re-enter:** `<Reveal once={false}>` (fires `onVisibilityChange` both ways).

## Known limitations

- CSS-only path can't do springs/gestures — escalate to a Motion-backed primitive for those ([`06`](../06-animation-engine-decision.md)).
- Requires both stylesheets (`@scope/tokens/styles.css` + `@scope/motion/styles.css`) or the planned compiled fallback; without them the element renders visible but unanimated.

## Related

- Standards: [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
- Inventory row: [`21-component-inventory.md`](../21-component-inventory.md)
- Definition of done: [`25-definition-of-done.md`](../25-definition-of-done.md#motion-primitive)
