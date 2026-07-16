# 28 — Visual direction

> **Type:** 🟢 Canonical visual system for the docs/marketing surface · **Status:** direction **selected** (2026-07-14) · **Related:** [ADR-0014](adrs/0014-visual-direction.md) · [`26-current-ui-audit.md`](26-current-ui-audit.md) · [`10-design-tokens.md`](10-design-tokens.md) · [`11-tailwind-strategy.md`](11-tailwind-strategy.md)
> **Design read:** *developer‑tool landing for technical buyers evaluating a motion system, "instrument / motion‑laboratory" language, motion as the primary material — not decoration.* Dials (per `design-taste-frontend`): **VARIANCE 8 · MOTION 7 · DENSITY 4**.
> **Scope note:** this defines the **docs/marketing brand layer** (its own CSS variables in `apps/docs`). The **library tokens (`@scope/tokens`) stay theme‑neutral** so consumers theme components themselves — we do not impose this brand on buyers' apps.

## Three directions

### Direction 1 — "Motion Laboratory" (instrument) — **SELECTED**
- **Concept:** the page is an instrument. Dark, matte control‑surface *chrome* frames a bright, well‑lit **stage** where real motion plays under real controls. Monospace instrumentation (timing, policy, sequence step) reads out live. Nothing glows for decoration; the accent is a *signal*.
- **Impression / audience:** "these people build motion tooling and sweat the details." Technical buyers, design‑system owners.
- **Brand attributes:** precise, engineered, legible, kinetic, honest.
- **Typography:** display = a tight grotesk (`"Space Grotesk"`, system‑grotesk fallback) for headlines; body = system UI sans; **monospace = `ui-monospace`/`"JetBrains Mono"` used functionally** for control labels, timings, code, and readouts (not decoration).
- **Color:** matte near‑black chrome `#0a0b0f`; raised panels `#14161c`; the **stage is light** (`#f4f5f7`) so motion is maximally legible against dark chrome. Ink `#e8eaf0` on dark, `#14161c` on the stage.
- **Neutral system:** 6‑step cool‑gray ramp (chrome → panel → hairline → muted → ink → stage).
- **Accent behavior:** **one functional signal** — electric lime `#c8ff2f` — used *only* for: active control, playhead/sequence step, focus ring, primary CTA. A cool secondary `#5b8cff` marks reduced‑motion/informational states. Accents never used as decorative fills.
- **Surface / radius / border / shadow:** panels with **1px hairline borders** (`rgba(255,255,255,.08)`), small radius (`8px` chrome, `4px` controls), **shadow used sparingly** to lift the stage only. No glow, no gradients‑as‑identity.
- **Grid:** 12‑col, **asymmetric** — a wide left stage + a narrow right "instrument rail" (controls/readouts). Full‑bleed sections alternate with framed plates.
- **Spacing rhythm:** 4px base; generous *inside* panels, tight between label/value pairs (instrument density).
- **Section composition:** hero stage (asymmetric) → Motion Laboratory (stage + rail) → choreography (code | scene split) → production‑proof (editorial asymmetry) → recipes (workflow strips) → live catalog → pricing → CTA. No repeated equal‑card rows.
- **Navigation:** slim, monospace section labels, restrained; primary CTA in the signal accent.
- **Code presentation:** dark editor panel, monospace, **synchronized to the live controls** (the code *is* the readout).
- **Motion character / intensity:** deliberate, physical, **replayable and interruptible**; MOTION 7 on desktop, auto‑reduced on mobile/touch and under `prefers-reduced-motion`.
- **Product‑preview strategy:** **real components on the stage** under real controls — never screenshots, never fake dashboards.
- **Illustration / icon:** none decorative; iconography is minimal line glyphs for controls only.
- **Dark mode:** the chrome *is* dark; a light‑mode variant inverts chrome to paper while keeping the stage — token‑swapped, not a re‑layout.
- **Advantages:** directly dramatizes the moat (stage + controls + readouts); differentiates from generic SaaS; makes motion the hero.
- **Risks:** dark instrument UIs can slip into "edgy but unreadable" — mitigated by the *light stage* and strict contrast. Monospace overuse can feel cold — confined to instrumentation.
- **Accessibility:** signal accent on dark passes AA for UI (used for borders/controls, paired with text labels, never color‑only); focus ring is the accent at 2px; forced‑colors falls back to system.
- **Performance:** transform/opacity motion on the stage only; the page shell is static/server‑rendered; the lab is a lazy client island.
- **Avoids patterns:** no equal cards, no decorative gradient/glow, no blobs/particles, dark is *functional* (frames the stage) not a premium costume.

### Direction 2 — "Technical Editorial" (light, print‑inspired)
- **Concept:** an engineering journal. Ink‑on‑paper, large grotesk/serif display, baseline grid, rule lines, footnote‑style annotations; motion shown inside framed "plates."
- **Typography:** serif or high‑contrast grotesk display; humanist body; mono for code only.
- **Color:** warm paper `#faf9f6`, ink `#191817`, one restrained ink‑blue accent; near‑monochrome.
- **Grid/composition:** strict baseline grid, wide margins, asymmetric text/figure columns, numbered sections.
- **Motion:** MOTION 4 — calm, precise entrances inside plates; motion is *evidence*, not spectacle.
- **Advantages:** timeless, high trust, very legible, cheap to keep coherent. **Risks:** calmer than the product deserves — a motion product that feels *still* undersells the moat. **A11y/perf:** excellent (light, low motion). **Avoids patterns:** editorial hierarchy replaces card grids.
- **Verdict:** strong, but under‑dramatizes motion for the primary buyer.

### Direction 3 — "Kinetic Modernist" (Swiss, type‑as‑motion)
- **Concept:** black/white + one primary red, **huge kinetic type** as the hero material (word/character reveals, rotating words), strict 12‑col grid, bold asymmetry.
- **Typography:** oversized neo‑grotesk display, minimal body; type *is* the motion.
- **Color:** `#000`/`#fff` + signal red `#ff3b30`; ultra‑high contrast.
- **Motion:** MOTION 8 — kinetic typography front‑and‑center.
- **Advantages:** striking, Awwwards‑leaning, memorable; showcases `TextReveal`/`RotatingWords`. **Risks:** can read as *agency portfolio* over *developer tool*; kinetic type ≠ the choreography/production moat; accessibility of large auto‑motion needs care. **A11y/perf:** needs strict reduced‑motion + interruption. **Avoids patterns:** no cards at all.
- **Verdict:** great for a launch splash, weaker at proving the *system* (choreography, policies, production panels).

## Decision matrix

| Criterion (weight) | 1 · Lab | 2 · Editorial | 3 · Kinetic |
|---|---|---|---|
| Dramatizes the moat (choreography + controls) ×3 | **5** | 3 | 3 |
| Differentiated from generic SaaS/shadcn ×2 | **5** | 4 | **5** |
| Fits technical‑buyer audience ×2 | **5** | 4 | 3 |
| Accessibility headroom ×2 | 4 | **5** | 3 |
| Performance headroom ×1 | 4 | **5** | 3 |
| Maintainable coherence ×1 | 4 | **5** | 3 |
| **Weighted total** | **46** | 41 | 37 |

## Selected direction: **1 — Motion Laboratory (instrument)**

It best supports the moat: the whole page becomes a *demonstration* — a light stage where real components run under real semantic‑intent/intensity/reduced‑motion/replay/theme controls, framed by dark instrument chrome with live monospace readouts (timing, policy, sequence step, SSR/bundle). It is premium **because of structure, contrast, and real interaction quality — not because it is dark or glows.** Token implications, homepage IA, and component‑page template flow from this. Rationale of record: [ADR-0014](adrs/0014-visual-direction.md).

## Token implications (docs brand layer — implemented in `apps/docs`)

Semantic docs‑brand tokens (do **not** edit `@scope/tokens` brand values):

| Token | Purpose | Value | Light‑mode |
|---|---|---|---|
| `--lab-chrome` | page/instrument background | `#0a0b0f` | `#faf9f6` |
| `--lab-panel` | raised panels/rail | `#14161c` | `#ffffff` |
| `--lab-hairline` | 1px borders | `rgba(255,255,255,.08)` | `rgba(0,0,0,.10)` |
| `--lab-ink` | primary text | `#e8eaf0` | `#14161c` |
| `--lab-muted` | secondary text/labels | `#9aa1b2` | `#5b6472` |
| `--lab-stage` | the demo stage surface | `#f4f5f7` | `#0f1115` (inverts) |
| `--lab-signal` | functional accent (active/playhead/focus/CTA) | `#c8ff2f` | `#3a7d00` (AA on paper) |
| `--lab-signal-2` | reduced‑motion/info | `#5b8cff` | `#2a5bd7` |
| `--lab-radius` / `--lab-radius-sm` | chrome / control radius | `8px` / `4px` | same |
| `--lab-mono` | instrumentation/code | `ui-monospace, "JetBrains Mono", monospace` | same |
| `--lab-display` | headlines | `"Space Grotesk", system-ui, sans-serif` | same |

Each new token: name · purpose · default · light value · **forced‑colors** → system colors · **reduced‑motion** → n/a (visual) · usage in `apps/docs/app/*`. Motion tokens continue to come from `@scope/tokens` ([`10`](10-design-tokens.md)).

---

## Design‑quality anti‑patterns (reject unless documented)

Enforced by [`visual-quality-gate`](../.claude/skills/responsive-review/SKILL.md). Reject:

- Repeated three‑equal‑card rows · identical bordered cards for every content type.
- Browser‑default‑looking buttons · excessive pill controls · random rounded rectangles.
- Generic blue/purple as the *only* identity · gradients/glow/blurred blobs/particles as decoration or filler.
- Fake dashboards of meaningless cards · empty space used to *simulate* luxury.
- Every section centered · every heading same alignment · weak/low‑contrast typography · arbitrary spacing.
- Motion added only as decoration · scroll hijacking · heavy parallax · animations that delay content or can't be interrupted or break under reduced motion.
- Components shown only as screenshots or as title+description cards.
- Fake code/controls/metrics/testimonials/logos/downloads/awards/avatars · fake urgency/countdowns.
- Overlong load‑in intros · hidden navigation · tiny low‑contrast text.
- Unstructured arbitrary Tailwind values where a token exists · different visual languages on different pages.

**Premium is not** dark backgrounds, gradients, large text, glass, or glow. Premium is: clear differentiation, strong hierarchy, one coherent visual language, real interaction quality, semantic motion, choreography, accessibility, responsiveness, performance, testing, docs, tooling, and verifiable proof.
