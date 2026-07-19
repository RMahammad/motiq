# ADR-0014: Docs/marketing visual direction — "Motion Laboratory" (instrument)

- Status: **Proposed**
- Date: 2026-07-14
- Owners: Eng, Docs
- Related documents: [`../28-visual-direction.md`](../28-visual-direction.md) (canonical), [`../26-current-ui-audit.md`](../26-current-ui-audit.md), [`../10-design-tokens.md`](../10-design-tokens.md)
- Supersedes: — · Superseded by: —

## Context
The pre‑redesign site read as a generic Tailwind/shadcn starter and did not demonstrate motion above the fold ([`26`](../26-current-ui-audit.md)). We need a coherent visual system that dramatizes the moat and gives the product an identity — without the "premium = dark/glow" trap.

## Decision
Adopt **Direction 1 — "Motion Laboratory" (instrument)**: dark matte control‑surface chrome framing a **bright light stage** where real components run under real controls, with monospace instrumentation (timing, policy, sequence step, SSR/bundle) and a single **functional** signal accent. Scored highest on a weighted matrix vs "Technical Editorial" and "Kinetic Modernist" ([`28`](../28-visual-direction.md)). Applies to the **docs brand layer only**; `@scope/tokens` stays theme‑neutral.

## Decision drivers
- Directly turns the page into a demonstration (stage + controls + readouts).
- Differentiates from generic SaaS; premium via structure/contrast/interaction, not decoration.

## Alternatives considered
- **Technical Editorial** — timeless, high a11y, but under‑dramatizes motion.
- **Kinetic Modernist** — striking, but reads as agency portfolio and doesn't prove the *system*.

## Consequences
### Positive
Identity + moat alignment; motion is the hero; clear IA.
### Negative
Dark instrument UIs risk low readability → mitigated by the light stage + strict contrast; monospace confined to instrumentation.

## Risks and mitigations
- Contrast/forced‑colors on dark → signal accent used for borders/controls with text labels, AA‑checked; forced‑colors falls back to system.
- Perf of a busy stage → transform/opacity only; page shell static; lab is a lazy client island.

## Validation
Accept after the redesigned homepage passes `visual-quality-gate` (screenshots at all breakpoints + light/dark + reduced‑motion) and `homepage-conversion-review`.

## Revisit conditions
If the instrument language hurts comprehension for non‑technical buyers, or a lighter variant tests better.

## Sources
[`28`](../28-visual-direction.md); `design-taste-frontend` (visual guidance, lower precedence than project rules).
