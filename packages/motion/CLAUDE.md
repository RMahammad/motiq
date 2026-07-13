# CLAUDE.md — `@scope/motion`

> 🔵 **Planned package.** Scaffold only; not built yet. Root rules: [`/CLAUDE.md`](../../CLAUDE.md). Package spec: [`docs/04-package-map.md`](../../docs/04-package-map.md). Use the [`motion-primitive-authoring`](../../.claude/skills/motion-primitive-authoring/SKILL.md) skill.

## Purpose
The low-level motion primitive layer (`MotionProvider`, `Reveal`, `Fade/Slide/Scale`, `Stagger`, `InView`, `ScrollProgress`, …) that powers components.

## Engine abstraction rule
Wrap **Motion for React** behind a **stable semantic API**. **No engine-specific object at the default (Level-1) surface** — expose the engine only through a namespaced Level-3 `motionProps` hatch. Use the lowest engine tier that works (CSS → WAAPI → Motion) per the [escalation rules](../../docs/06-animation-engine-decision.md#escalation-rules--when-each-engine-is-allowed).

## Allowed dependencies
`@scope/tokens`; peers: `react`, `react-dom`, `motion`. **Forbidden:** `@scope/react`, Remotion, Node built-ins, `next/*`.

## Cleanup requirements
Tear down every `IntersectionObserver`/timer/listener/`requestAnimationFrame` in effect cleanup. Share observers where beneficial; pause on background tabs.

## SSR behavior
Render **final state** on the server; do not measure layout on first render; animate after hydration. SSR test required.

## Reduced-motion requirements
Honor `prefers-reduced-motion` automatically; respect the stricter of OS vs app intensity ([`docs/10`](../../docs/10-design-tokens.md#motion-intensity-modes)). Reduced-motion test required.

## Performance expectations
Stay within the `@scope/motion` size budget; use `m`+LazyMotion, not the full `motion` import; transform/opacity by default. See [`docs/13`](../../docs/13-performance-standard.md). Every primitive documents **when NOT to use it**.
