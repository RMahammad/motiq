# Documentation index

> **Type:** Index (start here) · **Reviewed:** 2026-07-16

A commercially-sold animated component library for React and Next.js, delivered as editable source through a shadcn-compatible registry. **Phase 2 (MVP):** 60 catalog items across `@scope/{tokens,motion,react,sections}` + registry + docs site + Storybook + CI. The component inventory is **frozen** for the current production-readiness cleanup — see [`57-library-production-cleanup.md`](57-library-production-cleanup.md).

## Canonical standards

The maintained standards. Each is short and states its scope; detailed references and records are linked from them.

| Topic | Doc |
| --- | --- |
| Architecture & boundaries | [`architecture.md`](architecture.md) |
| Component authoring | [`component-authoring.md`](component-authoring.md) |
| Registry authoring | [`registry-authoring.md`](registry-authoring.md) |
| Preview authoring | [`preview-authoring.md`](preview-authoring.md) |
| Accessibility | [`accessibility-standard.md`](accessibility-standard.md) |
| Motion | [`motion-standard.md`](motion-standard.md) |
| Responsive | [`responsive-standard.md`](responsive-standard.md) |
| Code quality | [`code-quality-standard.md`](code-quality-standard.md) |
| Release | [`release-checklist.md`](release-checklist.md) |
| Commercial delivery | [`commercial-delivery.md`](commercial-delivery.md) |
| Security | [`security-model.md`](security-model.md) |

## Reference detail (owned by the standards above)

- Component API contract: [`09-component-api-standard.md`](09-component-api-standard.md) · Tokens: [`10-design-tokens.md`](10-design-tokens.md) · Tailwind: [`11-tailwind-strategy.md`](11-tailwind-strategy.md)
- Accessibility contract: [`12-accessibility-standard.md`](12-accessibility-standard.md) · Performance budgets: [`13-performance-standard.md`](13-performance-standard.md) · Testing: [`14-testing-strategy.md`](14-testing-strategy.md)
- Animation engine: [`06-animation-engine-decision.md`](06-animation-engine-decision.md) · Package map: [`04-package-map.md`](04-package-map.md) · Dependencies: [`05-dependency-decisions.md`](05-dependency-decisions.md)
- Architecture detail: [`03-architecture.md`](03-architecture.md) · Remotion: [`07-remotion-strategy.md`](07-remotion-strategy.md), [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md)
- Definition of done: [`25-definition-of-done.md`](25-definition-of-done.md) · Component inventory: [`21-component-inventory.md`](21-component-inventory.md) · Catalog board: [`39-catalog-production-board.md`](39-catalog-production-board.md)

## Product & records

- Differentiation / moat: [`27-product-differentiation.md`](27-product-differentiation.md) · Showcase visual system: [`30-showcase-visual-system.md`](30-showcase-visual-system.md)
- Commercial & operational records: indexed from [`commercial-delivery.md`](commercial-delivery.md).
- Security & threat records: indexed from [`security-model.md`](security-model.md).
- Clean-room research & do-not-copy: [`31-competitive-product-review.md`](31-competitive-product-review.md), [`35-react-bits-quality-study.md`](35-react-bits-quality-study.md).
- Signature-quality strategy: [`36-premium-creative-component-strategy.md`](36-premium-creative-component-strategy.md).

## Decisions & process

- ADRs: [`adrs/README.md`](adrs/README.md) — durable architectural decisions.
- Claude Code system: [`24-claude-code-workflow.md`](24-claude-code-workflow.md) · root routing: [`/CLAUDE.md`](../CLAUDE.md) · skills: [`.claude/skills/`](../.claude/skills/).
- Templates: [`templates/`](templates/).

## History

Superseded strategies, completed-sprint reports, and pre-pivot audits live in [`archive/`](archive/). Do not treat archived files as active instructions.

## Validation

`pnpm docs:check` runs link, ADR-index, duplicate-title, stale-date, and inventory checks. Keep them green; update the canonical owner first, then refresh links via [`documentation-maintenance`](../.claude/skills/documentation-maintenance/SKILL.md).
