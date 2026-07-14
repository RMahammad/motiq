---
name: premium-visual-review
description: The strict rendered review gate for signature components — scores 16 dimensions (first impression, visual authorship, motion direction, showcase quality, …) on a 5–10 scale from rendered output only, with hard per-dimension minimums that cannot be averaged away. Stricter than component-sellability-review.
allowed-tools: Read, Write, Bash, Grep, Glob, browser and screenshot tools available in the environment
---

# Premium visual review

The final approval gate for signature components. It is **stricter than** [`component-sellability-review`](../component-sellability-review/SKILL.md) and consumes the evidence set in `artifacts/signature-components/<slug>/`. Run by an **independent reviewer context that did not implement the component** (no-self-approval rule). The reviewer begins read-only: findings first, fixes after.

## Use this skill when

- A signature component has completed implementation, rendered-preview iteration, accessibility review, performance review, clean-fixture install, and an implementation-stage `originality-review`.
- Re-reviewing after fixes from a prior premium review.

## Do not use this skill when

- The component is a supporting/foundation item (use `component-sellability-review`).
- The evidence set is incomplete — return the list of missing evidence instead of reviewing partially.

## Required evidence (all persisted in `artifacts/signature-components/<slug>/`)

- Concepts: `concept-a.png`, `concept-b.png`, `concept-c.png`, `selected-concept.md`
- Rendered stills: `desktop-dark.png`, `desktop-light.png`, `tablet.png`, `mobile.png`, `forced-colors.png`, `zoom-200.png`
- Motion evidence (static screenshots are insufficient for motion approval): `normal-interaction.webm`, `rapid-interaction.webm`, `reduced-motion.webm`, `touch.webm`, `keyboard.webm` (or equivalent frame sequences / Playwright traces)
- `performance.json`, `bundle-report.json`, originality-review verdict, clean-fixture result **re-run after the latest source change**.

## Scoring dimensions (score every one, 1–10)

1. First impression · 2. Visual authorship (does it look designed by an author, not assembled from defaults?) · 3. Composition · 4. Typography · 5. Material & surface treatment · 6. Color behavior (both themes) · 7. Motion direction (does motion have intent and personality?) · 8. Interaction quality · 9. State continuity (interruption, reversal, rapid input) · 10. Responsive quality · 11. Touch quality · 12. Accessibility · 13. Reduced motion · 14. Performance · 15. Production usefulness · 16. Showcase quality.

## Scale

- **10** exceptional and memorable · **9** commercially compelling · **8** strong but familiar · **7** competent and ordinary · **6** unfinished · **5 or below** reject.

## Premium approval minimums (no averaging — one failing dimension fails the review)

First impression ≥ 9 · Visual authorship ≥ 9 · Motion direction ≥ 9 · Production usefulness ≥ 8 · Accessibility ≥ 9 · Responsive quality ≥ 8 · Performance ≥ 8 · Showcase quality ≥ 9 · no critical issues · no unresolved major issues · similarity risk **Low or Moderate** (from `originality-review`).

**Strongly Sellable** additionally requires (per [`docs/32`](../../../docs/32-component-quality-tracker.md) status set): Motion quality ≥ 9, Originality ≥ 8, API quality ≥ 8, Production evidence ≥ 9. **Category-leading** requires most scores 9–10, none below 8, a concrete commercial advantage, and independent reviewer approval.

## Procedure

1. Verify evidence completeness; reject the review request (not the component) if evidence is missing or stale.
2. Review stills and recordings **before** reading the source. First-impression score is recorded before any code is opened.
3. Score all 16 dimensions with one-line justifications each.
4. List issues by severity (critical / major / minor) with the evidence file that shows each.
5. Deliver a status: **Category-leading · Strongly Sellable · Sellable · Production-ready but ordinary · Needs polish · Needs redesign · Reject · Experimental.**
6. Write the review to `artifacts/signature-components/<slug>/independent-review.md` and update [`docs/32`](../../../docs/32-component-quality-tracker.md) keeping any prior self-scores visible.

## Stop conditions

- "Production-ready but ordinary" is a valid, honest terminal status — do not massage it upward.
- Escalate only for license uncertainty or evidence that cannot be produced in this environment.

## Prohibited

- Approving from source inspection, from tests passing, or from ephemeral screenshots.
- Approving motion from static images.
- Averaging a failing dimension away, or rounding 8.5 "up to 9" to pass a minimum.
- The implementing agent scoring its own component (it may prepare evidence; it may not approve).
- Featuring a component on the homepage hero before it is independently Strongly Sellable or Category-leading.
