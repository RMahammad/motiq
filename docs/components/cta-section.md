# CTASection

> **Status:** 🟡 In progress (spike + tests) · **Tier:** Premium · **Package:** `@scope/sections` · **Version introduced:** v0.0.0
> Source: [`cta-section.tsx`](../../packages/sections/src/cta-section.tsx) · Tests: [`cta-section.test.tsx`](../../packages/sections/src/cta-section.test.tsx) · Skill: [`animated-section-authoring`](../../.claude/skills/animated-section-authoring/SKILL.md)

A call-to-action band: title + subtitle + an actions slot. **Server-safe** (wraps content in [`Reveal`](reveal.md) as a client leaf when `animate`). Content is prop/slot-driven — **no baked copy**.

```tsx
import { CTASection } from "@scope/sections";
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/sections/styles.css";

<CTASection
  title="Ready to ship?"
  subtitle="Start building your landing page today."
  actions={<a href="/start" className="scope-btn">Get started</a>}
/>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `ReactNode` | — (required) | Section heading |
| `subtitle` | `ReactNode` | — | Supporting line |
| `actions` | `ReactNode` | — | Slot for CTA buttons/links |
| `align` | `"start" \| "center"` | `"center"` | Alignment |
| `headingLevel` | `2 \| 3` | `2` | Heading level |
| `animate` | `boolean` | `true` | Reveal entrance (reduced-motion-safe) |

**A11y:** semantic `<section>` + heading; actions are consumer-provided real controls. axe 0. Entrance respects `prefers-reduced-motion`.

Related: [HeroSection](hero-section.md) · [FeatureGrid](feature-grid.md) · [Inventory](../21-component-inventory.md)
