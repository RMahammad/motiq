# 30 — Showcase visual system

> **Type:** 🟢 Canonical for the showcase (docs/marketing/catalog) visual identity · **Status:** **"Deep Ink + Azure + Coral" selected** (2026-07-16) · **Supersedes** every prior identity (violet-on-near-black, warm graphite/cobalt, graphite/electric-violet). · **Related:** [ADR-0014](adrs/0014-visual-direction.md) (to be revised), [`10-design-tokens.md`](10-design-tokens.md), [`31-competitive-product-review.md`](31-competitive-product-review.md).

## Identity

A distinctive, professional component-library identity — **not** a generic purple AI site.

- **Neutrals — Deep Ink** (dark) / **cool porcelain + blue-gray** (light). A five-step surface hierarchy (page → subtle band → surface → elevated → strong) so nothing flattens into an undifferentiated black page.
- **Azure** `#4F7CFF` (dark) / `#315FEA` (light) is the **primary interaction colour** — buttons, active nav, selected tabs, focus rings, links, progress, primary motion emphasis.
- **Cyan** `#22C7D9` / `#009FB3` is the **secondary / data** accent — supporting details, dev-tool accents, informational states, subtle indicators.
- **Coral** `#FF6B5E` / `#E9564A` is the **rare Motionstack signature** — new-release indicators, one short highlighted phrase, small memorable brand moments. Never a general CTA colour; never paired with Azure on every card.
- **Status:** Emerald = success, Amber = warning, Red = error, Sky = info. Danger actions use Error, never Coral.
- Purple is retired as a brand colour (kept only where a creative component genuinely requires it). No brown/olive/beige/sepia.

Colour budget ≈ 65% neutral bg/surfaces · 20% elevated neutral · 10% Azure/Cyan · 5% Coral + status.

Scope: the **product surface** (homepage, catalog, docs, component pages). Per-component demo palettes (product swatches, avatar identity colours, chart series) remain component-specific customizable APIs and are out of scope.

## Palette

| Role | Dark | Light |
|---|---|---|
| Background | `#080C14` | `#F7F9FC` |
| Background subtle | `#0D1420` | `#F0F4F9` |
| Surface | `#111827` | `#FFFFFF` |
| Surface elevated | `#192337` | `#F8FAFD` |
| Surface hover | `#202D43` | `#EEF3FA` |
| Surface strong | `#243249` | `#E8EEF7` |
| Border / strong | `#263449` / `#354863` | `#DCE4EF` / `#C5D1E1` |
| Foreground | `#F8FAFC` | `#101828` |
| Foreground secondary | `#CBD5E1` | `#344054` |
| Foreground muted | `#9CAABD` | `#667085` |
| Foreground subtle | `#748197` | `#8793A5` |
| Azure / hover / pressed | `#4F7CFF` / `#6F91FF` / `#3D65E6` | `#315FEA` / `#244FD1` / `#1D40B3` |
| Azure soft | `rgba(79,124,255,0.14)` | `rgba(49,95,234,0.10)` |
| Cyan / soft | `#22C7D9` / `rgba(34,199,217,0.12)` | `#009FB3` / `rgba(0,159,179,0.10)` |
| Coral / hover / soft | `#FF6B5E` / `#FF8176` / `rgba(255,107,94,0.12)` | `#E9564A` / `#D9483D` / `rgba(233,86,74,0.10)` |
| Success / Warning / Error / Info | `#32D583` / `#F6B94A` / `#FF5C70` / `#38BDF8` | `#128A55` / `#B86E00` / `#D92D4A` / `#087DBD` |

Primary button — dark: Azure bg + deep-ink text; light: darker Azure bg + white text. Secondary button: neutral elevated surface + strong border, Azure border on hover. Focus: visible Azure ring with offset, both themes.

## Section-level treatment (homepage)

| Section | Treatment |
|---|---|
| Hero | Deep-ink / porcelain base, very subtle Azure spotlight + Cyan counter-glow, masked dot lattice, Azure top edge-light; strong neutral headline with **one Coral signature phrase** ("feel alive"); Azure primary CTA + neutral secondary |
| Differentiation | Mostly neutral; small Azure icon chips; exactly **one Coral proof point** (accessibility) |
| Featured | Neutral surface cards; Azure reserved for interaction/selected/hover; category secondary accents only in small details |
| Categories | One neutral card system; family colour only as a **top-border + soft tint + icon** (never a filled card) |
| Packs | Deep-ink azure-lit band (soft blue-gray in light), elevated pack cards, subtle Azure edge-light, **one small Coral commercial highlight** (the "Ship faster" dot) |
| Final CTA | A strong neutral (surface-strong) panel that **echoes the hero** — Azure/Cyan lighting + one Coral detail (the "Start today" dot). Not a disconnected bright rectangle |
| Footer | Quiet neutral, hairline top rule |

### Category accents
AI = Azure `#4F7CFF` · Developer tools = Cobalt `#3E5AE8` · Collaboration = Cyan `#22C7D9` · Data = Teal `#14B8A6` · Commerce = Emerald `#10B981` · Security = Indigo `#6366F1` · Productivity = Amber `#F59E0B` · Text & creative = Coral `#FF6B5E`. Icons, small badges, active details, soft tints, links only.

## Preview-stage templates (`apps/docs/app/_components/catalog-stage.tsx`)

AI = ink + Azure, Cyan info · Developer console = graphite + Cobalt/Cyan (Emerald/Amber/Red status) · Collaboration = neutral + Cyan/Azure · Data = navy/graphite + Cyan/teal · Commerce = neutral + Emerald · Security = cool navy + Azure/indigo (minimal) · Creative = ink + Azure/Cyan with a Coral signature edge · Mobile = neutral elevated. Tints stay faint so component content reads clearly; dev-console previews may remain internally dark.

## Implementation

- Tokens (default = Deep Ink + Azure + Coral): [`packages/tokens/styles.css`](../packages/tokens/styles.css). Requested semantic aliases (`--background`, `--surface-strong`, `--foreground-secondary`, `--accent`, `--secondary-accent`, `--signature`, `--success`, …) are defined in `:root` as `var()` pointers to the themed `--color-*` tokens.
- Homepage sections + category tiles: `apps/docs/app/page.tsx`; hero showcase tints: `apps/docs/app/_components/hero-showcase.tsx`.
- Evidence (dark + light, per section): `artifacts/homepage-redesign/ink/`.
- Validate via [`visual-quality-gate`](../.claude/skills/responsive-review/SKILL.md) at 320–1920 × light/dark before calling a change done.
