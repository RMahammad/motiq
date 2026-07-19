# AGENTS.md

A commercially-sold **animated component library for React and Next.js** — accessible, reduced-motion-safe, RSC-safe, sold as editable source through a shadcn-compatible registry. The moat is production-readiness and a coherent catalog, not component count.

> **Phase:** 🟡 Phase 2 (MVP). 60 catalog items across `@scope/{tokens,motion,react,sections}` + registry + docs site + Storybook + CI.
> **Component inventory is FROZEN** (2026-07-16 cleanup): no new components, blocks, packs, themes, or features. Work is cleanup, consistency, and reliability only. Cleanup tracker: [`docs/57-library-production-cleanup.md`](docs/57-library-production-cleanup.md).

## Source of truth

Canonical docs (start here). Detailed/record docs are linked from these.

| Topic | Canonical doc |
| --- | --- |
| Index | [`docs/README.md`](docs/README.md) |
| Architecture & boundaries | [`docs/architecture.md`](docs/architecture.md) |
| Component authoring | [`docs/component-authoring.md`](docs/component-authoring.md) |
| Registry authoring | [`docs/registry-authoring.md`](docs/registry-authoring.md) |
| Preview authoring | [`docs/preview-authoring.md`](docs/preview-authoring.md) |
| Accessibility | [`docs/accessibility-standard.md`](docs/accessibility-standard.md) |
| Motion | [`docs/motion-standard.md`](docs/motion-standard.md) |
| Responsive | [`docs/responsive-standard.md`](docs/responsive-standard.md) |
| Code quality | [`docs/code-quality-standard.md`](docs/code-quality-standard.md) |
| Release | [`docs/release-checklist.md`](docs/release-checklist.md) |
| Commercial delivery | [`docs/commercial-delivery.md`](docs/commercial-delivery.md) |
| Security | [`docs/security-model.md`](docs/security-model.md) |
| ADRs (durable decisions) | [`docs/adrs/`](docs/adrs/) |

## Precedence (when guidance conflicts)

1. Accepted ADRs & architectural boundaries.
2. Accessibility & performance standards.
3. Component API & design-token standards.
4. Project skills ([`.Codex/skills/`](.Codex/skills/)).
5. Taste skills (`design-taste-frontend`, `redesign-existing-projects` — third-party, visual guidance only; **do not modify** them). Project rules take precedence.
6. Task-specific instructions.

## Permanent invariants

- **Boundaries:** core React packages must not import Remotion, Node built-ins, or `next/*`. Remotion is video-only and isolated. Enforced by `pnpm lint`.
- **Packages** are ESM-only with `"use client"` preserved in client entry points ([ADR-0006](docs/adrs/0006-library-bundler.md), [ADR-0007](docs/adrs/0007-package-format.md)).
- **Accessibility (WCAG 2.2 AA) and reduced motion are release-blocking.**
- **Semantic tokens** over one-off values; never hardcode the brand or a placeholder `@scope/*` in visitor-facing output — brand comes from [`product.config.json`](product.config.json).
- **Motion for React** is the default engine; CSS for simple effects; heavy engines stay component-local and lazy. Motion is not in every component.
- **Registry source is customer-editable:** exact files/deps, no docs/preview/test/internal imports, no secrets. See [`docs/registry-authoring.md`](docs/registry-authoring.md).
- **Free source is public; Pro source is protected** and must never appear in public build output ([`docs/security-model.md`](docs/security-model.md)). No runtime license checks; no secrets in client code.
- **Clean-room only:** no competitor source, names, effects, or APIs copied. Renaming is not remediation.
- Documentation has one canonical owner per topic.

## Code quality (summary — full: [`docs/code-quality-standard.md`](docs/code-quality-standard.md))

- No `any`, no unsafe non-null assertions, no swallowed errors, no unhandled promises.
- Clean up every listener/timer/observer/animation loop. Pause continuous animation offscreen. No browser globals during render.
- Controlled/uncontrolled via shared `useControllableState`; stable `useId`s across SSR/CSR.
- Comments explain **why**, not what. One or two direct sentences. No marketing words, no commented-out code, no vague TODOs.
- Prefer readable local code over a generic helper used once.

## Operating model — two tracks

- **Default track:** [`registry-release`](.Codex/skills/registry-release/SKILL.md) — one-page brief → build → wire registry/preview/docs → lightweight release gate → mark Released/Experimental in [`docs/39-catalog-production-board.md`](docs/39-catalog-production-board.md). Status set: `Idea · Building · Preview-ready · Registry-ready · Released · Experimental · Deprecated`. No subjective scores.
- **Signature track:** heavier review is reserved for homepage centerpieces and complex Pro creative effects only ([`docs/36-premium-creative-component-strategy.md`](docs/36-premium-creative-component-strategy.md)). It is not the default.
- One component's polish does not block unrelated work. Free and Pro share the same accessibility/usability baseline.

### Shared-file editing rule (parallel work)

Parallel workers create only their own isolated files (component source, its test, its brief, its preview module). **Only the orchestrating context edits shared indexes:** `packages/registry/registry.json`, `apps/docs/lib/catalog.ts`, `apps/docs/lib/docs-content.ts`, `apps/docs/app/_previews/index.tsx`, homepage/nav arrays, the two tsconfig `paths` maps, and pack/block definitions. After parallel work: reconcile duplicates, integrate shared indexes once, then run catalog + registry + exposure validation.

## Skill routing

Invoke [`repository-orientation`](.Codex/skills/repository-orientation/SKILL.md) for first-in-session or cross-cutting work. Then:

| Task | Skill |
| --- | --- |
| Author/change a component, primitive, or section | [`component-authoring`](.Codex/skills/component-authoring/SKILL.md) |
| Review a component before release | [`component-review`](.Codex/skills/component-review/SKILL.md) |
| Accessibility review | [`accessibility-review`](.Codex/skills/accessibility-review/SKILL.md) |
| Responsive / rendered visual review | [`responsive-review`](.Codex/skills/responsive-review/SKILL.md) |
| Build or iterate a live preview | [`preview-authoring`](.Codex/skills/preview-authoring/SKILL.md) |
| Wire registry, run release gate, publish, migrations | [`registry-release`](.Codex/skills/registry-release/SKILL.md) |
| Integrate a component into the catalog | [`catalog-integration`](.Codex/skills/catalog-integration/SKILL.md) |
| Pro-source exposure & clean-room audit | [`protected-source-audit`](.Codex/skills/protected-source-audit/SKILL.md) |
| Fix a bug | [`bug-fix-workflow`](.Codex/skills/bug-fix-workflow/SKILL.md) |
| Sync docs/ADRs after a change | [`documentation-maintenance`](.Codex/skills/documentation-maintenance/SKILL.md) |
| Author a Remotion (video-only) composition | [`remotion-composition-authoring`](.Codex/skills/remotion-composition-authoring/SKILL.md) |

## Documentation sync

When code changes, update the canonical owner, then refresh links/summaries via [`documentation-maintenance`](.Codex/skills/documentation-maintenance/SKILL.md). Owners: architecture/boundaries → [`docs/architecture.md`](docs/architecture.md); public API → [`docs/09-component-api-standard.md`](docs/09-component-api-standard.md) or the component doc page; tokens → [`docs/10-design-tokens.md`](docs/10-design-tokens.md); dependencies → [`docs/05-dependency-decisions.md`](docs/05-dependency-decisions.md); durable choices → an ADR; commercial → [`docs/commercial-delivery.md`](docs/commercial-delivery.md); security → [`docs/security-model.md`](docs/security-model.md).

## Commands

```
pnpm install · pnpm build · pnpm typecheck · pnpm test · pnpm lint · pnpm docs:check
node packages/registry/scripts/build-registry.mjs   # registry generation
node scripts/check-catalog-quality.mjs               # catalog validation
pnpm check:exposure                                  # Pro-source exposure audit
pnpm check:launch                                    # launch-mode gates (fails closed by design)
```

> Env note: set `npm_config_verify_deps_before_run=false` if pnpm 11's dep pre-check trips on a native dep.

## Prohibited

- New components/blocks/packs/themes/features while the inventory is frozen.
- Any component without reduced-motion behavior, targeted tests, a preview, and docs.
- Arbitrary visual values when a token exists; hardcoded brand in visitor output.
- Remotion/Node/`next` imports in core packages; `@scope/*`/docs/preview imports in registry source.
- Exposing Pro source; weakening auth, rate limiting, token handling, or the exposure audits.
- Claiming planned functionality is implemented, or a bug fixed without reproducing it.
