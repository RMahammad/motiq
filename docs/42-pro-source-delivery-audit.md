# 42 — Pro source delivery & public-exposure audit

> **Type:** 🟢 Canonical for the commercial source-protection posture · **Last reviewed:** 2026-07-14
> **Status:** Findings recorded and the two **Critical** vectors remediated in the same sprint (see [`§ Remediation`](#remediation-status)). This document is the source of truth for what paid source is exposed and where.
> **Related:** delivery design [`docs/43`](43-private-registry-architecture.md) · commercial model [`docs/40`](40-commercial-packaging.md) · human decisions [`docs/41`](41-commercial-decisions.md).

## Why this audit exists

The catalog now contains **13 Pro items** (5 Pro components, 4 workflow blocks, 4 packs — every block/pack references Pro components and is itself Pro). Before any paid launch we must answer one question honestly: **can a visitor obtain Pro source without an entitlement?**

Until this sprint the answer was **yes**. The registry generator inlined *every* item's full `.tsx` source into a static file under a public directory, and the docs component page rendered that same source into static HTML. That is acceptable for a free/open catalog; it is **incompatible with selling that source**. No "private registry" existed — the word had been used in planning docs, but no access control was implemented, so this audit does not claim one exists until [`docs/43`](43-private-registry-architecture.md)'s flow actually gates access.

## Exposure classification legend

Each vector is classified by the strictest environment in which it is tolerable:

- **Acceptable in development** — fine for local docs; must not ship to a paid public deployment.
- **Acceptable in public preview** — fine while the product is free/preview and nothing is sold.
- **Must fix before paid launch** — a paying customer's exclusive artifact would leak; blocks charging money.
- **Critical** — paid source is *currently, publicly, unauthenticated* downloadable. Blocks even a private preview that advertises paid tiers.

## Findings

| # | Vector | What is exposed | Classification | Status |
|---|---|---|---|---|
| F1 | `apps/docs/public/r/<pro>.json` | Full `.tsx` source of every Pro component/block/pack, inlined in `files[].content`, served statically at `/r/<name>.json` with no auth | **Critical** | ✅ Remediated |
| F2 | `apps/docs/app/components/[slug]/page.tsx` "Source" section | Renders `reg.files[0].content` in a `<CodeBlock>` for *every* item incl. Pro → full source baked into static HTML + RSC payload | **Critical** | ✅ Remediated |
| F3 | `apps/docs/public/r/index.json` (search/catalog index) | Metadata only — `name, type, title, description, category, tier, kind, keywords, dependencies, registryDependencies, url, install`. **No `content` field.** | Acceptable in public preview | ✅ No change needed |
| F4 | Client JS bundles for live previews (`_previews/*` import registry sources via `@/components/motionstack/*` aliases) | The *running, compiled, minified* component logic ships in client chunks (as it must to render). This is behaviour, not the distributable editable `.tsx` artifact. | Acceptable in public preview | ⚠️ Policy-bounded (see below) |
| F5 | Source maps | `apps/docs/next.config.ts` sets no `productionBrowserSourceMaps` → Next default is **off**; prod client source maps are not emitted publicly. Dev serves maps (local only). | Acceptable in public preview | ✅ No change needed |
| F6 | Static build output `.next/` | Contains RSC payloads for prerendered pages; via F2 those payloads embedded Pro source. Fixing F2 removes Pro source from prerendered output. Server-only artifacts under `.next/server` are not served as static assets. | Was **Critical** via F2 | ✅ Remediated with F2 |
| F7 | Pack/block registry files (`ai-agent-workspace.json`, `*-pack.json`, …) | Same as F1 — these are Pro and were public. | **Critical** | ✅ Remediated (treated as Pro by the split) |
| F8 | Preview/demo data | Fictional only (no real prompts, keys, customer data, secrets — headers redacted as `Bearer ••••••`). Not a source-exposure issue; recorded for completeness. | Acceptable | ✅ No change needed |

### F4 — the running-code nuance (important, do not overclaim)

Any client component's logic necessarily ships to the browser to run. Minified bundle code is **not** the product we sell — the product is **editable, commented, typed `.tsx` source installed into the buyer's repo**. A determined viewer can always reconstruct *approximate* behaviour from any client component on any site; that is true of every component vendor. What we must not do is **hand over the pristine source file** via a download endpoint or copyable code block. So the protection boundary is: **the distributable `.tsx` artifact is gated; the compiled preview may render.** This is the same posture used by commercial React component vendors and is stated as policy in [`docs/40`](40-commercial-packaging.md) and the source-preview policy.

To keep even the compiled Pro logic from being trivially over-exposed before launch, the **launch configuration** can additionally lazy-mount Pro previews (they already pause offscreen) — but we explicitly **do not** claim the compiled preview is "protected." Claiming otherwise would be dishonest.

## Remediation status

Two **Critical** vectors (F1, F2, and F6/F7 which derive from them) were remediated in this sprint:

1. **Registry generation split (F1, F7).** `packages/registry/scripts/build-registry.mjs` now writes **Free** items to `apps/docs/public/r/` (publicly served, unchanged CLI behaviour) and **Pro/block/pack** items to a **private, non-public artifact directory** (`packages/registry/.protected/r/`, git-ignored, never under any `public/` path). The public `index.json` still lists Pro items as *metadata* (so the catalog can show them) but never their source. A build-time assertion fails the build if any Pro `content` lands under `public/`.

2. **Doc-page source gate (F2).** `apps/docs/app/components/[slug]/page.tsx` reads source from the split output and, for Pro items, renders the **source-preview policy** surface (API, props, file list, dependency summary, a short usage snippet) instead of the full implementation. Full source renders only for **Free** items, or for **any** item when the entitlement layer grants access in development mode.

3. **Delivery of Pro source (F1 replacement).** Paid source is retrieved through the **entitlement-aware registry route** ([`docs/43`](43-private-registry-architecture.md)), which authenticates a token, verifies entitlement, resolves dependencies, logs access, and returns the item JSON. No static public Pro JSON remains.

### Post-remediation verification (run in the validation phase)

- `scripts/audit-pro-exposure.mjs` scans `apps/docs/public/` (and, when present, `apps/docs/.next/`) for any file whose content matches a Pro item's implementation signature; **must report 0**.
- `index.json` asserted to contain no `content` key.
- Clean-fixture install of a Free item from `public/r` still succeeds; a Pro item is **not** resolvable from `public/r` and is only resolvable via the protected route with a valid dev token.

## What this audit does **not** claim

- It does **not** claim the compiled/minified preview is unrecoverable (F4).
- It does **not** claim a production-grade private registry with real customer auth exists — only a **development entitlement flow** that proves the architecture. Real provider integration is a tracked open decision ([`docs/41`](41-commercial-decisions.md)).
- It does **not** finalize what paid visitors may see before purchase — that is the **source-preview policy**, tracked and applied but subject to commercial sign-off.

## Standing rule

**No Pro `.tsx` source may be written under any `public/` directory, embedded in prerendered HTML/RSC output, or included in `index.json`.** Any change to registry generation or the docs source section must re-run `scripts/audit-pro-exposure.mjs` before merge. New Pro components inherit the split automatically (classification comes from `meta.tier`).
