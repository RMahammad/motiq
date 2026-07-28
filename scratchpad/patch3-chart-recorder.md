# Patch note — chart-recorder (exact Motion Lab color/ground/scrim correction)

Agent 2 (patch 3 pass, 2026-07-21). This corrects the prior token-resolved port
(see the now-superseded "Colors resolve live from CSS design tokens" bullet in
`docs-content.ts`) to be **pixel-identical** to the Motion Lab prototype's
`c-recorder` stage. The user rejected the theme-aware port: this is a
deliberate committed-dark, single-visual-world design. Canvas draw math
(waveform generation, packets, trail bloom, event payoffs, safe-area amplitude
quieting) is UNCHANGED — only colors, ground, scrim, and preview hero styling
were touched.

## What changed — `packages/registry/registry/backgrounds/chart-recorder.tsx`

1. **Killed token resolution.** Removed `resolvePalette(el)` / `FALLBACK` /
   the `getComputedStyle` reads and the "re-resolve every 30 frames"
   `colorAge` logic entirely. Replaced with a single fixed `LAB` constant:
   - `ground: "#0a0b10"`
   - `laneColors`: exact 5-entry spectrum `[158,132,255], [124,108,255],
     [96,168,255], [62,200,232], [53,213,229]` — indexed directly by lane
     index `i` (0–4; `lanes` is clamped 2–5 so this never overflows).
   - `auroraViolet: [124,108,255]`, `auroraCyan: [53,213,229]` — fixed,
     independent of the `accent` prop now (previously derived from the
     resolved accent/secondary tokens).
   - `lattice: [150,150,200]` (was `--color-muted`).
   - `ticks: "#8f95ab"` (was `--color-border`; this is the lab's literal
     `rgba(143,149,171,.20)` baseline-tick color, which is exactly the lab's
     `--muted` hex).
2. **`accent` prop** now overrides ONLY lane 0's color triple; lanes 1–4 stay
   fixed lab hues regardless. (Previously `accent` was one end of a live
   `lerpRgb` interpolation across all lanes — that interpolation, and the
   now-unused `colorT` field / `lerpRgb` helper, were removed.)
3. **Opaque lab ground.** `ctx.fillStyle = LAB.ground; ctx.fillRect(0,0,W,H);`
   is now the first canvas op every frame (right after `clearRect`), so the
   additive `'lighter'` aurora/glow passes always composite against a known
   dark ground regardless of host page/theme. Also set `.{cls} { background:
   #0a0b10; }` on the decorative wrapper as a pre-paint CSS fallback.
4. **Quiet-zone scrim — exact lab formula**, replacing the old
   `safeArea`-driven center/color: `createRadialGradient(W*0.24, H*0.5, 0,
   W*0.24, H*0.5, Math.min(W,H)*0.70)` with literal stops
   `rgba(10,11,16,0.90)@0`, `rgba(10,11,16,0.52)@0.55`, `rgba(10,11,16,0)@1`.
   This is now fixed/independent of the `safeArea` prop — `safeArea` still
   drives the amplitude/lattice quieting (`safeFalloff`) and the DOM frosted
   scrim (`scrimStyle`), just not this canvas readability gradient anymore.
5. Doc comments updated (props + component docstring) to describe the fixed
   lab palette instead of "theme resolves both ends."

## Preview hero restyle (both files)

- `apps/docs/app/_previews/chart-recorder.tsx`
- `apps/docs/app/_previews/catalog/chart-recorder.tsx`

Replaced all `var(--color-*)`-based hero styling (pill, h3, p, CTA, ghost
button) with fixed inline `style` objects matching the lab `.hero` exactly:
pill muted `#8f95ab` / border `#232636` / bg `rgba(10,11,16,.55)` / blur(8px);
h3 `#eceef8` weight 800 + `text-shadow: 0 2px 26px rgba(10,11,16,.95), 0 0 3px
rgba(10,11,16,.7)`; body `#b7bccf` + `text-shadow: 0 1px 18px
rgba(10,11,16,.95)`; CTA bg `#7c6cff` (Live Signal stage accent, the lab's
root `--violet` — NOT the same as lane 0's brighter spectrum hex
`#9e84ff`), text `#0a0b10`, weight 700, radius 10px; ghost border `#232636`,
text `#eceef8`, bg `rgba(10,11,16,.5)`, blur(8px), radius 10px. Copy text
unchanged. The safe-area debug-toggle overlay (dev-only, not part of the lab)
was left on theme tokens — out of scope per the spec.

## New docs-content.ts bullets (for the orchestrator to apply)

**`accessibility`** (replace the existing array for `chart-recorder` —
supersedes the "Colors resolve live from CSS design tokens ... correct in
both light and dark themes" bullet, which is no longer true):

```ts
accessibility: [
  "Decorative background: the canvas layer is aria-hidden, with `children` rendered in a separate, fully readable layer on top.",
  "Committed to a fixed dark Motion Lab palette (not CSS design tokens) — the field always renders the same violet→cyan spectrum on an opaque #0a0b10 ground, pixel-matched to the Motion Lab prototype regardless of host page or theme.",
  "Respects prefers-reduced-motion (or the reducedMotion prop) by freezing on one rich, representative frame instead of animating.",
  "Under forced-colors mode the canvas is hidden and replaced with a neutral bordered fallback box, since a canvas bitmap can't be restyled by the user's forced palette.",
],
```

`performance` bullets are unchanged (still accurate — nothing about the
rAF/DPR/pause discipline changed).

## Verification (from `packages/registry`)

- `npx vitest run registry/backgrounds/chart-recorder.test.tsx` → **13/13
  passed** (contract tests only — canvas output isn't assertable in jsdom;
  the expected `HTMLCanvasElement.prototype.getContext` "not implemented"
  stderr lines are the existing null-context-guard test doing its job).
- `npx tsc --noEmit` → clean.
- `npx tsc --noEmit -p tsconfig.consumer-strict.json` → clean (no unused
  locals after removing `lerpRgb`/`colorT`/`resolvePalette`/`FALLBACK`).

## Deviations

None from the spec. One judgment call: for `lanes < 5`, lane colors are taken
directly from `LAB.laneColors[i]` (first N of the 5 fixed lab hues) rather
than re-interpolated across the full spectrum — the spec's "5 lane colors
EXACT" + "accent overrides lane[0], keep the rest" reads as literal index-based
assignment, not a re-derived interpolation, so a 3-lane instance shows lanes
0–2 (violet → mid-blue) rather than violet → cyan stretched over 3 stops.
