# 17 — Security, supply chain & code quality

> **Type:** 🟢 Canonical for supply-chain, secrets, and code-quality standards · **Implementation status:** 🔵 Planned · **Last reviewed:** 2026-07-14
> **Owns:** secret handling, publishing security, strict-TS policy, coding conventions.
> **Related:** [`16-commercial-packaging.md`](16-commercial-packaging.md) · [`18-release-process.md`](18-release-process.md) · [`05-dependency-decisions.md`](05-dependency-decisions.md) · [`dependency-review` skill](../.claude/skills/dependency-review/SKILL.md)

## Security & supply chain

- **Secret handling** — **never** place commercial license secrets, tokens, or keys in any client package or frontend bundle. No runtime license checks ([`16`](16-commercial-packaging.md)).
- **License-key handling** — install-time only (private-registry token / registry auth), short-lived, scoped, revocable.
- **Client/server separation** — server-only code behind the `node` export condition; enforced by boundaries ([`03`](03-architecture.md)).
- **Publishing** — least-privilege npm publish permissions; **2FA required**; npm **provenance** (`--provenance`) or current equivalent; signed releases where practical.
- **CI permissions** — minimal scopes; publish tokens only in the release job.
- **Dependency hygiene** — committed lockfile; Renovate/Dependabot; vulnerability response process; minimal runtime deps to reduce malicious-dependency surface ([`05`](05-dependency-decisions.md), [`dependency-review`](../.claude/skills/dependency-review/SKILL.md)).
- **Source maps** — no secrets in maps; decide public vs private maps per package.
- **No customer-data collection.** **Telemetry off by default**, opt-in only, disclosed.
- **Build reproducibility** — pinned toolchain; deterministic builds.

## Code-quality standards

### Strict TypeScript

Evaluate/enable per package: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `isolatedModules`, `noUncheckedSideEffectImports`.

Where a strict option causes disproportionate complexity, relax **per-package** with a documented reason (not globally). Known friction points:
- `exactOptionalPropertyTypes` with third-party prop spreads.
- `noPropertyAccessFromIndexSignature` on token maps.

### Also configure

ESLint (+ import-boundary plugin), Prettier, unused-code detection (`knip`), API surface checks (`publint` + `@arethetypeswrong/cli`), type-level tests (`expect-type`/`tsd`), Changesets, Renovate/Dependabot, security scanning, npm provenance, committed lockfile, reproducible builds. Conventional commits only if it earns its keep (Changesets already drive versioning).

### Coding conventions

| Concept | Convention |
|---|---|
| Component names | `PascalCase` |
| File names | `kebab-case.tsx` |
| Hooks | `useX` |
| Utilities | `camelCase` |
| Tokens | `--motion-*` / `--<comp>-*` |
| Stories | `*.stories.tsx` |
| Tests | `*.test.tsx` / `*.a11y.test.ts` / `*.ssr.test.tsx` |
| Public types | exported + documented |
| Internal types | not exported |
| Event callbacks | `onX` |
| Controlled props | `value` / `onValueChange` (+ `defaultValue`) |
| Boolean props | positive (`once`, not `disableRepeat`) |
| Data attributes | `data-slot` / `data-state` / `data-motion` |
| Motion presets | typed unions |

Detailed API rules live in [`09-component-api-standard.md`](09-component-api-standard.md) (the canonical owner of API conventions); this section owns the code-quality tooling.
