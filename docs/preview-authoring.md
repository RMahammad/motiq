# Preview authoring standard

> **Type:** Canonical standard · Scope: every live preview across the docs site.

Every catalog item has a real live preview built from the real component and real controls — no fake controls or metrics. Preview adapters live in `apps/docs/app/_previews/`. The showcase identity is [`30-showcase-visual-system.md`](30-showcase-visual-system.md).

## Preview types

| Type | Purpose | Density | Interaction | Height |
| --- | --- | --- | --- | --- |
| Homepage | Prove the product above the fold | Focused, one idea | Auto-plays, restrained | Fixed, art-directed |
| Catalog card | Show the component dominating its card | Medium; the component fills the card | Hover/tap primary action | Uniform card height per grid |
| Detail | Full component with all working controls | Full | All controls wired to real props | Content-driven, no page overflow |
| Block | Composed components in a realistic layout | Realistic | Representative | Section height |
| Pack | The pack's components together | Overview | Light | Section height |

Never reuse a full detail preview inside a small card — cards get a purpose-built compact preview that keeps the component dominant.

## Requirements for every preview

- **Deterministic data** — no `Math.random()`/`Date.now()` in render; seed fixed data so SSR and CSR match.
- **Works** — every visible control maps to a real prop and changes the component.
- **Accessible** — keyboard operable, visible focus, reduced-motion respected; previews carry their own Light/Dark toggle.
- **Offscreen-safe** — continuous animation pauses when the preview is offscreen.
- **Lazy** — complex/heavy previews load lazily; no preview-only dependency loads globally.
- **No customer coupling** — preview code never leaks into the component's registry source.

## Wiring

The showcase page, install command, and metadata come from `product.config.json` — never hardcode the brand or a placeholder `@scope/*` specifier in visitor-facing output. See [`component-showcase-authoring`](../.claude/skills/preview-authoring/SKILL.md).
