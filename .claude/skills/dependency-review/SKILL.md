---
name: dependency-review
description: Review any dependency before adding or replacing it — verify current version, license, maintenance, security, bundle impact, SSR/browser behavior, ESM/tree-shaking, React/Next compatibility, correct classification, alternatives, and whether a small internal utility is safer. Stops on license, boundary, duplication, Remotion-in-core, or secret concerns.
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
---
# Dependency review

## Use this skill when
- Before adding or replacing any dependency (runtime, peer, or dev).

## Do not use this skill when
- Bumping an already-approved dependency within its policy range with no new capability (still record the bump in the changelog).

## Required context
- [`docs/05-dependency-decisions.md`](../../../docs/05-dependency-decisions.md) (canonical table + sources)
- [`docs/03-architecture.md`](../../../docs/03-architecture.md) (boundaries)
- [`docs/17-security-and-supply-chain.md`](../../../docs/17-security-and-supply-chain.md)

## Inputs
- The dependency name + the exact need.

## Procedure — answer all
1. **Exact purpose** — what specific capability, in which package.
2. **Current stable version** — verify via primary source (npm / official docs) **today**; record the date.
3. **License** — confirm it's compatible with a paid/redistributed library.
4. **Maintenance activity** — recent releases, open-issue health.
5. **Security** — known advisories / history.
6. **Bundle impact** — min+gzip; tree-shakeable?
7. **SSR & browser behavior** — safe in both? client-only?
8. **ESM compatibility** — ESM-native?
9. **React & Next.js compatibility** — peer ranges, RSC behavior.
10. **Classification** — dep / peer / devDep / optional peer / separate-package.
11. **Alternatives considered** — and why this one.
12. **Small-utility test** — can this be maintained safely in <~100 lines internally? If yes, prefer that.
13. **Docs/ADRs to change** — the dependency table + any relevant ADR.

## Required validation
- Version + license claims carry a **source + verification date** (add to [`05`](../../../docs/05-dependency-decisions.md#sources)).
- Classification is correct and the dependency does not cross a boundary ([`03`](../../../docs/03-architecture.md#forbidden-import-matrix)).

## Expected outputs
A decision record: add/reject, classification, version+license+date, bundle note, alternatives, and the doc/ADR updates required.

## Documentation updates
- Update the canonical dependency table in [`05`](../../../docs/05-dependency-decisions.md) and the relevant ADR. Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions (hard stops)
- Licensing is unclear or incompatible with a paid library.
- The dependency crosses the browser/server boundary incorrectly.
- It duplicates an existing dependency.
- It would introduce **Remotion into a core React package**.
- It requires secrets in client code.
For anything Remotion/redistribution-related, also run [`commercial-license`? see 08] and consult [`08-remotion-license-analysis.md`](../../../docs/08-remotion-license-analysis.md).

## Prohibited actions
- Adding a runtime dependency safely replaceable in <~100 maintained lines.
- Recording a version/license claim without a source + date.
- Classifying a client-unsafe package as a runtime dep of a client package.
