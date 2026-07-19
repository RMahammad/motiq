# Code quality standard

> **Type:** Canonical standard · Scope: all maintained TypeScript/React source.

Source is sold to customers as editable code. It must be easy to read and safe to change. This page is the enforceable baseline; component-specific rules live in [`component-authoring.md`](component-authoring.md).

## TypeScript

- No `any`. Use `unknown` at boundaries and narrow. The only accepted cast is a CSS-variable style object (`["--x" as string]: value`), and prefer typing the style object over `as any`.
- No non-null assertions (`!`) where a guard or early return works.
- Public props types are named (`ComponentNameProps`) and exported.
- Prefer discriminated unions over boolean-flag combinations for mutually exclusive states.

## React

- Client boundary (`"use client"`) only when the file uses state, effects, refs, or browser APIs. Keep it off shared server-safe code.
- No browser globals (`window`, `document`, `matchMedia`) read during render. Read them in effects or lazy `useState` initializers, and only when `typeof window !== "undefined"`.
- No state derived through an effect when it can be computed during render.
- Stable keys — never array index for reorderable lists.
- One interactive element per control; never nest interactive elements.

## Effects and lifecycles

- Every `addEventListener`, timer, observer, animation loop, and subscription is cleaned up in the effect's return.
- Continuous animation pauses when offscreen (`useVisibilityPause`) and stops under reduced motion.
- No expensive work on every frame routed through React state unless the value is rendered.

## State

- Controlled/uncontrolled via the shared `useControllableState` (`packages/registry/registry/lib/motion.ts`). Callbacks receive the new value, not the event.
- Optimistic updates must be able to recover on failure (`useOptimisticAction`).
- IDs are stable across server and client render (`React.useId`), never `Math.random()`.

## Error handling

- Interactive/async surfaces expose the states that apply: idle, pending, success, error, retry, empty. Errors are visible and associated with their control (`aria-describedby`).
- No swallowed errors. No customer-facing console errors during normal use.

## Naming

- Descriptive names. Avoid `data`, `item`, `temp`, `handleThing`, `processData`, `utils`, `manager` as public names.
- Public callbacks are `onValueChange` / `onOpenChange` / `on<Domain>` — never `handle*` in the public API.

## Comments

Comment **why**, not **what**. One or two direct sentences. Keep a comment only when it explains a non-obvious decision, a browser/framework quirk, an accessibility or hydration constraint, a performance limit, a security boundary, or a workaround tied to a real issue. Remove comments that restate code or use marketing words ("robust", "seamless", "comprehensive", "production-ready"). No commented-out code. TODOs must state a concrete reason.

## Files and dependencies

- Prefer readable local code over a generic helper used once.
- Heavy dependencies stay component-local and lazy-loaded; the shared packages never depend on a package used by one Pro component. See [`05-dependency-decisions.md`](05-dependency-decisions.md).
- Registry source imports only from `@/lib/*` (aliased), `react`, `motion`, and its declared runtime deps — never `@scope/*`, `next/*`, or `node:*`. See [`registry-authoring.md`](registry-authoring.md).

## Performance

Budgets and measurement live in [`13-performance-standard.md`](13-performance-standard.md). The enforceable rules: no offscreen animation, no layout thrashing in scroll/resize handlers, lazy-load complex previews, no documentation-only dependency inside customer source.

## Security

No secrets in client code, no runtime license checks, fail-closed access decisions. See [`security-model.md`](security-model.md).
