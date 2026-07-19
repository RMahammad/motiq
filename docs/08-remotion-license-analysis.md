# 08 — Remotion license analysis

> **Type:** 🟢 Canonical for Remotion licensing facts & open legal questions · **Implementation status:** 🔵 Planned (blocking gate for Phase 4) · **Last reviewed:** 2026-07-14
> **Related:** [`07-remotion-strategy.md`](07-remotion-strategy.md) · [ADR-0003](adrs/0003-remotion-boundary.md) · [`23-open-questions.md`](23-open-questions.md) · [`22-risk-register.md`](22-risk-register.md)
> ⚠️ **This document does not provide legal conclusions on ambiguous terms.** It separates verified facts from open questions that require answers from Remotion and a qualified attorney.

## Verified facts

Verified 2026-07-14 against <https://www.remotion.dev/docs/license>, <https://www.remotion.pro/license>, and <https://www.remotion.dev/blog/company-licenses>:

- **[FACT]** Remotion is **free** for individuals, non-profits, and for-profit organizations of **up to 3 people**, including commercial use and self-hosted rendering.
- **[FACT]** A **paid company license** is required once a for-profit org has **4+ people**.
- **[FACT]** Pricing ≈ **$25/developer/month**, minimum **$100/month or $1000/year**. Existing subscribers are grandfathered on price changes.
- **[FACT]** `@remotion/licensing` exists for programmatic license/usage tracking (relevant to hosted rendering).

## What matters is which action the product takes

| Product action | License exposure | Status |
|---|---|---|
| Sell **original templates** (our own source) | Lowest risk — selling our code, not Remotion. But buyers who render may need their own license at 4+ people | [LEGAL-UNCERTAIN] |
| Embed **`@remotion/player`** in buyer apps | Player in the browser; redistribution + buyer obligations unclear | [LEGAL-UNCERTAIN] |
| **Render videos for customers** (hosted) | We operate Remotion at scale → almost certainly need a company license + usage terms | [LEGAL-UNCERTAIN, high] |
| Let users **edit template values** (props) | Generally fine (the point of templates) | likely OK |
| Let users **edit Remotion code** | Closer to distributing a Remotion dev environment | [LEGAL-UNCERTAIN] |
| Let users **upload arbitrary Remotion projects** | Highest ambiguity — looks like Remotion-as-a-service | [LEGAL-UNCERTAIN, high] |
| Anything reading as **selling Remotion itself** or enabling **license circumvention** | Prohibited — avoid entirely | avoid |

## Questions that must be answered by Remotion

Send to Remotion (hello@remotion.dev / their licensing contact):

1. If we sell original video **templates** built with Remotion, does the **end buyer** need their own company license to render them (when 4+ employees), or does our license cover their rendering?
2. May we **redistribute `@remotion/player`** inside a paid component/template package? Any attribution or license-passthrough requirements?
3. If we offer **hosted rendering** for customers, what license tier/usage terms apply, and does `@remotion/licensing` satisfy compliance?
4. Are there restrictions on letting customers **edit template code** vs only props?
5. Does bundling Remotion templates in a **paid marketplace** trigger any redistribution clause distinct from normal app use?
6. Confirmation that **our own team size** determines our development-time license obligation, independent of what we sell.

## Questions requiring legal review

For a qualified software attorney (in parallel with the Remotion answers):

- Do our end-user license terms need to **pass through** any Remotion obligation to buyers?
- Liability if a buyer renders without a required Remotion license.
- Whether our resale of templates constitutes "distribution" under Remotion's terms.
- Refund/withdrawal interaction with source access (see [`16`](16-commercial-packaging.md)).

## Launch blockers

- **Do not ship the Remotion product line (Phase 4) until questions 1–5 are answered in writing.**
- No Remotion import may enter any core package at any time (enforced — [`03`](03-architecture.md#forbidden-import-matrix)).
- Hosted rendering (if pursued) requires a resolved license tier + cost model first ([`07`](07-remotion-strategy.md#rendering-deployment-options-planned-decision-open)).

## Verification log

| Claim | Source | Date |
|---|---|---|
| Free ≤3-person for-profit / individuals / non-profits | remotion.dev/docs/license | 2026-07-14 |
| Company license at 4+; ~$25/dev/mo; min $100/mo or $1000/yr | remotion.dev/blog/company-licenses, remotion.pro/license | 2026-07-14 |
| `@remotion/licensing` exists | remotion.dev docs | 2026-07-14 |

> Re-verify before Phase 4; licensing terms change. Stale-date detection: [`tooling/check-stale-dates.mjs`](tooling/) (planned).
