---
name: originality-review
description: Competitive originality gate for signature components — researches visually similar competitor components, compares interaction/layout/animation/API/preview, scores similarity risk (Low/Moderate/High/Unacceptable), and blocks shipping at High or Unacceptable. Renaming is never a fix.
allowed-tools: Read, Write, Grep, Glob, WebSearch, WebFetch, browser tools available in the environment
---

# Originality review

Clean-room protection for a commercially sold library. We compete with React Bits, Aceternity UI, Animate UI, Magic UI and others whose code is publicly visible but **not** freely reusable in a commercial competitor — and even where reuse were legal, imitation destroys our differentiation claim. Every signature component passes this review **twice**: once at concept stage (after `signature-component-conception`) and once against the rendered implementation (before `premium-visual-review` can approve).

## Use this skill when

- A signature-component brief has a Build verdict (concept-stage pass).
- A signature implementation is rendered and about to enter independent premium review (implementation-stage pass).
- Anyone suspects accidental imitation of a competitor component.

## Do not use this skill when

- Reviewing generic, unownable patterns in supporting components (a tabs indicator, a fade) — note them as generic and move on.

## Required context

- [`docs/35-react-bits-quality-study.md`](../../../docs/35-react-bits-quality-study.md) — including the do-not-recreate name lists and the licensing section.
- The component brief in `docs/signature-components/` and (at implementation stage) rendered screenshots/recordings.

## Procedure

1. **Research visually similar components.** Search the reference products (React Bits free + Pro, Aceternity, Animate UI, Magic UI, shadcn ecosystem registries) and the wider web for components a reasonable developer would call "the same thing". Record names + URLs.
2. **Compare interaction principles.** What drives the effect (pointer, scroll, time, state)? What are the interaction rules?
3. **Compare layout / visual anatomy.** Structure, composition, layering — not just colors.
4. **Compare animation.** Sequencing, choreography, what property animates in what order.
5. **Compare API.** Prop names and the conceptual model exposed to users.
6. **Compare preview presentation.** Does our showcase composition read as a copy of theirs?
7. **Identify accidental imitation** — convergence that happened without copying but still reads as the competitor's component.
8. **Identify generic patterns** — unownable fundamentals (fade, stagger, height-auto expand, carousel mechanics) that do not count toward similarity.
9. **Identify the original value** — what is defensibly ours: the interaction model, anatomy, use case, or API that a competitor page does not have.
10. **Score similarity risk** and record the full comparison in the brief or `artifacts/signature-components/<slug>/originality-review.md`.

## Similarity-risk levels

- **Low** — a knowledgeable developer would not name a specific competitor component when seeing ours.
- **Moderate** — shares a family resemblance (same category, some overlapping ideas) but distinct interaction model, anatomy, and API. Shippable; record the differences explicitly.
- **High** — a knowledgeable developer would say "this is X from Y with different styling". **Blocks shipping.**
- **Unacceptable** — recognizably the competitor's component (interaction + anatomy + sequencing align), regardless of renamed props or restyled colors. **Blocks shipping; treat as a licensing exposure.**

## Remediation rules

Superficial renaming is never a remediation. If similarity is High or Unacceptable, change at least one of, and usually several of:

- the interaction model (what drives it, how it responds),
- the visual anatomy (structure and composition, not palette),
- the sequencing/choreography,
- the API's conceptual model,
- the target use case,

— or **reject the component**. Re-run this review after remediation.

## Required output

A written verdict: researched comparables (names + URLs), per-dimension comparison, generic-vs-ownable analysis, the original value statement, the similarity-risk level, and (if High/Unacceptable) required remediations. Record the risk level in the quality tracker row.

## Stop conditions

Stop and escalate to the user for any suspected **licensing** exposure (e.g. the implementation was influenced by source we may not reuse) — that is a license-uncertainty blocker, not a design decision.

## Prohibited

- Approving High/Unacceptable similarity because the deadline is near or the component is good.
- Treating a renamed prop set or a re-colored theme as differentiation.
- Skipping the implementation-stage pass because the concept-stage pass was Low.
- Copying competitor source, effect recipes, shaders, or docs text during research into our repo — research records *observations*, never code.
