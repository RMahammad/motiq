# ADR-0005: Primitive-layer architecture — own primitives wrap the engine

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../09-component-api-standard.md`](../09-component-api-standard.md) (canonical), [`../04-package-map.md`](../04-package-map.md)
- Supersedes: —
- Superseded by: —

## Context
Components need a small, reusable layer that powers many higher-level components while keeping the public API stable and engine-agnostic. (Distinct from [ADR-0011](0011-accessible-primitives.md), which chooses the *accessible* primitive library, Radix.)

## Decision
Build a **single motion-primitive layer** (`@scope/motion`: `MotionProvider`, `Reveal`, `Fade/Slide/Scale`, `Stagger`, `InView`, `ScrollProgress`, …) that wraps Motion for React behind a **stable semantic API**. Components in `@scope/react` compose these primitives and never touch the engine directly except via the namespaced Level-3 escape hatch.

## Decision drivers
- Isolate engine choice ([ADR-0002](0002-animation-engine.md)) from the public API.
- Maximize reuse; keep the surface consistent.
- One primitive layer, not two (we dropped a separate `primitives/` package — [`../04`](../04-package-map.md#packages-deliberately-not-created-and-why)).

## Alternatives considered
- **Expose Motion directly per component** — leaks engine internals; unstable API; hard to swap engines.
- **Two layers (`primitives` + `motion`)** — unnecessary; invites duplication.

## Consequences
### Positive
- Engine swaps don't break Levels 1–2; consistent API; smaller components.
### Negative
- A wrapping layer to maintain; must resist leaking engine types upward.

## Validation
Move to **Accepted** once ≥3 MVP components are built purely on the primitive layer with no direct Motion imports.

## Revisit conditions
- The wrapper proves too limiting for a needed interaction.

## Sources
- Internal architecture ([`../09`](../09-component-api-standard.md)). Engine facts: [`../05`](../05-dependency-decisions.md#sources).
