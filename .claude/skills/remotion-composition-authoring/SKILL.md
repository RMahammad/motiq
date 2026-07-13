---
name: remotion-composition-authoring
description: Author a Remotion composition/template in @scope/remotion. Enforces the video-only boundary, a validated Zod input schema, deterministic FPS-aware output, asset/font checks, safe areas, Studio + Player previews, a render smoke test, and a license-boundary review. Stops on unresolved licensing.
allowed-tools: Read, Edit, Write, Bash, Grep, Glob, WebSearch, WebFetch
---
# Remotion composition authoring

## Use this skill when
- Creating or changing a Remotion composition, template, or render pipeline in `@scope/remotion*`.

## Do not use this skill when
- Building anything in the core UI packages (Remotion must never enter them — [`03`](../../../docs/03-architecture.md#forbidden-import-matrix)).
- The Phase-4 license gate is not yet cleared → stop (see below).

## Required context
- [`docs/07-remotion-strategy.md`](../../../docs/07-remotion-strategy.md) (canonical)
- [`docs/08-remotion-license-analysis.md`](../../../docs/08-remotion-license-analysis.md) (⚠️ license — read first)
- [ADR-0003](../../../docs/adrs/0003-remotion-boundary.md)

## Inputs
- The composition's purpose, inputs, duration/FPS/dimensions, assets.

## Procedure
1. **Confirm the package boundary** — this lives in `@scope/remotion`/`@scope/remotion/server` only; server render code behind the `node` condition.
2. **Validated input schema** — a Zod schema + default props; define duration, FPS, dimensions, aspect ratios, theme, fonts, safe areas, audio, captions.
3. **Deterministic output** — derive timing from `useCurrentFrame()`/`fps`; **no `Date.now()`/`Math.random()`** unless seeded via props; FPS-aware math.
4. **Asset & font loading** — validate/await fonts and media before relying on them.
5. **Safe-area handling** — respect defined safe areas per aspect ratio.
6. **Previews** — Studio preview; Player preview where supported.
7. **Render smoke test** + **deterministic-frame test** (same props → identical frame hash) ([`14`](../../../docs/14-testing-strategy.md)).
8. **License-boundary review** — re-check the action against [`08`](../../../docs/08-remotion-license-analysis.md) (are we redistributing the Player? rendering for customers? letting users edit code?).
9. Keep all Remotion package versions **synchronized**.

## Required validation
- Zod schema validates; defaults render.
- ⛔ Deterministic-frame test passes; render smoke test passes.
- ⛔ No import path from this package into any core UI package.
- License-boundary review recorded.

## Expected outputs
Composition + Zod schema + defaults + Studio/Player preview + render + deterministic-frame tests + docs update + license note.

## Documentation updates
- Update [`07-remotion-strategy.md`](../../../docs/07-remotion-strategy.md) scope/status. Run [`documentation-maintenance`](../documentation-maintenance/SKILL.md).

## Stop conditions
- **Any unresolved licensing implication** ([`08`](../../../docs/08-remotion-license-analysis.md)) → stop; do not ship the Remotion product line until the questions are answered in writing.
- Non-deterministic output that can't be made deterministic → stop.

## Prohibited actions
- Importing Remotion (or this package) into core UI packages.
- Shipping before the [`08`](../../../docs/08-remotion-license-analysis.md) license gate is cleared.
- Non-deterministic timing (`Date.now()`/`Math.random()`) in render paths.
