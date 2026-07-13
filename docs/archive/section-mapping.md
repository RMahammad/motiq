# Section mapping — original plan → maintained docs

> This table maps every section of the archived [`original-architecture-plan.md`](./original-architecture-plan.md)
> to the canonical maintained document that now owns it. Use it to confirm no content was lost in the split.
> **Last reviewed:** 2026-07-14.

| # | Original section | Canonical destination | Notes |
|---|---|---|---|
| 1 | Executive recommendation | [`00-executive-summary.md`](../00-executive-summary.md) | Condensed; decision table preserved |
| 2 | Key assumptions | [`00-executive-summary.md`](../00-executive-summary.md), [`23-open-questions.md`](../23-open-questions.md) | Assumptions listed in exec summary; open items in 23 |
| 3 | Unresolved questions | [`23-open-questions.md`](../23-open-questions.md) | Canonical |
| 4 | Product positioning | [`01-product-strategy.md`](../01-product-strategy.md) | Canonical; commercial terms table |
| 5 | Competitive analysis | [`02-market-analysis.md`](../02-market-analysis.md) | Canonical |
| 6 | Architecture decision | [`03-architecture.md`](../03-architecture.md) | Canonical (boundaries, mermaid) |
| 7 | Animation-engine comparison matrix | [`06-animation-engine-decision.md`](../06-animation-engine-decision.md) | Canonical; matrix + escalation rules |
| 8 | Remotion role and licensing analysis | [`07-remotion-strategy.md`](../07-remotion-strategy.md) (role) + [`08-remotion-license-analysis.md`](../08-remotion-license-analysis.md) (license) | Split: strategy vs license |
| 9 | Monorepo architecture | [`03-architecture.md`](../03-architecture.md) (rules) + [`04-package-map.md`](../04-package-map.md) (per-package) | Split |
| 10 | Package dependency graph | [`03-architecture.md`](../03-architecture.md) | Mermaid preserved |
| 11 | Recommended dependency table | [`05-dependency-decisions.md`](../05-dependency-decisions.md) | Canonical single source |
| 12 | Public API design standard | [`09-component-api-standard.md`](../09-component-api-standard.md) | Canonical |
| 13 | Tailwind & theming strategy | [`11-tailwind-strategy.md`](../11-tailwind-strategy.md) | Canonical |
| 14 | Accessibility standard | [`12-accessibility-standard.md`](../12-accessibility-standard.md) | Canonical |
| 15 | Performance budgets | [`13-performance-standard.md`](../13-performance-standard.md) | Canonical |
| 16 | Testing strategy | [`14-testing-strategy.md`](../14-testing-strategy.md) | Canonical |
| 17 | Documentation strategy | [`15-documentation-strategy.md`](../15-documentation-strategy.md) | Canonical |
| 18 | Commercial packaging & distribution | [`16-commercial-packaging.md`](../16-commercial-packaging.md) | Canonical |
| 19 | Prioritized component inventory | [`21-component-inventory.md`](../21-component-inventory.md) | Canonical matrix |
| 20 | Exact MVP component list | [`20-mvp-roadmap.md`](../20-mvp-roadmap.md) | Canonical |
| 21 | Implementation order | [`20-mvp-roadmap.md`](../20-mvp-roadmap.md) | Canonical |
| 22 | Claude Code consistency system | [`24-claude-code-workflow.md`](../24-claude-code-workflow.md) | Canonical |
| 23 | Proposed CLAUDE.md (root) | [`/CLAUDE.md`](../../CLAUDE.md) | Realized as the actual root file |
| 24 | Proposed Claude Code skills | [`.claude/skills/`](../../.claude/skills/) + [`24-claude-code-workflow.md`](../24-claude-code-workflow.md) | Realized as real skills |
| 25 | Proposed subagents | [`24-claude-code-workflow.md`](../24-claude-code-workflow.md) | Documented (subagents not yet created) |
| 26 | Proposed hooks | [`24-claude-code-workflow.md`](../24-claude-code-workflow.md), [`17-security-and-supply-chain.md`](../17-security-and-supply-chain.md) | Documented as planned |
| 27 | Reference component implementations | [`09-component-api-standard.md`](../09-component-api-standard.md) + [`docs/templates/`](../templates/) | Reference code retained in API standard |
| 28 | CI & release strategy | [`18-release-process.md`](../18-release-process.md) | Canonical; release mermaid |
| 29 | Risk register | [`22-risk-register.md`](../22-risk-register.md) | Canonical |
| 30 | Phased roadmap | [`20-mvp-roadmap.md`](../20-mvp-roadmap.md) | Canonical |
| 31 | ADR list + initial ADR contents | [`../adrs/`](../adrs/) | Expanded to full ADR structure (0001–0012) |
| 32 | Immediate next 10 actions | [`00-executive-summary.md`](../00-executive-summary.md), [`20-mvp-roadmap.md`](../20-mvp-roadmap.md) | Priorities |
| Appendix | Design-token system | [`10-design-tokens.md`](../10-design-tokens.md) | Canonical |
| Appendix | Full component catalog scope | [`21-component-inventory.md`](../21-component-inventory.md) | Canonical |
| Appendix | Remotion product line scope | [`07-remotion-strategy.md`](../07-remotion-strategy.md) | Canonical |
| Appendix | Documentation deliverables tree | [`README.md`](../README.md), this split | Realized |
| Appendix | Code-quality / strict-TS standards | [`17-security-and-supply-chain.md`](../17-security-and-supply-chain.md) + [`14-testing-strategy.md`](../14-testing-strategy.md) | Split (code quality → security/supply-chain doc §Code quality) |
| Appendix | Security & supply-chain requirements | [`17-security-and-supply-chain.md`](../17-security-and-supply-chain.md) | Canonical |
| Appendix | Sources | [`05-dependency-decisions.md`](../05-dependency-decisions.md#sources) | Canonical source list |

## New documents with no direct 1:1 original section

These were required by the restructuring brief and synthesized from multiple original sections:

| New document | Synthesized from |
|---|---|
| [`19-support-and-deprecation.md`](../19-support-and-deprecation.md) | §4 (support policy), §18 (updates), §30 (phases), plus new deprecation policy |
| [`25-definition-of-done.md`](../25-definition-of-done.md) | §20 (DoD), §12/§13/§14 (per-type gates) |
| [`ADR-0011 accessible-primitives`](../adrs/0011-accessible-primitives.md) | Split out of original §5-component-primitives (Radix choice) |
| [`ADR-0012 design-token-contract`](../adrs/0012-design-token-contract.md) | Design-token appendix elevated to a decision |

No original section was dropped. Anything not elevated to a canonical doc (e.g. the two filled-in ADR bodies in §31) is superseded by the expanded ADR files under [`../adrs/`](../adrs/).
