# BentoGrid / BentoGridItem

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/react` · **Version introduced:** v0.0.0
> Source: [`bento-grid.tsx`](../../packages/react/src/bento-grid.tsx) · Tests: [`bento-grid.test.tsx`](../../packages/react/src/bento-grid.test.tsx) · Standards: [API](../09-component-api-standard.md) · [A11y](../12-accessibility-standard.md)

A bento layout: a responsive grid (`BentoGrid`) of content cells (`BentoGridItem`) that can span columns/rows. **Server-safe** (composes `Reveal` as a client leaf when `revealOnView`). Content is prop/slot-driven.

```tsx
import { BentoGrid, BentoGridItem } from "@scope/react/bento-grid";
import "@scope/react/styles.css";

<BentoGrid columns={3}>
  <BentoGridItem colSpan={2} rowSpan={2} title="Fast" description="Sub-second builds." revealOnView />
  <BentoGridItem title="Accessible" description="WCAG 2.2 AA." revealOnView />
  <BentoGridItem title="Typed" description="Strict TypeScript." media={<img alt="Types" src="/t.png" />} />
</BentoGrid>
```

### BentoGrid

| Prop | Type | Default | Notes |
|---|---|---|---|
| `columns` | `number` | `3` | Desktop columns (collapses to 1 ≤640px) |

### BentoGridItem

| Prop | Type | Default | Notes |
|---|---|---|---|
| `colSpan` / `rowSpan` | `1\|2\|3` / `1\|2` | `1` / `1` | Grid span (desktop; collapses on mobile) |
| `title` / `description` / `icon` / `media` | `ReactNode` | — | Content slots |
| `headingLevel` | `2\|3\|4` | `3` | Semantic heading level for `title` |
| `revealOnView` | `boolean` | `false` | Wrap in `<Reveal trigger="in-view">` |

**Slots:** `data-slot="bento-item" | icon | title | description | media"`; `data-col-span` / `data-row-span`.

**A11y / responsive:** real heading for `title` (choose level to fit the page); `media` needs `alt`. axe 0. Single column on ≤640px (spans collapse); `revealOnView` entrance is reduced‑motion‑safe. ~1 kB brotli.

Related: [SpotlightCard](spotlight-card.md) · [HeroSection](hero-section.md) · [Inventory](../21-component-inventory.md)
