# 38 — Component expansion plan (breadth-first catalog)

> **Type:** 🟢 Canonical for the catalog target, waves, and candidate backlog · **Last reviewed:** 2026-07-14
> **Operating model:** breadth + originality + practical usefulness + rapid growth on a **lightweight** production baseline ([`rapid-component-release`](../.claude/skills/rapid-component-release/SKILL.md)). Production board: [`docs/39`](39-catalog-production-board.md). Signature/centerpiece pieces still use the heavier gates ([`docs/36`](36-premium-creative-component-strategy.md)); everything else does not.

## The niche

**Animated components for modern product workflows** — AI applications, developer tools, collaboration, data interfaces, commerce, media, security/accounts, productivity, communication, spatial UI, mobile, onboarding, and premium marketing. We help developers ship *complete interactions* they would otherwise design and engineer themselves. We do **not** compete on another pile of spotlight cards, blur-text variants, aurora/particle backgrounds, generic marquees, or scale-on-click buttons — those remain supporting items only.

## Catalog target

~**100–150** components over time, delivered in waves. Do not implement all at once; grow continuously and let real usage (post-launch analytics — never fabricated) decide where to invest deeper.

Every candidate is tracked with: **Name · Category · Problem solved · Expected users · Similar existing products · Our differentiator · Complexity · Dependencies · Free/Pro · Registry type · Status.** Live tracking lives in [`docs/39`](39-catalog-production-board.md); this document holds the plan and the backlog.

## Categories

`ai` · `developer-tools` · `collaboration` · `data-motion` · `commerce` · `file` · `security` · `productivity` · `communication` · `spatial` · `mobile` · `onboarding` · `marketing` · plus the existing supporting classes (`animated-shadcn`, `text`, `creative`, `backgrounds`, `icons`).

## Portfolio selection rules

Choose the next component by **portfolio value**, not the single highest visual score:

- No more than **two** components from the same narrow effect family consecutively.
- Alternate visual components with product-workflow components.
- Keep a Free/Pro balance (target ~35–45% Free / ~55–65% Pro; adjust with real conversion data later).
- Keep a simple/advanced balance.
- Prefer components that **unlock blocks**, **compose with existing components**, have **strong preview potential**, and solve a **real product problem**.
- Avoid five similar backgrounds before building workflow components.
- After every **four** workflow components, add **one** creative component (so creative effects never overwhelm the useful catalog).

## Waves

### Wave 1 — high-value niche workflows (20)
AI, developer tools, collaboration, data, commerce, file workflows. **The first 24-component expansion wave is enumerated below and is the active build target.**

### Wave 2 — product infrastructure (20)
Security, accounts, productivity, communication, onboarding.

### Wave 3 — visual differentiation (20)
Text, backgrounds, spatial UI, media, premium marketing — including the signature slice from [`docs/36`](36-premium-creative-component-strategy.md).

### Wave 4 — blocks & complete flows
Multi-component blocks composed from **released** primitives (a category needs ≥4 released components before its block is built). See [`docs/39` §Blocks](39-catalog-production-board.md).

## First expansion wave (24) — active

| # | Component | Category | Tier | Complexity | Batch |
|---|---|---|---|---|---|
| 1 | AI Response Stream | ai | Free | complex | **1 (built)** |
| 2 | Deployment Pipeline | developer-tools | Free | medium | **1 (built)** |
| 3 | Live Presence Stack | collaboration | Free | medium | **1 (built)** |
| 4 | KPI Number Morph | data-motion | Free | simple | **1 (built)** |
| 5 | Tool Call Activity | ai | Pro | medium | 2 |
| 6 | Live Log Stream | developer-tools | Free | medium | 2 |
| 7 | Activity Stream | collaboration | Free | medium | 2 |
| 8 | Streaming Data Rows | data-motion | Pro | medium | 2 |
| 9 | Agent Run Timeline | ai | Pro | complex | 3 |
| 10 | Source Citation Rail | ai | Free | simple | 3 |
| 11 | API Request Inspector | developer-tools | Pro | medium | 3 |
| 12 | Environment Switcher | developer-tools | Free | simple | 3 |
| 13 | Approval Workflow | collaboration | Pro | medium | 4 |
| 14 | Comment Thread | collaboration | Pro | medium | 4 |
| 15 | Filter Result Transition | data-motion | Free | medium | 4 |
| 16 | Data Refresh State | data-motion | Free | simple | 4 |
| 17 | Product Variant Selector | commerce | Free | medium | 5 |
| 18 | Cart Item Transition | commerce | Pro | medium | 5 |
| 19 | Checkout Progress | commerce | Free | simple | 5 |
| 20 | Order Tracking | commerce | Pro | medium | 5 |
| 21 | File Upload Pipeline | file | Free | complex | 6 |
| 22 | Multi-file Queue | file | Pro | medium | 6 |
| 23 | Processing Timeline | file | Pro | medium | 6 |
| 24 | Export Progress | file | Free | simple | 6 |

**Creative interleave (one per four workflow components):** after batch 1 → Luminous Topography (background, Free); after batch 2 → Magnetic Stack (surface, Free); then the remaining [`docs/36`](36-premium-creative-component-strategy.md) slice. Kinetic Emphasis is already Released/Strongly-Sellable.

## Backlog (from the niche briefs — not yet scheduled)

Full category menus (AI, developer tools, collaboration, data & dashboard, commerce, file/media, security/accounts, productivity, communication, spatial, mobile, onboarding, marketing) are the working backlog. We do **not** build a full charting library — for data we ship wrappers, states, and presentation components that compose with existing chart libraries. Constraints carried on every relevant item: no deceptive AI-capability claims, no manipulative scarcity/fake countdowns, no fake security guarantees, no device-haptics without app control, and demo data always clearly fictional.

## Free / Pro strategy

**Free:** enough high-quality components to build trust — useful AI and developer-tool examples, several workflow primitives, several creative effects, editable registry source. **Pro:** more complete workflows, advanced state management, drag-and-drop, complex galleries, advanced data interactions, multi-component blocks, templates, premium marketing sections, larger packs. **Do not put all distinctive components behind Pro.**

## Packs (sellable groupings — pricing deferred to a separate commercial decision)

AI Interface Pack · Developer Tools Pack · Collaboration Pack · Data Motion Pack · Commerce Motion Pack · File Workflow Pack · Mobile Interaction Pack · Creative Background Pack · Product Marketing Pack. Offered as individual pack / complete catalog / team / agency access.
