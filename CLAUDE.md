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

- We do **not** add components just because competitors have them — but **breadth across underrepresented product-workflow niches (AI, developer tools, collaboration, data, commerce, file/media, security, productivity, communication, spatial, mobile, onboarding, marketing) is now an explicit product goal** ([`docs/38`](docs/38-component-expansion-plan.md)). Grow a large, diverse, original catalog on a **lightweight** production baseline; do not pad the catalog with commodity effects.
- **The primary product is animated components** ([2026-07-14 pivot](docs/27-product-differentiation.md), [`31`](docs/31-competitive-product-review.md)). Standard UI behavior uses **shadcn + accessible primitives (Radix, [ADR-0017](docs/adrs/0017-shadcn-primitive-foundation.md))** — animate components instead of rebuilding accessible foundations. Semantic choreography is a **future/supporting** layer, not the first release or the homepage message.
- Every **premium** component/feature must have a clear paid‑value explanation ([`27`](docs/27-product-differentiation.md)).
- Every animation has a **reduced‑motion** behavior; every visual change uses **semantic tokens**; every live demo uses **real controls + real components** (no fake controls/metrics).
- Every catalog item has a **real live preview**; every preview control **works**; the **component dominates its showcase card** (tiny static catalog cards are prohibited).
- Source is distributed through a **shadcn‑compatible registry** ([`packages/registry`](packages/registry/)) as editable source; brand/namespace come from [`product.config.json`](product.config.json) — never hardcode the brand, and never show placeholder `@scope/*` to visitors.
- **Motion for React is the default browser engine**; CSS for simple effects; Motion is **not** in every item; heavy creative deps stay **component‑local**. **Remotion is not used in browser UI packages.**
- The **homepage must demonstrate the product above the fold.** Generic equal‑card grids are **not** the default composition. Claims must be backed by visible proof.
- The **warm ivory/olive‑green "Motion Laboratory" theme is not the default showcase identity** — the showcase uses Direction A "Violet studio" ([`30`](docs/30-showcase-visual-system.md)).
- **Competitor code cannot be copied** into a commercial product without license review ([`31`](docs/31-competitive-product-review.md)); all components are clean‑room. Do not claim accessibility, bundle size, or production readiness without evidence.
- **The core UI library must not import Remotion.**

## Operating model — two tracks (2026-07-14 breadth-first)

The catalog now runs on **two tracks**. Choose by what the component is, not by habit.

- **Default track — [`rapid-component-release`](.claude/skills/rapid-component-release/SKILL.md)** for ordinary catalog + workflow components. One ≤1-page brief → build → wire registry/preview/concise docs → the **12-point lightweight gate** → mark **Released** or **Experimental** in [`docs/39`](docs/39-catalog-production-board.md). Statuses are `Idea · Building · Preview-ready · Registry-ready · Released · Experimental · Deprecated` — **no** subjective Category-leading / Strongly-Sellable / 9-of-10 labels, **no** three concepts, **no** mandatory independent reviewer, **no** exhaustive tests or dozens of screenshots for visual-only items.
- **Signature track — the heavy gates below + [`docs/36`](docs/36-premium-creative-component-strategy.md)** are **reserved for homepage centerpieces and complex Pro creative visual effects only** (three concepts, independent `originality-review` + `premium-visual-review`, full evidence set).

Deblocking rules (supersede the old global gate):
- **One component's lack of originality or polish does not block unrelated catalog development.** No global "≥3 Strongly-Sellable unlock" gate.
- Ordinary supporting components may ship when useful and polished; workflow differentiation is preferred over cosmetic novelty.
- Free and Pro share the same **usability and accessibility baseline** (not the same review depth).
- **No exhaustive test requirement for visual-only components**; complex/stateful/focus/async/drag/financial/destructive/shared-primitive components get **targeted logic tests** only.
- **Clean-fixture installation remains mandatory** for every released component (no `next/*`, Node built-ins, or `remotion`).
- New component development may proceed **in parallel across unrelated categories** when package boundaries stay safe (no shared primitive / registry entry / unfinished shared API edited by two agents at once); run [`catalog-consistency-review`](.claude/skills/catalog-consistency-review/SKILL.md) after each batch.
- **Parallel-development integration rule (mandatory).** Parallel workers create **only their own isolated files** — component source, its targeted test, a one-page brief, its preview module, and any component-specific styles/utilities. They must **not** edit shared index files. **Only the orchestrating agent integrates shared files:** `packages/registry/registry.json`, `apps/docs/lib/catalog.ts`, `apps/docs/lib/docs-content.ts`, `apps/docs/app/_previews/index.tsx`, homepage arrays, nav definitions, the generated registry index, the [`docs/38`](docs/38-component-expansion-plan.md)/[`docs/39`](docs/39-catalog-production-board.md) boards, **the two tsconfig `paths` maps (`apps/docs/tsconfig.json` + `packages/registry/tsconfig.json`) that alias `@/components/motionstack/*` → registry sources, and pack/block definitions.** After parallel work: inspect each contribution → resolve duplicate utilities → normalize APIs/status/event names → integrate the shared indexes once → catalog consistency → registry generation → lightweight release gate. (A racing edit to a shared index silently dropped a preview entry in batch 1 — this rule prevents recurrence.)
- **Blocks (`registry:block`) compose released components.** A block's registry **source** imports its components via the consumer convention `@/components/motionstack/<name>` (so it installs correctly and stays editable); those specifiers are aliased to the registry sources in both tsconfig `paths` maps so the **same** block source renders in the docs app and typechecks — no double-authoring. Regenerate those aliases whenever components are added (orchestrator-only). Blocks list every composed component + `@motionstack/utils` + `@motionstack/primitives` as `registryDependencies`; validate dependency resolution and clean-fixture install. Pack registry items (`@motionstack/<pack>-pack`) install the block (which pulls its components) — do not duplicate shared utility files.

## Signature completion rules (centerpieces & complex Pro creative only)

- **No signature component is complete until visually reviewed in the rendered application** — not from source, not because tests pass, not because it uses Motion.
- It must go through [`rendered-preview-iteration`](.claude/skills/rendered-preview-iteration/SKILL.md) and an independent [`premium-visual-review`](.claude/skills/premium-visual-review/SKILL.md); status is tracked in [`docs/32-component-quality-tracker.md`](docs/32-component-quality-tracker.md) with **persisted review screenshots** (`artifacts/signature-components/<slug>/`).
- **Homepage hero/centerpiece slots** require independent Strongly-Sellable/Category-leading status; ordinary Released workflow components populate the category sections and "Recently added" freely.
- Signature motion must be meaningful, not decorative; every component (both tracks) works in **light, dark, mobile, keyboard, touch, and reduced-motion** contexts.

## Signature component rules (2026-07-14 creative pivot)

The product leads with **signature creative components** (text effects, interactive surfaces, galleries, backgrounds, navigation, product/SaaS motion). Strategy: [`docs/36`](docs/36-premium-creative-component-strategy.md) · quality study: [`docs/35`](docs/35-react-bits-quality-study.md) · roadmap: [`docs/37`](docs/37-signature-component-roadmap.md).

- **Ordinary animated shadcn components are supporting products, not the primary differentiator.** They stay accessible, refined, and documented — but they do not define the homepage or the catalog identity, and no further phase is spent making a standard primitive "category-leading".
- Every signature component requires **three meaningfully different rendered visual concepts** (composition, motion, interaction, surface, hierarchy — not three colorways) before implementation; the selection rationale is persisted (`selected-concept.md`).
- Every signature component passes [`signature-component-conception`](.claude/skills/signature-component-conception/SKILL.md) **before code**, and [`originality-review`](.claude/skills/originality-review/SKILL.md) at concept **and** implementation stage.
- **Similarity risk High or Unacceptable blocks release.** Renaming/restyling is never a remediation ([`originality-review`](.claude/skills/originality-review/SKILL.md)).
- Signature approval comes only from a rendered, independent [`premium-visual-review`](.claude/skills/premium-visual-review/SKILL.md) with the full evidence set in `artifacts/signature-components/<slug>/`. **No signature component is approved from source inspection.**
- **Competitor implementations may not be copied** — no source, names, exact effects, sequences, shaders, layouts, APIs, docs text, or preview compositions from React Bits (free or Pro), Aceternity, Animate UI, Magic UI, or any other library without license review.
- Creative effects must have **accessible and reduced-motion fallbacks**; heavy engines pass [`creative-performance-review`](.claude/skills/creative-performance-review/SKILL.md) and their dependencies stay **component-local and lazy-loaded**.
- **Homepage hero components must be independently Strongly Sellable or Category-leading.**
- **Do not increase component count while signature quality is below threshold** — one signature component at a time, each finished through independent review before the next begins.
- Motion uses the four documented personalities — **Precise · Fluid · Expressive · Ambient** ([`docs/36 §Motion personalities`](docs/36-premium-creative-component-strategy.md#motion-personalities)) — not per-component invented easing.

## No-self-approval rule (independent review)

- **The agent that implements a component may not be the only agent that approves it.** Sellability requires a **separate review pass** (a reviewer context/subagent that did not implement it — see [`docs/33-independent-component-audit.md`](docs/33-independent-component-audit.md)).
- The independent reviewer begins **read-only**: inspect rendered output + evidence and produce findings **before** any fix.
- **Static screenshots alone are insufficient for motion approval.** Animation recordings, frame sequences, or Playwright traces are required (`artifacts/component-reviews/<slug>/audit/`).
- **Clean-fixture installation must be rerun after meaningful source changes** — not reused from an earlier phase.
- **"Production-ready but ordinary" must not be relabeled as Sellable.** Use the strict status set (Category-leading · Sellable · Production-ready but ordinary · Needs polish · Needs redesign · Reject · Experimental).
- **No new component work begins while current featured components have unresolved major findings.**
- Independent scores and the prior self-scores are **both** kept in [`docs/32`](docs/32-component-quality-tracker.md) so optimism bias stays visible.

### Review-process routing

| Task | Required process |
| --- | --- |
| Signature component proposal | `signature-component-conception` |
| Competitor similarity review | `originality-review` |
| Signature visual approval | independent `premium-visual-review` |
| Heavy creative effect | `creative-performance-review` |
| Signature implementation | conception → originality → implementation → rendered iteration → accessibility → performance → independent premium review |
| Component implementation | authoring skill → `rendered-preview-iteration` |
| Component approval | independent `component-sellability-review` (separate reviewer) |
| Motion approval | animation recording/trace + `animation-quality-review` |
| Featured homepage selection | independent Sellable status required |
| Release approval | separate release reviewer (`release-readiness`) |

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
| **New workflow/catalog component (default track)** | **`rapid-component-release`** |
| New signature centerpiece / complex Pro creative effect | `signature-component-conception` → `originality-review` → authoring → `rendered-preview-iteration` → `premium-visual-review` |
| Existing website redesign | `redesign-existing-projects`, `visual-quality-gate` |
| Competitor / reference research | `competitive-library-review` |
| New animated shadcn component | `animated-shadcn-authoring`, `rendered-preview-iteration`, `animation-quality-review`, `component-sellability-review` |
| Creative component | `creative-component-authoring`, `rendered-preview-iteration`, `performance-review`, `component-sellability-review` |
| Existing component redesign | `design-system-consistency`, `rendered-preview-iteration`, `visual-quality-gate`, `component-sellability-review` |
| Component completion | `accessibility-review`, `performance-review`, `component-sellability-review` |
| Homepage feature selection | `catalog-consistency-review`, `component-sellability-review` |
| Component documentation/preview page | `component-showcase-authoring` |
| Catalog consistency review | `catalog-consistency-review` |
| Animation quality review | `animation-quality-review` |
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
