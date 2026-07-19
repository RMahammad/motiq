# ADR-0006: Library bundler — tsdown (Rolldown); tsup fallback

- Status: **Accepted** (validated by spike 2026-07-14)
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../05-dependency-decisions.md`](../05-dependency-decisions.md), [`../03-architecture.md`](../03-architecture.md), [`../14-testing-strategy.md`](../14-testing-strategy.md)
- Supersedes: —
- Superseded by: —

## Context
We ship an ESM-only library with multiple subpath exports, generated types, and — critically — **preserved `"use client"` directives** so RSC/App Router consumers work. The bundler choice hinges on directive preservation, which must be proven, not assumed.

## Decision
Adopt **tsdown** (Rolldown-based, tsup-compatible) as the default library bundler, **contingent on a fixture proving it preserves `"use client"`, emits correct subpath exports, and generates types**. If it fails that fixture, fall back to **tsup** (with a preserve-directives plugin/banner).

## Decision drivers
- ESM output, subpath exports, `.d.ts` generation, externalized peers, watch mode.
- Speed (Rolldown) + library ergonomics.
- **Directive preservation is a hard requirement** ([`../14`](../14-testing-strategy.md)).

## Alternatives considered
- **tsup** — proven; kept as fallback. Directive preservation historically needed extra config.
- **Vite library mode / raw Rollup** — more manual multi-entry + types wiring.
- **unbuild / esbuild raw** — less turnkey for this exact requirement.

## Consequences
### Positive
- Fast builds; modern toolchain; tsup-compatible migration path.
### Negative
- Newer tool; directive-preservation behavior must be verified per release.

## Risks and mitigations
- `"use client"` stripped → **packed-tarball fixture test blocks release**; tsup fallback ([`../22`](../22-risk-register.md)).

## Validation
**Done — spike passed 2026-07-14.** Built `@scope/{tokens,motion,react}` with **tsdown v0.15.12 (rolldown v1.0.0-beta.45)**. Verified:
- `"use client"` is **preserved on every consumer-facing entry point** (`dist/index.js`, `dist/reveal.js`, `dist/animated-button.js`); split chunks are directive-less but only reachable through a client-marked boundary. Present in the packed tarball too.
- Peers (`react`, `react-dom`) and workspace deps (`@scope/*`) are **externalized, not bundled**.
- **`apps/playground-next` (Next.js 16.2.10, App Router, Turbopack) builds successfully** importing the client components from a **Server Component** — the RSC boundary proof. If the directive were stripped, this build would fail.
- `apps/playground-vite` (Vite 6) builds successfully.
- Strict `tsc` typecheck passes across all packages; `.d.ts` + subpath exports generated.

Residual (does not block Accepted): run `publint` + `@arethetypeswrong/cli`, and a verdaccio-based packed-tarball inter-package install fixture (tracked in [`../14-testing-strategy.md`](../14-testing-strategy.md)). The **tsup fallback is not needed** — tsdown met the hard requirement.

## Revisit conditions
- tsdown regresses on directive preservation, or a better tool proves out.

## Sources
- tsdown.dev/guide, tsdown migrate-from-tsup — verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
