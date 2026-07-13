# 22 — Risk register

> **Type:** 🟢 Canonical risk register · **Implementation status:** 🔵 Planned (living document) · **Last reviewed:** 2026-07-14
> **Related:** [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md) · [`23-open-questions.md`](23-open-questions.md) · [`13`](13-performance-standard.md) · [`16`](16-commercial-packaging.md)
> Review at each phase gate ([`20`](20-mvp-roadmap.md)); update Likelihood/Impact and add early-warning signals as they appear.

| Risk | Likelihood | Impact | Early warning | Mitigation | Owner | Revisit |
|---|---|---|---|---|---|---|
| Remotion license ambiguity for template resale | High | High | unclear answers from Remotion | [`08`](08-remotion-license-analysis.md) question list to Remotion+counsel; gate Phase 4 | Founder | before Phase 4 |
| `"use client"` stripped by bundler | Med | High | RSC errors in Next fixture | fixture test blocks release; tsup fallback ([ADR-0006](adrs/0006-library-bundler.md)) | Eng | each release |
| Animation-engine lock-in (Motion) | Med | Med | Motion breaking changes | wrap in own primitives; `motionProps` hatch isolates | Eng | per Motion major |
| Bundle bloat | Med | High | size-limit regressions | budgets in CI; `m`+LazyMotion; lazy FX ([`13`](13-performance-standard.md)) | Eng | each PR |
| Next.js major break (16→17) | Med | Med | canary failures | test on Next canary in CI matrix | Eng | per Next release |
| React version incompat | Low | High | peer warnings | peer `>=18.3 <20`; test both | Eng | per React release |
| Tailwind v4 source-detection misses classes | Med | Med | missing styles in consumer | ship compiled CSS fallback; document `@source` ([`11`](11-tailwind-strategy.md)) | Eng | on Tailwind minor |
| Hydration mismatch | Med | High | console warnings | SSR tests; render final state | Eng | each component |
| A11y regression | Med | High | axe failures | axe gate is a release blocker ([`12`](12-accessibility-standard.md)) | A11y reviewer | each PR |
| Mobile perf (heavy FX) | Med | High | dropped frames on device | FX gated/lazy/reduced-motion; mobile tests | Perf reviewer | per FX |
| Too many novelty components | Med | High | catalog sprawl, low usage | curated MVP; V2 gating ([`20`](20-mvp-roadmap.md)) | Founder | each phase |
| Weak differentiation | Med | High | flat sales | lead on a11y + production-readiness ([`01`](01-product-strategy.md)) | Founder | quarterly |
| Copycat competitors | High | Med | clones appear | brand + docs + support moat; registry auth | Founder | ongoing |
| Source leakage (registry edition) | High | Med | pirated copies | price in; watermark; updates/support value ([`16`](16-commercial-packaging.md)) | Founder | ongoing |
| License-enforcement harming DX | Low | High | buyer complaints | **no runtime checks** (design choice) | Founder | n/a |
| High support burden | Med | High | ticket volume on setup | compiled CSS fallback; troubleshooting docs ([`19`](19-support-and-deprecation.md)) | Support | monthly |
| Breaking API changes | Med | Med | migration friction | changesets + codemods + deprecation policy | Eng | each major |
| Browser API changes (View Transitions, scroll timeline) | Low | Med | feature-detect failures | progressive enhancement + fallbacks | Eng | quarterly |
| Abandoned dependency | Low | Med | stale upstream | dependency-review skill; minimal deps ([`05`](05-dependency-decisions.md)) | Eng | quarterly |
| Visual-regression costs | Med | Low | slow/expensive CI | labeled-PR only; deterministic snapshots | Eng | quarterly |
| Maintaining too many themes | Low | Med | theme test explosion | tokens-only theming; 2 shipped themes max ([`10`](10-design-tokens.md)) | Eng | per theme |
| Remotion render infra cost (if hosted) | Med | High | render bills | source-only first; usage caps if hosted ([`07`](07-remotion-strategy.md)) | Founder | Phase 4 |
| Video codec/font issues | Med | Med | render failures | pin fonts/codecs; render smoke tests | Eng | Phase 4 |
| Customer redistribution | Med | Med | leaked packages | license terms + watermark + revocation | Founder | ongoing |
| AI-generated inconsistent code | Med | Med | style drift in PRs | CLAUDE.md + skills + api-consistency-review + CI ([`24`](24-claude-code-workflow.md)) | Eng | ongoing |
