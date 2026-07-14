# 47 — Private preview runbook

> **Type:** 🟡 Operational runbook for the invite-only private preview · **Last reviewed:** 2026-07-14
> **Status:** Draft runbook for a **development / private-preview** posture (`launchMode: "private-preview"`). The preview runs on the **dev-mock entitlement provider**, a **file-backed durable store**, and **no live checkout** — it validates the delivery architecture and gathers product feedback, it does not sell. No real customers, cohorts, or feedback are recorded here; every participant-specific value is a placeholder to be filled at run time.
> **Related:** delivery [`docs/43`](43-private-registry-architecture.md) · exposure audit [`docs/42`](42-pro-source-delivery-audit.md) · analytics [`docs/44`](44-product-analytics-plan.md) · launch gate [`docs/45`](45-paid-launch-decision-gate.md) · monitoring [`docs/48`](48-launch-monitoring-plan.md) · threat model [`docs/49`](49-commercial-threat-model.md).

## Purpose

Run a small, invite-only preview that (1) proves the entitlement-aware registry delivers Pro source correctly to real users on real machines, and (2) collects qualitative product feedback — **without** taking payment or making commercial or legal commitments. Everything commercial (pricing, refunds, final license) stays behind the paid-launch gate ([`docs/45`](45-paid-launch-decision-gate.md)).

## Entry criteria (all must hold before the first invite)

- `launchMode` is `private-preview` and `checkoutEnabled` is `false` in [`product.config.json`](../product.config.json).
- Pro-exposure audit passes: `scripts/audit-pro-exposure.mjs` reports **0** ([`docs/42`](42-pro-source-delivery-audit.md)); no Pro `.tsx` under any `public/` path.
- The private registry route authenticates a token, checks entitlement, resolves dependencies, and records an audit entry for every decision ([`docs/43`](43-private-registry-architecture.md)).
- Token revocation works end-to-end (a revoked token receives `403 "revoked"`).
- Clean-fixture install of a Free item succeeds and a Pro item is **not** resolvable from `public/r` (only via the protected route with a valid token).
- Rate limiting is enabled on the protected route.
- The legal draft pages render with their draft banners and `[REQUIRES LEGAL REVIEW]` markers intact (these deliberately keep the paid-launch gate blocked).
- The monitoring plan ([`docs/48`](48-launch-monitoring-plan.md)) log surfaces exist (dev-logger adapter today).

## Cohort & invite process

- **Cohort limit:** `<CONFIG>` (default 10). Keep the first cohort small enough to support individually and to review every audit trail by hand.
- Invites are issued manually. Each participant receives a **dev-fixture access token** (e.g. `dev-ai-pack`, `dev-collab-pack`, `dev-complete`) — tokens are obviously fake, never secrets, and scoped to the packs that participant should see.
- Record per-invite: pseudonymous participant id, token id, granted entitlement, invite date, expiration date. Do **not** record marketing profiles or unnecessary personal data (see §Data collection).
- Provide each participant the `components.json` `registries` snippet from [`docs/43`](43-private-registry-architecture.md) and the environment-variable name for their token (`MOTIONKIT_TOKEN`) — the token is never committed or placed in a URL.

## Supported packs

The preview covers the workflow packs that are Pro-gated and installable through the protected route:

- **AI Interface** pack.
- **Developer Tools** pack.
- **Collaboration** pack.
- **Data Motion** pack.

Free catalog items remain publicly installable and are in scope as the control/baseline. Individual (non-pack) Pro item sales stay **off** (`individualComponentsEnabled: false`).

## Known limitations (state plainly to participants)

- **Dev-mock entitlement provider.** Tokens are fixtures; there is no real billing/identity system behind them ([`docs/43`](43-private-registry-architecture.md) §Production hardening).
- **File-backed durable store.** The audit log / entitlement state uses a file-backed store, not a production database. Suitable for a small cohort; not a scale or HA guarantee.
- **No live checkout.** `checkoutEnabled: false`; no payment is taken and no purchase flow is exercised.
- **No monitoring vendor.** Signals go to the dev-logger adapter ([`docs/48`](48-launch-monitoring-plan.md)); alerting is manual review, not paged.
- **Draft legal terms.** The License, Terms, Privacy, Refund, Update, and Support pages are drafts pending legal review; participation is not a sale and grants no finalized license.
- **Preview builds may change** without the update/versioning guarantees a paid launch would carry.

## Support channel

- Single designated support channel for the cohort: `<CONFIG support channel>` (to be provided; falls back to `commerce.supportEmail`, currently "to be provided").
- Support scope during preview is best-effort install/usage help and defect triage; no SLA (consistent with the draft Support Policy).

## Feedback method

- One lightweight, structured feedback intake: `<CONFIG feedback form/channel>` (to be provided).
- Solicit: install success/failure, DX of the token setup, per-pack usefulness, visual/motion quality, bugs, and missing workflows.
- Do **not** fabricate or pre-populate feedback. Capture only what participants actually submit.

## Incident process

1. **Detect** — via a monitored signal ([`docs/48`](48-launch-monitoring-plan.md)) or a participant report.
2. **Classify** severity (info / warn / error / critical) using the monitoring plan's definitions.
3. **Contain** — for a suspected token compromise or abuse, revoke the token immediately (`revokeAccess(customerId)`; next request → `403 "revoked"`).
4. **Communicate** — notify affected participants through the support channel.
5. **Record** — log the incident, root cause, and resolution.
6. **Review** — feed systemic issues into the launch gate ([`docs/45`](45-paid-launch-decision-gate.md)) and threat model ([`docs/49`](49-commercial-threat-model.md)).

## Token revocation

- Any token can be revoked at any time; revocation is durable and takes effect on the next request.
- Revoke on: preview exit, suspected sharing/compromise, participant request, or completion of the cohort.
- Every revocation and subsequent denied request is written to the audit log.

## Preview expiration

- Each token carries an **expiration date**; expired tokens receive a denial (`403`, revoked/expired state) at the route.
- Default preview window: `<CONFIG>` (e.g. a fixed number of weeks per cohort). Extensions are explicit re-issues, not silent.
- At window end, all cohort tokens are revoked unless a participant is explicitly rolled into a new cohort.

## Data collection & privacy boundaries

- Collect only what the preview needs: pseudonymous participant id, token id + entitlement, invite/expiration dates, install outcomes, and submitted feedback.
- Analytics stays on the **whitelisted product-event** posture ([`docs/44`](44-product-analytics-plan.md)): no source, secrets, tokens, request/response bodies, headers, or query text.
- Registry access is logged as decisions tied to a token/entitlement id ([`docs/43`](43-private-registry-architecture.md)); IP-hashing and retention are open privacy decisions ([`docs/44`](44-product-analytics-plan.md), reflected in the draft Privacy Policy).
- No cross-source personal-data compilation; no third-party analytics SDK in the current posture.

## Success criteria

- Free and Pro installs succeed on participants' real machines via the shadcn CLI + token header.
- Entitlement enforcement holds: unentitled/expired/revoked tokens are correctly denied; entitled ones succeed; dependencies resolve under the same token.
- Audit log captures every access decision with no gaps.
- No Pro source is reachable without a valid entitlement (re-verify `audit-pro-exposure.mjs` mid-preview).
- Qualitative signal is strong enough to decide which packs are launch-ready.
- Target thresholds for the above are set at run time (`<CONFIG>`); this runbook fixes no numeric targets.

## Exit criteria

- Delivery architecture validated (or defects logged and triaged) across all four packs.
- Feedback synthesized into a prioritized action list.
- All cohort tokens revoked or explicitly migrated.
- Open items routed to the launch gate ([`docs/45`](45-paid-launch-decision-gate.md)), monitoring plan ([`docs/48`](48-launch-monitoring-plan.md)), and threat model ([`docs/49`](49-commercial-threat-model.md)).

## Conversion path

The private preview does **not** convert participants directly (no checkout). Its output feeds the paid-launch decision:

1. Preview validates delivery + collects feedback →
2. Commercial decisions resolved (pricing, license, refund, provider selection — [`docs/41`](41-commercial-decisions.md), [`docs/45`](45-paid-launch-decision-gate.md), [`docs/46`](46-commerce-provider-evaluation.md)) →
3. Real checkout + real provider integrated and hardened ([`docs/43`](43-private-registry-architecture.md) §Production hardening) →
4. Legal drafts finalized (draft markers cleared) →
5. Public beta / launched mode enabled in [`product.config.json`](../product.config.json).

Preview participants may be offered a first-cohort path at that point, but any such offer and its terms are a separate commercial decision, not established here.

---

## Phase status (2026-07-14)

The private-preview-only phase decision is recorded in [docs/45 §Private-preview phase decision](45-paid-launch-decision-gate.md). **Before inviting any real cohort**, the owner must approve preview terms by setting `MOTIONKIT_PREVIEW_TERMS_APPROVED=1` (the `private-preview` launch-config gate blocks until then). Cohort size and preview entitlement duration are configurable via `commerce.previewCohortSize` (default 10) and `commerce.previewEntitlementDurationDays` (default 30). **No real users have been invited by this automated work** — see the final report's "Actual private-preview users invited" item.
