---
name: signature-component-conception
description: Creative quality gate that runs BEFORE any signature-component implementation. Rejects derivative or shallow proposals (glow-on-existing, pointer-tracking cards, blur text, renamed competitor effects) and requires a real use case, mobile + reduced-motion strategy, accessibility feasibility, and a clear API before code is allowed.
allowed-tools: Read, Write, Grep, Glob, WebSearch, WebFetch
---

# Signature component conception

The first gate in the signature pipeline: **conception → originality-review → implementation → rendered iteration → accessibility → performance → independent premium-visual-review.** No signature-component code may be written before this skill produces a **Build** verdict on a written design brief.

A signature component is one intended for the homepage hero, the "signature" catalog sections, or Pro positioning. Animated shadcn components use `animated-shadcn-authoring` instead; this gate exists to keep the signature tier scarce and original.

## Use this skill when

- Proposing any new signature creative component (text effect, interactive surface, gallery, background, navigation, product-motion component, block).
- Substantially re-conceiving an existing component into a signature replacement.

## Do not use this skill when

- The work is a supporting/foundation component (route through `product-differentiation-review` + `animated-shadcn-authoring`).
- The brief already passed this gate this session and the concept has not changed.

## Required context

- Strategy: [`docs/36-premium-creative-component-strategy.md`](../../../docs/36-premium-creative-component-strategy.md) · Roadmap: [`docs/37-signature-component-roadmap.md`](../../../docs/37-signature-component-roadmap.md)
- Competitive study: [`docs/35-react-bits-quality-study.md`](../../../docs/35-react-bits-quality-study.md) (including the do-not-recreate name/effect lists)
- Current catalog ([`apps/docs/lib/catalog.ts`](../../../apps/docs/lib/catalog.ts)) — to detect internal overlap.
- Standards: [`docs/12`](../../../docs/12-accessibility-standard.md) a11y · [`docs/13`](../../../docs/13-performance-standard.md) performance · [`docs/27`](../../../docs/27-product-differentiation.md) moat.

## Inputs

A design brief (or draft) at `docs/signature-components/<slug>.md` covering: user problem, product use case, visual concept, interaction concept, motion behavior, anatomy, API proposal, states, responsive/touch/keyboard/reduced-motion/forced-colors behavior, loading/error/empty behavior where relevant, performance budget, dependency plan, preview concept, Free/Pro decision, competitive similarity risk, originality justification, acceptance criteria.

## Procedure

1. **Read the brief in full.** If any required section is missing, return **Redesign concept** with the gaps listed — do not fill them in yourself and approve your own fill.
2. **Test against the automatic-rejection list** below. Any hit → **Reject** or **Redesign concept**.
3. **Test the use case.** Name three real production pages/apps where a team would ship this. "It looks cool in a showcase" is not a use case.
4. **Test the concept's spine.** Remove the signature effect mentally: is the remaining component still a good component? Signature components must be excellent at rest.
5. **Test feasibility.** Accessibility model, reduced-motion fallback, mobile/touch strategy, and performance budget must be *stated and plausible*, not "TBD".
6. **Test the API.** The default API must be semantic (intensity, density, direction, focus, items…) — not shader uniforms, raw timelines, or pointer math.
7. **Test dependency weight.** A heavy dependency (canvas/WebGL lib, physics engine) needs a stated justification of why CSS/SVG/Motion cannot do it, plus isolation + lazy-load + fallback plans (see `creative-performance-review`).
8. **Test internal overlap.** Compare against every current catalog item; visually-similar siblings dilute the catalog.
9. **Deliver the verdict** with reasons, recorded at the bottom of the brief.

## Automatic rejection triggers

Reject (or demand redesign of) a proposal that is only:

- an existing component with a glow, gradient, or blur added;
- a card with pointer/spotlight tracking as its main idea;
- text with blur, fade, or per-character stagger as its main idea;
- a button with scale/press feedback as its main idea;
- an existing React Bits / Aceternity / Animate UI effect with a new name;
- impressive inside the showcase but with no real interface job;
- dependent on a heavy library without decisive value;
- lacking a mobile strategy, a reduced-motion strategy, or a plausible accessibility model;
- lacking a clear default API;
- visually similar to an existing catalog item.

## Required output

One of exactly four verdicts, written into the brief with justification:

- **Build** — proceed to `originality-review`, then three visual concepts.
- **Redesign concept** — the core idea has value but the concept must change (state what must change).
- **Defer** — good concept, wrong time (dependencies, catalog balance, unfinished prior work).
- **Reject** — does not merit signature investment; record why so it is not re-proposed.

## Stop conditions

Stop and escalate only for license uncertainty about a comparable competitor implementation, or a genuine paid-service/credential need for research.

## Prohibited

- Approving a proposal without a written brief.
- Approving your own just-written brief in the same breath without running every test above and recording the results.
- Letting "we need more components" justify a derivative concept — catalog count is explicitly not a goal.
