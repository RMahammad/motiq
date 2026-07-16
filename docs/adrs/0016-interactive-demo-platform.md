# ADR-0016: Interactive demo / Motion Laboratory platform

- Status: **Proposed**
- Date: 2026-07-14
- Owners: Eng, Docs
- Related documents: [`../28-visual-direction.md`](../28-visual-direction.md), [`../15-documentation-strategy.md`](../15-documentation-strategy.md), [`../13-performance-standard.md`](../13-performance-standard.md), [ADR-0008](0008-documentation-platform.md)
- Supersedes: — · Superseded by: —

## Context
The redesign requires a signature **Motion Laboratory**: real components on a stage under real controls (semantic intent, intensity, reduced‑motion, replay, theme, viewport) with code synchronized to the controls. This must not turn the whole homepage into a client bundle or fake any control.

## Decision
Build the interactive stages as **lazy client islands inside otherwise server‑rendered pages** (Next App Router). The page shell + copy are Server Components; each `<MotionLab>`/live stage is a `"use client"` island loaded where needed. Controls drive real component props and a **derived code readout** (single source: the control state → both the live component and the shown code). Reuse `@scope/*` components; no screenshots, no fake dashboards.

## Decision drivers
- Keep static content server‑rendered (perf, SSR) while allowing rich interaction ([`13`](../13-performance-standard.md)).
- "No control unless it works" and "understandable with animation disabled" are hard requirements ([`interactive-demo-authoring`](../../.claude/skills/preview-authoring/SKILL.md)).

## Alternatives considered
- **Whole page as a client component** — rejected (bundle/SSR regression; [`13`](../13-performance-standard.md)).
- **Storybook embeds/iframes on the homepage** — rejected for the hero (heavier, less control over IA); Storybook remains the isolated workbench ([ADR-0008](0008-documentation-platform.md)).
- **Prebuilt video/gifs** — rejected (not live; violates "real product proof").

## Consequences
### Positive
Live, honest product proof; small client surface; reusable stage primitives across homepage + component pages.
### Negative
Requires disciplined boundaries + tests for control correctness, reduced‑motion, and cleanup.

## Risks and mitigations
- Client‑island bloat → lazy‑load; measure with `size-limit`/route JS.
- Hydration flash → deterministic initial state; render final/hidden state server‑side.

## Validation
Accept once the homepage hero + Motion Laboratory ship as lazy client islands (page shell stays server‑rendered), all controls verified working, reduced‑motion + cleanup tested, and the Next build stays green. First slice ships in the 2026‑07‑14 redesign.

## Revisit conditions
If client‑island JS exceeds budget, or a different embedding strategy proves better for docs pages.

## Sources
[`28`](../28-visual-direction.md), [`15`](../15-documentation-strategy.md), [`13`](../13-performance-standard.md).
