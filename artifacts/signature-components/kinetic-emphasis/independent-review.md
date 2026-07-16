# Independent premium visual review — Kinetic Emphasis

> **Slug:** `kinetic-emphasis` · **Tier:** Free · **Class:** text-effect (signature)
> **Reviewer:** independent premium reviewer (did not implement, did not prepare evidence)
> **Date:** 2026-07-14 · **Skill:** [`premium-visual-review`](../../../.claude/skills/premium-visual-review/SKILL.md)
> **Method:** rendered evidence first (all stills + frame sequences viewed before any source), then live verification with Playwright against `http://localhost:3000/components/kinetic-emphasis` (normal sweep, 6× rapid re-trigger, OS-level `prefers-reduced-motion`, no-JS/SSR render, keyboard focus/tab order, light-theme computed-color contrast), then source/tests/preview/docs inspection.

---

## Evidence completeness

All required evidence present in `artifacts/signature-components/kinetic-emphasis/`: concepts (a/b/c + mids + `selected-concept.md`), six rendered stills, five webm recordings, `frames/normal-*` (8) + `frames/rapid-*` (4) sequences, `performance.json`, `bundle-report.json`, `originality-review.md` with **both** concept-stage and implementation-stage verdicts (Moderate; all 8 guardrails PASS; cleared for this review). Clean-fixture install, 19 passing registry tests, and production build were verified this session per the review request.

**One evidence defect:** `artifacts/component-reviews/kinetic-emphasis/focus.png` is byte-identical (md5 `1712c3d2…`) to `desktop-dark.png` — it captures no focus state. I re-verified keyboard focus live instead (visible ring on all preview controls, sane tab order); the finding below is about evidence hygiene, not behavior.

## First impression (recorded before opening any source)

**9/10.** The rendered stage reads as an authored editorial scene, not a demo box: balanced two-line headline with mid-sentence violet emphasis, glowing underline wash, a paragraph-scale pull quote proving range, and a docked control bar that looks real. The frame sequences make the concept legible in one viewing — attention visibly travels in reading order and *lands* on the marked phrase. Both themes hold. Not a 10 because the resting treatment (accent text + underline) is familiar typography until the motion explains it.

---

## Dimension scores (1–10, skill scale; strict, no averaging)

| # | Dimension | Score | Justification |
|---|---|---|---|
| 1 | First impression | **9** | Authored editorial scene, concept legible in one viewing; recorded before code (above). |
| 2 | Visual authorship | **9** | Punctuation-aware word segmentation ("emphasis," keeps its comma), underline bridges inter-word gaps with a gradient tail only on the phrase's last word, per-word decaying traces — detail decisions, not defaults. |
| 3 | Composition | **9** | Eyebrow + headline + subcopy + bordered pull-quote + docked controls; two content scales shown; balanced at every captured viewport. |
| 4 | Typography | **9** | Clamped display sizing, `text-balance`, tight leading/tracking; emphasis hierarchy (accent + semibold + underline) reads as designed type at rest (`desktop-dark.png`, `normal-2000ms`). |
| 5 | Material & surface | **8** | Underline wash with restrained glow and decaying accent traces are designed but modest; the component's material vocabulary is intentionally thin (typographic). Strong but familiar. |
| 6 | Color behavior (both themes) | **7** | Themes are coherent, but two color-state defects: reduced-motion strips the accent from `<em>` words (major #1) and light-theme accent at paragraph size measures ~3.7–4.0:1 (major #2). |
| 7 | Motion direction | **9** | Motion has intent and a thesis: reading-order activation front, per-word decaying trail, ignition causally synced to the front's arrival (`normal-0300→0950ms` shows "Reading has an" igniting word-by-word while "order" is still muted), designed terminal state, no bounce. Verified live. |
| 8 | Interaction quality | **8** | All controls map to real props; Replay is deterministic; speed presets are visibly distinct live. Trail slider gives no feedback until the next replay while speed/underline changes replay immediately — inconsistent (minor #4). |
| 9 | State continuity | **9** | 6 rapid re-triggers live: clean deterministic restart, no ghost underlines, correct settled state (`live-rapid-*`, `frames/rapid-*`); controlled rising-edge + Strict-Mode double-effect handled and tested. |
| 10 | Responsive quality | **9** | Desktop/tablet/mobile/zoom-200 all hold; multi-line emphasis wraps with correct per-line underline segments; controls wrap at 200% zoom without breakage. |
| 11 | Touch quality | **8** | Component itself needs no touch targets (non-interactive by design, no pointer dependency); `touch.webm` persisted; preview slider/checkbox are default-size — adequate, not generous. |
| 12 | Accessibility | **7** | Excellent architecture: original children exposed exactly once with native `<em>` semantics, animated layer `aria-hidden` + `select-none`, forced-colors falls back to real underlines, no focus stops, axe clean, SSR/no-JS render the full designed state. But major #2 is a WCAG 1.4.3 failure axe cannot see (aria-hidden layer), and major #1 degrades the reduced-motion presentation. |
| 13 | Reduced motion | **7** | Motion is fully removed, instantly, content never hidden — but the delivered rest state is a *downgraded* design (accent lost, only underline + weight remain), contradicting the component's own contract ("reduced motion renders the FINAL designed state") and the concept's selection rationale. |
| 14 | Performance | **9** | 120.2fps desktop / 118.8fps at 4× CPU throttle, zero frames >26ms (`performance.json`); transform/opacity/color only; IO-gated; interruption cancels in-flight animations; 2.26 KB gz component-only, within budget (`bundle-report.json`). Blemish: 134/262ms long tasks at sweep start under 4× throttle. |
| 15 | Production usefulness | **9** | Real job (emphasis in marketing/editorial copy); the `<em>`-as-API is genuinely better ergonomics than every string/indices competitor; SSR-safe final state, controlled mode, `as` polymorphism, soft word cap with dev warning, tested, tiny. |
| 16 | Showcase quality | **9** | Live preview dominates the page, every control is real, install command is brand-correct (`motionstack.dev/r/kinetic-emphasis.json`, no `@scope` placeholder), stage has working light/dark + reduce-motion toggles, two scales demonstrated. |

## Issues

### Critical
None.

### Major

1. **Reduced-motion rest state loses the designed accent color.** Under `prefers-reduced-motion` (and the preview's Reduce-motion toggle), `<em>` words render in the base text color with only underline + semibold — not the violet accent that defines the designed final state. Evidence: `artifacts/component-reviews/kinetic-emphasis/reduced-motion.png` (white "understands emphasis," vs violet in `desktop-dark.png`); live computed style under OS reduced motion: em color `rgb(247,248,250)` vs `rgb(129,118,255)` after a normal sweep; the **no-JS/SSR render shows the correct violet state**, proving the hydrated reduce path is the outlier. Root cause (source): `clearInline()` in `packages/registry/registry/text/kinetic-emphasis.tsx` calls `el.style.removeProperty("color")` on `[data-ke-word]`, stripping the React-applied inline accent from em words; React never re-applies it (vdom unchanged). Also reachable after a completed sweep when props change (same `clearInline()` call). Contradicts the docs claim ("Server markup, no-JS, and reduced motion all render the FINAL designed state") and the component's doc comment. The existing reduced-motion test asserts only `opacity`/`transform` are empty — it cannot catch this. Fix is small: never remove `color` from em words (or re-apply the accent after clearing) + a test asserting the accent survives `reducedMotion`.

2. **Light theme, paragraph-scale emphasis fails WCAG 1.4.3 contrast.** Measured live: em color `rgb(105,92,255)` on the light stage (~#ecebfb) ≈ **3.7–4.0:1** at `17px/600` — below the 4.5:1 requirement for normal-size text (the 52.8px headline passes the 3:1 large-text threshold; dark theme measures ~5.4:1 and passes). axe passes only because its color-contrast rule skips the `aria-hidden` animated layer — the text is still visible presentation and WCAG applies. Evidence: `desktop-light.png`, live computed styles. Fix: darken the light-theme `--ke-accent` resolution (or document/enforce a minimum-size guidance) so body-scale emphasis meets 4.5:1.

### Minor

3. **Invalid focus evidence artifact.** `artifacts/component-reviews/kinetic-emphasis/focus.png` is byte-identical to `desktop-dark.png`; no focus state was captured. Live verification shows a proper visible focus ring on Replay and correct tab order (slow → normal → fast → trail → checkbox → …), so this is evidence hygiene, not a behavior bug. Recapture.
4. **Inconsistent preview-control feedback.** Changing speed or the underline checkbox remounts and replays immediately; dragging Trail does nothing visible until the next replay (`apps/docs/app/_previews/index.tsx` — `key` includes `nonce/speed/underline` but not `trail`). Either debounce-replay on trail change or label it as applying on replay.
5. **Forced-colors multi-word emphasis renders per-word underlines with gaps** ("Reading has an order" in `forced-colors.png` reads slightly fragmented). Acceptable fallback — emphasis never relies on color alone — but a continuous underline would be cleaner.
6. **Init long tasks under 4× CPU throttle** (134ms, 262ms in `performance.json`) at sweep start. Frame cadence stays clean; watch when many instances mount on one page.

### Observations (no action required)

- The sr-only accessible layer plus `select-none` animated layer is the right trade; note that selection/copy of the passage yields the sr-only text (correct, single copy).
- The originality implementation-stage review's watch items (underline glow intensity, `trail=1` bar density, mid-sentence demo staging) all hold in the rendered evidence as shipped.
- The mobile still contains the Next.js dev overlay badge ("N") overlapping the Trail label — dev-only chrome, not product; consider hiding it in future captures.

## Premium minimums (no averaging)

| Minimum | Required | Scored | Pass |
|---|---|---|---|
| First impression | ≥ 9 | 9 | ✅ |
| Visual authorship | ≥ 9 | 9 | ✅ |
| Motion direction | ≥ 9 | 9 | ✅ |
| Production usefulness | ≥ 8 | 9 | ✅ |
| Accessibility | ≥ 9 | **7** | ❌ |
| Responsive quality | ≥ 8 | 9 | ✅ |
| Performance | ≥ 8 | 9 | ✅ |
| Showcase quality | ≥ 9 | 9 | ✅ |
| No critical issues | — | none | ✅ |
| No unresolved major issues | — | **2 open** | ❌ |
| Similarity risk Low/Moderate | — | Moderate (impl-stage, guardrails pass) | ✅ |

### Strongly Sellable extra requirements (checked explicitly)

Motion quality ≥ 9: **9 ✅** · Originality ≥ 8: **8 ✅** (Moderate risk; the two-tier semantic choreography combination is defensibly original, each half lives in crowded families) · API quality ≥ 8: **9 ✅** (semantic `<em>` API, clean prop surface, controlled mode, no strings/indices escape hatch) · Production evidence ≥ 9: **8 ❌** (comprehensive and mostly excellent, but one invalid artifact — `focus.png` duplicate — keeps this at 8).

Moot while the premium minimums fail, but recorded for the re-review.

## Status: **Needs polish**

The premium gate fails on the Accessibility minimum (7 < 9) and two unresolved major issues — one failing dimension fails the review; no averaging. Everything else is at or above minimums, and both majors are narrowly scoped, small fixes:

1. Stop `clearInline()` from stripping the em accent (and add a reduced-motion color assertion to the test suite).
2. Meet 4.5:1 for light-theme emphasis at body-text sizes.

Then recapture `focus.png` and `reduced-motion.png`, re-run the clean-fixture install (source will have changed), and re-review. On the current evidence the motion system, state continuity, performance, and showcase are already at Strongly-Sellable level; this is a near-miss on correctness of the non-animated states, not on the animation or the concept.

**Not eligible for homepage featuring until independently re-reviewed at Strongly Sellable or higher.**

---

## Post-fix re-review (2026-07-14)

> **Reviewer:** independent premium re-reviewer (did not implement the component or the fixes; separate context from the first reviewer's fix suggestions).
> **Method:** adversarial verification of each claimed fix — live Playwright 1.61 against `http://localhost:3000/components/kinetic-emphasis` (contexts: `reducedMotion:'reduce'` × dark and light, `colorScheme:'light'` + `localStorage theme=light`, normal-motion settled sweep), md5 comparison of recaptured artifacts, frame extraction from `reduced-motion.webm` (ffmpeg), independent contrast arithmetic, full registry test run, registry-JSON-vs-source diff, and registry typecheck. Evidence mtimes (17:17–17:19) postdate the source fix (`kinetic-emphasis.tsx`, 17:15) — chronology is consistent.

### Verification results per issue

| Issue | Claimed fix | Verdict | Evidence |
|---|---|---|---|
| **Major #1** — reduced-motion strips em accent | `clearInline()` re-applies `ACCENT_TEXT` to `[data-ke-word="em"]` | **FIXED — verified live in both themes.** Under `reducedMotion:'reduce'`, all 6 em words compute to `rgb(129,118,255)` (dark) — *identical* to the normal-sweep settled color — and `rgb(86,72,238)` (light); underlines render at `opacity:1`, full width, `transform:none`. Recaptured `reduced-motion.png` shows the full designed state; frame ~0.2s of the recaptured `reduced-motion.webm` already shows the complete rest state with no sweep in progress (motion evidence, not just a still). Regression test added (`kinetic-emphasis.test.tsx`: "reduced motion keeps the DESIGNED accent…") asserting the inline color survives and resolves through `--color-accent-text`. | live computed styles; `artifacts/component-reviews/kinetic-emphasis/reduced-motion.png`; `reduced-motion.webm` frames |
| **Major #2** — light-theme 17px em fails 4.5:1 | New `--color-accent-text` token: `#5648ee` light / `#8176ff` dark | **FIXED — verified live with independent contrast arithmetic.** Light-theme em text at 17px computes to `rgb(86,72,238)` = #5648ee exactly. Contrast: **5.90:1** on the white surface actually behind the pull quote, **5.70:1** on `--color-stage-bg` #fafbfd, **5.02:1** worst-case on the violet gradient wash at the stage top (~#ecebfb, the prior review's measured stage color) — all ≥ 4.5:1. Dark theme #8176ff: 5.52:1 on #0b0d12, 5.10:1 on #14171d. Headline (52.8px) unaffected and passing. Token documented in `packages/tokens/styles.css` with the WCAG rationale comment. | live computed styles + bg chain; token file |
| **Minor #3** — focus.png byte-duplicate | Recaptured | **FIXED.** md5 `3c730a09…` ≠ `after-desktop-dark.png` `6f0d9dcc…`; the image shows a genuine visible focus ring on Replay. | md5; `focus.png` |
| **Minor #4** — Trail slider gives no feedback | Commit-on-release with debounced replay | **FIXED — verified in source and live.** `apps/docs/app/_previews/index.tsx`: `onPointerUp`/`onKeyUp` → 250ms-debounced nonce bump → remount replay. Live: ArrowRight + keyup on the slider triggered a full replay (word opacity dipped to 0.35 then swept). All controls now share a deterministic commit→replay contract. | source; live interaction |
| **Minor #5** — forced-colors per-word underline gaps | Trailing space moved inside the `<em>` word spans | **FIXED.** Recaptured `forced-colors.png` shows continuous underlines bridging word gaps in both the headline phrase and "Reading has an order"; unit test asserts `emWords[0].textContent === "understands "`. | `forced-colors.png`; test |
| **Minor #6** — init long tasks under 4× throttle | (watch item, no fix claimed) | **Unchanged, acceptable.** Recaptured `performance.json`: long tasks 108/225ms under 4× throttle, but 119.5fps, worst frame 18.4ms, **0 frames > 26ms**. Remains a watch item for many-instance pages. | `performance.json` |

Supporting claims verified: **21/21 registry tests pass** (includes the two new regression tests); registry JSON `apps/docs/public/r/kinetic-emphasis.json` (17:17) is byte-identical to the fixed source and contains the `clearInline` fix; registry typecheck passes.

**Evidence observation (no action required):** the recaptured `reduced-motion.png` is byte-identical to `after-desktop-dark.png`. Adversarially chased: this is the *expected success condition* — the fix makes the reduced-motion rest state pixel-identical to the settled sweep state, and deterministic rendering reproduces identical bytes. Independence of the capture is established by `reduced-motion.webm` (instant rest state, no sweep) and by this reviewer's own live `reducedMotion:'reduce'` verification. Future captures could include the stage's Reduce-motion toggle in a checked state to make provenance self-evident.

### Re-scored dimensions (others unchanged from the prior table)

| # | Dimension | Prior | Now | Justification |
|---|---|---|---|---|
| 6 | Color behavior (both themes) | 7 | **9** | Both defects gone; dedicated contrast-safe `--color-accent-text` token resolves per theme (verified 5.0–5.9:1 light, 5.1–5.5:1 dark); rest/animated/reduced states all use the same accent chain. |
| 8 | Interaction quality | 8 | **9** | The one inconsistency is resolved: every control now produces deterministic visible feedback (speed/underline remount-replay; trail commits with replay on release/key-up, verified live). |
| 12 | Accessibility | 7 | **9** | The WCAG 1.4.3 failure and the reduced-motion degradation are fixed and regression-tested; the already-excellent architecture (single accessible copy, native `<em>`, aria-hidden animated layer, forced-colors text-decoration fallback now continuous, axe clean, SSR designed state) stands. Not 10: preview slider/checkbox remain default-size targets. |
| 13 | Reduced motion | 7 | **9** | Delivers the full designed final state instantly in both themes, matching SSR/no-JS exactly (verified live + webm); contract in docs now true; regression test locks it. |
| 11 | Touch quality | 8 | **8** | Trail commit-on-release also improves touch, but the default-size slider/checkbox targets that set this at 8 are unchanged — no upgrade. |
| — | Production evidence (Strongly Sellable extra) | 8 | **9** | The invalid artifact is replaced with a genuine focus capture; all evidence recaptured post-fix with consistent mtimes; perf/bundle re-measured; regression tests added; registry rebuilt and validated. |

### Premium minimums (re-run, no averaging)

| Minimum | Required | Scored | Pass |
|---|---|---|---|
| First impression | ≥ 9 | 9 | ✅ |
| Visual authorship | ≥ 9 | 9 | ✅ |
| Motion direction | ≥ 9 | 9 | ✅ |
| Production usefulness | ≥ 8 | 9 | ✅ |
| Accessibility | ≥ 9 | **9** | ✅ |
| Responsive quality | ≥ 8 | 9 | ✅ |
| Performance | ≥ 8 | 9 | ✅ |
| Showcase quality | ≥ 9 | 9 | ✅ |
| No critical issues | — | none | ✅ |
| No unresolved major issues | — | **0 open** (both verified fixed) | ✅ |
| Similarity risk Low/Moderate | — | Moderate (unchanged; no visual-concept change in the fixes) | ✅ |

### Strongly Sellable extra requirements (re-run explicitly)

Motion quality ≥ 9: **9 ✅** (untouched by the fixes; recaptured recordings consistent) · Originality ≥ 8: **8 ✅** (unchanged) · API quality ≥ 8: **9 ✅** (unchanged; the fix even improved the API contract's truthfulness) · Production evidence ≥ 9: **9 ✅** (re-scored above).

**Category-leading — checked and declined.** Requires most scores 9–10 with a concrete commercial advantage and an exceptional/memorable character. Material & surface (8) and Touch (8) are honest 8s, First impression is a 9 not a 10 ("familiar typography until the motion explains it" still holds at rest), and originality risk is Moderate with a 8. This is a strong, correct, well-evidenced component — not yet a category-defining one. Not massaged upward.

## Final status: **Strongly Sellable**

Both majors are fixed at the root cause, verified live by this reviewer (not from the implementer's artifacts alone), and locked with regression tests; all four addressed minors are confirmed; the remaining minor (#6 long tasks under synthetic 4× throttle) is a watch item with clean frame cadence. All premium minimums and all four Strongly Sellable extras pass.

**Now eligible for homepage featuring** (independently Strongly Sellable, per the premium-visual-review featuring rule).
