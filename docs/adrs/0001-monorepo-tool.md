# ADR-0001: Monorepo tool — pnpm workspaces + Turborepo

- Status: **Accepted** (validated by spike 2026-07-14)
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../03-architecture.md`](../03-architecture.md), [`../04-package-map.md`](../04-package-map.md)
- Supersedes: —
- Superseded by: —

## Context
The product is a multi-package library + apps (docs, Storybook, fixtures, Remotion studio). We need a package manager and task orchestrator that give strict dependency isolation, fast cached builds, and good monorepo ergonomics. (`pnpm 11.13.0` is 🟢 available in the environment; nothing is scaffolded yet.)

## Decision
Use **pnpm workspaces** as the package manager and **Turborepo** for task orchestration/caching.

## Decision drivers
- Strict, content-addressed node_modules (prevents phantom deps that would defeat the import-boundary rules in [`../03-architecture.md`](../03-architecture.md)).
- Fast incremental builds via Turbo cache across many packages.
- Simple config vs heavier alternatives.

## Alternatives considered
- **Nx** — more powerful, but heavier and more opinionated than needed at this stage.
- **npm/yarn workspaces without Turbo** — weaker isolation (npm) or slower/no task graph.
- **Bun workspaces** — promising but less proven for this publishing/RSC toolchain.

## Consequences
### Positive
- Strict isolation supports the forbidden-import firewall.
- Cached builds keep CI fast as package count grows.
### Negative
- Turbo cache config is another moving part.
- pnpm's strictness occasionally requires explicit peer declarations.

## Risks and mitigations
- Misconfigured workspace could leak deps → enforce boundaries in ESLint + CI ([`../24-claude-code-workflow.md`](../24-claude-code-workflow.md)).

## Validation
**Done — spike passed 2026-07-14.** `pnpm install` + `turbo run build` builds all three packages (`3 successful, 3 total`); `turbo run typecheck` passes (`5 successful`). Turbo task graph (`dependsOn: ["^build"]`) correctly builds `@scope/tokens` before its dependents. Residual: wire the ESLint import-boundary CI check (Phase 1). One environment note: pnpm 11's `verify-deps-before-run` pre-check can fail app scripts when a native dep (e.g. `sharp`) has an un-built script — set `verify-deps-before-run=false` or decide the build via `onlyBuiltDependencies`/`ignoredBuiltDependencies`.

## Revisit conditions
- Build times or DX degrade at scale.
- A materially better tool proves out.

## Sources
- pnpm/Turborepo official docs (general, not version-pinned here). Version facts for deps: [`../05-dependency-decisions.md`](../05-dependency-decisions.md#sources).
