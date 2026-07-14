# FeatureGrid

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/sections` · **Version introduced:** v0.0.0
> Composes [`BentoGrid`](bento-grid.md) · Source: [`feature-grid.tsx`](../../packages/sections/src/feature-grid.tsx) · Tests: [`feature-grid.test.tsx`](../../packages/sections/src/feature-grid.test.tsx) · Skill: [`animated-section-authoring`](../../.claude/skills/animated-section-authoring/SKILL.md)

A marketing "features" section: an optional heading block over a responsive [BentoGrid](bento-grid.md) of features. **Server-safe** (composes client leaves). Content is prop-driven — **no baked copy**.

```tsx
import { FeatureGrid } from "@scope/sections";
import "@scope/tokens/styles.css";
import "@scope/react/styles.css";
import "@scope/sections/styles.css";

<FeatureGrid
  eyebrow="Why us"
  title="Everything you need to ship"
  subtitle="Batteries included, no lock-in."
  features={[
    { title: "Fast", description: "Sub-second builds." },
    { title: "Accessible", description: "WCAG 2.2 AA." },
    { title: "Typed", description: "Strict TypeScript." },
  ]}
/>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `features` | `Feature[]` | — (required) | `{ icon?, title, description? }[]` |
| `eyebrow` / `title` / `subtitle` | `ReactNode` | — | Optional heading block |
| `columns` | `number` | `3` | Grid columns (collapses on mobile) |
| `headingLevel` | `2 \| 3` | `2` | Section heading level (items nest one deeper) |
| `align` | `"start" \| "center"` | `"start"` | Heading alignment |

**A11y/responsive:** semantic `<section>` + heading; each feature title is a real nested heading; items reveal on scroll (reduced-motion-safe). axe 0. Single column on mobile.

Related: [BentoGrid](bento-grid.md) · [HeroSection](hero-section.md) · [CTASection](cta-section.md) · [Inventory](../21-component-inventory.md)
