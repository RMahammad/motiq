# Motiq campaign renderer (`apps/promo`)

Internal marketing workspace that renders the Motiq promotional videos with
Remotion **directly from the real registry component source**
(`packages/registry/registry/**`) and the real design tokens
(`packages/tokens/styles.css`). It is part of the pnpm workspace but is not a
product package: nothing in `packages/*` may import it, and it ships nothing.

> **License note (recorded 2026-07-18):** local renders of our own marketing
> by an individual fall under Remotion's free tier (see
> [`docs/08-remotion-license-analysis.md`](../../docs/08-remotion-license-analysis.md)
> and the note in [`docs/07-remotion-strategy.md`](../../docs/07-remotion-strategy.md)).
> Re-check those docs before expanding this app's scope. This app replaced the
> earlier isolated `tools/promo` (removed 2026-07-19; its final renders are
> archived in `assets/promo/`).

## How it stays deterministic

Everything on screen is a pure function of the Remotion frame:

1. `src/index.ts` shims `matchMedia` so `prefers-reduced-motion: reduce`
   matches — the registry components take their **real reduced-motion path**,
   which by design disables every wall-clock loop (spinners, pulses, carets,
   number tweens). `MotionGlobalConfig.skipAnimations` is set as belt-and-braces,
   and `src/style.css` freezes any remaining CSS animation.
2. The adapters in `src/adapters/` map `useCurrentFrame()` to component
   *state*: pipeline stage statuses, agent-run steps, tool-call lifecycles,
   streamed-response word counts, KPI values, table rows, presence/approval
   data. The components simply render that state — which is exactly the
   library's "application-controlled state" story.
3. The SVG backgrounds render with their real `reducedMotion` static mode and
   are animated by advancing node *statuses* per frame.
4. Fonts (Inter, JetBrains Mono) load via `@remotion/google-fonts`; fixed
   epoch timestamps + `formatTimestamp`/`now` props keep every clock stable.

Scene choreography (entrances, crossfades, settle-zoom) is layered on top with
Remotion `spring`/`interpolate` in `src/theme/` and `src/scenes/`.

## Layout

- `src/campaign.ts` — copy, verified claims, install command, sizes, safe
  areas, beat sheet (single source of truth for all compositions)
- `src/data/` — fictional demo data (pipeline run, agent scenario, dashboard,
  collaboration); nothing implies a real company or outage
- `src/adapters/` — frame → component-props state machines
- `src/scenes/` — shared scene modules reused across aspect ratios
- `src/compositions/` — the registered compositions
- `src/theme/` — fonts, animation helpers, stage primitives

## Compositions

| ID | Size | Duration | Purpose |
| --- | --- | --- | --- |
| `MotiqReadmeHero` | 2560×1440 (1280×720 logical stage ×2) | ~680 f / ~22.7 s loop (derived from `heroPhases`) | README hero — 2K master MP4 + 1440×810 GIF + poster |
| `DeploymentPipelineSpotlight` | 1200×675 | 240 f / 8 s | Developer Tools Pack story |
| `AgentWorkflowSpotlight` | 1080×1080 | 285 f / 9.5 s | AI Interface Pack story |
| `LiveDataSpotlight` | 1080×1080 | 210 f / 7 s | Data Motion Pack story |
| `MotiqSocialVertical` | 1080×1920 | 300 f / 10 s | Vertical launch cut (not a crop) |
| `MotiqReducedMotionDemo` | 1200×675 | 210 f / 7 s | Reduced-motion demonstration |
| `MotiqPoster` | 1200×675 still | — | Poster frame (render `--scale=2`) |

## Usage

```bash
pnpm install                 # repo root
cd apps/promo
pnpm studio                  # live-edit in Remotion Studio
pnpm render                  # render everything to assets/campaign/
pnpm render:readme           # README GIF only (15 fps, loop, < 8 MB gate)
pnpm render:social           # landscape/square/vertical MP4s (H.264)
pnpm render:poster           # 2400×1350 PNG
pnpm typecheck
```

Requires `ffmpeg` on PATH for the GIF palette encode.

Claim discipline: the numbers in `src/campaign.ts` (56 components, 4 packs,
install command) are verified against `packages/registry/registry.json` and
`LAUNCH.md` — update them together.
