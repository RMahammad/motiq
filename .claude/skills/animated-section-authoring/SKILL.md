---
name: animated-section-authoring
description: Author a marketing/landing section in @scope/sections composed from existing components. Enforces content-via-props (no hard-coded copy), semantic HTML, responsive + mobile-safe animation, reduced-motion layout, theme support, and a performance review.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---
# Animated section authoring

## Use this skill when
- Creating or changing a marketing/landing section (Hero, FeatureGrid, CTA, Pricing, FAQ, Testimonials, Footer, …).

## Do not use this skill when
- Building a single interactive component → [`component-authoring`](../component-authoring/SKILL.md).

## Required context
- [`docs/09-component-api-standard.md`](../../../docs/09-component-api-standard.md)
- [`docs/12-accessibility-standard.md`](../../../docs/12-accessibility-standard.md)
- [`docs/13-performance-standard.md`](../../../docs/13-performance-standard.md)
- Existing sibling sections + the components being composed.

## Inputs
- The section's purpose and the components it will compose.

## Procedure
1. **Compose from existing components** — add no new animation engine; reuse primitives/components.
2. **No fixed company-specific marketing copy** — accept content through **props, slots, or structured data**. Provide realistic sample content only in stories.
3. **Semantic HTML** — correct heading hierarchy (one `h1` per page context; sections use appropriate `h2`/`h3`), landmarks where relevant.
4. **Responsive** across breakpoints; container queries where useful.
5. **Mobile-safe animations** — heavy scroll/parallax gated + fallback ([`13`](../../../docs/13-performance-standard.md)); no layout jank.
6. **Reduced-motion layout** — the section is fully usable and well-composed with motion off.
7. **No unnecessary client boundary** around static content — keep `"use client"` on the interactive leaves, not the whole section, to preserve RSC benefits.
8. **Theme support** — dark + custom-theme via tokens; no hard-coded colors.
9. Storybook: realistic examples (default / dark / custom-theme / reduced-motion / mobile).

## Required validation
- Run [`performance-review`](../performance-review/SKILL.md) (sections are perf-sensitive) and [`accessibility-review`](../accessibility-review/SKILL.md).
- Confirm the [marketing-section Definition of Done](../../../docs/25-definition-of-done.md#marketing-section).
- Verify content is fully prop/slot-driven (no baked copy).

## Expected outputs
Section component + prop/slot API + stories with realistic content + docs page + export update + changeset.

## Documentation updates
- Docs page + inventory row. Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- A section needs a brand-new component that doesn't exist → build it first via [`component-authoring`](../component-authoring/SKILL.md).
- Static content is being forced behind a client boundary → stop and restructure.

## Prohibited actions
- Hard-coded marketing copy in the reusable component.
- Wrapping static content in an unnecessary `"use client"` boundary.
- Heavy scroll/parallax with no mobile fallback.
- Hard-coded colors instead of theme tokens.
