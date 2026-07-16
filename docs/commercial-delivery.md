# Commercial delivery

> **Type:** Canonical front-door · Scope: how the product is packaged, priced, and delivered.

This page indexes the commercial and operational records. Those records are the source of truth and **must be preserved** (legal/commercial) — do not delete them. Do not change prices, licensing terms, refund policy, provider selection, paid-launch status, private-preview approval, or entitlement design outside a security/correctness fix.

## Packaging and distribution

- Distribution + IP + install-gating model: [`16-commercial-packaging.md`](16-commercial-packaging.md).
- Packs/blocks commercial structure: [`40-commercial-packaging.md`](40-commercial-packaging.md).
- Support tiers and deprecation policy: [`19-support-and-deprecation.md`](19-support-and-deprecation.md).

## Delivery of paid source

- Entitlement-aware protected registry: [`43-private-registry-architecture.md`](43-private-registry-architecture.md) and [`registry-authoring.md`](registry-authoring.md).
- No runtime license checks; gate at install/purchase.

## Launch and operations

- Paid-launch go/no-go gate: [`45-paid-launch-decision-gate.md`](45-paid-launch-decision-gate.md).
- Private-preview runbook + learning plan: [`47-private-preview-runbook.md`](47-private-preview-runbook.md), [`50-private-preview-learning-plan.md`](50-private-preview-learning-plan.md).
- Commerce provider evaluation: [`46-commerce-provider-evaluation.md`](46-commerce-provider-evaluation.md).
- Analytics plan: [`44-product-analytics-plan.md`](44-product-analytics-plan.md).
- Launch monitoring: [`48-launch-monitoring-plan.md`](48-launch-monitoring-plan.md).
- Open commercial/legal decisions: [`41-commercial-decisions.md`](41-commercial-decisions.md).

## Positioning

Product moat and differentiation: [`27-product-differentiation.md`](27-product-differentiation.md). The component inventory is **frozen** for the current cleanup phase.

## Launch gates (config-enforced)

`pnpm check:launch` gates launch modes and fails closed until the owner approves (e.g. `MOTIONSTACK_PREVIEW_TERMS_APPROVED=1` for private preview). A blocking result there is the gate working as designed, not a code defect.
