# 40 — Commercial packaging (preparation)

> **Type:** 🟡 Canonical for the commercial model — **structure only, no finalized prices/terms** · **Last reviewed:** 2026-07-14
> **Status:** the catalog is being prepared to sell as **finished workflow outcomes** (packs + blocks), not just isolated components. Nothing here sets a price, refund policy, license term, support SLA, or update duration — those are **human decisions** (see §Open decisions). Brand/namespace come from [`product.config.json`](../product.config.json); pricing flags there (`pricingFinalized: false`) gate any price display.

## Access tiers (structure)

| Tier | What it includes | Notes |
|---|---|---|
| **Free component** | Individual Free components, editable source via the registry | The acquisition + trust channel; same engineering quality as Pro |
| **Pro component** | Individual Pro components (advanced workflows, drag/reorder, complex state) | Gated at install via a token-authenticated registry namespace (no runtime license checks — [`docs/16`](16-commercial-packaging.md)) |
| **Pack** | One workflow pack = 4 components + 1 complete composed block (e.g. AI Interface Pack → AI Agent Workspace) | Sold as a finished outcome; a pack may reference both Free and Pro components |
| **Complete Catalog** | Every component, every block, every pack, future additions | The primary upgrade target |
| **Team** | Complete Catalog for a seat count | Seat model TBD |
| **Agency** | Complete Catalog for client work at scale | Terms TBD |

## Free vs Pro strategy

- **Free** proves quality and covers common building blocks (several impressive workflow + creative + mobile items). At least three of the strongest homepage components stay Free.
- **Pro** is the advanced/complete-workflow layer (Agent Run Timeline, Tool Call Activity, API Request Inspector, Approval Workflow, Comment Thread, Streaming Data Rows, …).
- Both tiers share the **same usability + accessibility baseline**; Pro differs in scope, not quality.

## Block strategy

Blocks (`registry:block`) compose released components into a complete, editable, application-controlled surface. A block installs all of its component dependencies via the registry, so buying/installing a block delivers a working workflow, not a parts list. Blocks are the concrete "finished outcome" a pack sells.

## Pack strategy

Each of the four primary workflow packs is a **3/4 → 4/4** progression toward one block:

| Pack | Block | Components |
|---|---|---|
| AI Interface | AI Agent Workspace | AI Response Stream · Tool Call Activity · Source Citation Rail · Agent Run Timeline |
| Developer Tools | Deployment Command Center | Deployment Pipeline · Live Log Stream · API Request Inspector · Environment Switcher |
| Collaboration | Collaborative Review Workspace | Live Presence Stack · Activity Stream · Approval Workflow · Comment Thread |
| Data Motion | Live Operations Dashboard | KPI Number Morph · Streaming Data Rows · Filter Result Transition · Data Refresh State |

Mobile Interaction Pack and Creative Background Pack grow next ([`docs/39`](39-catalog-production-board.md)).

## Template strategy (future)

Full multi-page templates composed from blocks (SaaS console, AI product, ops dashboard) are a later layer, after the four workflow blocks ship. Not started.

## Private registry concept

Distribution is a **shadcn-compatible registry** ([`packages/registry`](../packages/registry/)); Pro/pack access is gated by a **token-authenticated namespace** (the consumer's `components.json` supplies an env-var auth header). No secrets in client code, no runtime license checks — the token gates registry *access*, the installed source is the buyer's to edit. This matches [`docs/16`](16-commercial-packaging.md) and the shadcn namespace model.

## Upgrade path

Free component → Pack (finished outcome) → Complete Catalog (everything) → Team/Agency (scale). The homepage and pack pages present packs as the value step above individual components; pack pages link to individual component pages so buyers can inspect the parts.

## Open decisions (human sign-off required — do NOT hardcode)

- **Prices** for Pro component / Pack / Complete Catalog / Team / Agency.
- **License terms** (per-developer vs per-seat, redistribution boundaries, client-project usage).
- **Refund policy**, **support SLA**, **update duration / lifetime vs subscription**.
- **Discounts / launch offers** (no fake urgency or fabricated discounts anywhere).
- Team seat counts and agency scope.

Until signed off, product/pack pages display **placeholders only**: "Available in the Complete Catalog", "Pack access — coming soon", "Pricing and license terms to be finalized". Configuration placeholders live in [`product.config.json`](../product.config.json) (`pricingFinalized`, `freeTierLabel`, `premiumTierLabel`).

## Launch configuration & delivery (2026-07-14 update)

**Single control surface.** All commercial behavior is now driven by the `commerce` block in [`product.config.json`](../product.config.json) — not by hardcoded values in the app. It carries the operational flags (`productStatus`, `launchMode`, `pricingEnabled`, `checkoutEnabled`, `waitlistEnabled`, `privateRegistryEnabled`, `individualComponentsEnabled`, `packsEnabled`, `completeCatalogEnabled`, `teamLicenseEnabled`, `agencyLicenseEnabled`), the `currency`, contact addresses (`supportEmail`, `salesEmail`), policy URLs (`termsUrl`, `privacyUrl`, `licenseUrl`, `refundPolicyUrl`, `updatePolicyUrl`, `supportPolicyUrl`), and provider selectors (`checkoutProvider`, `analyticsProvider`, `waitlistProvider`, `customerPortalUrl`). Change commerce behavior there; do not scatter flags through the app.

**Launch modes** (`commerce.launchMode`) — the catalog progresses through:

- `development` — internal only.
- `private-preview` — **current mode**: no pricing, no checkout; waitlist and the entitlement-aware private registry are on.
- `public-beta` — broader access; pricing/checkout may be enabled per flags once Approved.
- `launched` — full commercial availability.

Modes are enforced by the flags above (e.g. private-preview holds `pricingEnabled: false`, `checkoutEnabled: false`, `waitlistEnabled: true`, `privateRegistryEnabled: true`), so no price or checkout surfaces to visitors while those flags hold.

**Canonical owners** (this doc stays structure-only; details live in their owners — do not duplicate their tables here):

- Open commercial & legal decisions → [`docs/41`](41-commercial-decisions.md).
- Free/Pro source-delivery audit → [`docs/42`](42-pro-source-delivery-audit.md).
- Entitlement-aware private registry → [`docs/43`](43-private-registry-architecture.md).
- Product analytics (interface, events, metrics, privacy) → [`docs/44`](44-product-analytics-plan.md).

**No price or term here is final.** Every price, license term, refund policy, support SLA, and update duration remains a human decision tracked in [`docs/41`](41-commercial-decisions.md) and is not policy until its Status is Approved by a human owner.
