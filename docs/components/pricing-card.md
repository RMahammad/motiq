# PricingCard

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/react`
> **Related primitives:** [`Reveal`](reveal.md) · **Canonical standards:** [API](../09-component-api-standard.md) · [Tokens](../10-design-tokens.md) · [Tailwind](../11-tailwind-strategy.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md)
> Source: [`packages/react/src/pricing-card.tsx`](../../packages/react/src/pricing-card.tsx) · Tests: [`pricing-card.test.tsx`](../../packages/react/src/pricing-card.test.tsx), [`.ssr`](../../packages/react/src/pricing-card.ssr.test.tsx), [`.a11y`](../../packages/react/src/pricing-card.a11y.test.tsx)

A themeable, accessible pricing-plan card. **Content is prop-driven** (no baked copy); **visuals come from semantic tokens** so it themes via `[data-theme]` without touching source. Optionally animates in with [`Reveal`](reveal.md).

## Install / import

```tsx
import { PricingCard } from "@scope/react"; // or "@scope/react/pricing-card"
import "@scope/tokens/styles.css";
import "@scope/react/styles.css"; // structural CSS (non-Tailwind path)
```

## Example (this is the fixture code)

```tsx
<PricingCard
  planName="Pro"
  price="$29"
  period="/mo"
  description="For growing teams"
  features={["Unlimited projects", "Priority support", "Analytics"]}
  cta={{ label: "Start free trial", href: "/checkout" }}
  featured
  badge="Most popular"
  revealOnView
/>
```

## Props

| Prop | Type | Default | Level | Description |
|---|---|---|---|---|
| `planName` | `string` | — (required) | 1 | Rendered as the card's `<h3>` (labels the card) |
| `price` | `string` | — (required) | 1 | Prominent amount (pass pre-formatted, e.g. `"$29"`) |
| `period` | `string` | — | 1 | De-emphasized suffix, e.g. `"/mo"` |
| `description` | `string` | — | 1 | Short muted line under the price |
| `features` | `ReactNode[]` | `[]` | 1 | Rendered as a `<ul>` with check markers |
| `cta` | `{ label; href?; onClick? }` | — | 1 | Renders a link if `href`, else a button |
| `featured` | `boolean` | `false` | 1 | Accent border + shadow; sets `data-featured` |
| `badge` | `string` | — | 1 | Small highlight label (e.g. "Most popular") |
| `revealOnView` | `boolean` | `false` | 1 | Wrap in `<Reveal trigger="in-view">` |
| `children` | `ReactNode` | — | 2 | Extra content before the CTA (slot) |
| `className` / `style` / `ref` | — | — | 1 | Forwarded; `className` merged last via `cn()` |

**Slots / data hooks (styling API):** `data-slot="pricing-card" | badge | plan | price | description | features | cta"`, plus `data-featured`.

## Accessibility notes

- The card is `role="group"` labelled by its plan-name `<h3>` (`aria-labelledby`), so screen-reader users can navigate between plans by name.
- Features are a real `<ul>`/`<li>` list; the check marker is decorative CSS (`::before`), not content.
- CTA is a real `<button>` or `<a>` with an accessible name from `cta.label`.
- axe: 0 violations at WCAG 2.2 AA scope for both button and link CTAs (automated tests).

## Reduced-motion behavior

Static by default. With `revealOnView`, the entrance is a [`Reveal`](reveal.md) — under `prefers-reduced-motion: reduce` the card appears at final state instantly, fully functional.

## Performance notes

Pure structural CSS + optional CSS entrance; no JS animation runtime. ~1 kB brotli for the component (excl. shared deps). `"use client"` (it composes Reveal and accepts handlers) — keep pricing *sections* server-rendered and let this leaf be the client boundary. Budget: [`13`](../13-performance-standard.md).

## Responsive behavior

The card fills its container; compose several in a responsive grid (see the playground). Content wraps naturally; long feature lists grow the card height.

## Dark mode & custom theme

No hard-coded colors — all from `--color-*` / `--space-*` / `--radius-*` tokens. Set `data-theme="dark"` (or `.dark`) on an ancestor, or override tokens, to re-theme without touching the component. See [`10-design-tokens.md`](../10-design-tokens.md).

## Common recipes

- **3-tier pricing:** render three `PricingCard`s in a grid; mark the middle one `featured`.
- **Annual/monthly toggle:** keep the toggle in the parent; pass the computed `price`/`period`.

## Known limitations

- Not a full pricing *section* (heading, toggle, comparison) — that will live in `@scope/sections`.
- `price` is a formatted string; currency/localization is the caller's responsibility.

## Related

- [`Reveal`](reveal.md) · Inventory: [`21-component-inventory.md`](../21-component-inventory.md) · DoD: [`25`](../25-definition-of-done.md#interactive-component)
