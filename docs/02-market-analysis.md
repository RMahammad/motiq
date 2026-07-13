# 02 — Market analysis

> **Type:** Canonical for competitive landscape · **Implementation status:** 🔵 Planned (analysis, not a build artifact) · **Last reviewed:** 2026-07-14
> **Related:** [`01-product-strategy.md`](01-product-strategy.md) · [`16-commercial-packaging.md`](16-commercial-packaging.md)
> No competitor's code, copy, or visual identity was copied. Categories are **[FACT]**; interpretation is **[REC]**.

## Product categories & the opening each gives us

| Category | Representative model | Buyer | Typical pricing | Common weakness (our opening) |
|---|---|---|---|---|
| shadcn-style OSS + paid blocks | Free primitives, paid templates/blocks | Product engineers | $0 core / $99–$499 blocks | Accessibility & motion depth vary; we differentiate on *motion quality + a11y* |
| Animated "magic" component kits | Copy-paste, flashy | Landing-page builders | Free or cheap | **Unmaintained, inaccessible, App-Router breakage, no reduced-motion** — our core wedge |
| Premium Tailwind UI kits | Compiled + HTML/React snippets | Teams | $149–$799 one-time | Little/no motion; static |
| SaaS UI/dashboard kits | Figma + code | Founders | $99–$299 | Motion is decorative, not systematic |
| Motion preset products | Presets/hooks | Devs | Small | Not a full system |
| Remotion template marketplaces | Video templates | Marketers/devs | Per-template | Fragmented; licensing confusion |

## Structural insights

- **Visually impressive but production-hostile:** particle fields, heavy WebGL/blur backgrounds, infinite parallax, cursor-follow physics, scroll-scrubbed video. Generate screenshots but cause jank, motion sickness, and mobile battery drain → make them **opt-in, lazy-loaded, reduced-motion-gated**, and market them honestly.
- **Frequently copied, rarely maintained properly:** command palette, mega menu, carousel, toast, dialog/drawer, marquee. These are **accessibility minefields** → build on Radix and make a11y the headline. See [`12`](12-accessibility-standard.md).
- **Support-problem generators:** scroll pinning, `position: sticky` interactions, z-index/overlay stacking, Tailwind class-detection failures. Design these out — see [`11-tailwind-strategy.md`](11-tailwind-strategy.md) and [`13-performance-standard.md`](13-performance-standard.md).
- **Justifies premium price:** guaranteed accessibility + reduced motion, RSC/App-Router safety, TypeScript-first API, token theming, tested + versioned + migration guides, source-registry access, real docs. **Exactly what copy-paste kits don't do.**

## Buyer types

- **Indie founder / solo engineer** — wants a beautiful landing page fast; values copy-paste + registry source.
- **SaaS product team** — wants dashboard + marketing components that pass an a11y audit and won't regress; values tests, types, semver.
- **Agency** — reuses across many client projects; values the agency license and customization.

## Positioning conclusion

Win on **trust and production-readiness**. The moat is docs + support + accessibility + maintenance discipline, reinforced by brand and (for the compiled edition) install-time entitlement. Differentiation detail: [`01-product-strategy.md`](01-product-strategy.md). Copycat risk is tracked in [`22-risk-register.md`](22-risk-register.md).
