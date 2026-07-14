# 43 — Private (entitlement-aware) registry architecture

> **Type:** 🟢 Canonical for how paid source is delivered · **Last reviewed:** 2026-07-14
> **Status:** 🟡 Development flow implemented and validated with a **mock** entitlement provider. Production hardening (real provider, rate limiting, durable audit log) is tracked in [`docs/41`](41-commercial-decisions.md).
> **Related:** exposure audit [`docs/42`](42-pro-source-delivery-audit.md) · commercial model [`docs/40`](40-commercial-packaging.md) · analytics [`docs/44`](44-product-analytics-plan.md).

## Goal

Deliver Pro/block/pack `.tsx` source **only** to entitled customers, using the standard shadcn CLI, with **no browser-exposed secret** and **no static public Pro JSON**. Free source keeps working exactly as before.

## Non-goals / hard rules

- **No query-string license keys.** The token travels in the `Authorization` header only.
- **No paid source in client bundles or static output** (enforced by [`docs/42`](42-pro-source-delivery-audit.md) split + assertion).
- **No checkout-provider secret in the browser.** Entitlement checks are server-only.
- The client is never trusted: a `localStorage` "pro=true" flag grants nothing. Enforcement is at the route.

## Components

| Layer | Where | Responsibility |
|---|---|---|
| Registry generation | `packages/registry/scripts/build-registry.mjs` | Free → `public/r/`; Pro/block/pack → `.protected/r/` (git-ignored). |
| Source reader (server) | `apps/docs/lib/registry-source.ts` | Read public/protected item JSON; gate full-source rendering. |
| Entitlement provider | `apps/docs/lib/server/entitlements.ts` | `getCustomerByToken`, `getEntitlements`, `hasEntitlement`, `canAccessRegistryItem`, `recordRegistryAccess`, `revokeAccess`. Provider-neutral; dev **mock** adapter today. |
| Protected route | `apps/docs/app/api/registry/[name]/route.ts` | Auth + entitlement + dependency resolution + audit; returns item JSON or an error. |

## Request flow

```
shadcn CLI ──GET /api/registry/<name>  (Authorization: Bearer <token>)──▶ route
  1. Free item?        → 200 public JSON (no auth)         [record: free]
  2. Protected item:
     a. no token       → 401 { error: "no-token" }         [record: denied]
     b. unknown token  → 403 { error: "invalid-token" }    [record: denied]
     c. revoked/refund → 403 { error: "revoked" }          [record: denied]
     d. not entitled   → 403 { error: "not-entitled" }     [record: denied]
     e. entitled       → 200 item JSON + resolvedDependencies  [record: granted]
  3. Registry dependencies are re-checked under the SAME token (step e).
```

### 1. Customer receives an access token
Issued after purchase/invite by the (future) provider. In development, tokens are fixtures (`dev-complete`, `dev-ai-pack`, `dev-collab-pack`, `dev-revoked`) — obviously fake, never secrets.

### 2. shadcn request sends an Authorization header
The CLI supports per-registry headers via `components.json` `registries`:

```jsonc
// components.json (customer side)
{
  "registries": {
    "@motionkit": {
      "url": "https://motionkit.dev/api/registry/{name}",
      "headers": { "Authorization": "Bearer ${MOTIONKIT_TOKEN}" }
    }
  }
}
```
Then `npx shadcn add @motionkit/tool-call-activity` sends the header. The token is read from the customer's environment — never committed, never in a URL.

### 3–5. Verify token → verify entitlement → return JSON
`canAccessRegistryItem(name, token)` resolves the customer, checks revocation/refund/expiry, then checks whether any entitlement that grants `name` is held. Entitlement→item mapping is derived from `packs.ts` (no duplication): `catalog.complete` grants everything; `pack.<slug>` grants that pack's four components + its block + the pack item; `component.<name>` grants a single item (only meaningful if individual sales are enabled).

### 6. Dependencies resolved under the same authorization
The item's protected `registryDependencies` are re-checked with the same token and reported in `meta.resolvedDependencies`. The CLI fetches each dependency URL itself (same header), so each is independently authorized. Free dependencies (`@motionkit/utils`, `@motionkit/primitives`) resolve publicly.

### 7. Access is logged
Every decision (granted or denied, free or paid) is appended to the provider's audit log via `recordRegistryAccess`. The dev adapter keeps an in-memory ring buffer; production uses a durable store (open decision).

### 8. Revoked tokens receive an appropriate error
Refund/chargeback/expiry ⇒ `state !== active` ⇒ `403 { error: "revoked" }`. `revokeAccess(customerId)` flips the flag; the next request is denied.

## Error contract

| Condition | Status | Body `error` |
|---|---|---|
| Free item | 200 | — |
| Protected, no header | 401 | `no-token` |
| Protected, unknown token | 403 | `invalid-token` |
| Protected, revoked/refunded/expired | 403 | `revoked` |
| Protected, valid token but not entitled | 403 | `not-entitled` |
| Protected, entitled | 200 | — |
| Unknown item | 404 | `not_found` |

## Local development setup

- `pnpm --filter registry build` (or `node packages/registry/scripts/build-registry.mjs`) generates the split.
- Run the docs app; the route is live at `/api/registry/<name>`.
- Exercise it: `curl -H "Authorization: Bearer dev-complete" http://localhost:3000/api/registry/tool-call-activity` → 200; omit the header → 401; `dev-revoked` → 403.
- Local docs pages still render Pro source in `next dev` (via `canRenderFullSource`, which is **off** in production builds) so authors keep full-source DX without leaking to prod.

## Production hardening — open before paid launch (see [`docs/41`](41-commercial-decisions.md))

- Replace the mock provider with a real billing/auth integration (token issuance, verification).
- Durable, queryable **audit log**; **rate limiting** per token/IP; abuse detection.
- **Downloadable ZIP fallback** and/or **git access** for customers who don't use the CLI.
- **Team/organization tokens** with seat limits; per-seat revocation.
- Signed, expiring tokens; rotation; customer self-serve revoke in the portal.
- Decide hosting of `.protected/r` in production (server bundle vs. object storage behind the route).
