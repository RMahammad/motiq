# ADR-0011: Accessible primitives — Radix default; React Aria later

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng, A11y
- Related documents: [`../12-accessibility-standard.md`](../12-accessibility-standard.md) (canonical), [`../05-dependency-decisions.md`](../05-dependency-decisions.md)
- Supersedes: —
- Superseded by: —

## Context
Complex a11y behavior (focus trapping, roving tabindex, ARIA wiring for dialog/menu/tabs/tooltip/popover) is error-prone to build from scratch and is a top source of support/a11y regressions. WCAG 2.2 AA is a release blocker ([`../12`](../12-accessibility-standard.md)).

## Decision
Use **Radix Primitives** (MIT) as the default for overlays/menus/tabs/tooltips/accordions/toasts. Add **React Aria** later for date pickers, tables, and complex grids where Radix has no equivalent. **Do not rebuild complex a11y from scratch.**

## Decision drivers
- Proven accessibility; MIT; SSR-safe; composable with our motion via `asChild`/`forceMount`.
- Reduces a11y-regression risk and support load.

## Alternatives considered
- **Base UI** — newer; promising but less battle-tested for our launch set.
- **React Aria for everything** — heavier; better reserved for the widgets Radix lacks.
- **Hand-rolled** — rejected (regression risk).

## Consequences
### Positive
- Strong a11y baseline; faster overlay development.
### Negative
- Peer/dep footprint per primitive; must integrate Motion with Radix (`forceMount`).

## Risks and mitigations
- Two primitive libs (Radix + React Aria) later → document which to use when ([`../12`](../12-accessibility-standard.md)).

## Validation
Move to **Accepted** once Dialog/Drawer/Tooltip ship on Radix with axe = 0 and keyboard/focus tests passing.

## Revisit conditions
- Base UI matures enough to consolidate, or Radix maintenance changes.

## Sources
- Radix MIT license; verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
