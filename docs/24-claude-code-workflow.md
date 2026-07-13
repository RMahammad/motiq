# 24 — Claude Code workflow

> **Type:** 🟢 Canonical for the Claude Code consistency system · **Implementation status:** 🟡 In progress — skills + root/package `CLAUDE.md` 🟢; **import-boundary ESLint firewall 🟢** (`@scope/eslint-config`, `pnpm lint`); **CI gate 🟢** (`.github/workflows/ci.yml`); hooks + subagents still 🔵 Planned · **Last reviewed:** 2026-07-14
> **Owns:** how CLAUDE.md / skills / subagents / hooks / ESLint / TS / tests / CI divide responsibility, and how docs stay in sync.
> **Related:** [`/CLAUDE.md`](../CLAUDE.md) · [`.claude/skills/`](../.claude/skills/) · [`14-testing-strategy.md`](14-testing-strategy.md) · [`adrs/`](adrs/)

## The layering rule

> **Invariants → `CLAUDE.md`; procedures → skills; deterministic enforcement → hooks/ESLint/TS/CI; judgment → subagents; correctness → tests.**

| Requirement | Belongs in |
|---|---|
| "Never import Remotion into `@scope/react`" | ESLint boundary rule (🟢 `@scope/eslint-config/boundaries`, `pnpm lint`, in CI) + hook (🔵) — not prose |
| "Every component needs a story+test+changeset" | Hook (warn) + CI (block) + `component-authoring` skill |
| "Reduced motion is a release blocker" | Test + skill checklist + `CLAUDE.md` invariant |
| "Verify dep version/license before adding" | `dependency-review` skill (judgment) |
| "Which primitive to reuse / API shape" | `component-authoring` + `api-consistency-review` |
| "No secrets in client packages" | Hook (grep) + CI |
| "Formatting" | Hook (Prettier on edit) |

**Do not use prompt instructions where deterministic tooling is more reliable.**

## What belongs where

- **`CLAUDE.md` (root)** — permanent invariants + skill routing + doc-sync rule. Concise. Detailed procedures live in skills/docs. See [`/CLAUDE.md`](../CLAUDE.md).
- **Package `CLAUDE.md`** — only where rules genuinely differ: [`packages/react`](../packages/react/CLAUDE.md), [`packages/motion`](../packages/motion/CLAUDE.md), [`packages/remotion`](../packages/remotion/CLAUDE.md) (all planned scaffolds today).
- **Skills** (`.claude/skills/`) — step-by-step workflows that link to canonical docs; never restate the standards. Index below.
- **Subagents** (planned) — focused reviewers; see table below.
- **Hooks** (planned) — deterministic, lightweight; see below.

## How Claude should select a skill

1. First substantive work in a session / cross-cutting change → [`repository-orientation`](../.claude/skills/repository-orientation/SKILL.md).
2. Match the task to the routing table in [`/CLAUDE.md`](../CLAUDE.md#skill-routing).
3. Any code/dep/API/token change → the relevant authoring skill **and** [`documentation-maintenance`](../.claude/skills/documentation-maintenance/SKILL.md).
4. Before "done" → the relevant review skills (accessibility/performance/testing/api-consistency) per [`25-definition-of-done.md`](25-definition-of-done.md).

## Skill index

| Skill | Use for |
|---|---|
| [`repository-orientation`](../.claude/skills/repository-orientation/SKILL.md) | orient before cross-cutting change |
| [`documentation-maintenance`](../.claude/skills/documentation-maintenance/SKILL.md) | keep docs/ADRs in sync after any change |
| [`design-system-consistency`](../.claude/skills/design-system-consistency/SKILL.md) | visual/token changes |
| [`component-authoring`](../.claude/skills/component-authoring/SKILL.md) | new/changed interactive component |
| [`motion-primitive-authoring`](../.claude/skills/motion-primitive-authoring/SKILL.md) | low-level motion primitive |
| [`animated-section-authoring`](../.claude/skills/animated-section-authoring/SKILL.md) | marketing section |
| [`api-consistency-review`](../.claude/skills/api-consistency-review/SKILL.md) | any public API change (read-only) |
| [`accessibility-review`](../.claude/skills/accessibility-review/SKILL.md) | before completing an interactive component |
| [`performance-review`](../.claude/skills/performance-review/SKILL.md) | effects/scroll/sections/release candidates |
| [`testing-review`](../.claude/skills/testing-review/SKILL.md) | test completeness |
| [`dependency-review`](../.claude/skills/dependency-review/SKILL.md) | add/replace a dependency |
| [`remotion-composition-authoring`](../.claude/skills/remotion-composition-authoring/SKILL.md) | Remotion templates |
| [`release-readiness`](../.claude/skills/release-readiness/SKILL.md) | releases |
| [`migration-authoring`](../.claude/skills/migration-authoring/SKILL.md) | breaking changes |

## How documentation synchronization works

The [`documentation-maintenance`](../.claude/skills/documentation-maintenance/SKILL.md) skill enforces: update the **canonical owner** of a topic (see the "[Which document should I update?](README.md#which-document-should-i-update)" table), then only refresh summaries/links elsewhere, refresh "Last reviewed", and run the link/ADR-index checks. Canonical ownership prevents the same content living in multiple files.

## How architectural decisions are recorded

A durable architectural decision → create/update an ADR in [`adrs/`](adrs/) using [`templates/architecture-decision-template.md`](templates/architecture-decision-template.md), link it to its canonical doc, and add it to [`adrs/README.md`](adrs/README.md). ADRs stay **Proposed** until validated by the actual project; they don't restate the whole canonical doc.

## Subagents (planned)

| Subagent | Delegate when | Tools | Model | Edits? |
|---|---|---|---|---|
| `architecture-reviewer` | boundaries / new package | Read, Grep, Bash | Opus 4.8 | read-only |
| `component-builder` | implement a proposed component | Read, Edit, Write, Bash | Opus 4.8 | yes |
| `accessibility-reviewer` | before completing interactive component | Read, Bash, Grep | Sonnet 5 | read-only |
| `motion-performance-reviewer` | FX/scroll/sections/RC | Read, Bash | Sonnet 5 | read-only |
| `remotion-reviewer` | any `@scope/remotion*` change | Read, Grep | Opus 4.8 | read-only |
| `api-consistency-reviewer` | new/changed public API | Read, Grep | Sonnet 5 | read-only |
| `documentation-reviewer` | docs/story PRs | Read | Sonnet 5 | read-only |
| `release-reviewer` | before publish | Read, Bash | Opus 4.8 | read-only |

No single "do-everything" subagent. These are documented here; the `.claude/agents/` files are not yet created (Phase 1).

## Hooks (planned)

Deterministic, lightweight only. **Never run the full test suite on every edit.** Illustrative config and the boundary script live in this doc's companion [`17-security-and-supply-chain.md`](17-security-and-supply-chain.md) and will be added to `.claude/settings.json` in Phase 1:

- PostToolUse (Edit|Write): Prettier on the edited file; import-boundary check; no-secrets-in-client check; no-dynamic-Tailwind-class check.
- Stop: story+test presence check; changeset-for-public-API check.

Not hooked: full test suite, visual regression, publish. Those are CI/manual.
