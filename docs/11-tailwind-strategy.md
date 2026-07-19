# 11 — Tailwind & theming strategy

> **Type:** 🟢 Canonical styling contract · **Implementation status:** 🔵 Planned · **Last reviewed:** 2026-07-14
> **Owns:** Tailwind preset strategy, `cn()`/CVA usage, non-Tailwind support, consumer overrides.
> **Related:** [`10-design-tokens.md`](10-design-tokens.md) · [`09-component-api-standard.md`](09-component-api-standard.md) · [ADR-0004](adrs/0004-styling-and-tailwind.md) · [`05-dependency-decisions.md`](05-dependency-decisions.md)
> Tailwind v4 facts (CSS-first `@theme`, automatic source detection) verified 2026-07-14 — see [`05`](05-dependency-decisions.md#sources).

## Hybrid strategy (this is the biggest source of consumer support tickets — design defensively)

1. **Ship a Tailwind v4 preset** (`@scope/tailwind-preset`) exposing tokens via `@theme` as CSS variables.
2. **Source registration** — compiled package classes live in `node_modules` (excluded by v4 heuristics). Either document `@source "../node_modules/@scope/react";` **or** avoid the problem by shipping compiled CSS for the npm edition (we do both — see fallback below).
3. **Never construct class names dynamically** (`` `bg-${c}-500` `` is banned) — Tailwind can't detect them. Use CVA maps with fully-spelled classes.
4. **CSS-variable design tokens** drive color/space/motion so themes override without touching source ([`10`](10-design-tokens.md)).
5. **Dark mode + multi-theme** via `data-theme`/`.dark` + var overrides; no component code changes.
6. **Consumer overrides** via `className` (tailwind-merge ensures the consumer wins) + documented `data-slot` hooks + CSS vars.
7. **Reduced motion** shipped as `@media (prefers-reduced-motion: reduce)` rules in the preset and honored in JS ([`12`](12-accessibility-standard.md)).
8. **Non-Tailwind users** import `@scope/styles` (compiled, namespaced, **no Preflight assumptions**).
9. **Registry edition** ships raw source with Tailwind classes for buyers who want full control ([`16`](16-commercial-packaging.md)).

## Utilities

- `cn()` = `clsx` + `tailwind-merge` (the override contract: consumer `className` always wins).
- Variants = **class-variance-authority (CVA)**.
- Theming = CSS custom properties + `data-*`.
- Layering via `@layer` to avoid specificity wars.

## The styling contract (what we promise consumers)

> *"Structure and behavior are stable; visuals are yours via tokens, `data-slot`, and `className`. We never win a class conflict against you."*

- Do **not** expose hundreds of class props. Expose semantic props, slots, CSS vars, and one `className` escape hatch. See [`09`](09-component-api-standard.md).
- Data-attribute hooks (`data-state`, `data-slot`, `data-motion`) are part of the public styling API and are covered by semver.

## Tailwind version compatibility

Target Tailwind v4.x. If a consumer is on v3, they use the **compiled CSS fallback** (`@scope/styles`) rather than the preset. Document both paths. Preflight is **not** assumed by our compiled CSS.

## Non-Tailwind support

`@scope/styles` is a compiled, namespaced stylesheet covering every component's structural CSS + token variables. Class names are prefixed (`scope-…`) to avoid collisions. This is a first-class supported path, not an afterthought — it protects the "works without Tailwind" promise and reduces support load.
