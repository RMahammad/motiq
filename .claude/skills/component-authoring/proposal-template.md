# Component proposal (in-skill copy)

Canonical copy: [`docs/templates/component-proposal-template.md`](../../../docs/templates/component-proposal-template.md). Fill before implementing.

- **Name:**
- **Buyer use case:** (production-useful, not merely novel?)
- **Reuse gate:**
  - Existing component already solves it? ______ (if yes, stop)
  - Better as a variant? ______
  - Existing motion primitive provides behavior? ______ (which)
  - Package/tier: free / premium / experimental / remotion ______
- **API — Level 1 (semantic props):**
- **API — Level 2 (tokens/presets):**
- **API — Level 3 (escape hatch):**
- **Accessibility model:** keyboard / focus / roles+states / reduced-motion / primitive (Radix?)
- **Motion:** engine per [escalation rules](../../../docs/06-animation-engine-decision.md#escalation-rules--when-each-engine-is-allowed) / tokens / reduced-motion fallback
- **Risks:** a11y / perf / mobile / SSR
