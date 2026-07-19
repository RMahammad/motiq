# Motion standard

> **Type:** Canonical standard · Scope: all animation in the catalog.

Engine choice, escalation rules, and the reduced-motion contract are owned by [`06-animation-engine-decision.md`](06-animation-engine-decision.md). The signature-quality strategy and the personality definitions are in [`36-premium-creative-component-strategy.md`](36-premium-creative-component-strategy.md). This page is the working summary.

## Engine order

CSS/WAAPI for simple state and entrance effects → Motion for React for orchestrated/interruptible motion → a heavy engine (canvas/WebGL) only when justified, isolated, and lazy-loaded. Motion is not in every component. **Core UI packages never import Remotion.**

## Personalities

Use one of four documented personalities, not a per-component invented easing:

- **Precise** — small, fast, functional (controls, toggles).
- **Fluid** — smooth continuity (reveals, transitions).
- **Expressive** — deliberate character on a hero moment.
- **Ambient** — slow, background, non-attention-seeking.

## Rules

- Every animation has a **reduced-motion** path that settles to the final state and stops unnecessary work.
- Motion is **meaningful**, not decorative; it clarifies a state change or hierarchy.
- Motion is **interruptible and reversible** — rapid toggles don't strand state.
- **Continuous animation pauses offscreen** (`useVisibilityPause`) and doesn't route per-frame updates through React unless the value is rendered.
- Timing comes from tokens, not magic numbers.

Review motion against the [`component-review`](../.claude/skills/component-review/SKILL.md) skill (animation-quality dimension).
