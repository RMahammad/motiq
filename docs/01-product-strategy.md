# 01 — Product strategy

> **Type:** Canonical for product positioning & commercial terms overview · **Implementation status:** 🔵 Planned · **Last reviewed:** 2026-07-14
> **Related:** [`02-market-analysis.md`](02-market-analysis.md) · [`16-commercial-packaging.md`](16-commercial-packaging.md) (distribution mechanics) · [`19-support-and-deprecation.md`](19-support-and-deprecation.md) · [`20-mvp-roadmap.md`](20-mvp-roadmap.md)
> ⚠️ Commercial terms below are business/legal drafts. **All license text and terms must be reviewed by a qualified attorney before sale.** Nothing here is legal advice.

## Target audience

React/Next.js engineers at seed–Series B SaaS companies, plus indie hackers and small agencies, who need a landing page or dashboard to look premium **without an in-house motion designer**.

## Core problem solved

> "Animated component collections look amazing in demos but are painful to use in production — inaccessible, not typed, not themeable, they break in the App Router, and they are unmaintained."

We sell **production-grade, accessible, RSC-safe motion** — the boring-but-hard 80% that copy-paste kits skip. Evidence for this gap: [`02-market-analysis.md`](02-market-analysis.md).

## Unique value proposition

> *"Premium motion you can actually ship: accessible by default, reduced-motion aware, Server-Component-safe, typed, themeable, and tested — with a source-registry escape hatch when you need to customize."*

Positioning line: **"the one animated kit that passes an accessibility audit and doesn't break your Lighthouse score."** We win on **trust and production-readiness, not component count.**

## Product name criteria

Do **not** reuse competitor identity. Criteria: short, pronounceable, motion-adjacent but not literally "Motion/Framer/GSAP"; available `.com` + npm scope + GitHub org; trademark-clear; works as a CLI verb (`npx <name> add reveal`). Brand direction: **restrained, technical, "engineered motion"** — dark editorial docs, precise not flashy. (Name is an [open question](23-open-questions.md).)

## Commercial terms (draft — lawyer review required)

| Term | Recommendation | Detail |
|---|---|---|
| Free vs paid | Small **free** primitive/core tier (funnel) + **paid** components/sections/Remotion | [`20`](20-mvp-roadmap.md#free-vs-premium-split) |
| Individual vs team | Per-seat; team license (≤N devs); agency license (unlimited client projects) | — |
| Source vs compiled | **Both** — compiled npm for convenience, registry source for customization | [`16`](16-commercial-packaging.md) |
| One-time vs subscription | **One-time per major version + optional annual "updates & new components" renewal** | [`19`](19-support-and-deprecation.md) |
| Commercial use | Permitted in unlimited end products; **redistribution of the library itself prohibited** | — |
| Agency / client work | Allowed under agency tier; deliver to clients as *compiled output in the client's app*, not the source package | — |
| Enterprise | Custom: SSO, priority support, private Slack, invoice billing | — |
| Refunds | 14-day, with anti-abuse (source access complicates this) | [`16`](16-commercial-packaging.md) |

## Strategic guardrails

- Optimize for a **commercially sustainable product**, not maximum component count.
- Treat documentation, examples, testing, licensing, and migration support as **part of the product**, not extras.
- Keep the core React library **independent from Remotion** (license + bundle firewall).
- Accessibility and reduced motion are **release requirements**, and they are the headline differentiator — market them.
- Novelty effects (particles, heavy parallax) are opt-in, lazy, reduced-motion-gated, and honestly marketed. See [`02`](02-market-analysis.md#structural-insights).
