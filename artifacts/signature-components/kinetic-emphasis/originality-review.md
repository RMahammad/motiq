# Originality review — Kinetic Emphasis (concept stage)

> **Slug:** `kinetic-emphasis` · **Stage:** concept (post-conception-gate, pre-implementation)
> **Reviewer:** independent originality reviewer (did not author the brief)
> **Date:** 2026-07-14
> **Method:** rendered-docs and web research only. **No competitor source code was fetched, read for implementation, or copied.** React Bits Pro was examined via its public docs page's behavioral description only.
> **Inputs:** [`docs/signature-components/kinetic-emphasis.md`](../../../docs/signature-components/kinetic-emphasis.md) · [`docs/35-react-bits-quality-study.md`](../../../docs/35-react-bits-quality-study.md) §7 · [`originality-review` skill](../../../.claude/skills/originality-review/SKILL.md)

---

## Verdict summary

**Similarity risk: MODERATE — shippable at concept stage, with mandatory design guardrails recorded below.**

The concept as a whole (semantic-`<em>`-driven choreography, reading-order activation front with decaying trail, designed persistent end state) is not recognizably any single competitor component. However, the brief's self-assessment **missed the two most dangerous comparables** — React Bits **Pro "Blur Highlight"** and Aceternity **"Hero Highlight"** — and both of the concept's two halves individually live in crowded territory:

1. *Word-by-word staggered activation* is a **generic, unownable pattern** (Aceternity Text Generate Effect, Magic UI Text Reveal/Text Animate, Motion-Primitives Text Effect, GSAP SplitText, karaoke captions).
2. *A persistent highlight/underline that draws onto a marked phrase* is an **established competitor identity** (Aceternity Hero Highlight, Animate UI Highlight Text, shadcn.io Highlight Text, rough-notation, React Bits Pro Blur Highlight).

The defensible originality is the **combination mechanics and the API**, not either half. If the implementation drifts toward "generic stagger + left-to-right background sweep on the last phrase," it becomes a High-risk Hero Highlight/Blur Highlight read-alike. The guardrails in §10 exist to prevent exactly that drift and **must be re-verified at the implementation-stage pass**.

---

## 1. Researched comparables (names + URLs)

### Tier 1 — closest neighbors (reveal + designated-phrase persistent highlight)

| Component | URL | What it does (observed behavior) |
|---|---|---|
| **React Bits Pro — Blur Highlight** | https://pro.reactbits.dev/docs/components/blur-highlight | Paragraph enters viewport blurred (default 8px) at low opacity (0.3); blur clears; **author-designated words/phrases (`highlightedBits` string-match array) receive a colored highlight that sweeps across them** in a chosen direction (left/right/top/bottom) and remains. Viewport-triggered, once or repeating. **The closest single competitor component to this concept. Not in the brief's self-assessment.** |
| **Aceternity — Hero Highlight** | https://ui.aceternity.com/components/hero-highlight | Hero section (interactive dot-pattern background) + a `Highlight` inline wrapper: a gradient background pill **sweeps across the wrapped phrase after the headline enters and persists** in the final state. Demo headline ends on the highlighted phrase ("…a copy, of a copy, of a copy"). Anatomy: rounded gradient-pill background behind inline text, dark cinematic hero staging. **Not in the brief's self-assessment.** |
| **Animate UI — Highlight Text** | https://animate-ui.com/docs/primitives/texts/highlight | Text primitive: gradient highlight sweeps across the full text (`text` string prop), in-view triggered (`inView`, `inViewOnce`), ~2s easeInOut default, Motion `transition` prop. Whole-string highlight, not phrase-designating. |
| **shadcn.io — Highlight Text** | https://www.shadcn.io/text/highlight-text | "Highlighter pen" effect: background-size grows 0%→100% across the text as if drawn, scroll/in-view triggered, persists. Same family as Animate UI's. |
| **rough-notation** (library, not a catalog component) | https://roughnotation.com/ · https://github.com/rough-stuff/rough-notation | Hand-drawn SVG annotations (underline, highlight, box, circle, strike) that **animate in on `show()` and persist**; annotation groups animate in order. 3.8kb. The canonical "persistent drawn emphasis" library. |
| **Aceternity — Pointer Highlight** | https://ui.aceternity.com/components/pointer-highlight | In-view-triggered animated rectangle border + pointer icon around a phrase; the rectangle persists as inline emphasis. Different anatomy (cursor-and-box, collaborative-tool metaphor). |

### Tier 2 — word-by-word reveal components (the "activation" half)

| Component | URL | What it does |
|---|---|---|
| Aceternity — Text Generate Effect | https://ui.aceternity.com/components/text-generate-effect | Words fade (optionally de-blur) in one-by-one on load with a fixed stagger. Ends uniform. Content-blind. |
| Magic UI — Text Reveal | https://magicui.design/docs/components/text-reveal | Scroll-scrubbed: each word's opacity goes muted→full **in reading order** tied to scroll position (sticky section). State persists as scrolled. Content-blind, scroll-driven. |
| Magic UI — Text Animate | https://magicui.design/docs/components/text-animate | Generic multi-preset per-word/char/line stagger (fade, blur, slide…). |
| React Bits — Scroll Reveal | https://reactbits.dev/text-animations/scroll-reveal | Scroll-triggered per-word stagger from low opacity + blur (+ container rotation) to final. Content-blind, blur-based. |
| React Bits — True Focus | https://reactbits.dev/text-animations/true-focus | Camera-viewfinder corner brackets jump word-to-word; **non-active words stay blurred**; loops automatically or follows hover. Depth-of-field metaphor. |
| React Bits — Shiny Text | (do-not-recreate list, docs/35 §7) | Looping sheen/gradient sweep overlay across the text. Decorative, endless, no end state. |
| React Bits — Variable Proximity | (do-not-recreate list, docs/35 §7) | Cursor-proximity variable-font weight/size response. Pointer-driven. |
| Motion-Primitives — Text Effect | https://motion-primitives.com/docs/text-effect | Per-word/char stagger with preset or custom Motion variants. The generic building block. |
| Animate UI — Splitting Text | https://animate-ui.com/docs/primitives/texts/splitting | Split-based per-unit stagger reveal. Generic. |
| GSAP SplitText (pattern, not product) | https://gsap.com/docs/v3/Plugins/SplitText/ | The underlying split-and-stagger technique; countless demos (masked reveals, line/word/char staggers). |

### Tier 3 — bespoke design-pattern territory (not products, but shapes perception)

| Pattern | URL | Relevance |
|---|---|---|
| Codrops "On-Scroll Text Highlight Animations" (2024) | https://tympanus.net/codrops/2024/04/17/some-on-scroll-text-highlight-animations/ | Editorial demos where single words get highlight treatments as they scroll into view (GSAP + Flip). Mostly one-word optimized, scroll-driven. |
| Let's Build UI "Highlighting Text on Scroll" | https://www.letsbuildui.dev/articles/highlighting-text-on-scroll/ | Scroll-scrubbed word-by-word highlight (karaoke-on-scroll) tutorial. |
| Karaoke / lyric captions | (generic; e.g. https://animatecaptions.com/karaoke-captions) | Words light up in reading order as spoken, sometimes with trailing decay. **The reading-order "activation front" is a decades-old generic pattern from lyric displays.** |

Not meaningfully similar (checked, excluded): Aceternity Flip Words / Typewriter / Text Reveal Card / Colourful Text (word-swap, typing, hover-mask, per-char color loops — different categories); Animate UI Counting/Rolling/Rotating/Gradient/Shimmering Text; Magic UI Word Pull Up / Line Shadow / Aurora Text; React Bits Split/Blur/Decrypted/Scrambled/Gradient/Falling Text (uniform content-blind reveals or loops, compared in aggregate as "generic staggers" below).

---

## 2. Interaction principles (what drives it)

| | Kinetic Emphasis | Closest competitors |
|---|---|---|
| Driver | Time-based sweep, played **once**, triggered by in-view/mount/controlled prop | Blur Highlight: viewport once/repeat. Hero Highlight: mount. Highlight Text: in-view. True Focus: **loop or hover**. Variable Proximity / Pointer Highlight: **pointer**. Magic UI Text Reveal / RB Scroll Reveal: **scroll-scrubbed**. |
| Pointer dependency | None (explicit) | True Focus (hover mode), Variable Proximity, Pointer Highlight are pointer-dependent |
| End condition | Deterministic designed final state; zero work after completion | Shiny Text/True Focus loop forever; scroll-scrubbed ones have no owned end state; Hero Highlight/Blur Highlight do end persistent (**overlap**) |
| Emphasis source | **Real `<em>`/`<strong>` children** (semantic markup is the API) | Blur Highlight: `highlightedBits` string-match array. Hero Highlight: manual `<Highlight>` wrapper. Everything else: content-blind |

**Finding:** the play-once/in-view trigger and "ends persistent" overlap with Blur Highlight and Hero Highlight. The `<em>`-as-API and the "activation front travels through every word before igniting emphasis" interaction rule are not observed anywhere.

## 3. Layout / visual anatomy

- **Kinetic Emphasis:** real heading element; one inline-block span per word; emphasis phrases carry a persistent **typographic** treatment (underline wash / highlight) integrated into the text; no frames, no overlays, no pointer chrome, no blur; multi-line wrapping is first-class.
- **True Focus:** four-corner viewfinder bracket overlay + glow + blurred siblings — completely different anatomy (ours has no frame and never degrades non-emphasis words with blur).
- **Hero Highlight:** rounded gradient pill behind an inline phrase inside a dot-grid hero **section** — the pill-on-dark-hero is their identity; ours must not present as a gradient pill.
- **rough-notation:** SVG hand-drawn strokes overlaid on elements — sketchy/hand-drawn identity; ours is clean typographic.
- **Blur Highlight:** paragraph-level treatment; anatomy centers on the blur veil clearing + directional color sweep on matched strings.
- Generic staggers: same span-per-word skeleton as ours — **unownable** (see §8).

**Finding:** anatomy is distinct from every named competitor *provided* the emphasis treatment stays typographic (underline wash / designed mark) and does not converge on the gradient-pill or flat marker-sweep look.

## 4. Animation sequencing / choreography

- **Kinetic Emphasis:** single reading-order front; per word rise + contrast lift (300–450ms, 30–80ms stagger); a **decaying accent trace (~500ms) behind the front**; when the front reaches an `<em>` phrase, a distinct **ignition**: deeper rise, 1.02 settle pulse, underline wash draws and persists; total 0.9–1.6s; ends in hierarchy, no bounce.
- Text Generate Effect / Text Animate / Splitting Text / SplitText demos: uniform stagger, identical treatment per word, uniform end. No front-with-trail, no per-phrase divergence.
- Blur Highlight: two coordinated phases (un-blur, then sweep highlights) but **paragraph-at-once**, not a traveling per-word front; no trail; no per-word activation.
- Hero Highlight / Highlight Text / rough-notation: single sweep on the marked phrase only; the rest of the sentence is not choreographed at all.
- Karaoke captions (generic): reading-order light-up, sometimes with decay — the closest ancestor of the "front + trail," and the reason the front alone cannot be claimed as ours.

**Finding:** the two-tier choreography (every word activates; marked phrases *ignite differently and persistently*, timed to the front's arrival) is not observed in any researched product. The front-with-decay alone reads as karaoke/sheen if the ignition is weak — the differentiation lives in the ignition being unmistakably a second, semantic tier.

## 5. API conceptual model

- **Kinetic Emphasis:** children with real `<em>`/`<strong>` = emphasis; `as`, `play`, `active`, `speed` presets, `trail` intensity, `emphasisStyle`, `onComplete`; CSS vars for theming. Conceptual model: *"write a semantic sentence; the component choreographs it."*
- Blur Highlight: `highlightedBits` string arrays + direction/duration/delay/opacity numbers. Model: *"tell me which substrings to paint."* Materially different and weaker (drift-prone string matching) — ours must **never** add an indices/strings prop, or the API distinction collapses.
- Animate UI Highlight Text: `text` string prop (no children semantics), `transition` object.
- Hero Highlight: manual wrapper composition, no semantics.
- Generic staggers: `by="word"`, `delay`, `duration`, preset names.

**Finding:** the semantic-markup API is genuinely distinct, is the moat tie-in (semantic motion, docs/27), and doubles as the a11y story. No researched competitor reads document semantics to drive choreography.

## 6. Preview presentation

Competitor identities to avoid: Hero Highlight's **dark cinematic hero with the gradient-pill phrase as the sentence finale**; True Focus's single-line looping demo; React Bits' dark-neon full-bleed stage; Aceternity's cinematic-dark staging (docs/35 §6 explicitly reserves these). The brief's editorial stage (eyebrow + subcopy, light/dark, Direction A violet studio, second pull-quote instance, working `speed`/`trail`/`emphasisStyle`/Replay controls) does not read as any of those. **Implementation-stage check:** do not stage the demo headline so the emphasized phrase is a color-pill at the end of a dark hero sentence — that composition *is* Hero Highlight's preview.

## 7. Accidental-imitation risks (convergence to watch)

1. **Ignition = plain left→right background sweep** → converges on Hero Highlight / Animate UI / shadcn.io / rough-notation `highlight`. Highest-probability accident.
2. **Underline draw-in as bare `scaleX` 0→1 accent line** → generic link-hover underline; also rough-notation's underline in clean form. Needs a designed "wash" (thickness/tint/texture behavior) to be ours.
3. **Trail rendered as a moving sheen/gradient overlay across the whole line** → converges on Shiny Text. The trail must be **per-word activation decay**, never a continuous overlay sweep.
4. **De-emphasized words rendered blurred** → converges on True Focus / Blur Highlight / Scroll Reveal. Brief already bans blur; keep it banned (muted color + slight offset only).
5. **Working name "Focus Trail Text"** (docs/36) — "Focus" + per-word attention directly evokes React Bits **True Focus** to any knowledgeable developer, and §7's list makes True Focus a named do-not-recreate. Naming is never a *remediation*, but adopting a competitor-evoking name is an *imitation vector* in itself. Ship under "Kinetic Emphasis" (or similar); drop "Focus" from all public naming and marketing.

## 8. Generic, unownable patterns (do not count toward similarity)

- Splitting text into word spans; per-word stagger in reading order; opacity/rise entrance; in-view triggering; `once` semantics; Motion `transition` escape hatch (table stakes per docs/35 §6); karaoke-style reading-order light-up as a broad pattern; underline/highlight as typographic devices per se.

These are fundamentals. Our claim cannot rest on them, and competitors' use of them does not make us imitators.

## 9. Original value statement (what is defensibly ours)

**A text component that reads the author's real `<em>` semantics and choreographs attention toward them — every word activates in reading order behind a decaying front, marked phrases ignite in sync with the front's arrival, and the animation ends in a persistent, designed typographic hierarchy that is equally the reduced-motion/SSR/no-JS state.** No researched competitor: (a) derives choreography from document semantics, (b) choreographs the *whole* sentence and the emphasis as two coordinated tiers, or (c) treats the designed at-rest hierarchy as the product (competitors end uniform, loop forever, or only animate the marked phrase). This is the moat claim (semantic motion, docs/27) expressed as a component, plus an accessibility property no competitor has (emphasis survives as real markup for screen readers and forced colors).

## 10. Risk score and required guardrails

### Score: **MODERATE**

- Not Low: the persistent-phrase-highlight half has many named competitor incumbents (Blur Highlight, Hero Highlight, Highlight Text, rough-notation), and the reveal half is generic; a careless implementation could be named "Hero Highlight plus a stagger" or "Blur Highlight without the blur."
- Not High: no researched component combines semantic-emphasis-driven two-tier choreography, a per-word decaying activation front, a play-once designed end state, and an `<em>`-children API; interaction model, anatomy, sequencing, and API each differ from every named neighbor on multiple dimensions.

### Mandatory guardrails (verified at the implementation-stage originality pass — drift on any of these re-opens the score toward High)

1. **No blur anywhere** (True Focus / Blur Highlight / Scroll Reveal territory). De-emphasis = muted color + slight offset only.
2. **The trail is per-word decay, never a continuous sheen/gradient overlay sweeping the line** (Shiny Text territory).
3. **The `highlight` emphasisStyle must not render as a flat left→right marker/gradient-pill sweep.** Design it as a distinct treatment (e.g., underline-wash-led, tint that arrives with the ignition pulse and settles into typography). If it cannot be made distinct in rendered review, ship `underline` as the only emphasis treatment at v1 and cut `highlight`.
4. **Ignition timing must be causally tied to the activation front reaching the phrase** — never a fixed post-reveal delay (a fixed delay is exactly Hero Highlight's "headline in, then sweep" sequencing).
5. **API stays semantic:** no `highlightedBits`/indices/strings prop, ever (that is Blur Highlight's conceptual model).
6. **Preview staging:** no dark-hero pill-phrase composition; keep the editorial Direction A stage per the brief.
7. **Public naming:** retire "Focus Trail Text" everywhere (docs/36 working name); no "Focus" in the shipped name or marketing copy.
8. **No competitor code, recipes, or docs text** were or may be consulted for implementation; React Bits Pro pages must not be revisited during implementation (docs/35 §0).

### Licensing exposure check

None found at concept stage. Research was rendered-docs/behavioral only; no source fetched or copied. React Bits Pro was observed solely through its public docs page's own behavioral description. The concept was authored before this comparison surfaced Blur Highlight, so no derivation risk exists — but implementers must not study it further.

### Record

Quality-tracker row (docs/32): originality risk **Moderate (concept stage)** — implementation-stage pass required before `premium-visual-review`.

---

# Originality review — Kinetic Emphasis (implementation stage)

> **Slug:** `kinetic-emphasis` · **Stage:** implementation (post-rendered-preview, pre-premium-visual-review)
> **Reviewer:** independent originality reviewer (did not implement the component; separate context from the concept-stage reviewer's implementation guidance)
> **Date:** 2026-07-14
> **Method:** source inspection of the shipped implementation + rendered evidence (desktop light/dark screenshots, `frames/normal-*` and `frames/rapid-*` motion sequences, preview source, catalog metadata). **No competitor source or React Bits Pro pages were visited** — Pro comparisons rely solely on the concept-stage review's recorded behavioral descriptions, per guardrail 8.
> **Inputs reviewed:**
> - `packages/registry/registry/text/kinetic-emphasis.tsx` (implementation)
> - `apps/docs/app/_previews/index.tsx` (`KineticEmphasisPreview`, lines ~466–575) + `apps/docs/lib/catalog.ts` metadata
> - `artifacts/signature-components/kinetic-emphasis/desktop-{dark,light}.png`, `frames/normal-{0100,0300,0500,0700,0950,1200,1500,2000}ms.png`, `frames/rapid-{0120,0400,0800,1600}ms.png`
> - `docs/35-react-bits-quality-study.md` §7 do-not-recreate lists

## Verdict summary

**Implementation-stage similarity risk: MODERATE — all eight binding guardrails PASS. Cleared to proceed to `premium-visual-review`. No remediations required.**

The rendered implementation matches the concept that was scored Moderate and did **not** drift toward the dangerous convergences the concept review flagged (Hero Highlight pill sweep, Blur Highlight strings-prop reveal, Shiny Text sheen, True Focus blur). The score stays Moderate rather than dropping to Low only because the component's two halves still live in crowded families (reading-order word activation; persistent drawn phrase emphasis) — the *combination* is not attributable to any specific competitor, but the family resemblance is real and permanent.

## Guardrail verification (all eight, against source + frames)

| # | Guardrail (binding, from concept stage) | Result | Evidence |
|---|---|---|---|
| a | **No blur anywhere** | **PASS** | Source contains no `filter`/blur (only a `.filter(Boolean)` array call). De-emphasized words in every frame are muted gray + lowered (`opacity 0.35`, `translateY(0.38em)`, muted color) — crisp, never defocused. Note: the persistent underline carries a subtle `box-shadow` glow; this is a decorative accent on a rule, not text defocus, and does not converge on True Focus / Blur Highlight / Scroll Reveal (whose identity is blurred *text*). Non-issue; see watch item 1. |
| b | **Trail = per-word decay, never a line-wide sheen** | **PASS** | Each non-emphasis word owns its own `data-ke-trace` element, animated per word (`opacity [0 → 0.9·trail → 0]`, ~0.45–0.8s). Frames `normal-0300ms`/`0500ms` and `rapid-0400ms` show discrete short bars with gaps under the 2–3 most recently activated words, fading independently behind the front — visibly not a continuous gradient overlay sweeping the line. No overlay element spans more than one word. |
| c | **No flat L→R marker/gradient-pill sweep; underline-wash-led; `highlight` cut from v1 API** | **PASS** | `EmphasisStyle = "underline" \| "none"` — no `highlight` value exists in the shipped API or the preview controls ("Persistent underline" checkbox only). The emphasis treatment is typographic: accent color + semibold + an underline wash (per-word `scaleX` draw with a soft glow and a gradient tail only on the phrase's final word; interior words bridge solid). No background pill, no marker sweep across the text box. Rest state (desktop-dark/light, `normal-2000ms`) reads as designed typography, not a highlighter effect. |
| d | **Ignition causally tied to the front's arrival — never a fixed post-reveal delay** | **PASS** | Delay math (source, `sweep()`): every word's activation is `delay = 0.05 + i * stagger` where `i` is its reading-order index; an emphasized word's underline ignites at `delay + duration * 0.3` — i.e. mid-rise of *that word's own* activation. Ignition therefore moves with the front (and with the `speed` preset), and multi-word phrases ignite progressively word-by-word as the front passes. Confirmed in frames: at `normal-0300ms` the underline is drawing under "understands" while "easing." is still muted; in the slow pull-quote, "Reading has an order" ignites ~950–1200ms exactly as the front reaches it while later words remain muted. This is structurally the opposite of Hero Highlight's "headline in, then sweep" fixed sequencing. |
| e | **Emphasis authored only via semantic `<em>`/`<strong>` children** | **PASS** | `segment()` walks children and derives emphasis solely from `child.type === "em" \|\| "strong"`. Public props: `as, play, active, speed, trail, emphasisStyle, reducedMotion, onComplete` — no `highlightedBits`, no strings/indices/ranges prop of any kind. The accessible layer renders the original children (native `<em>` semantics) exactly once. |
| f | **Preview staging: not a dark-hero-sentence-ending-on-highlighted-phrase; emphasis mid-sentence; light + dark shown** | **PASS** | Editorial stage (eyebrow badge + headline + subcopy + bordered pull-quote + working controls), not a cinematic hero. Emphasis is mid-sentence in both instances: "Motion that *understands emphasis*, not just easing." and "… *Reading has an order* — motion should know it." Both `desktop-light.png` and `desktop-dark.png` are persisted; the treatment is accent text + underline, never a color pill. Composition does not read as Hero Highlight's demo. |
| g | **No "Focus" in shipped name or marketing** | **PASS** | Shipped as `KineticEmphasis` / "Kinetic Emphasis" (catalog name, slug, registry item, docs path). Repo-wide grep of `packages/registry` and `apps/docs` sources finds no "Focus Trail" and no "Focus" in any kinetic-emphasis-related public string. The working name survives only in historical planning docs (docs/36), which is expected and acceptable. |
| h | **No competitor code/recipes/docs consulted; React Bits Pro not revisited** | **PASS (as verifiable)** | This review visited no competitor pages. The implementation is idiosyncratic (motion/mini `animate` over per-word WAAPI targets, custom punctuation-aware segmentation, dual accessible/animated layers) with no structural resemblance to any recorded competitor recipe; nothing suggests derivation. Absolute proof of a negative is not possible from artifacts; no red flags found. |

## Would a knowledgeable developer name a specific competitor?

Judged from the frame sequence honestly:

- **Mid-sweep** (`normal-0100→0700ms`): reads as reading-order activation with decaying per-word traces — the *family* ancestor is karaoke/lyric light-up (generic, unownable), not any catalog product. It does not look like Text Generate Effect (uniform, ends uniform), Shiny Text (continuous looping sheen), or True Focus (bracket frame + blurred siblings, looping).
- **Ignition** (`normal-0300–0950ms`): the emphasized phrase turns accent-colored and semibold with an underline drawing word-by-word *in stride with the front*. Not Hero Highlight (gradient pill background, post-reveal, dark hero), not Animate UI/shadcn.io Highlight Text (whole-string background sweep), not rough-notation (hand-drawn sketch identity; also annotation-only — the rest of the sentence is unchoreographed there, whereas here the whole sentence is the choreography).
- **Rest state** (`normal-2000ms`, desktop shots): accent-colored emphasized phrases with a glowing underline — generic typographic emphasis as a *style* (unownable in either direction), distinctive only in that competitors' text effects do not end in a designed hierarchy at all.
- **Rapid re-trigger** (`rapid-*`): restarts deterministically from the muted state — consistent with our interaction contract, no competitor-specific tell.

Conclusion: a knowledgeable developer would *describe* this ("a sweep that knows which phrase matters and leaves it emphasized") rather than name a competitor component. The two-tier, semantics-driven, causally-timed choreography visible in the frames is the differentiation the concept review demanded, and it survived implementation.

## Why Moderate and not Low

Same structural reason as concept stage: both halves individually remain crowded (word-stagger reveals; persistent drawn phrase emphasis à la rough-notation/Highlight-Text family). A viewer who sees only a cropped still of the ignited phrase could place it in the "animated underline emphasis" family, though not attribute it to a specific product. Moderate is the honest permanent score for this category; it is shippable per the skill's levels, with the differences recorded above.

## Watch items (non-blocking, for premium-visual-review awareness)

1. **Underline glow (`box-shadow`)** — currently subtle and acceptable. Do not intensify it toward a neon-glow identity (React Bits' dark-neon effect identity is a named avoid in docs/35 §6). If premium review asks for "more pop," add it via thickness/tint, not glow radius.
2. **Trail-as-underline-bars at `trail=1`** — at maximum trail intensity several simultaneous decaying bars could momentarily read as a broken line-wide sweep. Default 0.6 renders clearly per-word (verified in frames). If a future default raises trail, re-check against guardrail (b).
3. **Docs example copy** — keep future marketing demos placing `<em>` mid-sentence (per guardrail f); a demo sentence *ending* on the ignited phrase would drift the staging toward the Hero Highlight composition even though the treatment differs.

## Licensing exposure check

None found. No competitor source fetched or consulted during this review; the implementation shows no structural correspondence to any recorded competitor recipe; React Bits Pro observations remain limited to the concept-stage behavioral notes. No stop condition triggered.

## Record

Quality-tracker row (docs/32): originality risk **Moderate (implementation stage — all 8 guardrails PASS, no remediations)**. Cleared for independent `premium-visual-review`.
