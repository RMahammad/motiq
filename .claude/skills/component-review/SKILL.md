---
name: component-review
description: Single read-only review gate for a component before it ships — covers public API, motion quality, performance, test completeness, design-system/token consistency, and dependencies. Run after the component renders and before marking it Released.
---

# Component review

Inspect first, fix second. Read the rendered output and the code, record findings across all six areas, then apply fixes.

## When to use
- A new or changed component/section/primitive is built and renders, before marking it Released.
- Skip areas that don't apply: no public-API change → skip API; no new dependency → skip Dependencies; visual-only item → targeted logic tests only.

## Inputs
- The component under review (source + registry/preview entry) and the rendered app URL/route.
- The diff, its tests, and any new dependency.
- Canonical standards: ../../../docs/code-quality-standard.md · ../../../docs/motion-standard.md · ../../../docs/13-performance-standard.md · ../../../docs/09-component-api-standard.md · ../../../docs/14-testing-strategy.md · ../../../docs/05-dependency-decisions.md

## Steps
Work through each area read-only, mapping findings to the canonical doc; fix only after findings are recorded.

1. **API** (../../../docs/09-component-api-standard.md) — naming (`PascalCase`, `useX`, positive booleans, `onX`); controlled/uncontrolled (`value`/`defaultValue`+`onValueChange`); Level-1 timing props take token names not raw ms; `className` merged last via `cn()`; `forwardRef` to the primary node; documented `data-slot`/`data-state`; engine access only via namespaced `motionProps`; SSR-safe defaults (no first-render measurement); no engine internals as the sole interface; correct semver bump + changeset present.
2. **Motion** (../../../docs/motion-standard.md) — entrance/exit/state continuity; easing and duration purposeful (not slow-without-purpose, not bouncy); interruption, reversal, and rapid-toggle exercised and clean; hover/tap/keyboard feedback; reduced-motion keeps state legible; consistent with sibling components; cut motion that adds no clarity.
3. **Performance** (../../../docs/13-performance-standard.md) — single-component import within budget; tree-shaking (no sibling pull-in); no needless `"use client"`; animate transform/opacity only or justify; no layout thrashing; observers/timers/rAF/listeners cleaned on unmount; scroll handlers rAF-throttled; mobile + reduced-motion fallback for high-risk items; heavy effects lazy-loaded. For canvas/WebGL/shader/per-frame loops: justify the engine (CSS→SVG→Motion→Canvas→WebGL, stop at first sufficient level), keep deps component-local, verify offscreen/hidden pause with instrumentation, cap DPR ≤2, target ≥50fps on mid-range mobile.
4. **Tests** (../../../docs/14-testing-strategy.md) — verify behavior coverage, not line percent: unit (motion math/token logic), interaction (RTL), axe=0, reduced-motion final state, SSR + hydration, Next + Vite fixtures, type/export tests, packed-tarball fixture (installs the tarball, not source). Visual-only items get targeted logic tests only.
5. **Design system** (../../../docs/code-quality-standard.md) — reuse existing semantic tokens (color/space/radius/shadow/typography/motion); no one-off hex or arbitrary radius/shadow/duration/easing; no dynamically constructed Tailwind classes; full state coverage (default/hover/focus-visible/active/disabled/loading/error/selected); light/dark/forced-colors/reduced-motion correct (dark is not naive inversion); responsive across breakpoints. Add a token only when no existing one fits, and document its scope.
6. **Dependencies** (../../../docs/05-dependency-decisions.md) — for any new/replaced dep: exact purpose, current version + license verified with source and today's date, maintenance/security, bundle impact, SSR/ESM/RSC compatibility, correct classification (dep/peer/dev/optional/separate). Prefer a <~100-line internal utility when safe.

## Completion criteria
- Every applicable area has recorded findings mapped to its canonical doc, each pass or violation with the fix.
- Interruption, reversal, and rapid-toggle were exercised (not read); reduced-motion and keyboard paths confirmed.
- Semver bump and changeset are correct for any API change.

## Required validation
- Findings come from the rendered app plus code, not source inspection alone.
- Performance: `size-limit` within budget; for heavy creative items, offscreen pause and frame rate observed with instrumentation, not asserted.
- Tests: the packed-tarball fixture rule is honored; release-blocking suites (axe, SSR/hydration, reduced-motion, tarball) present.
- Dependencies: version/license claims carry source + verification date.

## Output format
Per-area findings list (pass / violation + fix), the correct semver impact, and a single go / no-go decision. No hidden fixes — list a finding before you fix it.

## Non-goals
- Not accessibility semantics beyond motion/reduced-motion (use accessibility-review).
- Not originality or commercial visual approval (use originality-review / component-sellability-review).
- No subjective 1–10 scores or Sellable/Category-leading labels.

## Stop conditions (block completion)
- API leaks engine internals as the sole interface, or the semver bump/changeset is wrong.
- Motion fails reduced-motion, breaks on rapid toggle, or harms keyboard/touch users.
- A performance budget regresses with no resolution, or a high-risk item has no mobile/reduced-motion fallback.
- A release-blocking test suite is missing, or a fixture imports monorepo source instead of the tarball.
- A shared token would be mutated to fix one component, or an arbitrary value is used where a token exists.
- A dependency has unclear/incompatible license, crosses the browser/server boundary, duplicates an existing dep, would pull Remotion into a core package, or needs secrets in client code.
