# CLAUDE.md — `@scope/recipes`

> 🟡 **Active (v0.1.0).** The **recipe** layer: complete, opinionated interface workflows composed from the primitives — not single effects. Ships `ProductIntroduction` (a choreographed product hero on `MotionScene`). Root rules: [`/CLAUDE.md`](../../CLAUDE.md). Package spec: [`docs/04-package-map.md`](../../docs/04-package-map.md). Moat: [`docs/27-product-differentiation.md`](../../docs/27-product-differentiation.md), [ADR-0013](../../docs/adrs/0013-product-moat.md). Use the [`animated-section-authoring`](../../.claude/skills/animated-section-authoring/SKILL.md) skill.

## Purpose
Premium, drop-in **workflow recipes** a buyer installs and fills with their own content via slots. Each recipe encodes a semantic choreography (roles + intents) so teams stop re-assembling the same coordinated sequences by hand.

## Allowed dependencies
`@scope/motion`, `@scope/tokens`; peers: `react`, `react-dom`. **Forbidden:** Remotion, Node built-ins, `next/*` (core-UI boundary — [`docs/03`](../../docs/03-architecture.md#forbidden-import-matrix)).

## Authoring rules
- **No baked copy.** All text/media is a slot; the recipe supplies structure and motion only.
- **Compose `MotionScene`/`MotionStep`** — do not hand-roll timing. Roles/intents carry meaning.
- **Server-safe shell** composing client leaves; the recipe itself may carry `"use client"` because it re-exports client primitives.
- **Accessibility:** the primary heading is a real `h1`/`h2`; slotted controls keep their own semantics. axe test required.
- **SSR + reduced-motion** behavior is inherited from `MotionScene`; both are covered by tests.
- Layout/typography live in `styles.css`; entrance choreography lives in `@scope/motion/styles.css`.
