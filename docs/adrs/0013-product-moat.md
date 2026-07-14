# ADR-0013: Product moat — semantic motion + choreography system

- Status: **Proposed**
- Date: 2026-07-14
- Owners: Founder, Eng
- Related documents: [`../27-product-differentiation.md`](../27-product-differentiation.md) (canonical), [`../01-product-strategy.md`](../01-product-strategy.md), [`../21-component-inventory.md`](../21-component-inventory.md)
- Supersedes: — · Superseded by: —

## Context
Free/copy‑paste animated kits hand buyers an *effect* and leave the recurring 80% — semantic consistency, choreography, reduced‑motion/mobile/pointer/SSR/interruption safety, testing, and a themeable contract — to the buyer ([`26`](../26-current-ui-audit.md), [`02`](../02-market-analysis.md)). Competing on component count or effect novelty is a race to the bottom.

## Decision
Position the product as a **production‑grade semantic‑motion + choreography system** for React/Next.js: authors describe **intent** and **scenes**; the system compiles safe, consistent, themeable, testable motion. Supporting differentiators: (1) accessibility/reduced‑motion/responsive/interruption built into every preset; (2) an interactive **production‑readiness panel** on every component.

## Decision drivers
- The moat surface is the cross‑cutting work others skip; it compounds with a team.
- We already ship the safe primitives + tests ([FACT] v0.1.0) — the semantic/choreography layer is the differentiating addition.

## Alternatives considered
- **More components / effect gallery** — rejected (count ≠ moat; support burden).
- **Thin wrapper over Motion for React** — rejected (no defensibility; the engine is free).
- **Remotion template marketplace as the lead** — rejected (separate, license‑gated line — [`08`](../08-remotion-license-analysis.md)).

## Consequences
### Positive
Defensible, aligned with buyer pain, coherent catalog, clear paid value.
### Negative
Requires a new API surface (`MotionScene`/intents) and disciplined scope control.

## Risks and mitigations
- Scope creep → the `product-differentiation-review` skill gates every addition.
- API churn pre‑1.0 → freeze before 1.0 ([`29`](../29-go-live-checklist.md) E1).

## Validation
Accept once `MotionScene`/`MotionStep` ship with tests, the homepage demonstrates choreography above the fold, and ≥1 production‑readiness panel is live. (In build 2026-07-14.)

## Revisit conditions
If buyer research shows the recipes (not the system) drive purchase, or if Motion for React ships an equivalent system layer.

## Sources
[`27`](../27-product-differentiation.md), [`02`](../02-market-analysis.md).
