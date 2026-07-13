# CLAUDE.md — `@scope/remotion`

> 🔵 **Planned package (Phase 4, license-gated).** Scaffold only. ⚠️ **Do not build until the license questions in [`docs/08-remotion-license-analysis.md`](../../docs/08-remotion-license-analysis.md) are answered in writing.** Root rules: [`/CLAUDE.md`](../../CLAUDE.md). Use the [`remotion-composition-authoring`](../../.claude/skills/remotion-composition-authoring/SKILL.md) skill.

## Video-only boundary
This is a **separate product line** with a **separate license**. It **must never be imported by any core UI package** (`@scope/react`, `@scope/sections`, `@scope/motion`). See [ADR-0003](../../docs/adrs/0003-remotion-boundary.md) and the [forbidden-import matrix](../../docs/03-architecture.md#forbidden-import-matrix). It may depend on `@scope/tokens` only.

## Synced Remotion package versions
Keep all `remotion` / `@remotion/*` package versions **synchronized** per official guidance.

## Schema requirements
Every composition/template defines a **Zod input schema** + default props, plus duration, FPS, dimensions, aspect ratios, theme, fonts, safe areas, audio, captions. See [`docs/07-remotion-strategy.md`](../../docs/07-remotion-strategy.md).

## Determinism
Same props → identical frames (deterministic-frame test). FPS-aware math from `useCurrentFrame()`/`fps`. **No `Date.now()`/`Math.random()`** in render paths unless seeded via props.

## Server/client separation
Render code (`renderMedia()`) lives in `@scope/remotion/server`, **Node-only**, behind the `node` export condition. The optional `@remotion/player` is the only client surface.

## Licensing stop conditions
Stop and escalate on any action that: sells/embeds the Player, renders for customers, lets users edit Remotion code, accepts arbitrary Remotion projects, or could read as selling Remotion itself. See [`docs/08`](../../docs/08-remotion-license-analysis.md). Do not present interpretations as legal conclusions.
