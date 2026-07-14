# 41 — Commercial decisions (tracker)

> **Type:** 🟡 Canonical for open commercial & legal decisions — **decision slots only, no finalized prices/terms** · **Last reviewed:** 2026-07-14
> **Status:** every row below is a **human decision**. This document tracks the option space and the current status; it does not set policy. Operational flags live in [`product.config.json`](../product.config.json) (`commerce` block); packaging structure lives in [`docs/40`](40-commercial-packaging.md). Statuses use the fixed set **Open · Proposed · Approved · Rejected · Deferred**.

**Nothing in this document is an accepted policy until its Status is Approved by a human owner.**

Current launch posture (from `commerce.launchMode`): **private-preview** — `pricingEnabled: false`, `checkoutEnabled: false`, `waitlistEnabled: true`, `privateRegistryEnabled: true`. No price or term is displayed to visitors while these flags hold.

Entitlement IDs referenced below are the stable contract: `component.<slug>`, `block.<slug>`, `pack.<slug>`, `catalog.complete`, `license.team`, `license.agency`.

## Product access

| Decision | Options considered | Status | Notes |
|---|---|---|---|
| Individual component purchase | Enabled · disabled at launch · Free-only individually | Proposed (disabled) | `individualComponentsEnabled: false` today; access is via packs/catalog. Revisit after pack pricing. |
| Pack-only purchase | Sell packs as the entry paid unit · no standalone packs | Proposed (enabled) | `packsEnabled: true`; four packs exist (ai-interface, developer-tools, collaboration, data-motion). Entitlement `pack.<slug>`. |
| Complete-catalog purchase | Single catalog SKU · bundle-of-packs only | Proposed (enabled) | `completeCatalogEnabled: true`; entitlement `catalog.complete`; positioned as primary upgrade target. |
| Team access | Seat-based · org-wide flat · not offered at launch | Open | `teamLicenseEnabled: false`; entitlement `license.team` reserved. |
| Agency access | Client-work tier · flat unlimited · not offered at launch | Open | `agencyLicenseEnabled: false`; entitlement `license.agency` reserved. |
| Lifetime vs subscription | One-time lifetime · annual subscription · hybrid (one-time + optional renewal for updates) | Open | Affects update-duration and support-scope rows; legal + pricing sign-off required. |
| Update duration | Lifetime updates · 1 year of updates · updates while subscribed | Open | Ties to `updatePolicyUrl`. Do not advertise "lifetime updates" until Approved. |
| Support scope | Community only · email support · SLA-backed support · tiered by access level | Open | Ties to `supportPolicyUrl`, `supportEmail`. No SLA claim until Approved. |
| Number of allowed projects | Unlimited · per-project · N projects per license | Open | Core license-term decision; legal sign-off required. |
| Client-project usage | Allowed · allowed with attribution · agency tier only | Open | Interacts with agency-access row. |
| Redistribution restrictions | No redistribution of source · allowed in compiled end products only · template-exception | Open | Baseline expectation: source is buyer-editable but not re-sellable; wording is a legal decision. |
| Source-code ownership | Buyer owns installed copy (edit freely), license grants use not IP · full IP transfer | Proposed (use-license, editable copy) | Matches registry model (installed source is the buyer's to edit); final wording legal-owned. |
| Employee & contractor access | Named-seat only · org can share within legal entity · contractors count as seats | Open | Depends on team/agency model. |

## Pricing (decision slots — no final values)

| Decision | Options considered | Status | Notes |
|---|---|---|---|
| Individual component price | `<PRICE_COMPONENT>` | Open | Only relevant if individual purchase is enabled. `currency: USD`. No value until Approved. |
| Pack price | `<PRICE_PACK>` | Open | Per-pack; may differ by pack size/complexity. |
| Complete-catalog price | `<PRICE_CATALOG>` | Open | Primary SKU. |
| Team multiplier | `<TEAM_MULTIPLIER>` (e.g. per-seat factor over catalog) | Open | Requires seat-model decision first. |
| Agency price | `<PRICE_AGENCY>` | Open | Requires agency-scope decision first. |
| Launch price | `<LAUNCH_PRICE>` / launch offer | Open | No fabricated discounts or fake urgency. Any launch offer needs explicit sign-off. |
| Upgrade credit | Credit pack purchase toward catalog · no credit · time-limited credit | Open | e.g. pack price credited toward `catalog.complete`. |
| Regional pricing | Flat global · purchasing-power adjusted · none at launch | Open | Tax + payment-provider dependent. |
| Tax handling | Provider-collected (VAT/GST/sales) · price-inclusive · price-exclusive | Open | Depends on `checkoutProvider` (currently `none`). Legal/finance sign-off. |

## Licensing

| Decision | Options considered | Status | Notes |
|---|---|---|---|
| Personal commercial use | Allowed · restricted | Proposed (allowed) | Standard expectation; final wording legal-owned via `licenseUrl`. |
| Client work | Allowed under base license · agency tier required · allowed with limits | Open | Interacts with agency-access + client-project-usage rows. |
| SaaS products | Allowed (compiled use) · restricted | Open | Confirm compiled-use language covers SaaS front-ends. |
| Multiple end products | Unlimited · N products · per-product license | Open | Ties to allowed-projects row. |
| Team sharing | Within named seats · within legal entity · not allowed | Open | Depends on team model. |
| Agency sharing | Per-client delivery allowed · not allowed · agency tier only | Open | Depends on agency model. |
| Template redistribution | Prohibited · allowed in end-product templates only | Open | Guards against reselling the catalog as a template kit. |
| Component-library redistribution | Prohibited | Proposed (prohibited) | Reselling/repackaging the components as a competing library is out of scope of any license. Legal-owned. |
| Source-code resale | Prohibited | Proposed (prohibited) | Buyer may edit installed source, not resell/redistribute it as source. |
| Open-source projects | Allowed (non-redistributable form) · case-by-case · not allowed | Open | Tension with redistribution rules; needs explicit carve-out wording. |
| Educational use | Discount · free tier · standard terms | Open | No program until Approved. |
| Refunds | Window-based · no refunds (digital) · case-by-case | Open | Ties to `refundPolicyUrl`. Legal + finance sign-off. |
| Account transfer | Non-transferable · transferable with notice | Open | Ties to `customerPortalUrl` capabilities. |
| License termination | Terms for breach/chargeback · access revocation vs installed-source retention | Open | Note: no runtime license checks — termination gates future registry access, not installed source. |

## Delivery

| Decision | Options considered | Status | Notes |
|---|---|---|---|
| Private registry authentication | Token-authenticated namespace (env-var header) · account login · both | Proposed (token namespace) | `privateRegistryEnabled: true`; entitlement-aware route (see [`docs/43`](43-private-registry-architecture.md)). No runtime license checks. |
| Downloadable ZIP fallback | Offer ZIP · registry-only | Open | Fallback for non-registry consumers; increases piracy surface — decision pending. |
| Git repository access | Read-only mirror per buyer · no git access · registry-only | Open | Interacts with source-resale restrictions. |
| Customer portal | Hosted portal (`customerPortalUrl`) · email-only · provider portal | Open | `customerPortalUrl` reserved in config; provider TBD. |
| Update notifications | Email · in-registry changelog · portal feed | Open | Depends on customer-portal + provider decisions. |
| License-key model | No keys (registry token is the gate) · issued keys · both | Proposed (token-as-gate) | Consistent with "no runtime license checks; gate at install/purchase" ([`docs/16`](16-commercial-packaging.md)). |
| Organization accounts | Supported (multi-seat) · single-owner only at launch | Open | Depends on team/agency model. |

## How to change a decision

1. Update the relevant flag/value in [`product.config.json`](../product.config.json) (`commerce` block) — this is the operational control surface consumed by the app.
2. Update the matching row here: change **Status** and **Notes**, and keep the option space visible.
3. **Legal or pricing decisions require a human owner's sign-off before Status may become Approved.** An agent may set Proposed/Open/Deferred; only a human owner sets Approved for anything touching price, license terms, refunds, or support commitments.
4. If the change alters packaging structure, also update the canonical owner [`docs/40`](40-commercial-packaging.md); if it changes displayed copy, ensure no placeholder `@scope/*` or unapproved price leaks to visitors.

---

## Phase decision (2026-07-14): private-preview-only

The project is operating as a **limited private preview** (full record: [docs/45 §Private-preview phase decision](45-paid-launch-decision-gate.md)). This does **not** move any row below to *Approved*: provider selection, all pricing, licensing, refund, team/agency, and update-duration decisions remain **Open / Deferred until paid-launch preparation**. Checkout and pricing stay disabled; Batch 6+ development proceeds on the rapid-release track. Preview terms require owner approval via `MOTIONKIT_PREVIEW_TERMS_APPROVED=1` (not set).
