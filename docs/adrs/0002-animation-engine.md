# ADR-0002: Animation engine — Motion for React + CSS/WAAPI

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../06-animation-engine-decision.md`](../06-animation-engine-decision.md) (canonical), [`../13-performance-standard.md`](../13-performance-standard.md)
- Supersedes: —
- Superseded by: —

## Context
A paid, accessible React 19 / Next 16 library needs a small bundle, RSC-safe, reduced-motion-capable engine with layout/gesture/scroll support and a license permitting unrestricted resale. Full comparison matrix and escalation rules: [`../06-animation-engine-decision.md`](../06-animation-engine-decision.md).

## Decision
**Motion for React** (`motion/react`, MIT) is the default engine, used via `m` + `LazyMotion` and wrapped in our own primitives. **Plain CSS/transitions** handle cheap effects; **WAAPI** is used internally; **GSAP** is an optional adapter only; **View Transitions** is progressive enhancement; **Remotion is excluded from browser UI**.

## Decision drivers
- MIT license (resale-safe) — verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
- Best React DX; layout/shared-layout, gestures, scroll-linked values.
- Tree-shakeable to ~4.6kb via `m`+LazyMotion.

## Alternatives considered
- **react-spring** — weaker layout/shared-layout.
- **CSS-only** — no gestures/layout/shared transitions.
- **GSAP core** — free but not MIT and carries an anti-compete clause; larger integration cost. Kept optional.
- **Custom rAF/spring** — maintenance burden not justified.

## Consequences
### Positive
- Small bundle if imports are disciplined; single engine to learn.
- Reduced-motion + `MotionConfig` support built in.
### Negative
- Client-only (`"use client"` required).
- Some coupling to Motion's API → mitigated by wrapping.

## Risks and mitigations
- Motion breaking changes → wrap in our primitives; expose engine only via namespaced `motionProps` ([`../09-component-api-standard.md`](../09-component-api-standard.md#level-3--escape-hatch)).
- Bundle bloat → `m`+LazyMotion, size-limit ([`../13`](../13-performance-standard.md)).

## Validation
Move to **Accepted** once the primitive layer ships within the motion-package size budget and passes SSR/reduced-motion tests.

## Revisit conditions
- Motion changes license.
- A materially smaller RSC-native engine emerges.

## Sources
- motion.dev (MIT, bundle sizes), github motiondivision/motion — verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
