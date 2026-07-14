# HeroSection

> **Status:** 🟡 In progress (spike + tests) · **Version introduced:** v0.0.0 (pre-release) · **Tier:** Premium · **Package:** `@scope/sections`
> **Composes:** [`Stagger`](stagger.md) + [`Reveal`](reveal.md) · **Standards:** [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md) · [Perf](../13-performance-standard.md) · Skill: [`animated-section-authoring`](../../.claude/skills/animated-section-authoring/SKILL.md)
> Source: [`packages/sections/src/hero-section.tsx`](../../packages/sections/src/hero-section.tsx) · Tests: [`.test`](../../packages/sections/src/hero-section.test.tsx), [`.ssr`](../../packages/sections/src/hero-section.ssr.test.tsx), [`.a11y`](../../packages/sections/src/hero-section.a11y.test.tsx)

A landing-page hero. **Content is entirely prop/slot-driven — no baked marketing copy.** It's **server-safe** (no `"use client"`): a Server Component can render it directly; it composes the client primitives (`Stagger`/`Reveal`) as leaves — the ideal RSC pattern.

## Import & example

```tsx
import { HeroSection } from "@scope/sections"; // or "@scope/sections/hero-section"
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/sections/styles.css";

<HeroSection
  eyebrow="Now in beta"
  title="Premium motion you can actually ship"
  subtitle="Accessible, reduced-motion-aware, Server-Component-safe components."
  actions={
    <>
      <a href="/start" className="scope-btn">Get started</a>
      <a href="/docs" className="scope-btn">Read the docs</a>
    </>
  }
  media={<img alt="Product screenshot" src="/hero.png" />}
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — (required) | Rendered as the hero heading |
| `eyebrow` | `ReactNode` | — | Small over-title label |
| `subtitle` | `ReactNode` | — | Supporting line |
| `actions` | `ReactNode` | — | **Slot** for CTA buttons/links (consumer-provided) |
| `media` | `ReactNode` | — | **Slot** for image / mockup / illustration |
| `align` | `"start" \| "center"` | `"start"` | Text alignment; sets `data-align` |
| `headingLevel` | `1 \| 2 \| 3` | `1` | Semantic heading level (keep one `h1` per page) |
| `animate` | `boolean` | `true` | Entrance stagger/reveal (still reduced-motion-safe) |
| `children` | `ReactNode` | — | Extra content after the text column |
| `className` / `style` / `ref` | — | — | Forwarded to the `<section>` |

## Accessibility (verified by tests)

Semantic `<section>` with a real heading at the chosen level; `media` requires meaningful `alt` (caller-provided). axe: 0 violations with realistic content. No information is conveyed by motion alone; keep exactly one `h1` per page (`headingLevel`).

## Reduced motion / performance / responsive

- Entrance is `Stagger`/`Reveal` (mount-triggered — hero is above the fold); under `prefers-reduced-motion` content appears instantly.
- Responsive: single column by default; **two columns on ≥768px when a `media` slot is present** (via `:has()`), so it stacks safely on mobile.
- Media is constrained (`max-width:100%`, `height:auto`).

## Known limitations

- Not a full page — compose with other sections (FeatureGrid/CTA, planned).
- `:has()` responsive rule needs a modern browser; degrades to single-column otherwise.

## Related

- [`Stagger`](stagger.md) · [`Reveal`](reveal.md) · [`PricingCard`](pricing-card.md) · [Inventory](../21-component-inventory.md) · DoD: [`25`](../25-definition-of-done.md#marketing-section)
