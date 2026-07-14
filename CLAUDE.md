# CLAUDE.md

Premium, commercially-sold **semantic motion & choreography system for React and Next.js** (not "another animated component kit"). Coherence, production‑readiness, and a real product moat beat component count. Product moat: [`docs/27-product-differentiation.md`](docs/27-product-differentiation.md).

> **Repo phase:** 🟡 Phase 2 (MVP). **v0.1.0** ships 21 accessible, reduced‑motion‑safe, RSC‑safe, tested components across `@scope/{tokens,motion,react,sections}` + a building docs site & Storybook + full CI. Redesign in progress toward the motion‑system product experience. Full context: [`docs/README.md`](docs/README.md); launch runbook: [`docs/29-go-live-checklist.md`](docs/29-go-live-checklist.md).

## Precedence order (when guidance conflicts)

1. **Accepted ADRs & architectural boundaries** ([`docs/adrs/`](docs/adrs/), [`docs/03`](docs/03-architecture.md)).
2. **Accessibility & performance standards** ([`docs/12`](docs/12-accessibility-standard.md), [`docs/13`](docs/13-performance-standard.md)).
3. **Component API & design‑token standards** ([`docs/09`](docs/09-component-api-standard.md), [`docs/10`](docs/10-design-tokens.md)).
4. **Project‑specific Claude skills** ([`.claude/skills/`](.claude/skills/)).
5. **Taste Skill** (visual guidance only — see below).
6. **Task‑specific instructions.**

> **Taste Skill** (`design-taste-frontend`, `redesign-existing-projects` — invoke via the Skill tool) provides **general visual/redesign guidance**. Project‑specific product, architecture, token, accessibility, API, testing, and performance rules **take precedence**. Installed 2026-07-14 from `https://github.com/Leonxlnx/taste-skill` (HEAD `b17742737e79`) into `.agents/skills/*` (git‑ignored, not vendored), symlinked into `.claude/skills/*`. Do not modify the third‑party skill files.

## Permanent product rules

- We do **not** compete on component count; we do **not** add components just because competitors have them.
- Prioritize **semantic motion, choreography, workflow recipes, and production tooling** over isolated effects.
- Every **premium** component/feature must have a clear paid‑value explanation ([`27`](docs/27-product-differentiation.md)).
- Every animation has a **reduced‑motion** behavior; every visual change uses **semantic tokens**; every live demo uses **real controls + real components** (no fake controls/metrics).
- The **homepage must demonstrate the product above the fold.** Generic equal‑card grids are **not** the default composition. Claims must be backed by visible proof.
- **The core UI library must not import Remotion.**

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
- **Product & redesign:** UI audit [`docs/26-current-ui-audit.md`](docs/26-current-ui-audit.md) · Differentiation/moat [`docs/27-product-differentiation.md`](docs/27-product-differentiation.md) · Visual direction [`docs/28-visual-direction.md`](docs/28-visual-direction.md)

## Skill routing

Invoke [`repository-orientation`](.claude/skills/repository-orientation/SKILL.md) first for any cross-cutting or first-in-session work. Then:

| Task | Required skills |
| --- | --- |
| First work in repository | `repository-orientation` |
| Existing UI redesign | `redesign-existing-projects`, `visual-direction`, `design-system-consistency` |
| New marketing page | `design-taste-frontend`, `visual-direction`, `homepage-conversion-review` |
| Documentation change | `documentation-maintenance` |
| Visual or token change | `design-system-consistency` |
| New component | `product-differentiation-review`, `component-authoring`, `design-system-consistency` |
| New motion primitive | `product-differentiation-review`, `motion-primitive-authoring` |
| New marketing section | `product-differentiation-review`, `animated-section-authoring`, `design-system-consistency` |
| New interactive demo | `interactive-demo-authoring`, `accessibility-review`, `performance-review` |
| Public API review | `api-consistency-review` |
| Accessibility review | `accessibility-review` |
| Performance-sensitive change | `performance-review` |
| Test completeness | `testing-review` |
| New dependency | `dependency-review` |
| Remotion composition | `remotion-composition-authoring` |
| Visual completion review | `visual-quality-gate` |
| Homepage completion review | `homepage-conversion-review` |
| Release catalog planning | `component-portfolio-review` |
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
- 🟢 `pnpm changeset` / `changeset status` — configured (`.changeset/`), git initialized on `main`; reports the pending `@scope/*` minor bump.
- 🟢 Packed-artifact check: `bash fixtures/tarball-consumer/verify.sh` (installs tarballs, checks resolution + `"use client"` + SSR).
- 🟢 Storybook (static): from `apps/storybook`, `./node_modules/.bin/storybook build` (CI runs `pnpm --filter storybook-app build-storybook`); `storybook dev -p 6006` for local.
- 🔵 Planned: `pnpm dev` (`test:a11y` now runs inside `pnpm test` via axe; `pnpm size` = `size-limit`).

> ⚠️ Env note: pnpm 11's `verify-deps-before-run` pre-check (which Turbo also triggers via `pnpm run`) can fail when a native dep (e.g. `sharp`) has an un-built script. Reliable fix used in CI: set env `npm_config_verify_deps_before_run=false`. Native builds are allow-listed in `pnpm-workspace.yaml` (`onlyBuiltDependencies: [esbuild, sharp]`). If a filtered app build still trips it, invoke the app's local bin directly.

## Prohibited shortcuts

- No component without reduced-motion behavior, tests, stories, and documentation.
- No unreviewed runtime dependency (`dependency-review`).
- No arbitrary visual values when tokens exist.
- No duplicated canonical documentation.
- No hidden browser/server boundary violations (no Remotion/Node/`next` in core packages).
- No claim that planned functionality is implemented.
