# ADR-0012: Design-token contract — semantic tokens, CSS vars + TS

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng, Design
- Related documents: [`../10-design-tokens.md`](../10-design-tokens.md) (canonical), [`../11-tailwind-strategy.md`](../11-tailwind-strategy.md)
- Supersedes: —
- Superseded by: —

## Context
Theming must work without forking component source; motion timing must be consistent and reduced-motion-aware; JS-driven springs/staggers and CSS transitions must share values without drift.

## Decision
`@scope/tokens` is the single source of design + motion tokens, emitted as **CSS custom properties** (for stylesheets/preset) **and typed TS constants** (for JS-driven animation), generated from one source to prevent drift. Components consume **semantic** tokens (`--motion-duration-normal`, not raw ms). Motion-intensity modes (`none`/`reduced`/`standard`/`expressive`) and `prefers-reduced-motion` are honored automatically. Token deprecation follows the policy in [`../10`](../10-design-tokens.md#token-deprecation-policy).

## Decision drivers
- Themes override tokens via the cascade, not source edits.
- One source for CSS + TS values (no drift).
- Reduced-motion + intensity as first-class token concerns.

## Alternatives considered
- **Per-component hard-coded values** — inconsistent; unthemeable; rejected.
- **TS-only tokens** — no CSS-var theming for consumers.
- **CSS-only tokens** — no typed springs/staggers for JS animation.

## Consequences
### Positive
- Consistent theming; reduced-motion built in; no CSS/JS drift.
### Negative
- A token generator to maintain; discipline needed to avoid one-off values.

## Risks and mitigations
- One-off values creeping in → review via [`design-system-consistency`](../../.claude/skills/design-system-consistency/SKILL.md).
- Too many themes → cap at 2 shipped ([`../22`](../22-risk-register.md)).

## Validation
Move to **Accepted** once `@scope/tokens` emits CSS+TS from one source and a second theme is applied with **zero** component changes.

## Revisit conditions
- A token category proves insufficient for real components.

## Sources
- Internal token design ([`../10`](../10-design-tokens.md)); Tailwind v4 `@theme` facts ([`../05`](../05-dependency-decisions.md#sources)).
