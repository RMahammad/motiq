# Patch note — core-strata (SVG+CSS → canvas rewrite)

Agent 1. Ported the Motion Lab "Deep Scan" choreography (`c-strata` stage) into
`packages/registry/registry/backgrounds/core-strata.tsx` as a production
canvas component, following the `runtime-signal-map.tsx` scaffold exactly.

## What changed

- **Rendering**: SVG `<path>`/`<rect>` + CSS `@keyframes` scroll/pulse
  animations → one `<canvas>` + a single `requestAnimationFrame` loop. No more
  batched-per-opacity-bucket SVG paths, no CSS `animation-play-state`
  choreography.
- **Geometry model**: still a deterministic mulberry32 model keyed by `seed`
  (SSR-safe, no `Math.random`/`Date.now` at render), but now baked into a
  fixed 1200×760 **logical field** and projected into the measured canvas via
  a `preserveAspectRatio="xMidYMid slice"`-equivalent scale/crop — so the
  model (`useMemo` on `[seed, density, faults]`) doesn't need to be rebuilt on
  resize, matching the runtime-signal-map `model` pattern.
- **Visual**: 3 parallax strata layers (deep/slow/dim → near/fast/bright)
  scroll continuously; a survey beam eases top↔bottom (9s cycle at
  `speed=1`) using the same `smoothstep`-based bounce as the lab; amber
  marker seams bloom + streak (additive `lighter` composite) the instant the
  beam's Gaussian falloff (`sigma=46` logical px) crosses them — 1:1 port of
  the lab's math.
- **`faults`** (new mapping — the lab prototype has no fault concept at all):
  now drives 1–6 baked vertical fault **columns**; each column gets an
  independent vertical "throw" offset applied to every band drawn inside it,
  producing a visible step discontinuity at the column boundary — a real
  geological-fault read. A faint diagonal line (per the fault's decorative
  skew) is drawn on top as the visual seam marker.
- **`readingLine`**: now does double duty — (1) a persistent faint dashed
  reference line + two end ticks drawn every frame (amber/marker color), and
  (2) the beam's **parked position** when motion is stopped (`reducedMotion`
  or `speed<=0`). In the parked state, each layer's scroll offset is solved
  (`forcedOffsetFor`) so a marker band from that layer is centered exactly on
  the reading line — the still frame always shows a lit marker deterministically,
  not by chance of whatever timestamp was passed to the frozen draw.
- **`speed<=0`**: previously froze the CSS animation (still legible via the
  static SVG geometry). Now: the rAF loop keeps running (`animate` is still
  governed only by `staticMode`/`paused`, matching the mandatory scaffold
  contract — same precedent as `runtime-signal-map`'s own `stalled` flag), but
  inside `draw()` a `stalled = speed<=0 || staticMode` flag freezes the beam
  at `readingLine` and pins every layer's scroll offset via `forcedOffsetFor`,
  so the rendered pixels are visually static frame-to-frame despite the loop
  technically ticking. `reducedMotion`/system-reduced-motion additionally
  skips starting the loop entirely and draws one `draw(7.3)` call (mirrors the
  lab's own still-frame timestamp).
- **Colors**: fully token-resolved via `resolvePalette()` — `amber` from
  `--color-warning` (marker seams + beam), `violet` from `--color-accent`
  (base sediment tint), `bg` from `--color-bg` (safe-area scrim ground). Motion
  Lab's literal hues (`#e8a852` amber, `#7c6cff` violet, `#0a0b10` ground) are
  used ONLY as fallback constants when a token is unresolved (e.g. no
  stylesheet in a bare test render). Both light and dark themes work; nothing
  is hardcoded.
- **`accent` prop — default changed** (deviation, see below).
- **Safe area**: the quiet-zone is now a canvas-painted radial gradient in the
  resolved ground color, drawn as the LAST canvas op every frame (was a static
  painted SVG `<ellipse>` with a `radialGradient` def). Additionally added a
  DOM frosted (`backdrop-filter: blur`) scrim div positioned over the
  `safeArea` rect, rendered only when `children != null`, matching the
  runtime-signal-map pattern of a canvas dim + DOM frost working together.
- **Forced-colors**: canvas hidden (`display:none`), a bordered
  `.mk-cs-fallback` box shown instead (`CanvasText` border, `Canvas`
  background) — was previously a hairline-stroke SVG fallback.

## Deviations from the prior SVG version

1. **`accent` prop default changed** from the literal string
   `"var(--color-accent,#695cff)"` to `undefined`. Canvas `fillStyle` does not
   resolve CSS custom-property references (`var(...)` strings are not valid
   canvas colors — they silently no-op), so the old default could never have
   worked once ported to canvas. The prop's **name, type
   (`accent?: string`), and semantic meaning** (marker-seam + reading-line
   color) are unchanged; when omitted it now resolves the `--color-warning`
   token via `resolvePalette()` instead. Passing an explicit color string
   (e.g. `"#ff8844"`) still overrides, as before.
2. **`faults` clamp range** changed from 2–4 to 1–6. The old range existed to
   guarantee ≥2 columns for the old SVG's column-split logic; the new canvas
   version has no such constraint, and 1 (a single unbroken fault split) is a
   valid, sensible visual. Default remains `3`.
3. **No more baked "avoid the safe area" fault-line nudging.** The previous
   SVG version algorithmically nudged each fault line so it never crossed the
   safe-area rectangle. The canvas version does not replicate this (faults can
   now cross under the copy) because the safe-area quiet-zone scrim is
   repainted as the LAST op every frame and reliably dims anything beneath it
   — readability no longer depends on geometry avoidance. This was a
   deliberate simplification to avoid re-baking geometry every time the
   `safeArea` prop changes (would otherwise force `safeArea` into the `model`
   memo deps, causing the whole mount effect — measure/RAF/ResizeObserver — to
   restart on every safeArea change).
4. Old SVG-path/keyframe-based tests (determinism-by-seed path assertions,
   `-tickflash`/`-linepulse`/`-faultdrift` keyframe-name assertions, per-seed
   fault/safe-area-avoidance geometry assertions) are gone — no SVG paths
   exist anymore. Replaced with the canvas lifecycle/accessibility contract
   tests (per spec): canvas presence, children-outside-aria-hidden,
   `data-motion` static/animated, `data-paused`, forced-colors CSS + fallback
   box, jsdom null-context no-throw, clean mount/unmount under
   `reducedMotion` and `speed=0`, prop-variation no-throw, multi-seed no-throw,
   and scrim-present/absent based on `children`.

## New docs-content.ts bullets (for the orchestrator to apply)

**`performance`** (replace the existing array for `core-strata`):

```ts
performance: [
  "One <canvas> element driven by a single requestAnimationFrame loop — no per-frame React state, no WebGL.",
  "Device-pixel-ratio capped at 2x so retina displays never over-render.",
  "Pauses automatically when scrolled offscreen or the browser tab is hidden (IntersectionObserver + visibilitychange), and renders a single static frame under reduced motion instead of looping.",
  "Strata geometry is a deterministic mulberry32 model keyed by `seed`, baked once into a fixed logical field and re-projected on resize — no per-resize regeneration, no layout thrash.",
],
```

**`accessibility`** (replace the existing array for `core-strata`):

```ts
accessibility: [
  "Colors resolve from theme tokens (--color-warning, --color-accent, --color-bg, ...) at draw time, so the field is correctly themed in both light and dark — nothing is hardcoded.",
  "Respects prefers-reduced-motion and the reducedMotion prop: renders one rich static frame (survey beam parked at the reading line, a marker seam lit) instead of animating.",
  "Under forced-colors (Windows High Contrast) mode the canvas is hidden and replaced with a plain bordered fallback box, since a painted bitmap can't be restyled by the user's contrast theme.",
  "The whole field is decorative and marked aria-hidden; foreground content passed as children renders in a separate, fully readable layer behind a frosted safe-area scrim.",
],
```

## Verification (from `packages/registry`)

- `npx vitest run registry/backgrounds/core-strata.test.tsx` → **12/12 passed**.
- `npx tsc --noEmit` → clean, no errors.
- `npx tsc --noEmit -p tsconfig.consumer-strict.json` → clean, no errors.

Preview files (`apps/docs/app/_previews/core-strata.tsx` and
`apps/docs/app/_previews/catalog/core-strata.tsx`) were left untouched — they
only pass `density`, `faults`, `reducedMotion`, `safeArea`, `className`, and
`children`, all of which are preserved verbatim.
