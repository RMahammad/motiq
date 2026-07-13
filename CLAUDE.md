# CLAUDE.md

Premium, production-ready **animated React & Next.js component library**, sold commercially. Coherence and production-readiness beat component count.

> **Repo phase:** 🟡 Phase 1. A working pnpm+Turborepo skeleton exists — `@scope/{tokens,motion,react}` (spike scaffolds with the `Reveal` primitive) + `apps/playground-{next,vite}`. The spike proved `"use client"` survives the tsdown build in Next 16 App Router + Vite ([ADR-0006](docs/adrs/0006-library-bundler.md)). MVP components/tests/Storybook/packaging are still **Planned**. Full context: [`docs/README.md`](docs/README.md).

## Permanent architectural invariants

- Core UI uses **Motion for React + CSS + WAAPI**. Remotion is **video-only and isolated**.
- **Core React packages must not import Remotion, Node built-ins, or `next/*`.** ([`docs/03-architecture.md`](docs/03-architecture.md#forbidden-import-matrix))
- Public packages are **ESM-only** with preserved `"use client"` in client entry points. ([ADR-0007](docs/adrs/0007-package-format.md), [ADR-0006](docs/adrs/0006-library-bundler.md))
- **Accessibility (WCAG 2.2 AA) and reduced motion are release requirements.** ([`docs/12`](docs/12-accessibility-standard.md))
- **Semantic tokens** over one-off values. ([`docs/10`](docs/10-design-tokens.md))
- **No runtime license checks; no secrets in client code.** Gate at install/purchase. ([`docs/16`](docs/16-commercial-packaging.md))
- Documentation is part of the product; one **canonical owner** per topic.

## Required reading

- Index: [`docs/README.md`](docs/README.md)
- Architecture: [`docs/03-architecture.md`](docs/03-architecture.md) · Package map: [`docs/04-package-map.md`](docs/04-package-map.md)
- Animation engine: [`docs/06-animation-engine-decision.md`](docs/06-animation-engine-decision.md)
- Component API: [`docs/09-component-api-standard.md`](docs/09-component-api-standard.md) · Tokens: [`docs/10-design-tokens.md`](docs/10-design-tokens.md) · Tailwind: [`docs/11-tailwind-strategy.md`](docs/11-tailwind-strategy.md)
- Accessibility: [`docs/12-accessibility-standard.md`](docs/12-accessibility-standard.md) · Performance: [`docs/13-performance-standard.md`](docs/13-performance-standard.md) · Testing: [`docs/14-testing-strategy.md`](docs/14-testing-strategy.md)
- Definition of done: [`docs/25-definition-of-done.md`](docs/25-definition-of-done.md) · ADR index: [`docs/adrs/README.md`](docs/adrs/README.md)
- How this Claude system works: [`docs/24-claude-code-workflow.md`](docs/24-claude-code-workflow.md)

## Skill routing

Invoke [`repository-orientation`](.claude/skills/repository-orientation/SKILL.md) first for any cross-cutting or first-in-session work. Then:

| Task | Skill |
| --- | --- |
| First work in repository | `repository-orientation` |
| Documentation change | `documentation-maintenance` |
| Visual or token change | `design-system-consistency` |
| New component | `component-authoring` |
| New motion primitive | `motion-primitive-authoring` |
| New marketing section | `animated-section-authoring` |
| Public API review | `api-consistency-review` |
| Accessibility check | `accessibility-review` |
| Performance-sensitive change | `performance-review` |
| Testing completeness | `testing-review` |
| New dependency | `dependency-review` |
| Remotion template | `remotion-composition-authoring` |
| Release | `release-readiness` |
| Breaking change | `migration-authoring` |

## Documentation synchronization rule

When code changes, update the **canonical owner**, then only refresh summaries/links (via `documentation-maintenance`):

- Package structure → [`docs/04`](docs/04-package-map.md) + [`docs/03`](docs/03-architecture.md)
- Public API → [`docs/09`](docs/09-component-api-standard.md) or the component doc page
- Tokens → [`docs/10`](docs/10-design-tokens.md) + theme examples
- Animation behavior → [`docs/06`](docs/06-animation-engine-decision.md)
- Dependency → [`docs/05`](docs/05-dependency-decisions.md)
- Durable architectural choice → an ADR in [`docs/adrs/`](docs/adrs/)
- Accessibility → [`docs/12`](docs/12-accessibility-standard.md)
- Performance budget → [`docs/13`](docs/13-performance-standard.md)
- Release policy → [`docs/18`](docs/18-release-process.md)

## Commands

- 🟢 `pnpm install` · `pnpm build` (packages, turbo → tsdown) · `pnpm build:all` · `pnpm typecheck` · `pnpm test` (vitest) · `pnpm lint` (import-boundary firewall) · `pnpm docs:check`
- 🟢 Doc validation: `node docs/tooling/check-links.mjs` · `check-adr-index.mjs` · `check-duplicate-titles.mjs` · `check-stale-dates.mjs` · `check-inventory.mjs`
- 🟢 Fixture builds: from `apps/playground-next` / `apps/playground-vite`, run `./node_modules/.bin/next build` / `./node_modules/.bin/vite build` (also wired in CI's `fixtures` job).
- 🟡 `pnpm changeset` — configured (`.changeset/`), but `changeset status`/`version` need the repo under git with a `main` branch.
- 🔵 Planned: `pnpm dev` · `pnpm test:a11y` · `pnpm size` · `pnpm storybook`.

> ⚠️ Env note: pnpm 11's `verify-deps-before-run` pre-check (which Turbo also triggers via `pnpm run`) can fail when a native dep (e.g. `sharp`) has an un-built script. Reliable fix used in CI: set env `npm_config_verify_deps_before_run=false`. Native builds are allow-listed in `pnpm-workspace.yaml` (`onlyBuiltDependencies: [esbuild, sharp]`). If a filtered app build still trips it, invoke the app's local bin directly.

## Prohibited shortcuts

- No component without reduced-motion behavior, tests, stories, and documentation.
- No unreviewed runtime dependency (`dependency-review`).
- No arbitrary visual values when tokens exist.
- No duplicated canonical documentation.
- No hidden browser/server boundary violations (no Remotion/Node/`next` in core packages).
- No claim that planned functionality is implemented.
