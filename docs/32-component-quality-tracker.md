# 32 — Component quality tracker

> **Type:** 🟢 Canonical for per-component sellability status · **Last reviewed:** 2026-07-14
> **Gate:** [`component-sellability-review`](../.claude/skills/component-sellability-review/SKILL.md) · **Loop:** [`rendered-preview-iteration`](../.claude/skills/rendered-preview-iteration/SKILL.md) · **Screenshots:** `artifacts/component-reviews/<slug>/`
> **Statuses:** Draft · Functional · Visually reviewed · Production reviewed · **Sellable** · Needs redesign · Deferred.
> **Rule:** No component is **Sellable** without persisted, reviewed screenshots. Free = same gate as Pro. Scores are A Product · B Visual · C Motion · D Originality · E A11y · F Responsive · G Perf · H API · I Showcase · J Production (minimums 8/8/8/7/9/8/8/8/8/9).

## Scores (2026-07-14 upgrade pass — self-scored) — ⚠️ SUPERSEDED

> **These are the IMPLEMENTATION AGENT's self-scores and are now SUPERSEDED** by the independent audit + revalidation two sections down. They are kept **verbatim** so the optimism bias (uniform "Sellable, 8–9") is visible against the independent scores. **Do not treat this table's "Sellable" statuses as current.** The self-review also **double-counted** Arrow + Copy as two rows (they are one `animated-icons` item).

Scores below are self-assessed "meets-gate" values. Independent review dropped every status to "Production-ready but ordinary" or "Needs polish" (see below).

| Component | Tier | A | B | C | D | E | F | G | H | I | J | Status | Screenshots |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Animated Dialog | Free | 9 | 9 | 9 | 8 | 9 | 9 | 9 | 9 | 9 | 9 | **Sellable** | `animated-dialog/` |
| Animated Tabs | Free | 9 | 9 | 9 | 8 | 9 | 8 | 9 | 8 | 9 | 9 | **Sellable** | `animated-tabs/` |
| Animated Accordion | Free | 8 | 8 | 9 | 7 | 9 | 8 | 9 | 8 | 8 | 9 | **Sellable** | `animated-accordion/` |
| Animated Button | Free | 9 | 8 | 8 | 7 | 9 | 9 | 9 | 9 | 8 | 9 | **Sellable** | `animated-button/` |
| Blur Text | Free | 9 | 9 | 9 | 8 | 9 | 8 | 8 | 8 | 9 | 9 | **Sellable** | `blur-text/` |
| Rotating Text | Free | 8 | 8 | 8 | 7 | 9 | 8 | 8 | 8 | 8 | 9 | **Sellable** | `rotating-text/` |
| Animated List | Pro | 9 | 9 | 9 | 8 | 9 | 8 | 8 | 8 | 9 | 9 | **Sellable** | `animated-list/` |
| Spotlight Card | Pro | 8 | 9 | 8 | 8 | 9 | 8 | 9 | 8 | 8 | 9 | **Sellable** | `spotlight-card/` |
| Animated Grid | Free | 8 | 9 | 8 | 8 | 9 | 8 | 9 | 8 | 9 | 9 | **Sellable** | `animated-grid/` |
| Animated Arrow | Free | 8 | 8 | 8 | 7 | 9 | 8 | 9 | 8 | 8 | 9 | **Sellable** | `animated-icons/` |
| Animated Copy | Free | 8 | 8 | 8 | 7 | 9 | 8 | 9 | 8 | 8 | 9 | **Sellable** | `animated-icons/` |

## Independent audit + post-fix revalidation (2026-07-14)

> **Reviewer:** an independent adversarial subagent that did **not** implement the components (full findings: [`docs/33-independent-component-audit.md`](33-independent-component-audit.md)). Prior self-scores above are **kept** so optimism bias stays visible. Statuses use the strict vocabulary; "Production-ready but ordinary" is **not** Sellable.
> **Note:** `docs/32` previously double-counted **Animated Arrow** and **Animated Copy** as two rows; they are **one** registry item (`animated-icons`) — consolidated below.

**Prior self-scores were a uniform "Sellable, 8–9". The independent audit downgraded every one.** Two systemic evidence findings drove it: **S1** the "light-mode" screenshots were actually dark (PreviewStage hardcoded its theme to dark and the harness shot that element) → Production evidence was unproven; **S2** solid buttons/triggers lost all boundary in forced-colors. Both are now **fixed and re-verified** (see revalidation column).

| Component | Prior self (status) | Independent score (A/B/C/D/E/F/G/H/I/J) | Independent status | Key delta | Post-fix revalidation (2026-07-14) | Final status |
|---|---|---|---|---|---|---|
| Animated Dialog | Sellable (9-heavy) | 9/9/8/7/8/8/9/8/9/7 | Production-ready but ordinary | J −2, D −1, E −1 | Light evidence now real (J→8); forced-colors trigger boundary (E→9). Originality D7 unchanged. | **Production-ready but ordinary** |
| Animated Tabs | Sellable | 8/8/8/7/8/7/9/8/8/7 | Production-ready but ordinary | J −2, F −1 | Forced-colors active-tab Highlight outline + outline focus (E→9); light real (J→8); `directionAware` docs fixed. Overflow still unhandled (F7). | **Production-ready but ordinary** |
| Blur Text | Sellable | 8/9/8/6/9/8/8/8/9/7 | Production-ready but ordinary | D −2, J −2 | Light real (J→8). Originality D6 (commodity effect) unchanged. | **Production-ready but ordinary** |
| Animated List (Pro) | Sellable | 8/8/8/6/9/8/8/8/8/7 | Production-ready but ordinary | D −2, J −2 | Light real (J→8). Pro originality D6 < 8 — **removed from homepage featured**. | **Production-ready but ordinary** |
| Animated Grid | Sellable | 8/8/7/7/8/8/9/8/8/7 | Production-ready but ordinary | J −2, B −1 | **Forced-colors fallback grid** added (E→9); light real (J→8); `size` docs fixed. **Removed from homepage featured**. | **Production-ready but ordinary** |
| Animated Button | Sellable | 8/8/7/6/8/8/9/9/8/7 | Production-ready but ordinary | D −1, C −1, J −2 | **Forced-colors boundary on all variants + outline focus** (E→9); light real (J→8). Originality D6 unchanged. | **Production-ready but ordinary** |
| Animated Accordion | Sellable | 8/8/8/6/8/8/9/8/8/7 | Production-ready but ordinary | D −1, J −2 | Light real (J→8). Textbook FAQ; originality D6 unchanged. | **Production-ready but ordinary** |
| Rotating Text | Sellable | 7/8/7/6/8/8/8/8/8/7 | Needs polish | D −1, J −2 | Removed role-less `tabIndex` span (E→9); light real (J→8). A7/D6 remain. | **Needs polish** |
| Spotlight Card (Pro) | Sellable | 7/7/6/6/8/7/9/8/7/7 | Needs polish | B −2, C −2, D −2 | Light real (J→8) only. Commodity spotlight, plain base card, touch value gap, Pro originality unmet. | **Needs polish** |
| Animated Icons (Arrow + Copy) | Sellable ×2 | Arrow 6/7/5/6/8/8/9/8/7/7 · Copy 7/7/6/6/8/8/9/8/7/7 | Needs polish | C −3/−2 | Light real (J→8). Motion too small to matter; question standalone-entry value. | **Needs polish** |

**Score-history rule honored:** prior optimistic scores are in the table at the top of this file; independent + post-fix here. Nothing was upgraded to "Sellable" by self-review — per the [no-self-approval rule](../CLAUDE.md#no-self-approval-rule-independent-review), a formal Sellable status requires an independent re-review pass on the post-fix evidence.

### Revalidation results
- Registry regenerated + validated ✓ · registry component tests **10/10** ✓ · registry + docs typecheck ✓ · production build ✓.
- **Clean-fixture install re-run after the source fixes** (fresh project): 11 files, correct deps, **no forbidden imports**, installed source typechecks ✓.
- Re-captured evidence: **real light mode** for all 11 (`after-*-light.png`), forced-colors re-shot for Button/Grid/Tabs (`audit/forced-colors.png` — all now legible). Recordings + frames from the audit pass retained under `artifacts/component-reviews/<slug>/audit/`.

### Unlock decision
- **Category-leading: 0 · Strongly Sellable: 0 · Sellable: 0.** The **≥3 unlock is NOT met.** Originality is the standing blocker (every effect is a commodity competitors ship free). **New component development remains BLOCKED** (no Tooltip/Switch/Aurora/Marquee/Count Up).
- Homepage featured reduced to the **3 strongest, all free, diverse motion**: Animated Dialog, Animated Tabs, Blur Text (documented as the near-term Sellable candidates, not yet formally Sellable). Removed: Animated List, Animated Grid.
- **Next work:** push originality on the 3 strongest via *substance* (Dialog mobile-sheet + long-content scroll; Tabs overflow + a signature indicator; a distinctive Blur variant), then an independent re-review — not new components.

## Signature sprint (2026-07-14) — [`docs/34`](34-signature-component-sprint.md)

Turning the 3 strongest into signature components. **Independent re-review after each; no self-approval.**

| Component | Pre-sprint status | Signature changes | Independent status | Delta | Unlock-qualifying? |
|---|---|---|---|---|---|
| Animated Dialog | Production-ready but ordinary | Adaptive mobile **sheet**, long-content **Header/Body/Footer** (pinned actions), forced-colors-safe close, restrained visual/motion signature; 3 real dialogs | **Sellable** | ordinary → Sellable | **No** — Originality 7 < 8 (reviewer: sheet+sticky is "table-stakes"); gating **faked-evidence** + **keyboard-overclaim** + controlled-state defects all **fixed** |
| Animated Tabs | Production-ready but ordinary | *(cycle not run this session)* | — | — | — |
| Blur Text | Production-ready but ordinary | *(cycle not run this session)* | — | — | — |

**Unlock:** Category-leading 0 · Strongly Sellable 0 → **≥3 gate NOT met → new components remain BLOCKED.** The strongest component reached only *Sellable* under an honest adversarial review; reaching *Strongly Sellable* on commodity patterns likely needs novel interaction R&D, not polish (recorded honestly — not gamed).

## Signature components (creative pivot, 2026-07-14 — [`docs/36`](36-premium-creative-component-strategy.md), gates: conception → originality → premium-visual-review)

| Component | Tier | Class | Concept evidence | Originality risk | Status | Evidence |
|---|---|---|---|---|---|---|
| Kinetic Emphasis | Free | text-effect (signature) | 3 concepts rendered + `selected-concept.md` ✓ | **Moderate** (independent concept + implementation-stage passes; all 8 guardrails PASS) | **Strongly Sellable** — independent post-fix re-review 2026-07-14 (second reviewer, adversarial live verification): First impression 9 · Authorship 9 · Composition 9 · Typography 9 · Material 8 · **Color 9** · Motion direction 9 · **Interaction 9** · State continuity 9 · Responsive 9 · Touch 8 · **Accessibility 9** · **Reduced motion 9** · Performance 9 · Usefulness 9 · Showcase 9; extras: Motion 9 · Originality 8 · API 9 · **Production evidence 9**. Both majors verified fixed live (reduced-motion em accent = settled-sweep color in both themes; light 17px em #5648ee via new `--color-accent-text` = 5.0–5.9:1) + regression-tested (21/21); all 4 addressed minors confirmed; Category-leading checked and declined (Material 8 · Touch 8 · Moderate originality). *Score history — first premium review 2026-07-14: **Needs polish** (Color 7 · Interaction 8 · Accessibility 7 · Reduced motion 7 · Production evidence 8; 2 majors: `clearInline()` stripped the em accent under reduced motion; light body-scale emphasis ≈3.7–4:1 < 4.5:1; invalid `focus.png` duplicate).* Watch item: 108/225ms init long tasks under synthetic 4× throttle (0 frames >26ms). Eligible for homepage featuring | `artifacts/signature-components/kinetic-emphasis/` · `independent-review.md` (incl. post-fix re-review) |

## Per-component notes

- **Animated Dialog** — before: trigger floating in a dotted box. After: realistic "Members / access" card trigger context; open modal is a polished "Invite to workspace" surface with a focused email input, dimmed+blurred backdrop, clear button hierarchy. Radix focus trap/Esc/portal preserved; scale enter/exit; reduced-motion instant. No blockers.
- **Animated Tabs** — realistic dashboard (Overview/Analytics/Reports) with a bar chart; subtle accent indicator (not a garish pill) that slides via `layoutId`; content cross-fades; arrow-key roving focus preserved. Minor: mobile overflow relies on wrapping — acceptable.
- **Animated Accordion** — FAQ context, auto chevron, `height:auto` Motion via MutationObserver-mirrored `data-state`; keyboard + single/multiple + disabled preserved; reduced-motion instant. Originality is modest (7) — a refined FAQ, not novel — but meets the gate.
- **Animated Button** — real "Publish changes" form footer with press feedback, accessible loading (`aria-busy` + polite status) and copy affordance; focus-visible ring; forms/disabled intact.
- **Blur Text** — marketing-grade hero: eyebrow badge + large headline + subcopy on a gradient wash; full string via `aria-label`, segments `aria-hidden`; reduced-motion final state.
- **Rotating Text** — polished centered headline; stable inline-grid layout (no jump); `aria-live=polite` announces current word; pauses on hover/focus.
- **Animated List** — activity feed with status dots + metadata; staggered enter, clean exit, focus-safe add/remove.
- **Spotlight Card** — real feature cards (icon tile + title + copy) that stand on their own; pointer glow is CSS-only (no re-render) and doesn't carry meaning; touch-safe.
- **Animated Grid** — upgraded from a single dotted layer to a layered grid (fine base + accent major lines) with a drifting accent glow and radial fade; readable foreground; CSS-only, reduced-motion stops all motion.
- **Animated Arrow / Copy** — shown inside real controls (checkout button, API-key copy row); decorative (`aria-hidden`, `focusable=false`, not tabbable); copy→check swap; reduced-motion static.

### Remaining honest caveats
- Originality sits at 7 for the more utilitarian items (accordion, button, rotating text, icons) — they are refined and clean-room, not radically novel. That meets the D≥7 minimum but is the first place to push further.
- Screenshots captured at desktop light/dark + mobile light/dark + reduced-motion + focus + one interaction each. Tablet and additional error/empty states are not yet all captured.

### Legend for the loop
Each component: record current weaknesses → upgrade → render + persist screenshots → critique → fix → re-render → score → set status. Do not mark Sellable from source.
