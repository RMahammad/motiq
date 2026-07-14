# ADR-0011: Accessible primitives — Radix default; React Aria later

- Status: **Accepted** (validated by spike 2026-07-14)
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
**Partially validated — spike passed 2026-07-14.** `AnimatedDialog` (`@scope/react`) ships on **Radix Dialog** with a **CSS-keyframe** enter/exit (Radix waits for the exit animation — no Motion dependency needed, [ADR-0002](0002-animation-engine.md)/[docs/06](../06-animation-engine-decision.md)). Tests verify **focus trap, focus restore to trigger, Escape-to-close, controlled `onOpenChange`, SSR (trigger-only when closed), and axe = 0** (with and without a description). Builds/consumes in the Next 16 App Router + Vite fixtures. **Still to do before fully closing:** Drawer/Sheet, Tooltip/Popover on Radix with the same test bar. Radix decision is Accepted; the remaining overlays are tracked in [`../21-component-inventory.md`](../21-component-inventory.md).

## Revisit conditions
- Base UI matures enough to consolidate, or Radix maintenance changes.

## Sources
- Radix MIT license; verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
