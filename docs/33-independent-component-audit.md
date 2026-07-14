# 33 — Independent component audit (adversarial, read-only)

> **Type:** Independent, adversarial, READ-ONLY audit. **Reviewer:** a separate auditing process that did **not** implement these components and does not trust prior scores. **Date:** 2026-07-14.
> **Scope:** the 11 shipped components. **Method:** source read + tests read + docs/catalog/preview read + rendered PNG evidence in `artifacts/component-reviews/<slug>/` (desktop/mobile/tablet, dark, "light", focus, forced-colors, zoom-200, entrance frame sequences, interaction/state stills). Live `.webm` was not watched — motion is judged from frame sequences + code.
> **Strict scale:** 10 exceptional/category-leading · 9 highly polished/commercially strong · **8 = GOOD, not premium** · 7 competent but visibly ordinary · 6 functional but unfinished · ≤5 not commercially ready.
> **Strict Sellable rule:** no dimension < 8; Accessibility ≥ 9; Production evidence ≥ 9; Originality ≥ 8 (Pro) / ≥ 7.5 (Free, no silent rounding); real animation evidence; no major issue; docs match implementation; works mobile/tablet/desktop/**light**/dark/reduced-motion.
> Dimensions scored 1–10: **A** Product usefulness · **B** Visual · **C** Motion · **D** Originality · **E** Accessibility · **F** Responsiveness · **G** Performance · **H** API · **I** Showcase · **J** Production evidence.

---

## 0. Two systemic findings that gate the whole set

**S1 — The persisted "light-mode" screenshots are not light mode (blocks Production evidence, all 11).**
Every `after-desktop-light.png` / `after-mobile-light.png` / `audit/tablet-light.png` I opened renders the **dark** theme, pixel-for-pixel identical to its dark counterpart. Verified on `animated-dialog/after-desktop-light.png`, `blur-text/after-desktop-light.png`, `spotlight-card/after-desktop-light.png`, `animated-grid/after-desktop-light.png`, and `animated-grid/audit/tablet-light.png` — all dark. The light-capture pipeline never toggled the theme. Consequence: there is **zero rendered proof of light-mode behavior for any component.** The components are token-based (`var(--color-fg,#111318)`, `var(--color-surface,#fff)` …) so they almost certainly *work* in light, but the prior tracker's **Production = 9** for all 11 is unsupported by the evidence it cites. I cap Production at **7** everywhere.

**S2 — Solid buttons lose all affordance under forced-colors (Windows High Contrast).**
`animated-button/audit/forced-colors.png` shows the primary "Publish" (solid variant: `bg-accent text-white`, no border) collapse to bare text, visually indistinguishable from the ghost "Cancel"; only the `outline` variant keeps a boundary. Same effect on the dialog trigger (`animated-dialog/audit/forced-colors.png`, "Invite" becomes plain text) and the icons demo checkout button. This is a real WCAG 1.4.11 (non-text contrast / control boundary) gap and it caps Accessibility for every button-bearing component below the 9 the tracker claims.

Together S1 and S2 mean **no component currently clears the strict Sellable bar on evidence**, independent of intrinsic quality.

---

## 1. Ranking, weakest → strongest (drives fix order)

1. **Animated Copy** — trivial icon swap; padding a catalog slot.
2. **Animated Arrow** — 3px nudge; the smallest animation in the set.
3. **Rotating Text** — commodity word-cycler; focusable-span smell.
4. **Spotlight Card** *(Pro)* — commodity spotlight on a plain base card; value evaporates on touch.
5. **Rotating/Accordion tie → Animated Accordion** — clean but textbook FAQ.
6. **Animated Grid** — nicer-than-usual layered grid, still a common backdrop.
7. **Animated Button** — solid, useful states; forced-colors + focus-evidence gaps.
8. **Blur Text** — marketing-grade finish on one of the most over-cloned effects.
9. **Animated List** *(Pro)* — genuinely useful activity feed; best forced-colors result; very recognizable pattern.
10. **Animated Tabs** — clean, tasteful indicator; standard sliding-pill.
11. **Animated Dialog** — strongest: best demo, best surface, real Radix a11y spine.

---

## 2. Summary table

| Component | Prior status | Independent status | A11y (E) | Originality (D) | Production (J) | Lowest dim | Verdict |
|---|---|---|---|---|---|---|---|
| Animated Dialog | Sellable | Production-ready but ordinary | 8 | 7 | 7 | 7 | Strongest; blocked by S1 + forced-colors |
| Animated Tabs | Sellable | Production-ready but ordinary | 8 | 7 | 7 | 7 | Standard sliding-pill; overflow unhandled |
| Blur Text | Sellable | Production-ready but ordinary | 9 | 6 | 7 | 6 | Beautiful but over-cloned effect |
| Animated List (Pro) | Sellable | Production-ready but ordinary | 9 | 6 | 7 | 6 | Useful; Pro originality bar not met |
| Animated Grid | Sellable | Production-ready but ordinary | 8 | 7 | 7 | 7 | Common backdrop, well executed |
| Animated Button | Sellable | Production-ready but ordinary | 8 | 6 | 7 | 6 | Good states; forced-colors affordance loss |
| Animated Accordion | Sellable | Production-ready but ordinary | 8 | 6 | 7 | 6 | Textbook FAQ |
| Rotating Text | Sellable | Needs polish | 8 | 6 | 7 | 6 | Commodity; focusable span |
| Spotlight Card (Pro) | Sellable | Needs polish | 8 | 6 | 7 | 6 | Commodity spotlight; Pro tier unjustified |
| Animated Arrow | Sellable | Needs polish | 8 | 6 | 7 | 5 | Animation too small to matter |
| Animated Copy | Sellable | Needs polish | 8 | 6 | 7 | 6 | Trivial; double-counted vs catalog |

---

## 3. Per-component detail

Prior per-dimension scores are quoted from `docs/32-component-quality-tracker.md` (A/B/C/D/E/F/G/H/I/J). All prior statuses were **Sellable**.

### 3.1 Animated Dialog — *strongest*
- **Prior:** 9/9/9/8/9/9/9/9/9/9.
- **Independent:** A9 B9 C8 D7 E8 F8 G9 H8 I9 **J7**. Delta: D −1, E −1, C −1, F −1, J −2.
- **Critical:** none.
- **Major:** S1 (no light evidence); mobile *open* state never captured — a centered `max-w-lg` modal with long content on a 375px viewport is the classic overflow risk and there is no shot proving it (only the closed trigger card, `after-mobile-dark.png`).
- **Minor:** entrance is a 0.96→1 scale + fade; `frames/entrance-0080ms.png` and `entrance-0400ms.png` are indistinguishable (motion is tasteful but so subtle stills can't resolve it); "Invite" trigger loses affordance in forced-colors (S2).
- **External:** vs Radix/shadcn default dialog, ours adds a genuinely nicer demo (Members → Invite surface, blurred backdrop, `interaction-open.png`) and clean AnimatePresence exit. It does **not** do anything Animate UI / Aceternity dialogs don't; no mobile sheet variant, no long-content scroll region. A buyer would notice the *demo* polish, not a novel dialog.
- **Evidence:** `after-desktop-dark.png`, `after-desktop-light.png` (dark!), `after-mobile-dark.png`, `interaction-open.png`, `audit/forced-colors.png`, `audit/frames/entrance-0080ms.png`, `entrance-0400ms.png`.

### 3.2 Animated Tabs
- **Prior:** 9/9/9/8/9/8/9/8/9/9.
- **Independent:** A8 B8 C8 D7 E8 F7 G9 H8 I8 **J7**. Delta: B −1, D −1, E −1, F −1, J −2.
- **Major:** overflow/long-label behavior is unhandled — the List is `inline-flex` with no scroll; long labels or many tabs will wrap or clip on mobile (not proven safe). S1.
- **Minor:** in `audit/forced-colors.png` the active-tab pill (`bg-accent/12`) disappears and all three tabs read identically — the active state is **visually indistinguishable** in high contrast (SR is fine via Radix `aria-selected`). Docs API says `directionAware` default **"true"**; the source default is **`false`** — a real docs/impl mismatch.
- **External:** the `layoutId` sliding indicator (`interaction-analytics.png`, `zoom-200.png` clean) is the exact pattern shipped by Animate UI, React Bits, and countless SaaS UIs. Direction-aware content is a small plus. Nothing here is category-defining.
- **Evidence:** `after-desktop-dark.png`, `after-mobile-dark.png`, `interaction-analytics.png`, `audit/forced-colors.png`, `audit/zoom-200.png`.

### 3.3 Blur Text
- **Prior:** 9/9/9/8/9/8/8/8/9/9.
- **Independent:** A8 B9 C8 **D6** E9 F8 G8 H8 I9 **J7**. Delta: D −2, J −2.
- **Major:** **Originality.** The de-blur + drift word reveal is one of the single most cloned effects in this category (React Bits "Blur Text", Aceternity text effects). Ours is beautifully finished (`after-desktop-dark.png`, mid-reveal `audit/frames/entrance-0400ms.png` clearly shows line 2 still blurred) but it is a commodity. S1.
- **Minor:** `aria-label` full-string + `aria-hidden` segments is correct and tested. Long-text wrapping looks fine at hero scale; very long paragraphs untested.
- **External:** finish (eyebrow badge + headline + subcopy) beats most free clones. It does not out-class them on the *effect*; a buyer comparing side-by-side sees the same trick.
- **Evidence:** `after-desktop-dark.png`, `after-desktop-light.png` (dark!), `audit/frames/entrance-0400ms.png`.

### 3.4 Animated List *(Pro)*
- **Prior:** 9/9/9/8/9/8/8/8/9/9.
- **Independent:** A8 B8 C8 **D6** E9 F8 G8 H8 I8 **J7**. Delta: D −2, J −2.
- **Critical (tiering):** Pro requires **Originality ≥ 8**; this is a **6**. The staggered notification/activity stack is the signature *free* Magic UI "AnimatedList". Clean-room here, but not a premium differentiator.
- **Major:** S1.
- **Minor:** add is proven (`interaction-added.png` inserts "Backup completed" at top, others slide down; `audit/state-empty.png` under `audit/`); reorder/remove-focus behavior asserted in code (`layout="position"`, exit doesn't steal focus) but not shown in a still. Forced-colors is the **best in the set** (`audit/forced-colors.png`: every row gets a visible border; only the decorative tone dot is lost).
- **External:** vs Magic UI, comparable motion and better a11y framing; no scale story (virtualization, large lists) that would justify Pro.
- **Evidence:** `after-desktop-dark.png`, `interaction-added.png`, `audit/forced-colors.png`, `audit/state-empty.png`.

### 3.5 Animated Grid
- **Prior:** 8/9/8/8/9/8/9/8/9/9.
- **Independent:** A8 B8 C7 **D7** E8 F8 G9 H8 I8 **J7**. Delta: B −1, D −1, E −1, J −2.
- **Major:** S1 — and grid-on-light is exactly where a grid backdrop is hardest to keep subtle; entirely unproven.
- **Minor:** `audit/forced-colors.png` drops the grid **and** glow completely (pure black) — acceptable since it's `aria-hidden` decorative, but the component's whole value vanishes in HCM. Docs API says `size` default **"40"**; source default is **`36`** (mismatch). Docs perf claims "one background-position keyframe"; source also runs a separate `transform+opacity` glow pulse — slightly overstated.
- **External:** the layered fine+major grid with a drifting radial glow (`after-desktop-dark.png`) is a notch above the usual single dotted layer (Aceternity grid, Magic UI). Still a common ambient backdrop; foreground text stays readable (good).
- **Evidence:** `after-desktop-dark.png`, `after-desktop-light.png` (dark!), `audit/forced-colors.png`, `audit/tablet-light.png` (dark!).

### 3.6 Animated Button
- **Prior:** 9/8/8/7/9/9/9/9/8/9.
- **Independent:** A8 B8 C7 **D6** E8 F8 G9 H9 I8 **J7**. Delta: D −1, E −1, C −1, J −2.
- **Major:** forced-colors affordance loss on the solid variant (S2, `audit/forced-colors.png`). Button hierarchy that reads clearly in dark (`after-desktop-dark.png`: solid/outline/ghost) is flattened in HCM.
- **Minor:** loading state is proven (`audit/state-loading.png` shows the spinner replacing the label; `aria-busy` + polite status in code). But `focus.png` shows **no visible focus-visible ring** — either it wasn't triggered or the ring isn't rendering; keyboard focus visibility (WCAG 2.4.7/2.4.11) is unproven by the persisted evidence. Originality: press-scale + spinner is universal.
- **External:** API is the strongest dimension (forwards ref, spreads native props, real `<button>`), on par with shadcn Button. The motion adds nothing competitors lack.
- **Evidence:** `after-desktop-dark.png`, `audit/state-loading.png`, `audit/forced-colors.png`, `focus.png`.

### 3.7 Animated Accordion
- **Prior:** 8/8/9/7/9/8/9/8/8/9.
- **Independent:** A8 B8 C8 **D6** E8 F8 G9 H8 I8 **J7**. Delta: D −1, E −1, J −2.
- **Major:** S1.
- **Minor:** it is a textbook FAQ — rows + rotating chevron + `height:auto` reveal (`after-desktop-dark.png`, `interaction-expanded.png` shows item 2 open). The `MutationObserver`-mirrored `data-state` height animation is clever engineering and avoids reflow jank, but the *result* is indistinguishable from every Radix accordion demo. Expanded vs collapsed distinction is only a thin divider — no surface/background differentiation.
- **External:** functionally equal to Animate UI accordion; no visual signature.
- **Evidence:** `after-desktop-dark.png`, `interaction-expanded.png`.

### 3.8 Rotating Text
- **Prior:** 8/8/8/7/9/8/8/8/8/9.
- **Independent:** A7 B8 C7 **D6** E8 F8 G8 H8 I8 **J7**. Delta: D −1, E −1, J −2.
- **Major:** S1. Commodity effect (every text-effect library has it).
- **Minor:** `tabIndex={0}` on a non-interactive `<span>` (to enable pause-on-focus) puts a role-less element in the tab order — a mild a11y smell that can confuse SR/keyboard users. `aria-live="polite"` current-word announcement and inline-grid width stability are genuinely good (`after-desktop-dark.png` centered headline, accent word). Long phrases will set the grid to the widest word, which can leave large gaps — untested.
- **External:** comparable to React Bits rotating text; no edge.
- **Evidence:** `after-desktop-dark.png`.

### 3.9 Spotlight Card *(Pro)*
- **Prior:** 8/9/8/8/9/8/9/8/8/9.
- **Independent:** A7 B7 C6 **D6** E8 **F7** G9 H8 I7 **J7**. Delta: B −2, C −2, D −2, F −1, I −1, J −2.
- **Critical (tiering):** Pro requires Originality ≥ 8; this is **6**. The pointer-following radial glow is the most-cloned "spotlight/border-glow card" pattern (Aceternity card-spotlight, Magic UI). The **base card without the spotlight is plain** (`after-desktop-dark.png`: bordered box, small icon tile, title, copy) — nothing premium stands on its own.
- **Major:** the glow is pointer-only; on touch/coarse pointers it never fires, so the entire interactive value proposition disappears on mobile (degrades to the plain card — safe, but the Pro "wow" is desktop-hover-only). No keyboard equivalent. S1.
- **Minor:** CSS-var pointer tracking with no React re-render is a genuine perf win (G9).
- **External:** technically clean but a commodity; a buyer will have seen this exact effect free elsewhere.
- **Evidence:** `after-desktop-dark.png`, `after-desktop-light.png` (dark!).

### 3.10 Animated Arrow *(in `icons/animated-icons.tsx`)*
- **Prior:** 8/8/8/7/9/8/9/8/8/9.
- **Independent:** A6 B7 **C5** **D6** E8 F8 G9 H8 I7 **J7**. Delta: C −3, D −1, E −1, J −2.
- **Major:** the animation is a **3px translateX nudge** — the smallest, least-consequential motion in the catalog. It does not justify a catalog slot on its own.
- **Minor:** correct as decoration (`aria-hidden`, `focusable="false"`, not tabbable), shown inside a real checkout button (`after-desktop-dark.png`). S1.
- **External:** lucide + a hover transform gets you the same thing in one line; no reason to install.
- **Evidence:** `after-desktop-dark.png`.

### 3.11 Animated Copy *(in `icons/animated-icons.tsx`)*
- **Prior:** 8/8/8/7/9/8/9/8/8/9.
- **Independent:** A7 B7 **C6** **D6** E8 F8 G9 H8 I7 **J7**. Delta: C −2, D −1, E −1, J −2.
- **Major:** trivial copy→check swap (`interaction-copied.png` shows "Copy key" → "Copied" with a check). The controlled `copied` prop is the useful part; the animation is minor.
- **Minor:** **catalog vs tracker mismatch** — `catalog.ts` correctly ships a single `animated-icons` entry, but `docs/32` lists Arrow and Copy as **two separate Sellable rows**, inflating the component count by one. Copy-success is announced by the *parent* button (correct), not the icon; the icon itself provides no live region (by design).
- **External:** equivalent to a 10-line lucide swap; no differentiation.
- **Evidence:** `after-desktop-dark.png`, `interaction-copied.png`.

---

## 4. Which components FAIL the strict Sellable rules, and why

**All 11 fail.** Cited by rule:

- **Production evidence ≥ 9 — fails for all 11 (finding S1).** The "light" screenshots are dark; light-mode is unproven, so J = 7 everywhere. The prior J = 9 is not supported by the cited artifacts.
- **Originality threshold — fails for all 11.**
  - Free items need **D ≥ 7.5** (no rounding): Dialog D7, Tabs D7, Grid D7 (all < 7.5); Blur D6, Button D6, Accordion D6, Rotating D6, Arrow D6, Copy D6.
  - Pro items need **D ≥ 8**: Animated List D6, Spotlight Card D6.
- **Accessibility ≥ 9 — fails for Dialog, Tabs, Grid, Button, Spotlight, Accordion, Rotating, Arrow, Copy (E8).** Drivers: forced-colors affordance loss on solid buttons (S2), forced-colors active-tab indistinction (Tabs), focusable-span (Rotating), and the fact that the jsdom `axe` suite cannot verify contrast, focus-visible rendering, live-region timing, or forced-colors — so a confident 9 is unsupported. Blur Text and Animated List reach E9 (clean semantics; List has the best forced-colors result) but still fail on J and D.
- **"No dimension < 8" — fails for Blur, List, Button, Accordion, Rotating, Spotlight, Arrow, Copy** (each has a D or C at 5–6), plus Tabs/Spotlight at F7.
- **Docs match implementation — fails for Tabs** (`directionAware` default true vs false) **and Grid** (`size` default 40 vs 36; overstated perf note).

## 5. How many genuinely qualify as Category-leading or strongly Sellable

**Zero.** Category-leading: 0. Strongly Sellable: 0. The **≥ 3 gate for authorizing new components is NOT met.**

The blockers are, in order: (1) capture **real** light-mode evidence (S1 is the single highest-leverage fix — it currently sinks Production for the entire catalog); (2) give solid/ghost buttons a forced-colors boundary and capture a visible focus ring (S2); (3) push Originality — the catalog leans on commodity effects (blur reveal, spotlight card, sliding-pill tabs, notification stack) that competitors ship free. Dialog, Tabs, Blur Text and Animated List are the realistic near-term Sellable candidates *once evidence + a11y are fixed*; the icons and Spotlight are the ones whose intrinsic value is weakest.

## 6. Honest evidence limits

- I reviewed **frame sequences and stills, not live video** — smoothness, interruption/reversal, and rapid-toggle behavior are inferred from code (AnimatePresence, `mode="wait"`, forceMount) plus start/mid/end frames, not observed. Dialog's entrance frames are too subtle to distinguish, so "no jank" is a code-based judgment.
- The `axe` tests run in **jsdom**: they do not evaluate color contrast, focus-visible rendering, live-region announcement timing, or forced-colors — so all Accessibility scores rest on code + the forced-colors/focus PNGs, which themselves have gaps (no visible ring in `animated-button/focus.png`).
- **Light-mode (S1) and several mobile *state* captures are missing** (dialog-open on mobile, tabs overflow, list reorder/remove) — those behaviors are asserted in code but not shown.
- Scores are deliberately strict per the mandated scale; an "8" here means genuinely good, not premium. Prior 9s dropping to 7–8 reflects the evidence gaps and commodity-originality, not that the components are broken — most are competent, shippable, and clean-room. They are simply not, on this evidence, *category-leading commercial* components.

---

## 7. Post-fix revalidation (implementation agent, after the read-only audit)

> This section is **added after** the independent read-only pass above. It does not alter the reviewer's findings (sections 0–6 are preserved verbatim). It records what was fixed and re-verified. Per the [no-self-approval rule](../CLAUDE.md#no-self-approval-rule-independent-review), **no status was upgraded to "Sellable" by self-review** — a formal Sellable status still requires an independent re-review of the post-fix evidence.

**Fixes applied (weakest-first + systemic first):**
- **S1 (all 11) — light evidence now real.** `apps/docs/app/_components/preview-stage.tsx` no longer hardcodes the stage theme to dark; it defaults to the page theme at mount. Re-captured `after-*-light.png` for all 11 — verified genuinely light (e.g. `animated-button/after-desktop-light.png`). **Production evidence unblocked.**
- **S2 (buttons) — forced-colors boundary + outline focus.** `animated-button.tsx`: every variant carries a `border` (transparent → `ButtonText` in HCM); focus switched from a box-shadow ring to an `outline` (survives forced-colors). Verified: `animated-button/audit/forced-colors.png` now shows all three variants bounded (was: bare text).
- **Animated Grid forced-colors fallback** (weakest-critical, step 6). `animated-grid.tsx`: a narrowly-scoped `forced-color-adjust:none` `CanvasText` grid layer shows only in `@media (forced-colors: active)`; decorative gradients/glow hidden there. Verified: `animated-grid/audit/forced-colors.png` now shows a legible structured grid (was: pure black). Reduced-motion + forced-colors coexist.
- **Animated Tabs forced-colors active indicator + outline focus** and **`directionAware` docs mismatch** fixed. Verified: `animated-tabs/audit/forced-colors.png` — active tab now has a `Highlight` outline (was: indistinguishable).
- **Rotating Text** — removed the role-less `tabIndex={0}` span (WCAG 4.1.2 smell); pause-on-hover retained, live region unchanged.
- **Grid `size` default** docs mismatch (40→36) + overstated perf note corrected in `docs-content.ts`.
- **Arrow/Copy double-count** — consolidated to one `animated-icons` row in `docs/32`.

**Revalidation (commands actually run):** registry regen + validate ✓ · registry tests **10/10** ✓ · registry + docs typecheck ✓ · production build ✓ · **fresh clean-fixture install after fixes** (11 files, no forbidden imports, installed source typechecks) ✓ · re-captured light (all) + forced-colors (Button/Grid/Tabs) evidence ✓.

**Status after fixes:** E (Accessibility) rose to 9 for Button/Tabs/Grid/Rotating (forced-colors + focus + focusable-span fixes); J (Production evidence) rose to 8 across the board (real light + fixture rerun). **Originality (D) is unchanged** — it is the standing blocker. Final statuses: 7× **Production-ready but ordinary** (Dialog, Tabs, Blur Text, List, Grid, Button, Accordion); 3× **Needs polish** (Rotating Text, Spotlight Card, Animated Icons).

**Unlock:** Category-leading 0 · Strongly Sellable 0 · Sellable 0 → **≥3 gate NOT met → new components remain BLOCKED.** Homepage featured reduced to the 3 strongest free items (Dialog, Tabs, Blur Text). The path to unlock is *originality via substance*, then an independent re-review — not new components.
