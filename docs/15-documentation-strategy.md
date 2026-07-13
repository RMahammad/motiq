# 15 — Documentation strategy

> **Type:** 🟢 Canonical for docs & Storybook responsibilities · **Implementation status:** 🔵 Planned (this repo's `docs/` exists 🟢; the docs *site* and Storybook do not) · **Last reviewed:** 2026-07-14
> **Owns:** Storybook vs docs-site responsibilities, required component-page sections, doc validation.
> **Related:** [`14-testing-strategy.md`](14-testing-strategy.md) · [`documentation-maintenance` skill](../.claude/skills/documentation-maintenance/SKILL.md) · [`storybook-documentation`? see `15` + `component-authoring`]

## Two surfaces

| Surface | Status | Responsibility |
|---|---|---|
| **Storybook 9** (`apps/storybook`) | 🔵 Planned | isolated dev, interaction/a11y/visual tests, API playground |
| **Next.js docs site** (`apps/docs`) | 🔵 Planned | sellable catalog, marketing, guides, versioned reference |
| **`docs/` (this folder)** | 🟢 Implemented | engineering/product source of truth (what you're reading) |

Storybook 9 provides Vitest-backed interaction/a11y/visual tests in one workbench ([`14`](14-testing-strategy.md), sources in [`05`](05-dependency-decisions.md#sources)).

## Docs-site information architecture

Getting started · Installation (npm + registry/CLI) · React usage · Next.js usage (App Router + Pages) · Tailwind setup · Non-Tailwind setup · Theming · MotionProvider · Reduced motion · Component catalog · API reference · Recipes · Performance · Accessibility · Troubleshooting · Migration guides · Changelog · Licensing · FAQ · Remotion integration · Video rendering · Examples · Simple-vs-advanced API.

## Required component-page sections (real examples, no lorem)

Interactive preview · code example · install command · props table · a11y notes · reduced-motion behavior · perf notes · responsive behavior · dark-mode + custom-theme examples · recipes · known limitations · **version introduced** · related primitives · copy-code button · **import path**. Use the [`templates/component-documentation-template.md`](templates/component-documentation-template.md).

## Ownership & review

- The **canonical engineering docs** in this folder own standards; the **docs site** presents and links, it does not restate standards.
- Doc changes follow the [`documentation-maintenance`](../.claude/skills/documentation-maintenance/SKILL.md) skill: update the canonical owner, then only refresh summaries/links elsewhere.
- Every public component must have a doc page before release ([`25`](25-definition-of-done.md)).

## How docs are validated

Planned deterministic checks ([`tooling/`](tooling/)):

- **Internal link check** — no dead relative Markdown links (`check-links.mjs`).
- **ADR index sync** — every ADR appears in [`adrs/README.md`](adrs/README.md) (`check-adr-index.mjs`).
- **Duplicate-title check** — no two docs claim the same canonical title (`check-duplicate-titles.mjs`).
- **Stale verification dates** — version/license claims older than a threshold flagged (`check-stale-dates.mjs`).
- **Inventory sync** — component-inventory status matches component folders once they exist (`check-inventory.mjs`).
- **Example exports** — component examples reference real package exports (planned, needs packages first).

## How examples are tested

Component code examples in stories are executed as interaction tests ([`14`](14-testing-strategy.md)); docs-site examples import the real packages so a broken export fails the build. Copy-paste snippets are generated from the same source as the tested example to prevent drift.

## Detecting stale documentation

Beyond the scripts above: the `documentation-maintenance` skill requires refreshing "Last reviewed" metadata on touched canonical docs, and the release process ([`18`](18-release-process.md)) includes a docs-deploy + link-check gate.
