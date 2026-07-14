# Kinetic Emphasis — signature component design brief

> **Slug:** `kinetic-emphasis` · **Working name in [`docs/36`](../36-premium-creative-component-strategy.md):** Focus Trail Text · **Category:** text-effect (signature) · **Tier:** Free · **Personality:** Expressive
> **Status:** brief → conception gate → originality review → three concepts → implementation
> **Evidence:** `artifacts/signature-components/kinetic-emphasis/`

## User problem

Marketing and product headlines carry one phrase that actually matters, but every animated-text component on the market treats all characters identically — uniform staggers, uniform blurs, uniform scrambles. Teams end up hand-building emphasis (a colored `<span>`, a hand-tuned delay) on top of a generic reveal. There is no text component that *understands emphasis* and choreographs attention toward it.

## Product use case

- Hero headlines where the value phrase must land ("Ship **twice as fast** without breaking a11y").
- Section intros and editorial pull quotes that guide reading order.
- Feature headings where the emphasized phrase persists as designed typography after the animation — the component doubles as a styled-emphasis system at rest, so it earns its place even with motion off.

Three real placements: a SaaS hero (our own homepage), a changelog/launch page headline, a pricing-page section intro.

## Visual concept

Reading emphasis physically travels through the copy in reading order. Words begin de-emphasized (muted, slightly lowered). An activation front sweeps through; each word lifts to full contrast as it activates and leaves a brief accent trace that decays behind the front. When the front reaches an **author-marked emphasis phrase**, the phrase *ignites*: it gains a persistent designed treatment (accent underline wash / highlight) that remains in the final state. The animation ends in a deliberate typographic hierarchy — emphasized phrases visibly styled, everything else clean — never in a uniform "everything faded in" state.

Distinctness at rest: with animation complete (or reduced motion), the component still renders premium emphasis typography. It is excellent standing still.

## Interaction concept

- `play="in-view"` (default): sweeps once when scrolled into view; `play="mount"`, `play="controlled"` (external `active` prop) also supported.
- Replayable (docs preview exposes Replay; consumers re-trigger via `active`/key).
- No pointer dependency — behavior is identical for touch, keyboard, and mouse users. Optional `onComplete` callback.
- Interruption-safe: unmount/re-trigger mid-sweep never strands intermediate styles (Motion handles interruption; final state is deterministic).

## Motion behavior (personality: Expressive)

- Per-word activation staggered in reading order (30–80ms), each word: rise ~0.35em → 0, opacity 0.45 → 1, color muted → fg, 300–450ms ease-out.
- Trail: an accent tint + soft underline glow that peaks at activation and decays over ~500ms — implemented per word (opacity/transform/background only).
- Emphasis ignition: marked phrases get a slightly deeper rise, a 1.02 scale pulse that settles, and a persistent underline wash that draws in (scaleX 0→1) and stays.
- Total sequence for a typical 8–12 word headline: 0.9–1.6s. No bounce; springs restricted to the settle (damping ≥ 26).

## Component anatomy

```
<KineticEmphasis as="h1">            ← real heading element, aria-label = full plain text
  ├── sr-visible aria-hidden word spans (one per word, animated)
  │     └── emphasis words additionally wrapped by a persistent mark treatment
  └── (reduced motion / SSR first paint: final-state styles, no offsets)
```

Emphasis is authored semantically: `<KineticEmphasis>Ship <em>twice as fast</em> …</KineticEmphasis>` — real `<em>` children are the emphasis API. No parallel "indices" prop to drift out of sync.

## API proposal

```ts
interface KineticEmphasisProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;        // text with optional <em>/<strong> marks
  as?: "h1"|"h2"|"h3"|"h4"|"p"|"span";
  play?: "in-view" | "mount" | "controlled";  // default "in-view"
  active?: boolean;                 // for play="controlled"
  speed?: "slow" | "normal" | "fast";  // maps to stagger+duration presets
  trail?: number;                   // 0–1 trail intensity (default 0.6)
  emphasisStyle?: "underline" | "none"; // persistent treatment (a "highlight" wash was cut at v1 per originality guardrails)
  onComplete?: () => void;
}
```

CSS variables for theming: `--ke-accent`, `--ke-muted`, `--ke-underline-thickness`. Advanced escape hatch (grouped, optional): `transition` override per Motion conventions. No timeline arrays, no per-character config.

## Visual states

Initial (de-emphasized, only when JS active and not reduced-motion) · sweeping (front + trail) · ignited (emphasis persistent) · final (designed hierarchy) · reduced-motion/SSR/no-JS (final state immediately — never a hidden or empty heading).

## Responsive behavior

Wraps as normal text (word spans are `inline-block` with normal wrapping); `clamp()`-friendly; multi-line sweeps continue in reading order across lines; no fixed widths; tested at 360px, 768px, 1280px, 1920px and at 200% zoom.

## Touch behavior

None required (no pointer dependency). In-view trigger works with touch scrolling.

## Keyboard behavior

Not interactive — no focus stops, no keyboard traps. If placed inside a link/button, the parent's focus behavior is unaffected (spans are `aria-hidden`, non-focusable).

## Reduced-motion behavior

`prefers-reduced-motion` (and `MotionConfig reducedMotion`) renders the final designed hierarchy instantly — emphasis treatment visible, no sweep, no intermediate opacity. Verified by test + recording.

## Forced-colors behavior

Color tricks vanish gracefully: text renders in `CanvasText`; the persistent emphasis underline uses a real text-decoration/border (visible in HCM); trail/highlight effects are `transparent`-safe (no information carried by color alone — emphasis is also real `<em>` semantics).

## Loading / error / empty behavior

SSR/first paint: full text visible in final state (no CLS, no FOIT of meaning); the de-emphasized initial state is applied only client-side immediately before animation. Empty children → renders nothing. Non-text children (elements other than em/strong/br/string) are rendered un-animated with a dev warning.

## Performance budget

- ≤ 5 KB min+gz (component, no deps beyond `motion` peer + cn util).
- Animates `transform`, `opacity`, `background-size/position`, `text-decoration-color` only — no layout properties, no filter blur.
- No per-frame JS beyond Motion's internals; nothing runs offscreen (in-view trigger); zero work after completion.
- 60fps desktop / ≥50fps mobile for headlines ≤ 30 words; document a soft cap (~40 words) with a dev warning.
- DOM: one span per word + one per emphasis mark (bounded by text length).

## Dependency plan

`motion` (already a catalog-wide peer) + `cn`. No new dependencies. No canvas/WebGL. Engine ladder level: Motion for React.

## Preview concept (component-first)

Full-width editorial stage: large multi-line headline (clamp 2.2–4rem) with a real marketing sentence and one emphasized phrase, eyebrow + subcopy for realistic context; controls that map to real props (`speed`, `trail`, `emphasisStyle`, Replay); light/dark; reduced-motion toggle shows the designed final state; a second smaller instance shows `p`/pull-quote usage. The component occupies most of the stage — no dotted box.

## Free or Pro

**Free.** It is the trust-building signature text component (per [`36`](../36-premium-creative-component-strategy.md) free/Pro strategy) and a homepage hero candidate.

## Originality guardrails (from the independent concept-stage review — binding)

Verdict: **Moderate** (`artifacts/signature-components/kinetic-emphasis/originality-review.md`). Closest missed comparables: React Bits Pro *Blur Highlight* (in-view reveal + designated persistent phrase highlight via a `highlightedBits` strings prop) and Aceternity *Hero Highlight* (post-reveal gradient pill sweep on a wrapped phrase). Binding implementation guardrails — drifting on any re-opens High:

1. No blur anywhere.
2. Trail = **per-word decay**, never a line-wide sheen (Shiny Text adjacency).
3. No flat left-to-right marker/gradient-pill phrase sweep; emphasis treatment is **underline-wash-led** (the `highlight` style is cut from v1).
4. Ignition timing **causally tied to the activation front's arrival** — never a fixed post-reveal delay.
5. Emphasis authored **only via semantic `<em>`/`<strong>` children** — never a `highlightedBits`-style strings/indices prop.
6. Preview must not restage the dark-hero-sentence-ending-on-highlighted-phrase composition; emphasis mid-sentence, light + dark shown.
7. Working name "Focus Trail Text" retired ("Focus" evokes React Bits *True Focus*).
8. Implementers must not visit React Bits Pro pages; implementation-stage originality pass required before premium review.

## Competitive similarity risk (self-assessment; independent originality review required)

Nearest neighbors: React Bits **True Focus** (viewfinder frame jumps between words, rest blurred — different anatomy: ours has no frame, no blur-the-rest), **Variable Proximity** (cursor-proximity variable font weight — ours has no pointer dependency, no weight animation), **Shiny Text** (looping sheen overlay — ours has no overlay sheen; the trail is per-word activation decay, plays once, and ends designed), generic Split/Blur/Gradient text (uniform staggers — ours is semantically weighted and ends in persistent hierarchy). Assessed **Moderate**, pending independent review.

## Originality justification

The ownable idea: **emphasis-aware choreography with a persistent designed end state, authored via real `<em>` semantics.** Every competitor text effect is content-blind and ends uniform. Ours reads the author's semantic emphasis, choreographs attention toward it, and leaves real typography behind. This ties directly to the product moat (semantic motion, [`27`](../27-product-differentiation.md)) and is simultaneously an accessibility feature (emphasis is real markup, not decoration).

## Acceptance criteria

1. Renders full text SSR/no-JS/reduced-motion with the designed final hierarchy (no hidden content, no CLS).
2. Screen readers announce the sentence exactly once, including native `<em>` semantics; animated spans hidden.
3. `play` modes work and are interruption-safe under rapid re-trigger.
4. Both themes + forced-colors legible; emphasis distinguishable without color.
5. Perf budget met (bundle + frame rate evidence persisted).
6. Independent originality review ≤ Moderate; independent premium-visual-review meets [`premium-visual-review`](../../.claude/skills/premium-visual-review/SKILL.md) minimums.
7. Unit + a11y (axe) + reduced-motion tests; clean-fixture install passes.

---

## Conception-gate verdict (signature-component-conception)

*Recorded 2026-07-14 after running the gate checklist:*

- Automatic-rejection triggers: **not** "text with blur" (no blur anywhere; core idea is semantic emphasis choreography, and the at-rest state is a designed typographic system, not an effect). Not a renamed competitor effect (nearest neighbors compared above — different driver, anatomy, end state). Has use case, mobile strategy (none needed — no pointer), reduced-motion strategy, a11y model, clear API, no heavy deps. No internal overlap: Blur Text (uniform de-blur reveal) is demoted to supporting and is visually/behaviorally distinct; if confusion arises in the catalog, Blur Text folds into supporting text utilities per [`37`](../37-signature-component-roadmap.md).
- Spine test: with the effect removed, a styled semantic-emphasis heading remains — useful on its own. ✓
- Use-case test: SaaS hero, launch/changelog headline, pricing section intro. ✓
- Feasibility: all stated, plausible, no TBDs. ✓

**Verdict: Build** — proceed to concept-stage originality review and three visual concepts.
