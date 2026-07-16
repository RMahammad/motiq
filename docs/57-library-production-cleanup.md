# Library production-readiness cleanup (tracker)

Canonical tracker for the 2026-07-16 production-readiness and maintainability cleanup. Component inventory is **frozen** — no new components, blocks, packs, themes, or features. Scope: make the existing codebase clean, consistent, customer-editable, and reliable across registry / docs site / clean projects.

## Baseline (recorded 2026-07-16, before edits)

| Check | Command | Result |
| --- | --- | --- |
| Lint | `pnpm lint` | ✅ clean |
| Typecheck | `pnpm typecheck` | ✅ clean (FULL TURBO) |
| Tests | `pnpm test` | ✅ 41 files, 240 tests pass |
| Docs checks | `pnpm docs:check` | ✅ links/adr/titles/dates/inventory clean |
| Pro-exposure audit | `pnpm check:exposure` | ✅ 0 protected items exposed (23 checked) |
| Registry generation | `node packages/registry/scripts/build-registry.mjs` | ✅ 37 free + 23 protected, source-protection OK |
| Catalog quality | `node scripts/check-catalog-quality.mjs` | ✅ 60 items, all metadata present |
| Launch config | `pnpm check:launch` | (to record) |

**No pre-existing failures.** The repository was already in strong health; the cleanup is maintainability/consolidation-focused, not bug-firefighting.

## Severities

Critical · Major · Moderate · Minor

## Findings & actions

| Area | File / package | Problem | Severity | Required change | Status | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| Build config | `app/` (repo root) | Stray empty, untracked `app/_previews/catalog` dir left by a screenshot script | Minor | Delete | ✅ Done | `git status` clean; not tracked |
| Documentation | `docs/` | No small canonical set; numbered docs used as active instructions | Major | Created 11 canonical named docs + concise README index; numbered docs subordinated to them as reference/record detail | ✅ Done | `docs:check` 0 broken links, 0 dup titles |
| Skills | `.claude/skills/*` (34) | Large overlapping set; several tied to the superseded scorecard/unlock operating model | Major | Consolidated to 10 canonical + 2 auxiliary + 2 third-party; deleted 28 merged/obsolete; repointed 83 inbound links | ✅ Done | `docs:check` green; 14 skills, all valid frontmatter |
| Documentation | `CLAUDE.md` (22 KB) | Long; duplicated rules; referenced deleted skills & retired score model | Major | Rewrote concise (~130 lines); routes only to the 12 live skills; links to canonical docs | ✅ Done | links resolve |
| Components | `packages/registry/registry/**` | Checked for AI-prose, `console.*`, `any`, dead code, forbidden imports, util duplication | Moderate | No changes needed — source already clean; `kinetic-emphasis` local reduced-motion hook confirmed **intentional** registry self-containment (avoids pulling the full motion bundle as a dep) | ✅ Verified clean | lint/typecheck/tests green |
| Commercial infra | `artifacts/**` (806 tracked files, ~620 MB) | Historical visual evidence + required review evidence intermixed | Moderate | Archive completed-sprint evidence; keep review-process evidence | ⏸ Deferred (user call — recently committed) | recommendation only |
| Scripts | `scripts/shoot-*.mjs` (one-off harnesses) | One-off screenshot harnesses, several recently committed | Minor | Keep — recently active; recommend future `scripts/evidence/` grouping | ⏸ Deferred | recommendation only |

## Confirmed clean (no action needed)

- **Source comments**: no AI-slop prose in component/hook/util source. The few phrase hits are accurate technical terms ("seamless marquee") or demo copy in tests.
- **console.\***: all remaining are intentional dev-adapter logging (`analytics`, `feedback`, `email`, `monitoring` — documented fail-safe adapters), server API dev logs, or a well-commented misuse guard in `kinetic-emphasis.tsx`. None are debug leftovers in shipped component source.
- **`any` / non-null**: the 3 hits are a legit CSS-variable cast in a story and prose in a comment. No unsafe assertions in component source.
- **TODO/FIXME/HACK**: none in maintained source.

## Deferred / recommendations (user's call)

1. **`artifacts/` archival** — ~620 MB of tracked evidence. `signature-components/` and `component-reviews/` are required by the review process and must stay; `homepage-redesign/`, `product-ui-stabilization/`, `catalog-rehabilitation/`, `hero-rebuild/`, `packs-rebuild/`, `ui-production/` are completed-sprint visual evidence that could move to `artifacts/archive/`. Not done unilaterally — deleting tracked history is destructive and several were recently committed.
2. **9-breakpoint browser responsive smoke across all 60 items** and **per-item clean-fixture browser install** — enormous; the responsive/clean-fixture *rules* are now codified in [`responsive-standard.md`](responsive-standard.md) and [`registry-authoring.md`](registry-authoring.md), and the automated exposure/catalog/registry checks pass. A full rendered 9×60 sweep is a separate QA pass.
3. **Physical archival of historical sprint reports** (`20, 26, 28, 33, 34, 37, 55, 56, 58, 59`) — classified for `docs/archive/` by survey, but each has 1–7 inbound links across the interlinked numbered-doc/ADR graph. Moving them requires link surgery that risks the now-green `docs:check` for low marginal value (the README already subordinates them to the canonical set). Deferred as a careful follow-up.

## Canonical documentation set (created)

`README.md` (rewritten index) · `architecture.md` · `component-authoring.md` · `registry-authoring.md` · `preview-authoring.md` · `accessibility-standard.md` · `motion-standard.md` · `responsive-standard.md` · `code-quality-standard.md` · `release-checklist.md` (H1 "Release gate") · `commercial-delivery.md` · `security-model.md`. Each is short, states its scope, and links to load-bearing detail/records rather than duplicating them.

## Canonical skill set (result — 14 total)

**10 canonical:** component-authoring · component-review · preview-authoring · registry-release · accessibility-review · responsive-review · documentation-maintenance · catalog-integration · protected-source-audit · bug-fix-workflow.
**2 auxiliary kept** (distinct, heavily referenced, no clean canonical home): repository-orientation · remotion-composition-authoring.
**2 third-party** (symlinked, not modified): design-taste-frontend · redesign-existing-projects.
**28 deleted** (merged into the canonical set or tied to the retired scorecard/unlock model).

## Final validation (2026-07-16, after cleanup)

| Check | Result |
| --- | --- |
| `pnpm lint` | ✅ clean |
| `pnpm typecheck` | ✅ clean (no source code changed) |
| `pnpm test` | ✅ 240 tests (no source code changed) |
| `pnpm docs:check` | ✅ 0 broken links (1459), 0 dup titles, ADR/dates/inventory clean |
| Registry generation | ✅ 60 items, source-protection assertion OK |
| Catalog quality | ✅ 60 items, metadata complete |
| Pro-exposure audit | ✅ 0 protected items exposed |

No new components were created; the component inventory remains frozen.
