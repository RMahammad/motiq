---
name: visual-quality-gate
description: Screenshot-based review after implementing a page, major section, signature component, doc template, theme, or large responsive change. Approves only on rendered evidence, not source inspection. Major failures block completion.
allowed-tools: Read, Bash, Grep, Glob
---

# Visual quality gate

## Use this skill when
After implementing a page, a major section, a signature component, a documentation template, a theme, a component catalog, or a large responsive change.

## Do not use this skill when
Reviewing non-visual code, or a change with no rendered surface.

## Required context
[`docs/28-visual-direction.md`](../../../docs/28-visual-direction.md) (selected direction + anti‑patterns), [`docs/12`](../../../docs/12-accessibility-standard.md), [`docs/13`](../../../docs/13-performance-standard.md).

## Inputs
The running app URL (start the dev server per [`/CLAUDE.md`](../../../CLAUDE.md) commands) and the section/page under review.

## Procedure
1. Render the target and **capture real screenshots** at: wide desktop, laptop, tablet, mobile; light + dark; reduced‑motion where visually relevant. (Use the in‑app Browser tools; do not approve from source alone.)
2. Review: visual hierarchy · typography · alignment · spacing rhythm · color/token/shape/border/shadow consistency · responsive behavior · interaction states (hover/focus‑visible/active/loading/disabled/open) · motion quality & continuity · reduced‑motion · dark mode · forced‑colors · empty/loading/error states · keyboard · touch.
3. Judge against the anti‑pattern list: generic look? equal‑card rows? browser‑default controls? obvious focal point? **real product proof present?** demonstrates differentiation? relies on glow/gradient/decoration instead of structure?
4. Classify issues (critical / major / minor / a11y / responsive / motion) and fix; **re‑screenshot** to confirm.

## Required validation
Screenshots at every listed breakpoint + theme. Major or accessibility failures **block** completion.

## Expected outputs
PASS/FAIL · screenshot list · critical/major/minor issues · a11y/responsive/motion issues · recommended fixes · re‑validation results.

## Documentation updates
None required; link findings in the PR/commit message.

## Stop conditions
FAIL and stop if the result looks generic, uses equal‑card default layouts, has no real product proof, or relies on decoration for its premium feel.

## Prohibited actions
Do not approve based only on reading source. Do not accept fake controls/metrics/proof. Do not skip the reduced‑motion or dark screenshots.
