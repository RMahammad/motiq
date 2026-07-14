# 30 — Showcase visual system

> **Type:** 🟢 Canonical for the showcase (docs/marketing/catalog) visual identity · **Status:** **Direction A selected** (2026-07-14) · **Supersedes** the "Motion Laboratory" chrome in [`28-visual-direction.md`](28-visual-direction.md) for the product surface. · **Related:** [ADR-0014](adrs/0014-visual-direction.md) (to be revised), [`10-design-tokens.md`](10-design-tokens.md), [`31-competitive-product-review.md`](31-competitive-product-review.md).

## Problem this fixes

The old showcase ran **two clashing palettes**: the docs chrome (`apps/docs/app/docs.css`) used a lime `#c8ff2f` signal (dark) that flipped to beige `#faf9f6` + olive `#3a7d00` (light), while component previews (`packages/tokens/styles.css`) used a separate indigo `#4f46e5`/`#818cf8`. Plus tiny type, terminal micro-labels, and narrow width. **One coherent identity** for the product surface is required; individual component *demos* may still expose customizable colors, but the chrome around them must be consistent.

Scope: this system styles the **product surface** (homepage, catalog, docs, component pages). It is **not** the per-component demo palette (those use `--color-*` tokens and can be themed by controls).

## Selected: Direction A — "Violet studio" ✅

Neutral white/graphite surfaces with one electric-violet accent. Closest to the Linear/Animate-UI register: premium, calm, broad appeal, lets colorful component demos pop without the chrome competing. Implemented in [`packages/tokens/styles.css`](../packages/tokens/styles.css).

| Role | Light | Dark |
|---|---|---|
| Background | `#FFFFFF` | `#08090C` |
| Secondary bg | `#F6F7FB` | `#0E1015` |
| Surface (elevated) | `#FFFFFF` | `#14171D` |
| Surface raised | `#FFFFFF` | `#1B1F27` |
| Primary text | `#111318` | `#F7F8FA` |
| Secondary text | `#667085` | `#9BA3B4` |
| Border | `#E4E7EC` | `#252A34` |
| Primary accent | `#695CFF` | `#8176FF` |
| Accent hover | `#5748F5` | `#9A90FF` |
| Focus ring | `#695CFF` (3px @40% via `--ring`) | `#8176FF` |
| Success | `#16A34A` | `#4ADE80` |
| Warning | `#B45309` | `#FBBF24` |
| Error | `#DC2626` | `#F87171` |
| Code bg | `#F6F7FB` | `#0E1015` |
| Preview-stage bg | `#FAFBFD` | `#0B0D12` |

- **Gradient policy:** restrained. One brand gradient `linear-gradient(135deg, #695CFF, #8176FF)` for the hero accent + CTA glow only; never behind body text. No rainbow/mesh chrome (component demos may use their own).
- **Typography:** `--font-display`/`--font-sans` = system UI stack (swap to a variable display face later); `--font-mono` for code. Scale: hero 56–80 / 40–52 mobile; section 36–52; card title 18–24; body 15–18; metadata ≥12–13. No all-caps micro-labels as the default; letter-spacing near-0 except the eyebrow.
- **Radius:** 6/10/16 (`--radius-sm/md/lg`); cards 16, controls 10, chips 6.
- **Shadow:** `--shadow-sm/md/lg`, tuned to the graphite ink so they read on white without muddiness.
- **Spacing/grid:** 4-based scale; content max ~1200–1440; catalog grid `repeat(auto-fill, minmax(320px, 1fr))` so previews stay large (never 4–5 tiny cards per row).
- **Motion character:** confident and quick — 120–360ms, `cubic-bezier(0.2,0,0,1)`; springs only for gestures. Reduced-motion preserves final state.
- **Contrast (informal WCAG 2.2 AA):** fg/bg ~19:1 (light) / ~18:1 (dark) ✓; muted/bg ~4.7:1 (light) / ~7:1 (dark) ✓ AA normal; accent-as-fill with `--color-accent-fg` white ≈ 3.9:1 → **AA for large/bold UI text (≥3:1) only** — small text on accent must use `--color-accent-hover` (darker) or dark ink. Focus ring meets 3:1 non-text.
- **Strengths:** widest appeal, premium/neutral, demo colors pop. **Risks:** violet-on-white button labels need the large-text caveat above; must not become "generic SaaS" — signature component demos above the fold carry the personality.

## Direction B — "Mono + electric cyan" (not selected)

Black-and-white studio, teal/cyan accent. More technical/distinctive.

| Role | Light | Dark |
|---|---|---|
| Background / Secondary | `#FFFFFF` / `#F4F7F8` | `#07090B` / `#0C1014` |
| Surface | `#FFFFFF` | `#101419` |
| Text / Muted | `#0A0D10` / `#5F6B76` | `#F8FAFC` / `#9AA7B3` |
| Border | `#DDE3E7` | `#242B33` |
| Accent / hover | `#007A8A` / `#006875` | `#32D6C5` / `#5FE3D6` |

Success `#0E9F6E`/`#34D399`, Warning `#B45309`/`#FBBF24`, Error `#D64550`/`#F87171`; code `#F4F7F8`/`#0C1014`; stage `#F7FAFB`/`#090C0E`. Gradient: cyan→teal, sparse. Same type/radius/spacing as A. **Contrast:** teal `#007A8A` + white ≈ 4.6:1 (AA normal ✓ — better than A's accent). **Strengths:** distinctive, strong on dark, best accent contrast. **Risks:** teal can read "fintech/ops"; less warm; dark cyan can vibrate on large fills.

## Direction C — "Graphite + vivid coral" (not selected)

Warm graphite neutrals, bold coral accent. Energetic, creative-tool feel.

| Role | Light | Dark |
|---|---|---|
| Background / Secondary | `#FCFCFD` / `#F5F5F6` | `#0A0A0C` / `#101013` |
| Surface | `#FFFFFF` | `#151518` |
| Text / Muted | `#16161A` / `#6D6D75` | `#FAFAFA` / `#A3A3AA` |
| Border | `#E5E5E8` | `#2A2A30` |
| Accent / hover | `#F04F47` / `#DB4039` | `#FF6B63` / `#FF8079` |

Success `#16A34A`/`#4ADE80`, Warning `#B45309`/`#FBBF24`, Error reuses a deeper red `#C4342C` to stay distinct from the coral accent; code `#F5F5F6`/`#101013`; stage `#FBFBFC`/`#0C0C0E`. Gradient: coral→amber, hero only. **Contrast:** coral `#F04F47` + white ≈ 3.4:1 → **large/bold UI text only**; error vs accent proximity is a risk (mitigated by the deeper error red). **Strengths:** memorable, energetic. **Risks:** coral is polarizing for a dev tool; accent/error hue collision; harder to keep "premium" vs "playful."

## Decision rationale

A wins on **broadest appeal + letting colorful demos be the star** without the chrome shouting. B is the strongest runner-up (best accent contrast, distinctive) and is kept as the documented fallback if violet ever reads too "generic." C is deferred — coral's appeal is narrower and its accent/error hue proximity adds risk. Contrast caveats for A's accent are encoded as a rule: **small text never sits on raw `--color-accent`.**

## Implementation

- Tokens: [`packages/tokens/styles.css`](../packages/tokens/styles.css) (done).
- Docs chrome: `apps/docs/app/docs.css` re-based on the `--color-*` tokens (removes the lime/olive/beige layer).
- Validate via [`visual-quality-gate`](../.claude/skills/visual-quality-gate/SKILL.md) at desktop/tablet/mobile × light/dark before calling the redesign done.
