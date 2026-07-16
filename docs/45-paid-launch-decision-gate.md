# 45 — Paid-launch decision gate (go/no-go)

> **Type:** 🔴 Canonical **go/no-go gate** for paid launch — enumerates every human decision that blocks charging money · **Last reviewed:** 2026-07-14
> **Status:** **paid launch is DISABLED.** Every price and every legal term below is **Open** and **Blocking**; nothing is Approved. This document supersedes [`docs/41`](41-commercial-decisions.md) as the **launch-blocking view** — 41 remains the detailed decision tracker (full option space + rationale), 45 is the single go/no-go gate. Where the two overlap, 41 is the canonical owner of the decision detail; 45 owns only the launch-blocking classification.
> **Related:** packaging structure [`docs/40`](40-commercial-packaging.md) · decision tracker [`docs/41`](41-commercial-decisions.md) · source-exposure audit [`docs/42`](42-pro-source-delivery-audit.md) · private registry delivery [`docs/43`](43-private-registry-architecture.md) · analytics [`docs/44`](44-product-analytics-plan.md) · launch controls [`product.config.json`](../product.config.json) (`commerce` block).

## What "paid launch" means here

Paid launch is the milestone at which **a real customer can purchase or receive access, obtain an entitlement, install protected source, manage access, and lose access after revocation/refund**. That is a strictly higher bar than the current **private preview** (waitlist + entitlement-aware registry with a mock provider, no pricing, no checkout).

**Paid launch stays disabled while any row below marked _Blocking paid launch_ has Status _Open_.** Private preview may continue with those rows Open — enumerating the decisions does not unblock them, and this agent decides **nothing** commercial or legal. Every row here is a slot for a human owner to fill; the tables below record the option space and current status only, they do not set policy.

**Status** values: `Open` · `Proposed` · `Approved` · `Rejected` · `Deferred`.
**Blocking?** values: **Blocking paid launch** · Non-blocking.
Default posture: every price and every legal/licensing term is **Open + Blocking**; nothing is **Approved** (a human owner must approve each one).

## 1. Product model

| Decision | Options | Status | Blocking? | Notes |
|---|---|---|---|---|
| Individual component sales on/off | On · off · Free-only individually | Proposed (off) | Non-blocking | `individualComponentsEnabled: false`. Off is a safe default; can launch without it. |
| Pack sales on/off | On · off | Proposed (on) | **Blocking paid launch** | `packsEnabled: true`; the intended paid entry unit. If on, its price + license must be Approved. |
| Complete catalog on/off | On · off | Proposed (on) | **Blocking paid launch** | `completeCatalogEnabled: true`; primary SKU. Price + license must be Approved. |
| Subscription vs one-time | One-time · subscription · hybrid | Open | **Blocking paid launch** | Determines billing model, update entitlement, and refund shape. |
| Lifetime vs limited update period | Lifetime updates · N-year updates · updates while subscribed | Open | **Blocking paid launch** | Do not advertise "lifetime" until Approved; ties to `updatePolicyUrl`. |
| Team access | Seat-based · org-wide flat · not at launch | Open | Non-blocking | `teamLicenseEnabled: false`; entitlement `license.team` reserved. Blocking only if launched with team tier on. |
| Agency access | Client-work tier · flat unlimited · not at launch | Open | Non-blocking | `agencyLicenseEnabled: false`; entitlement `license.agency` reserved. Blocking only if launched with agency tier on. |
| Client-project usage | Allowed · allowed with attribution · agency tier only | Open | **Blocking paid launch** | Legal term buyers rely on; must be settled before selling. |
| Number of projects per license | Unlimited · per-project · N projects | Open | **Blocking paid launch** | Core license term; legal sign-off required. |
| Employee & contractor sharing | Named-seat only · within legal entity · contractors as seats | Open | **Blocking paid launch** | Defines who may use a purchased license; legal term. |
| Upgrade credit (pack → catalog) | Credit toward catalog · no credit · time-limited credit | Open | Non-blocking | Pricing convenience; can ship post-launch. |
| Existing-customer migration | Grandfather preview users · paid migration · none | Open | Non-blocking | Relevant if preview users transition to paid; not required to open checkout. |

## 2. Pricing (placeholders only — no values set here)

| Decision | Options | Status | Blocking? | Notes |
|---|---|---|---|---|
| Currency | `<CURRENCY>` | Proposed (USD) | **Blocking paid launch** | `commerce.currency: "USD"` is a config placeholder; the displayed billing currency needs owner sign-off before charging. |
| Individual component price | `<PRICE_COMPONENT>` | Open | Non-blocking | Only relevant if individual sales are enabled (currently off). |
| Pack price | `<PRICE_PACK>` | Open | **Blocking paid launch** | Per-pack; no value until Approved. |
| Complete-catalog price | `<PRICE_CATALOG>` | Open | **Blocking paid launch** | Primary SKU; no value until Approved. |
| Team price / multiplier | `<TEAM_MULTIPLIER>` | Open | Non-blocking | Blocking only if team tier launches; requires seat model first. |
| Agency price | `<PRICE_AGENCY>` | Open | Non-blocking | Blocking only if agency tier launches; requires agency scope first. |
| Launch pricing / offer | `<LAUNCH_PRICE>` | Open | **Blocking paid launch** | No fabricated discounts or fake urgency. Any launch offer needs explicit sign-off. |
| Upgrade pricing | `<UPGRADE_PRICE>` | Open | Non-blocking | Pack→catalog upgrade cost; can follow launch. |
| Regional pricing | Flat global · purchasing-power adjusted · none | Open | Non-blocking | Tax + provider dependent; flat-global is a valid launch default. |
| Taxes included/excluded | Provider-collected · price-inclusive · price-exclusive | Open | **Blocking paid launch** | Legal/finance term shown at checkout; depends on `checkoutProvider` (currently `none`). |
| Coupon policy | No coupons · manual codes · automated campaigns | Open | Non-blocking | Absence of coupons does not block launch. |
| Educational access | Discount · free tier · standard terms | Open | Non-blocking | No program until Approved; not required to launch. |
| Open-source access | Free grant · discount · standard terms | Open | Non-blocking | Interacts with redistribution licensing (§3); not required to launch. |

## 3. Licensing (every term legal-owned)

| Decision | Options | Status | Blocking? | Notes |
|---|---|---|---|---|
| Commercial SaaS use | Allowed (compiled use) · restricted | Open | **Blocking paid launch** | Confirm compiled-use language covers SaaS front-ends. |
| Client work | Allowed under base license · agency tier required · with limits | Open | **Blocking paid launch** | Interacts with agency access + client-project usage. |
| Multiple end products | Unlimited · N products · per-product | Open | **Blocking paid launch** | Ties to allowed-projects term. |
| Internal tools | Allowed · restricted | Open | **Blocking paid launch** | Common buyer use case; must be explicit. |
| Team sharing | Within named seats · within legal entity · not allowed | Open | **Blocking paid launch** | Depends on team model. |
| Agency sharing | Per-client delivery allowed · not allowed · agency tier only | Open | Non-blocking | Blocking only if agency tier launches. |
| Contractor access | Allowed within entity · counts as seat · not allowed | Open | **Blocking paid launch** | Who may touch purchased source; legal term. |
| Source modification | Buyer may edit installed source · restricted | Proposed (edit allowed) | **Blocking paid launch** | Matches registry model; final wording legal-owned via `licenseUrl`. |
| Redistribution | No source redistribution · compiled end-products only · template exception | Open | **Blocking paid launch** | Baseline: source is editable but not redistributable; wording is a legal decision. |
| Resale (source) | Prohibited | Proposed (prohibited) | **Blocking paid launch** | Buyer may edit, not resell/redistribute as source; final wording legal-owned. |
| Template resale | Prohibited · allowed in end-product templates only | Open | **Blocking paid launch** | Guards against reselling the catalog as a template kit. |
| Component-library resale | Prohibited | Proposed (prohibited) | **Blocking paid launch** | Repackaging as a competing library is out of any license scope. |
| Open-source publication | Allowed (non-redistributable form) · case-by-case · not allowed | Open | **Blocking paid launch** | Tension with redistribution rules; needs explicit carve-out. |
| License transfer | Non-transferable · transferable with notice | Open | Non-blocking | Convenience term; default non-transferable is launch-safe. |
| Account transfer | Non-transferable · transferable with notice | Open | Non-blocking | Ties to `customerPortalUrl` capabilities. |
| License termination | Terms for breach/chargeback · revocation vs installed-source retention | Open | **Blocking paid launch** | No runtime checks — termination gates future registry access, not installed source. |
| Refund effect on license | License voided on refund · retained · partial | Open | **Blocking paid launch** | Defines what a refunded customer may still use; legal + finance. |
| Post-refund source usage | Must stop using · may keep installed copy · compiled-only | Open | **Blocking paid launch** | No runtime enforcement exists; this is a stated contract, not a technical control. |
| Product discontinuation | Continued access to installed source · sunset window · refund | Open | **Blocking paid launch** | Buyers rely on this; must be stated before selling. |
| Update entitlement | Lifetime · N years · while subscribed | Open | **Blocking paid launch** | Mirrors §1 lifetime/limited row; ties to `updatePolicyUrl`. |

## 4. Support & updates

| Decision | Options | Status | Blocking? | Notes |
|---|---|---|---|---|
| Support channel | Community only · email · portal · tiered | Open | **Blocking paid launch** | A paying customer must know where to get help; ties to `supportEmail` / `supportPolicyUrl`. |
| Response target | No SLA · best-effort · stated SLA by tier | Open | **Blocking paid launch** | No SLA claim may be published until Approved. |
| Included support level | None · standard · premium | Open | **Blocking paid launch** | Defines what the base price covers. |
| Priority support | Not offered · paid add-on · top-tier only | Open | Non-blocking | Upsell; absence does not block launch. |
| Bug-fix policy | Best-effort · committed for released items · none | Open | **Blocking paid launch** | Buyers of "production-ready" source expect a stated bug-fix stance. |
| New-component access | Included in catalog · paid add-on · none | Open | **Blocking paid launch** | Whether future components reach existing buyers; core value promise. |
| Update duration | Lifetime · N years · while subscribed | Open | **Blocking paid launch** | Same decision as §3 update entitlement; keep both in sync. |
| Security-update duration | Same as updates · longer guaranteed window · none | Open | **Blocking paid launch** | Security patches may outlive feature updates; must be stated. |
| Breaking-change policy | Semver + migration guides · none · notice-only | Proposed (semver + migration) | **Blocking paid launch** | Aligns with existing release process; wording must be Approved for the commercial promise. |
| Migration support | Codemods/guides included · paid · none | Open | Non-blocking | Depth of migration help; a stated policy (above) is what blocks, not the depth. |

## 5. Delivery

| Decision | Options | Status | Blocking? | Notes |
|---|---|---|---|---|
| Private registry | Token-authenticated namespace · account login · both | Proposed (token namespace) | **Blocking paid launch** | `privateRegistryEnabled: true`; entitlement-aware route validated with a **mock** provider ([`docs/43`](43-private-registry-architecture.md)). A **real** entitlement provider must be wired before charging. |
| ZIP fallback | Offer ZIP · registry-only | Open | Non-blocking | Registry-only is launch-safe; ZIP increases piracy surface. |
| Git repo access | Read-only mirror per buyer · none · registry-only | Open | Non-blocking | Interacts with source-resale restrictions; not required to launch. |
| Customer portal | Hosted portal · email-only · provider portal | Open | **Blocking paid launch** | Buyers need a way to retrieve access/receipts/manage license; `customerPortalUrl` reserved, provider TBD. |
| Organization accounts | Multi-seat · single-owner only at launch | Open | Non-blocking | Single-owner is launch-safe unless team/agency tiers ship. |
| Token rotation | Self-serve rotation · support-assisted · none | Open | **Blocking paid launch** | A leaked token must be revocable/rotatable before paid tokens exist. |
| Multiple developer machines | Allowed (token reuse) · per-machine · limited | Open | **Blocking paid launch** | Practical install term buyers rely on; must be stated. |
| Offline access | Installed source works offline (yes) · N/A | Proposed (works offline) | Non-blocking | Installed source is the buyer's copy; no runtime checks, so it already works offline. |
| Update notifications | Email · in-registry changelog · portal feed | Open | Non-blocking | Depends on portal/provider; nice-to-have, not launch-blocking. |

## Paid-launch gate rule

Paid launch — defined as `commerce.checkoutEnabled: true` **or** `commerce.pricingEnabled: true`, **or** `commerce.launchMode` set to `public-beta`/`launched` **with pricing/checkout enabled** — **MUST remain disabled while any row above marked _Blocking paid launch_ has Status _Open_.** The automated **`launch-assertions`** enforce this relationship in code: the assertions fail the build/launch path if a pricing/checkout flag is enabled while blocking commercial or legal decisions remain unresolved, so the gate cannot be bypassed by editing `product.config.json` alone.

**Private preview is explicitly permitted with Open pricing and Open legal terms.** In `launchMode: private-preview` the blocking flags are held safe (`pricingEnabled: false`, `checkoutEnabled: false`, `waitlistEnabled: true`, `privateRegistryEnabled: true`), so no price, checkout, or unapproved term surfaces to visitors. Preview access is allowed to continue **provided the preview terms shown to preview participants are themselves owner-approved** — the preview must not present unreviewed license or data-handling language even though pricing stays off.

To move a blocking row toward launch: a human owner fills the placeholder/value, sets its Status here **and** in the canonical tracker [`docs/41`](41-commercial-decisions.md), and only then may the corresponding `commerce` flag be enabled. An agent may set `Proposed`/`Open`/`Rejected`/`Deferred`; an agent may **not** set `Approved`.

**No row may be marked Approved except by the human commercial/legal owner.**

---

## Private-preview phase decision (2026-07-14)

> **Recorded product decision — not an approval of anything paid.**

**Decision:** For the next product phase, the project operates as a **limited private preview**. Public checkout and paid launch remain **disabled**. Component development may continue on the **rapid-release track** while private-preview feedback is collected.

| Setting | Value | Source of truth |
|---|---|---|
| Launch mode | `private-preview` | `product.config.json` → `commerce.launchMode` |
| Product phase | `private-preview-only` | `commerce.productPhase` |
| Checkout | **disabled** | `commerce.checkoutEnabled = false` |
| Pricing | **disabled** | `commerce.pricingEnabled = false` |
| Private registry | **enabled** | `commerce.privateRegistryEnabled = true` |
| Waitlist / access requests | **enabled** | `commerce.waitlistEnabled = true` |
| Batch 6 development | **allowed** | this decision (rapid-release track) |
| Paid launch | **blocked** | `scripts/check-launch-config.mjs` (launched-mode gate) |
| Provider selection | **deferred** | docs/46 recommendation is *Proposed* only |
| Pricing decision | **deferred** | docs/41 — all Open |
| Legal completion | **deferred** until paid-launch preparation | legal pages remain drafts (gate-enforced) |
| Preview cohort size | **configurable, default 10** | `commerce.previewCohortSize` |
| Preview entitlement duration | **configurable** (default 30 days) | `commerce.previewEntitlementDurationDays` |
| Preview terms | **require owner approval** | env `MOTIONSTACK_PREVIEW_TERMS_APPROVED=1` (NOT set) |

**This decision is explicitly NOT approval of:** final prices · final licenses · public checkout · paid launch · lifetime updates · refund terms · team or agency terms · a specific commerce provider. **No public claim may be made that the product is launched or available for purchase.**

### Exact owner action required to approve preview terms

The private-preview *go-live* assertion (`scripts/check-launch-config.mjs`, mode `private-preview`) intentionally **fails** until the owner approves the preview terms. To approve:

1. Review the preview terms (the draft `/legal/*` pages + the preview scope in [docs/47](47-private-preview-runbook.md)).
2. Set the environment variable **`MOTIONSTACK_PREVIEW_TERMS_APPROVED=1`** in the deployment/runtime environment (never commit it to source).
3. Re-run `node scripts/check-launch-config.mjs` — it must report **OK** for `private-preview` before any real cohort is invited.

This flag is **not** set automatically by this change, and setting `commerce.previewTermsApproved` in config is only a documentation mirror — the runtime gate reads the env var. Approving preview terms does **not** approve paid launch, pricing, or legal terms.
