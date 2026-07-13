# 00 — Executive summary

> **Type:** Overview (links to detail; do not duplicate detail here) · **Implementation status:** 🔵 Planned (repo is pre-implementation) · **Last reviewed:** 2026-07-14
> **Legend:** see [Current vs planned](README.md#current-vs-planned-legend).

## Core product recommendation

Build a **pnpm + Turborepo monorepo** shipping an **ESM-only, tree-shakeable React component library** whose default animation engine is **Motion for React (MIT)** layered over **CSS / Web Animations API**, with **Remotion quarantined into a separate, separately-licensed paid video product line** that the core UI library never imports.

**The single most important invariant:** `@scope/react` (interactive UI) has **zero dependency on Remotion, Node APIs, or Next.js**. Enforced by ESLint import boundaries + CI + a hook — not discipline. See [`03-architecture.md`](03-architecture.md).

## Main technical choices

| Question | Decision | Detail |
|---|---|---|
| Animation engine | **Motion for React** + CSS/WAAPI | [`06`](06-animation-engine-decision.md), [ADR-0002](adrs/0002-animation-engine.md) |
| Remotion role | Video/timeline only; separate package + license | [`07`](07-remotion-strategy.md), [ADR-0003](adrs/0003-remotion-boundary.md) |
| Monorepo | pnpm workspaces + Turborepo | [ADR-0001](adrs/0001-monorepo-tool.md) |
| Bundler | tsdown (Rolldown); tsup fallback — gated on `"use client"` fixture | [ADR-0006](adrs/0006-library-bundler.md) |
| Styling | Tailwind preset + CSS vars + compiled fallback; `cn()` + CVA | [`11`](11-tailwind-strategy.md), [ADR-0004](adrs/0004-styling-and-tailwind.md) |
| Accessible primitives | Radix default; React Aria later | [ADR-0011](adrs/0011-accessible-primitives.md) |
| Packaging | Compiled private npm **+** shadcn-style source registry | [`16`](16-commercial-packaging.md), [ADR-0010](adrs/0010-commercial-distribution.md) |
| IP model | **No runtime license checks**; gate at install/purchase | [`16`](16-commercial-packaging.md) |
| Docs | Storybook 9 + Next.js docs site | [`15`](15-documentation-strategy.md), [ADR-0008](adrs/0008-documentation-platform.md) |

## Main product positioning

Target: **React/Next.js product engineers, indie founders, and small agencies** building SaaS landing pages and dashboards. Core problem: *"animated kits look great in demos but are inaccessible, untyped, un-themeable, and break in the App Router."* UVP: **"premium motion you can actually ship — accessible, reduced-motion aware, Server-Component-safe, typed, themeable, tested."** Full detail: [`01-product-strategy.md`](01-product-strategy.md), [`02-market-analysis.md`](02-market-analysis.md).

## Most important risks

1. ⚠️ **Remotion license boundary** — reselling templates / embedding the Player / hosted rendering are legally ambiguous. Gate the video line until answered in writing. See [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md).
2. **`"use client"` stripped by the bundler** — breaks RSC. Blocked by a packed-tarball fixture test. See [`14`](14-testing-strategy.md).
3. **Too many novelty components** — dilutes the production-readiness positioning. Curated MVP only.

Full register: [`22-risk-register.md`](22-risk-register.md).

## MVP summary

**~24 components on a ~10-primitive layer**; 5 hero components for marketing. A coherent landing-page + SaaS starter kit, not 24 novelties. Free tier = core primitives (funnel); premium = the rest + sections. Exact list, free/premium split, and hero components: [`20-mvp-roadmap.md`](20-mvp-roadmap.md).

## Key assumptions

- Small team (1–4 people) — affects your own Remotion license tier.
- Buyers are React/Next engineers, not designers-who-can't-code or video editors.
- Ship a coherent ~24-component v1, not a 300-component behemoth.
- Tailwind is primary but non-Tailwind users are supported (compiled CSS fallback).
- ESM-only is acceptable (Next 16 / React 19 / Vite all support it).

Assumptions that are still *questions* live in [`23-open-questions.md`](23-open-questions.md).

## Immediate priorities (next actions)

1. **Send the Remotion license questions** to Remotion + counsel ([`08`](08-remotion-license-analysis.md)) — longest lead time.
2. **Architecture spike:** pnpm+Turborepo skeleton with `tokens`/`motion`/`react` + Next & Vite fixtures; ship one `Reveal` and prove `"use client"` survives the build and hydrates.
3. **Lock the bundler** from spike results ([ADR-0006](adrs/0006-library-bundler.md)).
4. **Author boundary enforcement** (ESLint + hook + failing-import test).
5. **Define the token system** ([`10`](10-design-tokens.md)) and primitive layer ([`21`](21-component-inventory.md)).
6. **Stand up CI** with all gates incl. tarball-fixture install ([`14`](14-testing-strategy.md), [`18`](18-release-process.md)).
7. **Buyer interviews** (3–5) to validate the wedge.

Full staged plan: [`20-mvp-roadmap.md`](20-mvp-roadmap.md).
