# ADR-0010: Commercial distribution — private npm + authed registry; no runtime checks

- Status: Proposed (refund/terms angle needs legal review)
- Date: 2026-07-14
- Owners: Founder, Eng
- Related documents: [`../16-commercial-packaging.md`](../16-commercial-packaging.md) (canonical), [`../17-security-and-supply-chain.md`](../17-security-and-supply-chain.md)
- Supersedes: —
- Superseded by: —

## Context
We must protect IP without hurting developer experience, offline work, or CI — and without putting secrets in frontend bundles.

## Decision
**Hybrid, install-time gating:** a **compiled edition** on a private npm scope (per-customer scoped token driven by billing entitlement) **and** a **source edition** via an **authenticated shadcn-style registry + CLI**. **No runtime license checks.** Gate at purchase/install only; revocation = revoke token. Source files may carry a provenance watermark comment (not enforcement).

## Decision drivers
- No secrets in client code ([`../17`](../17-security-and-supply-chain.md)).
- Best DX (offline/CI friendly); best differentiation (source access).
- Revocable entitlement.

## Alternatives considered
- **Runtime license key check** — leaks secrets, breaks offline/CI, harms DX; **rejected**.
- **Downloadable zip only** — leaks, no revocation.
- **Compiled-only** — poor customization for power users.

## Consequences
### Positive
- Convenient + customizable; revocable; no secret exposure.
### Negative
- Source edition can leak (accepted; priced in). Refunds interact awkwardly with source access.

## Risks and mitigations
- Source leakage → value in updates/support; watermark; brand moat ([`../22`](../22-risk-register.md)).
- Refund abuse → short window, seat-based licensing, clear terms (**legal review required**).

## Validation
Move to **Accepted** once (a) the entitlement→token flow issues/revokes access in a test, and (b) counsel has reviewed the refund/redistribution terms.

## Revisit conditions
- Piracy materially harms revenue; or a better non-intrusive gating emerges.

## Sources
- Internal commercial analysis ([`../16`](../16-commercial-packaging.md)); npm provenance docs (general).
