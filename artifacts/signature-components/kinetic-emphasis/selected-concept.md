# Kinetic Emphasis — concept selection (2026-07-14)

Three rendered concepts (lab page `apps/docs/app/lab/kinetic-emphasis/page.tsx`, captured to `concept-{a,b,c}.png` + `concept-{a,b,c}-mid.png`). They differ in composition, motion behavior, sequencing, surface treatment, and hierarchy — not colorways.

## Concept A — "Reading current" ✅ SELECTED
Reading-order activation front; each word lifts from a muted lowered state to full contrast leaving a decaying accent trace; author-marked `<em>` phrases ignite in sync with the front into a persistent accent color + glowing underline. Ends in a designed hierarchy.

**Why selected**
- The motion *is* the concept: attention physically travels in reading order and lands on the marked phrase — the semantic-emphasis idea is legible in one viewing (mid-frame proves it: passed words settled, front at "emphasis," upcoming words still muted).
- Strongest end state: accent + underline hierarchy doubles as premium emphasis typography at rest → excellent with motion off (reduced-motion/SSR state is genuinely designed).
- Satisfies every originality guardrail structurally: per-word trail decay (not a line sheen), ignition causally tied to front arrival, no blur, no pointer dependency.
- Tuning noted for implementation: trail decay in the prototype lingers ~4 words behind the front; production tightens decay so ~2 words trail (keeps the "current" reading).

## Concept B — "Depth settle" ❌ rejected
Emphasis words converge from a front plane first (scale 1.28 → 1 + pill highlight), then the rest settles in reading order behind them.
- Emphasis-before-context breaks reading comprehension: the phrase pops before the sentence exists — impressive but harder to *read*, which contradicts the component's purpose.
- The boxed pill treatment reads as text selection, and per-word pills fracture multi-word phrases into separate boxes (visible in `concept-b.png`).
- Large-scale initial pop feels gimmicky at hero sizes and pattern-matches toward highlight-pill treatments we were warned away from (Hero Highlight adjacency).

## Concept C — "Editorial markup" ❌ rejected
Masked per-word baseline rise, then a skewed highlighter wash draws across the phrase and a rule underlines the block.
- The masked line-rise is the most commoditized reveal in the category (generic pattern — adds no ownable identity).
- The post-reveal highlighter-draw is exactly the "fixed post-reveal delay + marker sweep" sequencing the originality review flags as Hero Highlight / rough-notation adjacency.
- Two-stage timing (reveal → mark) is slower to the payoff with a familiar payoff.

## Consequences applied
- `emphasisStyle: "highlight"` cut from v1 API (underline-wash-led treatment only) per originality guardrail.
- Working name "Focus Trail Text" retired ("Focus" evokes React Bits True Focus); product name **Kinetic Emphasis**.
- Preview staging will avoid the dark-hero-sentence-ending-on-highlighted-phrase composition; emphasis sits mid-sentence, shown in light and dark.
