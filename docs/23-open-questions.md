# 23 — Open questions

> **Type:** 🟢 Canonical for unresolved decisions · **Implementation status:** 🔵 Planned (living) · **Last reviewed:** 2026-07-14
> **Related:** [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md) · [`16-commercial-packaging.md`](16-commercial-packaging.md) · [`22-risk-register.md`](22-risk-register.md)
> Resolve blocking items before the phase noted. When resolved, record the decision in the owning canonical doc and/or an ADR, then move the row to "Resolved".
> **For launch specifically**, the consolidated, prioritized runbook is [`29-go-live-checklist.md`](29-go-live-checklist.md) — it maps each of these decisions to a recommendation + what it unblocks.

## Blocking (before Phase 2 / as noted)

| # | Question | Needed by | Owner | Where it lands when resolved |
|---|---|---|---|---|
| B1 | Do buyers who render our Remotion templates need their **own** company license at 4+ people? Who bears it? | Phase 4 | Founder + counsel | [`08`](08-remotion-license-analysis.md), [ADR-0003](adrs/0003-remotion-boundary.md) |
| B2 | Does the Remotion product embed `@remotion/player` in buyer apps, or ship source + a render service only? | Phase 4 | Founder | [`07`](07-remotion-strategy.md) |
| B3 | Business model: one-time + updates vs subscription (recommendation: one-time+updates) | Phase 2 | Founder | [`01`](01-product-strategy.md) |
| ~~B4~~ | ~~Does the bundler (tsdown) preserve `"use client"` + subpath exports + types?~~ | ✅ **Resolved 2026-07-14** | Eng | [ADR-0006](adrs/0006-library-bundler.md) |

### Resolved

- **B4 (2026-07-14): YES.** The architecture spike built `@scope/{tokens,motion,react}` with **tsdown v0.15.12 (rolldown)**; `"use client"` is preserved on all consumer entry points, subpath exports + `.d.ts` generate correctly, peers/workspace deps stay external, and **Next.js 16.2.10 App Router + Vite 6 fixtures both build** (the Next build imports the client components from a Server Component — the RSC boundary proof). tsup fallback not needed. See [ADR-0006](adrs/0006-library-bundler.md) Validation.

## Important (before Phase 3 / launch)

| # | Question | Owner | Where it lands |
|---|---|---|---|
| I1 | Is there a **free tier** at all, and exactly which components? (recommended: small primitive set) | Founder | [`20`](20-mvp-roadmap.md) |
| I2 | Offer **hosted rendering** for Remotion videos (infra + support cost) or source-only? | Founder | [`07`](07-remotion-strategy.md) |
| I3 | Team-size trajectory (affects our **own** Remotion license obligation) | Founder | [`08`](08-remotion-license-analysis.md) |
| I4 | Product / brand name + npm scope (`@scope` placeholder) + GitHub org | Founder | [`01`](01-product-strategy.md), [`04`](04-package-map.md) |
| I5 | Supported-version window for previous major (6 vs 12 months) | Founder | [`19`](19-support-and-deprecation.md) |
| I6 | Support response-time targets per tier | Founder | [`19`](19-support-and-deprecation.md) |
| I7 | Number of shipped themes (keep ≤2 to bound cost) | Eng | [`10`](10-design-tokens.md) |

## Assumptions in force (revisit if they change)

- Small team (1–4 people) — affects Remotion license tier.
- Buyers are React/Next engineers, not designers-who-can't-code or video editors.
- Ship a coherent ~24-component v1, not 300 components.
- Tailwind primary but non-Tailwind supported (compiled fallback).
- ESM-only acceptable (Next 16 / React 19 / Vite).

> These assumptions are also summarized in [`00-executive-summary.md`](00-executive-summary.md#key-assumptions); this doc is the canonical place to challenge them.
