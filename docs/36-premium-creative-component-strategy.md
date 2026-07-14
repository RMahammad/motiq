# 36 — Premium creative-component strategy

> **Type:** 🟢 Canonical for the signature catalog strategy, candidate scoring, slice selection, motion personalities, and creative budgets · **Last reviewed:** 2026-07-14
> **Inputs:** competitive study [`docs/35`](35-react-bits-quality-study.md) · roadmap [`docs/37`](37-signature-component-roadmap.md) · gates: [`signature-component-conception`](../.claude/skills/signature-component-conception/SKILL.md), [`originality-review`](../.claude/skills/originality-review/SKILL.md), [`premium-visual-review`](../.claude/skills/premium-visual-review/SKILL.md), [`creative-performance-review`](../.claude/skills/creative-performance-review/SKILL.md).

## The corrected product goal

Not "add small animations to standard shadcn components" but: **create original, visually memorable, production-ready animated React components that developers cannot easily reproduce with a basic Motion tutorial.** Two product layers:

- **Layer A — animated application components** (supporting): shadcn/Radix foundations with *meaningful interaction improvements* (dialogs, tabs, menus, sheets, selects, accordions, buttons, notifications, lists, uploads, navigation). Kept accessible, refined, documented — never the homepage identity.
- **Layer B — signature creative components** (the main attraction): text effects, interactive surfaces, galleries, creative navigation, backgrounds, cursor-responsive surfaces, scroll scenes, product showcases, data transitions, premium marketing components, justified lightweight canvas effects.

Our differentiation vs the reference products (from [`35 §5`](35-react-bits-quality-study.md#5-weaknesses--our-opportunities)): **evidence-backed accessibility + reduced motion + performance budgets + tests + system coherence** — the whitespace every competitor leaves open — on top of genuinely original concepts.

## Pillars and exploration backlog

Concepts below are working names, not commitments. Nothing gets built without `signature-component-conception` → brief → `originality-review` → three concepts. Names/effects on the [do-not-recreate lists](35-react-bits-quality-study.md#7-do-not-recreate-lists-names--recognizable-effects) are checked at every gate.

- **A. Kinetic typography:** Focus Trail Text · Depth Type · Elastic Line Reveal · Kinetic Highlight · Perspective Words · Magnetic Letterfield · Gradient Refraction Text · Split Horizon Heading · Variable Weight Pulse · Directional Type Flow · Layered Echo Text · Text Lens · Pixel Resolve Heading · Editorial Mask Reveal. *(Signal Decode rejected — see scoring.)*
- **B. Interactive surfaces & cards:** Magnetic Stack · Depth Map Card · Ambient Border Card · Perspective Feature Card · Layered Product Card · Responsive Lightfield · Elastic Expand Card · Material Shift Card · Cursor Wake Surface · Data Lens Card · Fold Reveal Card. *(Refraction Surface rejected — see scoring. Basic spotlight/pointer-tracking cards are conception-gate auto-rejects.)*
- **C. Galleries & media:** Spatial Gallery · Focus Rail · Elastic Filmstrip · Perspective Media Deck · Layered Carousel · Magnetic Thumbnail Grid · Dynamic Crop Gallery · Depth Scroll Gallery · Portal Image Transition · Editorial Image Stack · Product Storyboard · Interactive Comparison Scene.
- **D. Navigation & interaction:** Elastic Command Menu · Morphing Navigation Rail · Spatial Breadcrumb · Adaptive Island Navigation · Layered Mobile Menu · Focus Trail Menu · Expandable Action Dock · Context Orbit · Directional Tab Rail. *(No macOS-Dock magnification clones.)*
- **E. Backgrounds & environments:** Luminous Topography · Flowing Contours · Chromatic Mesh · Depth Noise · Liquid Lines · Responsive Starfield · Perspective Wirefield · Elastic Gradient Fabric · Signal Field · Diffraction Surface · Orbital Particles. *(Spectral Field / Aurora Veil rejected — aurora-blob space is saturated.)* Every background: light + dark variants, reduced-motion fallback, mobile fallback, density/intensity/color controls, pause/visibility behavior, performance docs, foreground readability.
- **F. Product & SaaS motion:** Notification Stream · Animated Product Tour · Feature Comparison Stage · Interactive Pricing Model · Dashboard State Composer · Command Result Transition · Upload Pipeline · Deployment Timeline · Live Collaboration Stack · Search Journey · Before-and-After Product Scene · Data Story Card · AI Response Stream · Approval Workflow · Status Topology · Product Screenshot Sequencer. These justify premium pricing: they solve complete interaction problems.
- **G. Premium blocks (deferred):** Creative SaaS Hero · AI Product Hero · Interactive Feature Story · Kinetic Pricing Section · Scroll-driven Showcase · Animated Testimonials · Integration Constellation · Product Tour Section · Editorial CTA · Interactive FAQ · Premium Navigation · Advanced Footer. **No block is built until its component dependencies are independently approved.**

## The 12 launch candidates

Each candidate, with the required concept fields condensed. Working names throughout.

### 1. Focus Trail Text — kinetic typography
- **Visual behavior:** an editorial headline where *reading emphasis physically travels through the copy*: a soft focal band sweeps the text; words entering it lift ~2px, reach full contrast, and leave a fading accent trail; author-marked emphasis phrases keep a designed highlight when the sweep settles. The animation ends in a deliberate typographic hierarchy, not a uniform state.
- **Use case:** hero/section headlines that guide reading order toward the value phrase; feature intros; editorial pull quotes.
- **Interaction:** plays on mount/in-view; optional scroll-progress scrubbing; replayable; hover re-sweep optional.
- **A11y:** one real text node (screen readers get the full string once); effect spans `aria-hidden`; emphasis rendered as real `<em>`/`<strong>`. **Reduced motion:** static final hierarchy (emphasis visible, no sweep). **Forced colors:** plain readable text.
- **Perf risk:** low — transform/opacity/background only, no layout animation. **Mobile:** identical (time/scroll driven, no pointer dependency).
- **Originality risk:** Moderate — must stay distinct from React Bits *True Focus* (viewfinder frame + blur) and *Variable Proximity* (cursor-proximity weight): ours is semantic emphasis choreography, no frame, no cursor dependency, and it *ends designed*. Competitor text effects treat all characters equally; ours understands emphasis — that ties to the semantic-motion moat.
- **API:** `children` (with `<em>` marks) or `text` + `emphasis`, `play` (`mount|in-view|scroll|controlled`), `speed`, `trail` (length/intensity), `direction`, `as`, `onComplete`. **Tier: Free.**

### 2. Signal Decode Heading — kinetic typography
Character-resolve headline (noise → text). **Rejected:** the decode/scramble/decrypt/glitch space is saturated (React Bits Decrypted Text, Scrambled Text, Glitch Text, Shuffle) — similarity risk High no matter the styling; a11y also weak (illegible intermediate states).

### 3. Refraction Surface — interactive surface
Glass-refraction card. **Rejected:** glassmorphism cards are saturated (Fluid Glass, Glass Surface, Reflective Card, Chroma Card); credible refraction needs WebGL (heavy) or fakes it (ordinary); similarity High.

### 4. Magnetic Stack — interactive surface
- **Visual behavior:** a coordinated set of content cards resting in a layered stack; pointer proximity (or keyboard focus) *fans* the stack with weighted separation — near cards yield more, far cards less — and the set settles with restrained spring physics. Selecting a card brings it forward with continuous layout; the stack remains a designed composition at rest.
- **Use case:** testimonials, feature sets, portfolio pieces, plan comparison — anywhere 3–6 peer items need engagement without a carousel.
- **Interaction:** pointer proximity + click; full keyboard parity (arrows move focus = same fan behavior); touch: tap to cycle/bring forward with gesture threshold.
- **A11y:** real list semantics, focusable items, visible focus, `aria-selected`; motion never hides content. **Reduced motion:** static fanned layout with selection via instant swap. **Forced colors:** borders on every card.
- **Perf risk:** medium — pointer math in rAF via CSS variables, transform-only. **Mobile:** tap-based, no proximity.
- **Originality risk:** Moderate — React Bits *Stack*/*Card Swap*/*Bounce Cards* are swipe-to-cycle image toys; ours is a keyboard-first coordinated content surface with proximity-weighted choreography. Conception gate must verify the difference visually.
- **API:** `items`/`renderItem`, `activeIndex`/`onActiveChange`, `spread`, `depth`, `interactionMode` (`proximity|select|hover`), `intensity`. **Tier: Free** (the free interactive surface).

### 5. Spatial Gallery — media
- **Visual behavior:** a horizontal media rail with real depth: the focused item stands at full size/sharpness; neighbors recede with scale/parallax layering (no 3D carousel rotation). Focus moves with velocity-aware momentum and settles precisely.
- **Use case:** product screenshots, case studies, photography portfolios, app-store-style feature media.
- **Interaction:** drag/swipe with thresholds + momentum; arrow keys + Home/End; clickable items; optional autoplay off by default.
- **A11y:** listbox/group semantics with labels, visible focus, announced position ("3 of 8"); images require alt. **Reduced motion:** crossfade-free instant focus change, no parallax. **Loading:** stable dimensions via aspect ratios, skeleton slots.
- **Perf risk:** medium — transform-only, virtualization beyond ~12 items, offscreen images lazy. **Mobile:** native-feeling swipe, stable heights.
- **Originality risk:** Moderate — galleries are saturated (Circular/Dome Gallery, Carousel, Flying Posters) but those are ring/dome/infinite gimmicks; ours is a production rail with depth staging. **API:** `items`, `activeIndex`/`onActiveChange`, `depth`, `itemGap`, `aspect`, `onItemClick`, `renderItem`. **Tier: Pro.**

### 6. Elastic Command Menu — navigation/interaction
- **Visual behavior:** a command palette whose results respond *elastically to query changes*: result rows share continuous layout (no list teleporting), group headers morph, the panel height animates smoothly, selection ripples subtly. Feels alive without slowing typing.
- **Use case:** in-app command palettes, docs search, action launchers — a real daily-driver surface.
- **Interaction:** full combobox keyboard model (type, arrows, Enter, Esc), pointer hover parity, recent/empty states.
- **A11y:** ARIA combobox + listbox pattern, `aria-activedescendant`, live result count, focus trap in dialog mode. **Reduced motion:** instant list updates. Interruption-safe: animation never delays input handling.
- **Perf risk:** medium — layout animations capped to visible rows; input latency budget < 16ms.
- **Originality risk:** Low — none of the reference products ships a command menu; the crowded neighbor is cmdk (unstyled, MIT) which we don't copy, we design over the same ARIA pattern.
- **API:** `items`/`groups`, `onSelect`, `open`/`onOpenChange`, `placeholder`, `emptyState`, `speed`, `renderItem`. **Tier: Pro.**

### 7. Adaptive Island Navigation — navigation
Floating pill nav that morphs between states. **Not selected:** dynamic-island clones are widespread (similarity Moderate-High), production value narrower than the command menu; revisit after the slice.

### 8. Spectral Field — background
Aurora-style gradient field. **Rejected:** Aurora/Soft Aurora/Plasma/Silk/Iridescence saturation makes any soft-gradient-blob background read as a copy; similarity High.

### 9. Luminous Topography — background
- **Visual behavior:** layered contour lines (terrain map) in semantic accent tones; a slow light source drifts across the field, brightening the contours it passes; density thins near the content area for readability.
- **Use case:** hero/section backdrop; dashboard empty states; auth screens. Light + dark variants.
- **Interaction:** none required (ambient); optional gentle pointer light-bias.
- **A11y:** `aria-hidden` decorative; contrast-safe under any foreground via density/intensity props; documented overlay recipe. **Reduced motion:** static contours, no drift. **Pauses** offscreen + when tab hidden.
- **Perf risk:** low-medium — SVG paths animated with CSS/WAAPI (dashoffset/opacity/transform), no canvas, no per-frame JS when idle. **Mobile:** reduced density preset.
- **Originality risk:** Low-Moderate — no contour-terrain background in the reference catalogs (their line-family items are Threads/Waves/Line Waves/Floating Lines = flowing strands, not topography).
- **API:** `density`, `intensity`, `speed`, `color`/`palette`, `lightRadius`, `pauseWhenHidden`, `interactive`. **Tier: Free** (the free lightweight background).

### 10. Product Screenshot Sequencer — product motion
Scroll/step-driven sequence of product screenshots with annotated state transitions. **Not selected for the slice** (highest implementation risk: real asset pipeline + scroll choreography); prioritized next after the slice proves the system. **Tier: Pro.**

### 11. Interactive Feature Comparison — product motion
Two-state product scene with animated diffs. **Not selected:** strong concept, but Notification Stream covers the product pillar with lower risk; backlog. **Tier: Pro.**

### 12. Notification Stream — product/data motion
- **Visual behavior:** a live activity surface: items enter with weighted stagger, group/collapse by source, age visually, and exit cleanly; overflow condenses into a count chip. A real product component, not a looping demo list.
- **Use case:** in-app notification centers, activity feeds, deploy/audit logs, collaboration presence.
- **Interaction:** hover/focus pauses the stream; keyboard traversal; dismiss/expand per item; "catch up" control.
- **A11y:** `role="log"`/polite live region with rate-limited announcements, focus never stolen, pause control (WCAG 2.2.2). **Reduced motion:** instant insert/remove, no slide.
- **Perf risk:** low-medium — bounded DOM (windowed history), transform/opacity only.
- **Originality risk:** Moderate — animated lists are everywhere (incl. our own Animated List, which this **replaces** per [`37`](37-signature-component-roadmap.md)); differentiation is the complete product behavior: grouping, aging, overflow, pause, live-region correctness.
- **API:** `items`, `onDismiss`, `grouping`, `maxVisible`, `paused`/`onPauseChange`, `renderItem`, `announce`. **Tier: Pro.**

## Score matrix (1–5 per criterion; Sim = similarity risk)

| # | Candidate | Impact | Prod value | Orig | A11y | Perf | Mobile | API | Preview | Impl risk (5=low) | Dep weight (5=none) | Sim | Total/50 | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Focus Trail Text | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 4 | 5 | Moderate | **47** | **Select — first** |
| 2 | Signal Decode Heading | 4 | 3 | 1 | 2 | 4 | 4 | 4 | 4 | 4 | 5 | **High** | 35 | Reject |
| 3 | Refraction Surface | 4 | 3 | 2 | 3 | 2 | 3 | 3 | 4 | 2 | 2 | **High** | 28 | Reject |
| 4 | Magnetic Stack | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 5 | 3 | 5 | Moderate | **40** | **Select** |
| 5 | Spatial Gallery | 5 | 4 | 3 | 4 | 4 | 4 | 4 | 5 | 3 | 5 | Moderate | **41** | **Select** |
| 6 | Elastic Command Menu | 4 | 5 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | 5 | Low | **40** | **Select** |
| 7 | Adaptive Island Nav | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 4 | 3 | 5 | Mod-High | 36 | Defer |
| 8 | Spectral Field | 4 | 3 | 1 | 4 | 3 | 3 | 4 | 5 | 3 | 3 | **High** | 33 | Reject |
| 9 | Luminous Topography | 4 | 4 | 4 | 5 | 4 | 4 | 5 | 5 | 4 | 5 | Low-Mod | **44** | **Select** |
| 10 | Product Screenshot Sequencer | 4 | 5 | 5 | 3 | 3 | 3 | 3 | 5 | 2 | 4 | Low | 38 | Defer (next after slice) |
| 11 | Interactive Feature Comparison | 3 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 3 | 5 | Low | 36 | Defer |
| 12 | Notification Stream | 4 | 5 | 3 | 4 | 4 | 4 | 4 | 5 | 3 | 5 | Moderate | **41** | **Select** |

## The selected vertical slice (6)

| Order | Component | Category | Tier | Why |
|---|---|---|---|---|
| 1 | **Focus Trail Text → shipped as “Kinetic Emphasis”** (working name retired per originality review — "Focus" evokes React Bits *True Focus*) | text-effect | Free | Highest score; hero-defining; zero deps; ties to the semantic-motion moat; fastest path to proving the premium pipeline |
| 2 | Luminous Topography | background | Free | Big visual impact, low risk, decorative a11y is tractable, backgrounds are the market's proven "wow" layer |
| 3 | Magnetic Stack | creative-ui | Free | The free interactive surface; replaces Spotlight Card |
| 4 | Notification Stream | product-showcase / data-motion | Pro | Replaces Animated List with a complete product component; first Pro anchor |
| 5 | Spatial Gallery | interactive-media | Pro | Media pillar; premium gallery with production a11y |
| 6 | Elastic Command Menu | navigation | Pro | Real daily-driver surface; lowest similarity risk; hardest a11y (done last, with the pipeline mature) |

Coverage check: text ✓ surface ✓ media ✓ background ✓ product ✓ navigation ✓ — not six visual effects.
**Free/Pro:** free tier gets a premium text component, an interactive surface, and a lightweight background (+ existing foundations); Pro gets the gallery, the command menu, the product stream, then sequencer/comparison/blocks. Same quality bar both tiers.
**Sequencing:** strictly one at a time ([`CLAUDE.md`](../CLAUDE.md#signature-component-rules-2026-07-14-creative-pivot)); #2 does not begin until #1 has a stable independent status.

## Motion personalities

Shared vocabulary for all motion; tokens live in `@scope/tokens`, tuned per component only with justification. **Do not make every component bouncy.**

| Personality | For | Character | Defaults |
|---|---|---|---|
| **Precise** | controls, state changes (buttons, tabs, menus, command results) | short, minimal overshoot, clear continuity, interruption-first | 120–220ms, ease-out, spring only at damping ≥ 30 |
| **Fluid** | galleries, cards, spatial movement | smooth velocity, soft deceleration, continuous layout, restrained spring | 250–450ms, velocity-aware, no bounce > 0.15 |
| **Expressive** | marketing text, signature previews | staged, deeper, sequenced — but usable | 400–900ms total sequence, stagger 30–80ms, one focal accent |
| **Ambient** | backgrounds | slow, subtle, nonessential; pauses offscreen; reduced-motion-static | 8–30s loops, opacity/position drift only |

## Creative performance budgets (defaults; per-component overrides in the brief)

- 60fps desktop; **stable ≥ 50fps on mid-range mobile** (4× CPU throttle proxy).
- JS ≤ 8 KB min+gz (CSS/SVG/Motion items); ≤ 30 KB incl. deps for canvas items (needs brief sign-off).
- Zero work offscreen/hidden/reduced-static · bounded DOM & listeners · rAF-batched pointer state via CSS vars (no per-move React state) · compositor-only properties · no heavy blur/shadow stacks on animated elements · DPR cap ≤ 2 on any canvas.
- Engine ladder: CSS → SVG → Motion/WAAPI → Canvas 2D → isolated lazy WebGL (last resort, [`creative-performance-review`](../.claude/skills/creative-performance-review/SKILL.md)). No global Three.js/shader framework — ever — for a single background.

## API & customization principles

Default API = semantic concepts (`intensity`, `density`, `depth`, `direction`, `speed`, `focusRadius`, `itemGap`, `perspective`, `interactionMode`, `pauseWhenHidden`, `reducedMotion`, `activeIndex`/`onActiveChange`, `renderItem`). No raw shader uniforms, Motion object dumps, internal timeline arrays, or pointer math in the default surface; advanced escape hatches (e.g. a `transition` override) grouped and optional. Every signature component supports `className`/`style`, CSS variables, semantic tokens, light+dark, size/intensity/motion controls, content slots, and controlled state where relevant. Not 40 flat props — group advanced config.

## Signature evidence requirements

Per component, persisted in `artifacts/signature-components/<slug>/`: `concept-{a,b,c}.png`, `selected-concept.md`, `desktop-{dark,light}.png`, `tablet.png`, `mobile.png`, `touch.webm`, `keyboard.webm`, `normal-interaction.webm`, `rapid-interaction.webm`, `reduced-motion.webm`, `forced-colors.png`, `zoom-200.png`, `performance.json`, `bundle-report.json`, `originality-review.md`, `independent-review.md`. Static screenshots alone never approve motion. Approval thresholds: [`premium-visual-review`](../.claude/skills/premium-visual-review/SKILL.md) + [`docs/32`](32-component-quality-tracker.md).

## What "premium" means here (and does not)

Not premium: more props, uses Motion, has a gradient/blur/pointer effect/dark mode/tests/variants/canvas, took long to build. **Premium:** strong original concept · solves a useful problem · memorable · polished · production-safe · easy to customize · documented · performant · accessible · clear commercial advantage. A component failing this list stays honest-labeled ([`32`](32-component-quality-tracker.md) status set) no matter the effort spent.
