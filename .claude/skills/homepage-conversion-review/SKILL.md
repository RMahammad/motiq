---
name: homepage-conversion-review
description: Evaluate the homepage for clarity, differentiation, CTA hierarchy, live product proof, pricing clarity, and honest trust — without dark patterns. Run after a homepage change and before calling it done.
allowed-tools: Read, Bash, Grep, Glob
---

# Homepage conversion review

## Use this skill when
After a homepage redesign or major hero/section change, before completion.

## Do not use this skill when
Reviewing an internal docs page (use `documentation-maintenance`) or a component page (use `visual-quality-gate`).

## Required context
[`docs/27-product-differentiation.md`](../../../docs/27-product-differentiation.md) (the moat + why‑pay), [`docs/28-visual-direction.md`](../../../docs/28-visual-direction.md), [`docs/29-go-live-checklist.md`](../../../docs/29-go-live-checklist.md) (pricing state), [`docs/12`](../../../docs/12-accessibility-standard.md).

## Inputs
The running homepage URL (start the docs dev server).

## Procedure
Render and evaluate: above‑the‑fold clarity · product differentiation visible · primary vs secondary CTA hierarchy · **live product proof in the first viewport** · pricing clarity (free vs paid; proposed state, no invented numbers) · navigation clarity · scroll progression · objection handling · trust (no fakery) · docs access · final CTA · **mobile** conversion · accessibility · performance · **can the visitor try the product without leaving the page?** · does the page show **why it's paid**? · are claims **verified by demos**?

## Required validation
Confirm on the rendered page (desktop + mobile). Any missing live proof above the fold is a **major** finding.

## Expected outputs
Primary visitor goal · current funnel · conversion blockers · message hierarchy · CTA hierarchy · missing proof · recommended changes · mobile findings · a11y findings · PASS/FAIL.

## Documentation updates
None; record findings in the PR/commit.

## Stop conditions
FAIL if the first viewport lacks real product proof, the moat isn't communicated, pricing/offering is absent or invented, or CTAs lack hierarchy.

## Prohibited actions
Do not recommend fake urgency/countdowns/testimonials/logos/metrics/downloads/awards, forced account creation, hidden pricing, deceptive button hierarchy, or any dark pattern.
