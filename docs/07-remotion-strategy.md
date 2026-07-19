# 07 — Remotion strategy

> **Type:** 🟢 Canonical for the Remotion product line & rendering flow · **Implementation status:** 🔵 Planned (Phase 4 — gated) · **Last reviewed:** 2026-07-14
> **Related:** [`08-remotion-license-analysis.md`](08-remotion-license-analysis.md) (⚠️ read first) · [ADR-0003](adrs/0003-remotion-boundary.md) · [`03-architecture.md`](03-architecture.md) · [`remotion-composition-authoring` skill](../.claude/skills/remotion-composition-authoring/SKILL.md)
> ⚠️ **Do not build any of this until the license questions in [`08`](08-remotion-license-analysis.md) are answered in writing.** This is the Phase-4 gate.
>
> **Internal marketing use (2026-07-18, tool consolidated 2026-07-19):** [`apps/promo/`](../apps/promo/README.md) uses Remotion to render our own marketing videos (`assets/campaign/`, `assets/showcase/`; it replaced the earlier isolated `tools/promo`, whose final renders are archived in `assets/promo/`). This is local rendering by an individual under Remotion's free tier — it does not redistribute the Player, render for customers, or ship Remotion code to buyers, so it does not trip the Phase-4 gate. It is a private workspace app, not part of this product line.

## Product boundaries

Remotion is a **separate product line** in `@scope/remotion` and `@scope/remotion/server`. The core UI packages never import it (see the [forbidden-import matrix](03-architecture.md#forbidden-import-matrix)). It shares only `@scope/tokens` so videos and UI use one design language — the dependency arrow never points back into the UI.

## Template architecture

Design a shared template schema validated with **Zod**. Each template defines:

- Composition ID
- Input schema + default props
- Duration, FPS, dimensions, aspect ratios
- Theme, fonts, media assets
- Safe areas
- Audio behavior, captions
- Render requirements

Each template must be: **previewable in Remotion Studio**, **displayable via Remotion Player** in React/Next, **renderable on a server**, and **parameterized through validated props**. Keep all Remotion package versions **synchronized** per official guidance.

## Preview & render flow

```mermaid
graph LR
  subgraph Studio["Dev: Remotion Studio"]
    comp[Composition + Zod schema]
  end
  subgraph AppSide["Buyer app (browser)"]
    player["@remotion/player<br/>(client, optional)"]
  end
  subgraph Server["Render (Node/Lambda, licensed)"]
    render["@scope/remotion/server<br/>renderMedia()"]
  end
  comp -->|preview| Studio
  comp -->|validated props| player
  comp -->|validated props| render
  render --> mp4[(MP4/WebM)]
  player -. never in .-x CoreUI[@scope/react]
```

## Determinism requirements

- Same props → identical frames (deterministic-frame test, [`14`](14-testing-strategy.md)).
- FPS-independent math where possible (derive from `useCurrentFrame()`/`fps`, not wall-clock).
- No `Date.now()` / `Math.random()` in render paths unless seeded via props.
- Assets and fonts must be load-checked before they are relied on.

## Package separation

| Package | Env | Contains |
|---|---|---|
| `@scope/remotion` | browser + node | compositions, `<Player>` wrappers, Zod schemas, template registry |
| `@scope/remotion/server` | **node only** | `renderMedia()` and render orchestration behind the `node` export condition |
| `@scope/remotion-templates` | data + source | editable template packs (sold separately) |

## Rendering deployment options (planned, decision open)

| Option | Notes | Cost/support |
|---|---|---|
| Source-only (buyer renders) | Simplest; buyer needs own Remotion license if 4+ people | Lowest for us |
| Self-hosted render service | We run `renderMedia()` | Infra + support; needs company license |
| Serverless (Lambda) render | Scales; per-render cost | Cost tracking via `@remotion/licensing` |

Which to offer is an [open question](23-open-questions.md) and a Phase-4 decision.

## Product categories (scope)

Kinetic typography, logo reveals, product-launch intros, feature showcases, SaaS demo videos, social ads, story/reel templates, YouTube intros/outros, lower thirds, animated captions, quote videos, podcast clips, data-viz scenes, code-demo videos, testimonial videos, comparison videos, app-store preview sequences, timeline/chapter components, transitions, background loops. Classify each as: **low-level reusable component** vs **full composition** vs **editable template** vs **example project** vs **separate paid pack**.

## Stop condition

Any work here stops at the first unresolved licensing implication. See [`08`](08-remotion-license-analysis.md) and the [`remotion-composition-authoring`](../.claude/skills/remotion-composition-authoring/SKILL.md) and [`dependency-review`](../.claude/skills/component-review/SKILL.md) skills.
