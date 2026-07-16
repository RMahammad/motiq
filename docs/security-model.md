# Security model

> **Type:** Canonical front-door · Scope: source protection, secrets, supply chain, threat model.

Security records are the source of truth and **must be preserved**. Do not weaken authentication, rate limiting, token handling, or the source-exposure audits.

## Principles

- **No secrets in client code**; no runtime license checks. Gate access at install/purchase.
- **Fail closed** — access decisions default to deny on any error or unknown state (`apps/docs/lib/server/access.ts`).
- **Free source is public; Pro source is protected.** Protected source must never appear in public build output.

## Enforcement

- `pnpm check:exposure` (`scripts/audit-pro-exposure.mjs`) — asserts no protected item is exposed under `public/`.
- The registry build asserts no protected source lands under the public dir.
- Import-boundary firewall (`pnpm lint`) keeps Node/`next`/Remotion out of core packages.

## Records (do not delete)

- Supply chain, secrets, publishing security: [`17-security-and-supply-chain.md`](17-security-and-supply-chain.md).
- Commercial threat model (commerce + Pro-source surface): [`49-commercial-threat-model.md`](49-commercial-threat-model.md).
- Pro source-exposure audit + remediation history: [`42-pro-source-delivery-audit.md`](42-pro-source-delivery-audit.md).
- Risk register: [`22-risk-register.md`](22-risk-register.md).

## Reporting a change

Any change touching access control, token handling, entitlement, or the public/protected boundary requires re-running the exposure audit and updating the relevant record above.
