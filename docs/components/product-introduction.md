# ProductIntroduction

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/recipes`
> **Composes:** [`MotionScene`/`MotionStep`](../adrs/0015-semantic-motion-api.md) · **Standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md) · Skill: [`animated-section-authoring`](../../.claude/skills/component-authoring/SKILL.md)
> Source: [`packages/recipes/src/product-introduction.tsx`](../../packages/recipes/src/product-introduction.tsx) · Tests: [`.test`](../../packages/recipes/src/product-introduction.test.tsx)

The first **recipe** — a complete, opinionated workflow, not a single effect ([`27`](../27-product-differentiation.md), [ADR-0013](../adrs/0013-product-moat.md)). A drop-in, choreographed product hero: you supply content through slots and the recipe assigns each part a **semantic role and intent**, then plays them as one coordinated [`MotionScene`](../adrs/0015-semantic-motion-api.md) (eyebrow → heading → subtitle → preview → actions). **No baked copy.** It carries `"use client"` (it re-exports client primitives) but is still a server-safe shell over a single client leaf.

## Import & example

```tsx
import { ProductIntroduction } from "@scope/recipes"; // or "@scope/recipes/product-introduction"
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/recipes/styles.css";

<ProductIntroduction
  eyebrow="New"
  title="Author motion by intent, not keyframes"
  subtitle="A coordinated product hero in a single component."
  media={<img alt="Product screenshot" src="/preview.png" />}
  primaryAction={<a href="/start" className="scope-btn">Get started</a>}
  secondaryAction={<a href="/docs" className="scope-btn">Read the docs</a>}
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — (required) | Product headline; rendered as a real heading |
| `eyebrow` | `ReactNode` | — | Small over-title label (kicker) |
| `subtitle` | `ReactNode` | — | Supporting line beneath the headline |
| `media` | `ReactNode` | — | **Slot** for product preview (image/video/component); enables two-column layout |
| `primaryAction` | `ReactNode` | — | **Slot** for the primary CTA |
| `secondaryAction` | `ReactNode` | — | **Slot** for the secondary CTA |
| `align` | `"start" \| "center"` | `"start"` | Alignment when there is no `media` |
| `headingLevel` | `1 \| 2` | `1` | Semantic heading level (keep one `h1` per page) |
| `intensity` | `"none" \| "reduced" \| "standard" \| "expressive"` | `"standard"` | Choreography intensity (forwarded to the scene) |
| `trigger` | `"mount" \| "in-view"` | `"in-view"` | When the scene plays |
| `reducedMotion` | `"respect" \| "force-reduce" \| "allow"` | `"respect"` | Reduced-motion policy (forwarded to the scene) |
| `children` | `ReactNode` | — | Extra steps appended to the scene |
| `className` / `style` / `ref` | — | — | Forwarded to the `<section>` |

## Choreography (the recipe)

Each slot becomes a `MotionStep` with a semantic role/intent, coordinated by a single `MotionScene` with `preset="product-introduction"`:

| Slot | Role | Intent | Sequence |
|---|---|---|---|
| `eyebrow` | `detail` | `deemphasize` | 1 |
| `title` | `heading` | `introduce` | 2 |
| `subtitle` | `supporting-content` | `deemphasize` | 3 |
| `media` | `product-preview` | `introduce` | 4 |
| actions | `primary-action` | `emphasize` | 5 (enters last) |

## Accessibility (verified by tests)

Semantic `<section>` with a real heading at the chosen level (`h1`/`h2`); slotted controls and `media` keep their own semantics (`media` requires meaningful caller-provided `alt`). axe: 0 violations on SSR output with realistic content. No information is conveyed by motion alone; keep exactly one `h1` per page.

## Reduced motion / performance / responsive

- Inherits `MotionScene` behavior: **SSR renders final state**, animates after hydrate; under `prefers-reduced-motion` (or `reducedMotion="force-reduce"`) steps appear at their final position with no transform.
- Responsive: single stacked column by default; **two-column editorial grid at ≥900px when `media` is present** (media on the right, copy on the left), so it stacks safely on mobile.
- Layout/typography ship in `@scope/recipes/styles.css`; entrance choreography comes from `@scope/motion/styles.css`.

## Known limitations

- One-heading recipe — for a multi-section page, compose with `@scope/sections` around it.
- The two-column layout assumes a single `media` node; complex split layouts should use a custom `MotionScene`.

## Related

- [`MotionScene`/`MotionStep`](../adrs/0015-semantic-motion-api.md) · [`HeroSection`](hero-section.md) · Moat: [`27`](../27-product-differentiation.md), [ADR-0013](../adrs/0013-product-moat.md) · [Inventory](../21-component-inventory.md) · DoD: [`25`](../25-definition-of-done.md#marketing-section)
