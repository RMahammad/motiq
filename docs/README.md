# Documentation index

> **Type:** Index (start here) · **Last reviewed:** 2026-07-14

## What this project is

A **premium, production-ready animated component library for React 19 and Next.js 16 (App Router) and Vite**, sold commercially. The product's differentiator is *production-readiness*: accessibility, reduced-motion, Server-Component safety, typed APIs, theming via tokens, tests, and versioning — not raw component count. See [`00-executive-summary.md`](00-executive-summary.md).

## Current project phase

🟡 **Phase 1 (foundation) — architecture spike landed 2026-07-14.**

The repository now contains: this documentation set, the Claude Code system (`.claude/`, `CLAUDE.md`), the archived plan, **and a working pnpm + Turborepo monorepo skeleton** — `@scope/{tokens,motion,react}` (spike scaffolds with the `Reveal` primitive), plus `apps/playground-next` and `apps/playground-vite` fixtures. The spike **proved `"use client"` survives the tsdown build and renders in Next.js 16 App Router + Vite** (resolving open question B4; [ADR-0006](adrs/0006-library-bundler.md) and [ADR-0001](adrs/0001-monorepo-tool.md) are now Accepted).

Everything else remains **Planned** unless a doc marks it 🟡/🟢. The MVP components, full test suite, Storybook, docs site, and packaging are not built yet. See [`20-mvp-roadmap.md`](20-mvp-roadmap.md) for phase gates and [`23-open-questions.md`](23-open-questions.md) for what remains.

### Current vs planned legend

Used throughout the docs:

| Marker | Meaning |
|---|---|
| 🟢 **Implemented** | Exists in the repository right now |
| 🟡 **In progress** | Partially built (e.g. the spike scaffolds) |
| 🔵 **Planned** | Designed here but not yet built |

> As of 2026-07-14, the monorepo skeleton + `@scope/{tokens,motion,react}` + both fixtures are 🟡 (spike scaffolds); the doc validators in [`tooling/`](tooling/) are 🟢; the rest is 🔵 Planned. When you implement something, change its marker in the owning canonical doc and run the validation scripts.

## Where new contributors (and Claude) should begin

1. Read [`00-executive-summary.md`](00-executive-summary.md).
2. Read [`03-architecture.md`](03-architecture.md) for the package boundaries and firewalls.
3. Read [`24-claude-code-workflow.md`](24-claude-code-workflow.md) to understand skills/hooks/ADRs.
4. For any hands-on work, invoke the [`repository-orientation`](../.claude/skills/repository-orientation/SKILL.md) skill first.
5. Check the [Definition of Done](25-definition-of-done.md) before calling anything complete.

## Documents by topic

### Product & market
- [`00-executive-summary.md`](00-executive-summary.md) — the whole plan in one page
- [`01-product-strategy.md`](01-product-strategy.md) — positioning, audience, commercial terms
- [`02-market-analysis.md`](02-market-analysis.md) — competitive landscape
- [`27-product-differentiation.md`](27-product-differentiation.md) — **canonical** product moat & differentiation
- [`26-current-ui-audit.md`](26-current-ui-audit.md) — pre‑redesign UI audit
- [`28-visual-direction.md`](28-visual-direction.md) — **canonical** visual system + anti‑patterns
- [`20-mvp-roadmap.md`](20-mvp-roadmap.md) — MVP scope, phases, hero components
- [`21-component-inventory.md`](21-component-inventory.md) — component matrix
- [`19-support-and-deprecation.md`](19-support-and-deprecation.md) — support & deprecation policy
- [`30-showcase-visual-system.md`](30-showcase-visual-system.md) — **canonical** showcase visual system (Direction A violet studio)
- [`31-competitive-product-review.md`](31-competitive-product-review.md) — 2026-07-14 pivot review
- [`32-component-quality-tracker.md`](32-component-quality-tracker.md) — **canonical** per-component sellability status
- [`33-independent-component-audit.md`](33-independent-component-audit.md) — independent audit findings
- [`34-signature-component-sprint.md`](34-signature-component-sprint.md) — signature sprint log
- [`35-react-bits-quality-study.md`](35-react-bits-quality-study.md) — **canonical** reference-product research + do-not-recreate lists + licensing
- [`36-premium-creative-component-strategy.md`](36-premium-creative-component-strategy.md) — **canonical** signature strategy, candidate scores, slice selection, motion personalities
- [`37-signature-component-roadmap.md`](37-signature-component-roadmap.md) — **canonical** catalog demotion decisions + signature sequencing
- [`signature-components/`](signature-components/) — per-component signature design briefs

### Architecture & engineering
- [`03-architecture.md`](03-architecture.md) — **canonical** system architecture & boundaries
- [`04-package-map.md`](04-package-map.md) — **canonical** per-package spec
- [`05-dependency-decisions.md`](05-dependency-decisions.md) — **canonical** dependency table
- [`06-animation-engine-decision.md`](06-animation-engine-decision.md) — engine choice & escalation rules
- [`07-remotion-strategy.md`](07-remotion-strategy.md) — Remotion product line & rendering
- [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md) — ⚠️ license facts & open legal questions

### Standards (the contracts)
- [`09-component-api-standard.md`](09-component-api-standard.md) — **canonical** component API contract
- [`10-design-tokens.md`](10-design-tokens.md) — **canonical** token system
- [`11-tailwind-strategy.md`](11-tailwind-strategy.md) — **canonical** styling contract
- [`12-accessibility-standard.md`](12-accessibility-standard.md) — **canonical** a11y contract (release-blocking)
- [`13-performance-standard.md`](13-performance-standard.md) — **canonical** performance budgets
- [`14-testing-strategy.md`](14-testing-strategy.md) — **canonical** test layers & CI checks
- [`15-documentation-strategy.md`](15-documentation-strategy.md) — docs & Storybook responsibilities
- [`25-definition-of-done.md`](25-definition-of-done.md) — **canonical** definitions of done

### Commercial & operations
- [`16-commercial-packaging.md`](16-commercial-packaging.md) — distribution & IP model
- [`17-security-and-supply-chain.md`](17-security-and-supply-chain.md) — supply chain, secrets, code quality
- [`18-release-process.md`](18-release-process.md) — release pipeline & checklist
- [`22-risk-register.md`](22-risk-register.md) — **canonical** risk register
- [`23-open-questions.md`](23-open-questions.md) — **canonical** unresolved decisions
- [`29-go-live-checklist.md`](29-go-live-checklist.md) — **canonical** launch runbook (what's between v0.1.0 and a paid launch)

### Claude Code system
- [`24-claude-code-workflow.md`](24-claude-code-workflow.md) — how CLAUDE.md / skills / hooks / ADRs fit together
- [`/CLAUDE.md`](../CLAUDE.md) — root invariants & skill routing
- [`.claude/skills/`](../.claude/skills/) — the skills

### Templates & checklists
- [`templates/`](templates/) — component docs, proposals, ADR, migration, release/a11y/perf/design checklists

## ADR index

See [`adrs/README.md`](adrs/README.md) for the full status table. All ADRs are currently **Proposed** (nothing is implemented yet to validate them).

## Which document should I update?

| When you change… | Update this canonical doc | Also refresh (links/summaries) |
|---|---|---|
| Product positioning / moat | [`27-product-differentiation.md`](27-product-differentiation.md) | [`01`](01-product-strategy.md), [ADR-0013](adrs/0013-product-moat.md) |
| Visual language / homepage structure | [`28-visual-direction.md`](28-visual-direction.md) | [ADR-0014](adrs/0014-visual-direction.md) |
| Package structure / a new package | [`04-package-map.md`](04-package-map.md) | [`03-architecture.md`](03-architecture.md) |
| A boundary / forbidden import | [`03-architecture.md`](03-architecture.md) | package `CLAUDE.md`, [`24`](24-claude-code-workflow.md) |
| A public component API | [`09-component-api-standard.md`](09-component-api-standard.md) | component doc page, changeset |
| A design token | [`10-design-tokens.md`](10-design-tokens.md) | [`11-tailwind-strategy.md`](11-tailwind-strategy.md), theme examples |
| Styling / Tailwind approach | [`11-tailwind-strategy.md`](11-tailwind-strategy.md) | [`10`](10-design-tokens.md) |
| Animation engine usage | [`06-animation-engine-decision.md`](06-animation-engine-decision.md) | [ADR-0002](adrs/0002-animation-engine.md) |
| A dependency (add/remove/bump) | [`05-dependency-decisions.md`](05-dependency-decisions.md) | relevant ADR |
| Accessibility behavior | [`12-accessibility-standard.md`](12-accessibility-standard.md) | component doc page |
| A performance budget | [`13-performance-standard.md`](13-performance-standard.md) | [`14`](14-testing-strategy.md) CI checks |
| Test layers / CI | [`14-testing-strategy.md`](14-testing-strategy.md) | [`18`](18-release-process.md) |
| Release / versioning policy | [`18-release-process.md`](18-release-process.md) | [`19`](19-support-and-deprecation.md) |
| A durable architectural choice | new/updated ADR in [`adrs/`](adrs/) | the ADR's canonical doc |
| MVP scope / roadmap | [`20-mvp-roadmap.md`](20-mvp-roadmap.md) | [`21`](21-component-inventory.md) |
| A component's status | [`21-component-inventory.md`](21-component-inventory.md) | component doc page |
| A risk | [`22-risk-register.md`](22-risk-register.md) | — |
| A launch‑blocking decision resolves | [`29-go-live-checklist.md`](29-go-live-checklist.md) | its canonical doc + ADR if durable |

Follow the [`documentation-maintenance`](../.claude/skills/documentation-maintenance/SKILL.md) skill so linked summaries stay in sync.

## Definition of done

The single source of truth for "is it finished" is [`25-definition-of-done.md`](25-definition-of-done.md). Accessibility, reduced-motion, tests, stories, docs, and (for public API) a changeset are **release-blocking**.

## Provenance

The maintained docs were split from [`archive/original-architecture-plan.md`](archive/original-architecture-plan.md). The section mapping is in [`archive/section-mapping.md`](archive/section-mapping.md). Do not edit the archived file.
