# Patch note — riso-registration (exact Motion Lab color/ground/scrim correction)

Agent 2 (patch 3 pass, 2026-07-21). This corrects the prior token-resolved port
(see the now-superseded "Colors resolve live from CSS design tokens ... the
screen/multiply blend choice itself follows the resolved ground's luminance"
bullet in `docs-content.ts`) to be **pixel-identical** to the Motion Lab
prototype's `c-riso` stage. The user rejected the theme-aware port: this is a
deliberate committed-dark, single-visual-world design. Canvas draw math (plate
drift/lissajous, lock envelope, roller-flash sweep, corner-crosshair blink) is
UNCHANGED — only colors, ground, blend-mode branching, scrim, and preview
hero styling were touched.

## What changed — `packages/registry/registry/backgrounds/riso-registration.tsx`

1. **Killed token resolution.** Removed `resolvePalette(el)` / `FALLBACK` /
   the `getComputedStyle` reads and the "re-resolve every 30 frames"
   `colorAge` logic entirely. Replaced with a fixed `LAB` constant:
   - `ground: "#0a0b10"`
   - `plateAHex: "#ff5c93"` @ `plateAAlpha: 0.75` (plate A / pink — exact lab
     `rgba(255,92,147,.75)`)
   - `plateBHex: "#3aa0ff"` @ `plateBAlpha: 0.7` (plate B / blue — exact lab
     `rgba(58,160,255,.70)`)
   - `crosshair: "#eceef8"` (was `--color-fg`; exact lab
     `rgba(236,238,248,.55)`)
2. **Blend mode is now ALWAYS `'screen'`.** Removed `relativeLuminance()` and
   the `dark = relativeLuminance(parseRgb(palette.bg)) < 0.5` branch that
   picked `'screen'` vs `'multiply'` — the lab is always dark, so there is no
   light-ground case to branch on anymore. `accent`/`secondary` still
   override plate A / plate B respectively (parsed via `parseRgb`, which is
   now used ONLY for that override — no longer doubles as a luminance input).
3. **Opaque lab ground.** `ctx.fillStyle = LAB.ground; ctx.fillRect(0,0,W,H);`
   is now the first canvas op every frame (right after `clearRect`), so the
   `'screen'` blend always composites against a known dark ground regardless
   of host page/theme. Also set `.{cls} { background: #0a0b10; }` on the
   decorative wrapper as a pre-paint CSS fallback.
4. **Quiet-zone scrim — exact lab formula**, replacing the old
   `safeArea`-driven center/color: `createRadialGradient(W*0.26, H*0.5, 0,
   W*0.26, H*0.5, Math.min(W,H)*0.72)` with literal stops
   `rgba(10,11,16,0.93)@0`, `rgba(10,11,16,0.55)@0.6`, `rgba(10,11,16,0)@1`.
   This is now fixed/independent of the `safeArea` prop — `safeArea` still
   drives the DOM frosted scrim (`scrimStyle`), just not this canvas
   readability gradient anymore. (Note: unlike chart-recorder, this
   component's plate-drift math never read `safeArea` for amplitude
   quieting, so removing it from the `draw()` destructure was safe — no
   other usage.)
5. Doc comments updated (props + component docstring) to describe the fixed
   lab palette + always-screen blend instead of "theme resolves it" / "chosen
   by the resolved ground's luminance."

## Preview hero restyle (both files)

- `apps/docs/app/_previews/riso-registration.tsx`
- `apps/docs/app/_previews/catalog/riso-registration.tsx`

Replaced all `var(--color-*)`-based hero styling (pill, h3, p, CTA, ghost
button) with fixed inline `style` objects matching the lab `.hero` exactly:
pill muted `#8f95ab` / border `#232636` / bg `rgba(10,11,16,.55)` / blur(8px);
h3 `#eceef8` weight 800 + `text-shadow: 0 2px 26px rgba(10,11,16,.95), 0 0 3px
rgba(10,11,16,.7)`; body `#b7bccf` + `text-shadow: 0 1px 18px
rgba(10,11,16,.95)`; CTA bg `#ff5c93` (Press Run stage accent, the lab's root
`--pink`), text **`#fff`** (not `#0a0b10`) — the lab's riso stage carries an
explicit `style="color:#fff"` override on its `.cta` span (the only stage that
does), reproduced here verbatim; weight 700, radius 10px; ghost border
`#232636`, text `#eceef8`, bg `rgba(10,11,16,.5)`, blur(8px), radius 10px.
Copy text unchanged. The safe-area debug-toggle overlay (dev-only, not part of
the lab) was left on theme tokens — out of scope per the spec.

## New docs-content.ts bullets (for the orchestrator to apply)

**`accessibility`** (replace the existing array for `riso-registration` —
supersedes the "Colors resolve live from CSS design tokens ... the
screen/multiply blend choice itself follows the resolved ground's luminance"
bullet, which is no longer true):

```ts
accessibility: [
  "Decorative background: the canvas layer is aria-hidden, with `children` rendered in a separate, fully readable layer on top.",
  "Committed to a fixed dark Motion Lab palette (not CSS design tokens) — plate A (pink) and plate B (blue) always screen-blend on an opaque #0a0b10 ground, pixel-matched to the Motion Lab prototype regardless of host page or theme.",
  "Respects prefers-reduced-motion (or the reducedMotion prop) by freezing on one rich, representative register-lock frame instead of animating.",
  "Under forced-colors mode both canvas ink plates are hidden (blend modes are unavailable there and would otherwise render as a flat, muddy block) and replaced with a neutral bordered fallback box.",
  "Known limitation: Safari's canvas 'screen' blend-mode compositing has historically been inconsistent across versions — visually verify the plate overlap in Safari before shipping a Safari-heavy audience page (tracked from the original batch build, still applicable now that the blend is unconditional).",
],
```

`performance` bullets are unchanged (still accurate — nothing about the
rAF/DPR/pause discipline changed).

## Verification (from `packages/registry`)

- `npx vitest run registry/backgrounds/riso-registration.test.tsx` → **12/12
  passed** (contract tests only — canvas output isn't assertable in jsdom;
  the expected `HTMLCanvasElement.prototype.getContext` "not implemented"
  stderr lines are the existing null-context-guard test doing its job).
- `npx tsc --noEmit` → clean.
- `npx tsc --noEmit -p tsconfig.consumer-strict.json` → clean (no unused
  locals after removing `relativeLuminance`/`resolvePalette`/`FALLBACK` and
  dropping the now-unused `sa` destructure from `draw()`).

## Deviations

None from the spec. Carried forward the pre-existing "riso needs Safari QA"
note (from the original batch build) into the accessibility bullet above per
the orchestrator's instruction to "keep the Safari blend-mode note" — this
component was not visually re-verified in Safari during this pass (no browser
access from this agent); it's a carried-forward caveat, not a new finding.
