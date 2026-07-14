# 48 — Launch monitoring plan

> **Type:** 🟡 Canonical for what is monitored around commerce & delivery · **Last reviewed:** 2026-07-14
> **Status:** Plan only. Monitoring signals are emitted to the **dev-logger adapter** today; **no monitoring/observability vendor is selected** and none is integrated. Every threshold is a placeholder and every response owner is **TBD**. This document defines *what* to watch, *how severe* each condition is, and *who* responds — it does not claim live alerting exists.
> **Related:** delivery [`docs/43`](43-private-registry-architecture.md) · exposure audit [`docs/42`](42-pro-source-delivery-audit.md) · analytics [`docs/44`](44-product-analytics-plan.md) · launch gate [`docs/45`](45-paid-launch-decision-gate.md) · preview runbook [`docs/47`](47-private-preview-runbook.md) · threat model [`docs/49`](49-commercial-threat-model.md).

## Current posture (honest baseline)

- Signals are produced by the same provider-neutral pattern as analytics: the code emits a named event; an **adapter** decides what to do with it. Today the only adapter is the **dev-logger**, which writes locally.
- **No vendor is chosen.** Selecting an error-tracking / metrics / alerting provider is an **open decision** ([`docs/41`](41-commercial-decisions.md), [`docs/46`](46-commerce-provider-evaluation.md)). Swapping in a vendor is an adapter change; the monitored areas below do not change.
- Until a vendor is integrated, "alerting" means **manual review** of dev-logger output; nothing pages anyone automatically.
- **No thresholds are committed** — every value below is a placeholder set at integration time.

## Severity definitions

| Severity | Meaning | Expected handling once a vendor exists |
|---|---|---|
| `info` | Normal, expected event worth counting for baselines/trends. | Dashboards only; no alert. |
| `warn` | Degradation or elevated rate; not yet customer-blocking. | Non-urgent notification; review within business hours. |
| `error` | Customers affected; a flow is failing for some. | Alert on-call owner; investigate promptly. |
| `critical` | Revenue, access, or paid-source integrity at risk; broad or security-sensitive failure. | Page immediately; incident process ([`docs/47`](47-private-preview-runbook.md) §Incident process). |

## Monitored areas

Each area lists the signal, its default severity if the alert condition trips, a **threshold placeholder**, and the **response owner** (all TBD). Sources reference the real controls already built.

| # | Area | Signal / source | Alert condition | Severity | Threshold (placeholder) | Response owner |
|---|---|---|---|---|---|---|
| M1 | Registry errors | 5xx / unexpected failures from `/api/registry/[name]` ([`docs/43`](43-private-registry-architecture.md)) | Error rate exceeds baseline | `error` | `<CONFIG error rate over window>` | TBD |
| M2 | Registry access denials | `registry_access_denied` + route `401/403` audit decisions ([`docs/42`](42-pro-source-delivery-audit.md), [`docs/43`](43-private-registry-architecture.md)) | Denial rate or absolute spike above baseline (possible abuse/misconfig) | `warn` → `error` on sustained spike | `<CONFIG denials over window>` | TBD |
| M3 | Registry latency | Response time of the protected route | p95 latency over target | `warn` | `<CONFIG p95 ms>` | TBD |
| M4 | Checkout errors | Checkout provider callbacks / `checkout_started` without `checkout_completed` ([`docs/44`](44-product-analytics-plan.md)) | Failure/abandon-error rate over baseline | `error` | `<CONFIG failure rate>` | TBD |
| M5 | Webhook errors | Checkout-provider webhook receipt/verification failures | Any verification failure, or delivery-failure rate over baseline | `error` → `critical` on verification failure (forgery risk) | `<CONFIG failures over window>` | TBD |
| M6 | Entitlement failures | `canAccessRegistryItem` / entitlement-check errors ([`docs/43`](43-private-registry-architecture.md)) | Errors resolving entitlement for a valid token (entitled user wrongly denied, or check throwing) | `critical` | `<CONFIG any over window>` | TBD |
| M7 | Access-request failures | Failures in the access/invite/token-issuance path ([`docs/47`](47-private-preview-runbook.md)) | Issuance or lookup failures over baseline | `error` | `<CONFIG failures over window>` | TBD |
| M8 | Email failures | Transactional email (invite, receipt, revocation notice) send failures | Send-failure rate over baseline | `error` | `<CONFIG failure rate>` | TBD |
| M9 | Portal failures | Customer-portal (`customerPortalUrl`) availability/errors | Portal errors or unavailability | `error` | `<CONFIG error rate / uptime>` | TBD |
| M10 | Download failures | Failures delivering item JSON / ZIP fallback ([`docs/43`](43-private-registry-architecture.md) §hardening) | Delivery-failure rate over baseline | `error` | `<CONFIG failure rate>` | TBD |

## Cross-cutting security signals

These derive from the same sources but warrant explicit callouts, cross-referenced to the threat model ([`docs/49`](49-commercial-threat-model.md)):

- **Rate-limit trips** on the protected route → `warn`, escalating to `error`/`critical` on sustained or distributed patterns (scraping / enumeration). Threshold `<CONFIG>`; owner TBD.
- **Webhook signature verification failures** (M5) are treated as `critical` — possible forgery ([`docs/49`](49-commercial-threat-model.md)).
- **Repeated denials against guessable item names / customer identifiers** (M2) → enumeration signal; `warn` → `error`. Threshold `<CONFIG>`; owner TBD.
- **Revocation-latency check**: a revoked token must be denied on its next request; a granted decision for a revoked token is `critical`.

## Dashboards & retention

- Counts and rates for M1–M10 plus the security signals should be visualized once a vendor exists; retention of monitoring data is an **open decision** tied to the same privacy rules as analytics ([`docs/44`](44-product-analytics-plan.md)).
- Monitoring must obey the analytics privacy boundary: **no source, secrets, tokens, request/response bodies, headers, or query text** in monitoring payloads; use ids, slugs, coarse counts, and error codes only.

## Open decisions

- **Which monitoring/observability vendor** (error tracking + metrics + alerting) replaces the dev-logger adapter. — **Open** (no vendor selected).
- **Concrete thresholds** for every area above. — **Open** (all placeholders).
- **Response owners / on-call rotation.** — **Open** (all TBD).
- **Retention** window for monitoring data. — **Open**.
- **Paging/notification channel** and escalation policy. — **Open**.

Until a vendor is selected and thresholds/owners are assigned, this plan is the specification for monitoring, not a live alerting system.
