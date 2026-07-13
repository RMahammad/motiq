# ADR-0003: Remotion boundary — video-only, separate package & license

- Status: Proposed ⚠️ (legal-uncertain)
- Date: 2026-07-14
- Owners: Founder, Eng
- Related documents: [`../07-remotion-strategy.md`](../07-remotion-strategy.md) (canonical), [`../08-remotion-license-analysis.md`](../08-remotion-license-analysis.md) (⚠️ license)
- Supersedes: —
- Superseded by: —

## Context
Remotion is frame-exact video rendering with a **company license** (free ≤3-person for-profit, individuals, non-profits; paid at 4+; ~$25/dev/mo, min $100/mo or $1000/yr — verified 2026-07-14). Resale of templates, embedding `@remotion/player`, and hosted rendering are **legally ambiguous**. It is also the wrong tool for interactive DOM UI.

## Decision
Remotion is a **separate product line** (`@scope/remotion`, `@scope/remotion/server`) that the core UI packages **never import**. Node render code sits behind `./server` + the `node` export condition. **Ship the Remotion product only after written answers to the [`../08`](../08-remotion-license-analysis.md) license questions.**

## Decision drivers
- License firewall (avoid contaminating the MIT-only core resale story).
- Bundle firewall (no renderer in browser bundles).
- Correct-tool: Remotion scores 1–2 on browser-UI criteria ([`../06`](../06-animation-engine-decision.md)).

## Alternatives considered
- **Remotion as primary engine** — rejected: bundle, license, wrong tool for DOM UI.
- **Canvas/WebGL video** — out of scope.

## Consequences
### Positive
- Clean license + bundle separation; video line cleanly gated to Phase 4.
### Negative
- Two design languages must be kept in sync via shared `@scope/tokens`.

## Risks and mitigations
- **License ambiguity** → question list to Remotion + counsel; hard Phase-4 gate ([`../08`](../08-remotion-license-analysis.md), [`../22`](../22-risk-register.md)).
- Render infra cost (if hosted) → source-first; usage caps.

## Validation
Move to **Accepted** only when: (a) the [`../08`](../08-remotion-license-analysis.md) questions are answered in writing, **and** (b) a boundary test proving no Remotion import reaches core packages passes in CI.

## Revisit conditions
- Remotion changes its license or clarifies resale terms.

## Sources
- remotion.dev/docs/license, remotion.dev/blog/company-licenses — verified 2026-07-14 ([`../08`](../08-remotion-license-analysis.md#verification-log)).
