# ADR-0007: Package format — ESM-only, subpath exports, preserved directives

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../03-architecture.md`](../03-architecture.md), [`../14-testing-strategy.md`](../14-testing-strategy.md), [ADR-0006](0006-library-bundler.md)
- Supersedes: —
- Superseded by: —

## Context
Consumers are React 19 / Next 16 / Vite — all ESM-native. We need clean subpath exports (`@scope/react/dialog`), correct `exports` conditions (browser/node, import, types), `sideEffects` for CSS, and preserved `"use client"`.

## Decision
Publish **ESM-only** packages with an explicit `exports` map: per-component subpaths, `types` first, `import` conditions, `node` condition for server-only subpaths (Remotion), `sideEffects: false` except CSS entries, source maps without secrets. React/react-dom/motion are peers with ranges. `"use client"` is preserved in client entry points.

## Decision drivers
- Tree-shaking and dedup; correct SSR/RSC behavior.
- Avoid dual-package hazards of shipping CJS+ESM.

## Alternatives considered
- **ESM + CJS dual** — dual-package hazard, larger surface; rejected (our targets are ESM-native).
- **Single entry (no subpaths)** — worse tree-shaking and lazy-loading.

## Consequences
### Positive
- Small consumer bundles; clean server/client separation; good types.
### Negative
- Consumers on legacy CJS-only setups are unsupported (acceptable for the target audience).

## Risks and mitigations
- Broken export map → `publint` + `@arethetypeswrong/cli` + fixture install ([`../14`](../14-testing-strategy.md)).
- Stripped directives → see [ADR-0006](0006-library-bundler.md).

## Validation
Move to **Accepted** once `publint`/`attw` are clean on a packed tarball and both fixtures import subpaths correctly.

## Revisit conditions
- A significant customer segment needs CJS.

## Sources
- React `use client` docs; Next.js directives docs (general). Bundler facts: [`../05`](../05-dependency-decisions.md#sources).
