# 25 — Definition of done

> **Type:** 🟢 Canonical for "is it finished" · **Implementation status:** 🔵 Planned (applies once building starts) · **Last reviewed:** 2026-07-14
> **Owns:** per-work-type definitions of done. Release-blocking items are marked ⛔.
> **Related:** [`12`](12-accessibility-standard.md) · [`13`](13-performance-standard.md) · [`14`](14-testing-strategy.md) · [`18`](18-release-process.md) · [`component-authoring` skill](../.claude/skills/component-authoring/SKILL.md)

## Motion primitive

- [ ] Stable **semantic** API; no engine-specific object in the default (Level-1) API ([`09`](09-component-api-standard.md)).
- [ ] Timing via **tokens** ([`10`](10-design-tokens.md)).
- [ ] ⛔ Reduced-motion behavior (final-state render, still functional).
- [ ] ⛔ SSR-safe initial output (no measure-on-first-render).
- [ ] Cleanup of all observers/timers/listeners/rAF.
- [ ] Level-3 escape hatch (`motionProps` or equivalent), namespaced.
- [ ] Unit tests for timing + visibility logic.
- [ ] Performance benchmark within budget ([`13`](13-performance-standard.md)).
- [ ] Docs: "when NOT to use this primitive".
- [ ] Export updated; changeset.

## Interactive component

- [ ] Component proposal + buyer use case; primitive-reuse analysis done.
- [ ] Three-level API; `forwardRef`; semantic HTML.
- [ ] ⛔ Correct `"use client"` placement; preserved in build.
- [ ] Radix (or approved primitive) for overlay/menu/tabs/tooltip a11y ([ADR-0011](adrs/0011-accessible-primitives.md)).
- [ ] ⛔ Reduced-motion fallback.
- [ ] ⛔ axe = 0 violations; keyboard + focus verified ([`12`](12-accessibility-standard.md)).
- [ ] Interaction tests; ⛔ SSR/hydration test.
- [ ] Storybook stories (default/dark/theme/reduced-motion).
- [ ] Docs page with real example ([`15`](15-documentation-strategy.md)).
- [ ] ⛔ Size within budget ([`13`](13-performance-standard.md)).
- [ ] Export map updated; changeset.

## Marketing section

- [ ] Composed from existing components; adds no new engine.
- [ ] ⛔ No hard-coded marketing copy — content via props/slots/structured data.
- [ ] Semantic heading hierarchy; responsive; mobile-safe animation.
- [ ] ⛔ Reduced-motion layout.
- [ ] No unnecessary client boundary around static content.
- [ ] Realistic Storybook examples (default/dark/custom-theme).
- [ ] Performance review passed ([`performance-review`](../.claude/skills/performance-review/SKILL.md)).
- [ ] Docs page; changeset.

## Remotion composition

- [ ] ⛔ Correct package boundary (no import into core UI).
- [ ] Validated Zod input schema + default props; duration/dimensions/FPS defined.
- [ ] ⛔ Deterministic output (frame-hash test); FPS-aware math.
- [ ] Asset + font loading validated; safe-area handling.
- [ ] Studio preview; Player preview where supported; render smoke test.
- [ ] ⛔ License-boundary review passed ([`08`](08-remotion-license-analysis.md)).
- [ ] Docs updated.

## Documentation change

- [ ] Canonical owner updated (not a copy elsewhere).
- [ ] Summaries/links elsewhere refreshed; "Last reviewed" bumped.
- [ ] ⛔ No dead internal links; no duplicated canonical tables.
- [ ] No claim that planned functionality is implemented.
- [ ] Version/license claims carry a source + verification date.
- [ ] ADR created/updated if the change is a durable architectural decision.

## Dependency addition

- [ ] `dependency-review` completed: purpose, verified version, license, maintenance, security, bundle, SSR/browser, ESM, tree-shaking, React/Next compat, classification, alternatives ([`05`](05-dependency-decisions.md)).
- [ ] ⛔ License compatible with a paid library; ⛔ no secrets required in client code.
- [ ] ⛔ Does not introduce Remotion into a core package.
- [ ] Canonical dependency table + relevant ADR updated.

## Breaking API change

- [ ] Migration guide ([`templates/migration-guide-template.md`](templates/migration-guide-template.md)); before/after examples.
- [ ] Codemod where feasible; deprecation timeline + compatibility window ([`19`](19-support-and-deprecation.md)).
- [ ] ⛔ Major-version changeset; changelog; docs links updated.
- [ ] Rollback guidance.

## Package release

- [ ] Full [release checklist](18-release-process.md#release-checklist) green, including ⛔ packed-tarball fixture install, ⛔ `"use client"` preserved, ⛔ export/type validation, ⛔ size budgets, provenance.
- [ ] Go/no-go report produced ([`release-readiness`](../.claude/skills/release-readiness/SKILL.md)).
