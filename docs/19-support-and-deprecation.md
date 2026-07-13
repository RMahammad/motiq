# 19 — Support & deprecation

> **Type:** 🟢 Canonical for support & deprecation policy · **Implementation status:** 🔵 Planned (policy draft; some items are business decisions) · **Last reviewed:** 2026-07-14
> **Owns:** supported-version policy, deprecation policy, support tiers, customer communication.
> **Related:** [`18-release-process.md`](18-release-process.md) · [`16-commercial-packaging.md`](16-commercial-packaging.md) · [`01-product-strategy.md`](01-product-strategy.md) · [`migration-authoring` skill](../.claude/skills/migration-authoring/SKILL.md)
> ⚠️ Commercial support/SLA terms are business decisions — confirm before publishing customer-facing promises. Several items below are [open questions](23-open-questions.md).

## Supported-version policy (draft)

- **Latest major** — full support (features, fixes, security).
- **Previous major** — security + critical fixes for a defined window (e.g. 6–12 months; TBD).
- Peer-dependency support range: React `>=18.3 <20`, current Next.js LTS and prior, Tailwind v4 (v3 via compiled CSS fallback) — see [`03`](03-architecture.md#framework-compatibility) and [`05`](05-dependency-decisions.md).

## Deprecation policy

1. Mark the API/token `@deprecated` (JSDoc) with a replacement pointer; keep it functional for **at least one major version**.
2. Emit a **dev-only** console warning where feasible (never in production builds; no telemetry).
3. Document in the changelog and a migration guide ([`templates/migration-guide-template.md`](templates/migration-guide-template.md)).
4. Remove only in a **major** release, with a codemod where feasible.
5. Never rename/remove a shared token or public prop silently ([`10`](10-design-tokens.md#token-deprecation-policy)).

## Support tiers (draft)

| Tier | Channel | Scope |
|---|---|---|
| Community/free | public issues/discussions | best-effort |
| Paid (individual/team) | email/portal | usage & bug support, defined response target (TBD) |
| Enterprise | private Slack + priority | onboarding, SLAs, custom terms ([`01`](01-product-strategy.md)) |

## Update policy

One-time purchase per major + optional annual "updates & new components" renewal ([`01`](01-product-strategy.md#commercial-terms-draft--lawyer-review-required)). Compiled-edition buyers get updates via `pnpm up`; source/registry buyers get **codemods + migration notes** because they own the code ([`16`](16-commercial-packaging.md#commercial-tradeoffs)).

## Customer communication

- Changelog + GitHub releases for every version ([`18`](18-release-process.md)).
- Migration guides for breaking changes.
- Security advisories for security releases.
- Deprecation notices ahead of removal (one major-version lead time).

## Support-burden mitigations

The top support-cost drivers (from [`02`](02-market-analysis.md#structural-insights) and [`22`](22-risk-register.md)): Tailwind class-detection failures, overlay/z-index issues, scroll-effect breakage on mobile. Mitigated by: the compiled-CSS fallback ([`11`](11-tailwind-strategy.md)), Radix overlays ([`12`](12-accessibility-standard.md)), mobile-fallback rules ([`13`](13-performance-standard.md)), and a strong Troubleshooting doc-site section ([`15`](15-documentation-strategy.md)).
