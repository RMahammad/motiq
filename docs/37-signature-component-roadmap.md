# 37 — Signature component roadmap (catalog pivot)

> **Type:** 🟢 Canonical for existing-catalog demotion decisions and the signature replacement plan · **Last reviewed:** 2026-07-14
> **Context:** the 2026-07-14 creative pivot ([`CLAUDE.md` §Signature component rules](../CLAUDE.md#signature-component-rules-2026-07-14-creative-pivot)). Strategy: [`docs/36`](36-premium-creative-component-strategy.md) · competitive study: [`docs/35`](35-react-bits-quality-study.md) · per-component quality: [`docs/32`](32-component-quality-tracker.md).

## Why this document exists

The independent audit ([`docs/33`](33-independent-component-audit.md)) found every current component "production-ready but ordinary" — the catalog is 11 well-engineered items whose effects competitors ship free. The pivot stops trying to make standard primitives category-leading and redirects creative effort to **signature creative components**. This document records what happens to every existing item, and the replacement plan.

## Catalog classifications (new)

`foundation` · `animated-shadcn` · `text-effect` · `creative-ui` · `interactive-media` · `background` · `navigation` · `product-showcase` · `data-motion` · `block` · `experimental`

Only signature items (classes `text-effect`, `creative-ui`, `interactive-media`, `background`, `navigation`, `product-showcase`, `data-motion`, and approved `block`s) normally appear in the homepage hero montage — and only when independently **Strongly Sellable** or **Category-leading**.

## Existing-catalog decisions

| Existing component | Current status ([32](32-component-quality-tracker.md)) | New classification | Decision | Proposed signature successor | Tier | Priority | Risk | Expected commercial value |
|---|---|---|---|---|---|---|---|---|
| Animated Dialog | Sellable (independent) | animated-shadcn | **Keep as animated shadcn**; remove from hero once a signature item replaces it | — (foundation of future product workflows) | Free | Maintain | Low | Trust/acquisition: proves engineering quality |
| Animated Tabs | Production-ready but ordinary | animated-shadcn | **Keep as animated shadcn**; drop the planned "signature indicator" sprint | Directional Tab Rail idea absorbed into future navigation work | Free | Maintain | Low | Supporting |
| Animated Accordion | Production-ready but ordinary | animated-shadcn | **Keep**; no further signature investment | — | Free | Maintain | Low | Supporting |
| Animated Button | Production-ready but ordinary | animated-shadcn | **Keep** (loading/success pattern is genuinely useful); remove from any featured slot | — | Free | Maintain | Low | Supporting |
| Blur Text | Production-ready but ordinary (D6 commodity) | text-effect (supporting) | **Demote from homepage**; keep as free utility until a signature text component ships, then evolve or fold its API into the signature item | Signature kinetic-typography component (slice pick, [`36`](36-premium-creative-component-strategy.md)) | Free | High (successor) | Low | Successor is a hero candidate |
| Rotating Text | Needs polish | text-effect (supporting) | **Keep as supporting text utility**; no signature claim | — | Free | Low | Low | Long-tail utility |
| Animated List (Pro) | Production-ready but ordinary (D6 < Pro bar) | data-motion (draft) | **Evolve into a real Notification Stream / activity product component** — the current generic list does not justify Pro | Notification Stream (candidate #12, [`36`](36-premium-creative-component-strategy.md)) | Pro | High | Medium | Solves a complete product problem → justifies Pro |
| Spotlight Card (Pro) | Needs polish (commodity spotlight) | creative-ui (needs redesign) | **Replace** with a stronger interactive surface; the pointer-glow-card pattern is explicitly on the conception-gate rejection list | Signature interactive surface (slice pick, [`36`](36-premium-creative-component-strategy.md)) | Pro→ successor decides | High (successor) | Low | Successor is a hero candidate |
| Animated Grid | Production-ready but ordinary | background (utility) | **Demote to utility / preview-stage primitive**; keep free | Signature background (slice pick, [`36`](36-premium-creative-component-strategy.md)) | Free | Medium | Low | Successor is a hero candidate |
| Animated Icons (Arrow + Copy) | Needs polish (motion too small) | foundation (micro-interaction) | **Combine + keep** as one animated-icon collection entry; grow icon set later instead of new standalone entries | Possible future "animated icon collection" expansion | Free | Low | Low | Completeness |
| cn() utils | — | lib | **Keep** | — | Free | — | — | — |

**Homepage consequences (Stage 5 of the pivot, blocked until ≥3 signature components are independently Strongly Sellable/Category-leading):**
- Current hero/featured (Dialog, Tabs, Blur Text) are placeholders — all are supporting-class and will be replaced in the hero montage by signature items.
- New homepage sections: Signature Text · Interactive Surfaces · Visual Environments · Media & Galleries · Product Motion.
- Ordinary components move to a "Foundations" catalog section with honest positioning ("accessible animated shadcn, free").

## Signature launch collection (from [`docs/36`](36-premium-creative-component-strategy.md))

The 12 candidates, scores, and the selected 6-component vertical slice live in docs/36 (canonical). This roadmap tracks sequencing:

| # | Slice component | Category | Tier | Status |
|---|---|---|---|---|
| 1 | First slice pick (see 36 §Selection) | per 36 | per 36 | In progress — one at a time |
| 2–6 | Remaining slice picks | per 36 | per 36 | Blocked until #1 reaches a stable independent status |

**Sequencing rule:** one signature component at a time through the full loop (conception → originality → 3 concepts → implementation → rendered iteration → a11y → performance → clean fixture → independent premium review). No parallel signature implementations.

## Non-negotiables carried over

- Free and Pro share the same engineering quality bar.
- At least one premium-quality text component, one interactive surface, and one lightweight background stay **free** — visitors need proof before paying.
- Weak entries are not preserved because they exist; "Production-ready but ordinary" is an honest status, not a demotion insult.
