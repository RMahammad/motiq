# ADR-0004: Styling & Tailwind — preset + CSS vars + compiled fallback

- Status: Proposed
- Date: 2026-07-14
- Owners: Eng
- Related documents: [`../11-tailwind-strategy.md`](../11-tailwind-strategy.md) (canonical), [`../10-design-tokens.md`](../10-design-tokens.md)
- Supersedes: —
- Superseded by: —

## Context
Tailwind is the primary styling target, but fragile consumer setup (source detection, `node_modules` exclusion, dynamic classes) is a top support-cost driver. Non-Tailwind users must also be supported. Tailwind v4 (CSS-first `@theme`, automatic source detection) verified 2026-07-14.

## Decision
**Hybrid:** ship a Tailwind v4 **preset** (`@theme` tokens) **+** CSS-variable design tokens **+** a compiled, namespaced **CSS fallback** (`@scope/styles`) for non-Tailwind users. Use `cn()` (`clsx`+`tailwind-merge`) and **CVA** for variants. **No dynamically constructed class names.** Consumer `className` always wins.

## Decision drivers
- Defensive against Tailwind class-detection failures.
- Works with and without Tailwind.
- Stable styling contract via tokens + `data-slot` + `className`.

## Alternatives considered
- **Tailwind-only (classes in components)** — breaks non-Tailwind users; source-detection fragility.
- **Compiled CSS only** — poor customization for Tailwind users.
- **CSS-in-JS runtime** — bundle + SSR cost; rejected.

## Consequences
### Positive
- One styling contract; both consumer types supported; themeable via tokens.
### Negative
- Must maintain preset **and** compiled fallback in sync.

## Risks and mitigations
- Source-detection misses classes → compiled fallback + documented `@source` ([`../11`](../11-tailwind-strategy.md)).
- Dynamic class usage sneaking in → lint rule + review ([`../24`](../24-claude-code-workflow.md)).

## Validation
Move to **Accepted** once a consumer fixture renders correctly **both** with the preset and with only the compiled CSS (no Tailwind).

## Revisit conditions
- Tailwind changes source-detection or `@theme` semantics.

## Sources
- tailwindcss.com/blog/tailwindcss-v4 — verified 2026-07-14 ([`../05`](../05-dependency-decisions.md#sources)).
