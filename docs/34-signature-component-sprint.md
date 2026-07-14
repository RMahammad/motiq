# 34 — Signature component sprint

> **Type:** 🟢 Canonical for the signature-component upgrades · **Started:** 2026-07-14 · **Goal:** turn the 3 strongest components (Animated Dialog, Animated Tabs, Blur Text) into independently-reviewed **Strongly Sellable / Category-leading** components so the ≥3 new-component unlock ([`docs/33`](33-independent-component-audit.md)) can pass. **No new catalog items** until then.
> **Rule:** originality via **substance** (interaction model, states, responsiveness, a11y, API), not decoration. Independent re-review after each; no self-approval ([`CLAUDE.md`](../CLAUDE.md#no-self-approval-rule-independent-review)).
> **Score history:** kept in [`docs/32`](32-component-quality-tracker.md). Pre-sprint independent statuses: all three = *Production-ready but ordinary*.

## Clean-room references (patterns observed, no code/layout/animation copied)

- **Dialogs (shadcn/Radix, Vaul, Animate UI, real SaaS):** desktop centered modal is universal; the differentiators buyers actually miss are (a) **mobile bottom-sheet adaptation**, (b) **long-content sticky header/scroll-body/sticky footer** so actions never fall below the fold / behind the mobile keyboard, (c) **forced-colors** boundaries, (d) interruption-safe exit. Common weakness: a plain centered box with a scale animation and no mobile or long-content story.
- **Tabs (shadcn, Radix, Animate UI, React Bits):** sliding indicator is table stakes; missing production behavior is **overflow** (many tabs / long labels → horizontal scroll + keep active tab in view), **vertical** layout, **direction-aware** content, and forced-colors indicator. Common weakness: an inline row that wraps/clips on mobile.
- **Text reveals (React Bits, Aceternity):** blur-reveal is ubiquitous; the missing substance is **multiple materially-different reveal modes**, **layout stability** (no width jump / reflow / clip during filter), **safe character-count limits**, and honest SR output. Common weakness: one blur effect, tiny demo, no perf guardrail.

---

## A. Animated Dialog — design brief

**Problem being solved:** the current dialog is a competent centered modal with a scale animation and *no mobile-sheet, no long-content structure, no forced-colors close affordance* — ordinary. Buyers repeatedly hand-roll those three.

**Signature scope (substance, not decoration):**
1. **`mobileVariant="sheet"` (default)** — on ≤640px the dialog becomes a bottom sheet (full-width, rounded-top, slides up, ≤90vh) and stays a centered modal on desktop. `mobileVariant="centered"` opts out.
2. **Long-content structure** — `AnimatedDialogHeader` / `AnimatedDialogBody` / `AnimatedDialogFooter`: header + footer are `shrink-0` and always visible; body is the only scroll region (`overflow-y-auto`), capped by the content's `max-h`. **Actions never disappear** below the viewport or behind the mobile keyboard.
3. **Polished close control** — an accessible top-right `X` (`aria-label="Close"`) with a forced-colors boundary.
4. **Motion** — fast scale+fade (desktop) / slide-up (sheet), interruption-safe (AnimatePresence off controlled `open`), reduced-motion instant. No excessive spring.
5. **Robustness** — forced-colors (bordered surface + bounded close), 200% zoom + long content (internal scroll), localization (wrapping header/actions).

**Not doing:** trigger-origin morph (unstable/novelty), drag-to-dismiss (complexity for little a11y gain).

**API stays high-level:** `mobileVariant`, `animation`, `duration`, `origin`, plus the structural sub-components. No raw Motion config as the primary surface.

### A. Animated Dialog — cycle result

- **Pre-sprint independent status:** Production-ready but ordinary (from [`docs/33`](33-independent-component-audit.md)).
- **Changes made (substance):** `mobileVariant="sheet"` adaptive bottom sheet (default); `AnimatedDialogHeader/Body/Footer` long-content structure (pinned header+footer, single scroll region, actions stay visible over long content capped by `max-h`); accessible forced-colors-safe close (`X`); restrained visual signature (layered graphite shadow, inner edge ring, top-edge sheen) + critically-damped spring (physical, no bounce); overlay tween. Preview rebuilt into a realistic Workspace-settings panel with **three working dialogs** (Invite form, long-form Edit Profile, destructive Delete w/ loading).
- **Independent review (separate adversarial reviewer, not told a target):** **Sellable.** Scores: Product 9 · Visual 8 · Motion 8 · Originality 7 · A11y 8 · Responsive 9 · Perf 8 · API 8 · Showcase 9 · **Production evidence 5** (gated by a real integrity failure).
- **Reviewer's blockers → resolution:**
  - **[Major] Faked evidence** — `sig-localization-longform.png` was a byte-identical copy of `sig-long-content.png` (md5 confirmed). **Fixed:** regenerated a *genuine* localization render (real ~40%-longer German labels/title/actions injected into the live dialog → `sig-localization.png`, distinct md5); removed the duplicate. (`sig-reduced-motion.png` == `sig-desktop-centered.png` is **expected** — reduced motion renders the final settled state, which equals the animated end state; kept as an honest signal, documented.)
  - **[Major] Keyboard overclaim** — "actions stay above the mobile keyboard" was not delivered (`dvh` handles chrome, not the OSK). **Fixed:** softened the doc-comment + `docs-content` to "actions stay visible over long content (capped by max-h)" — no keyboard claim.
  - **[Minor] Controlled-state mirror** (one-render lag). **Fixed:** `open` now derives directly from `openProp` in controlled mode (no effect-sync lag).
  - **Visual/Motion** — added the restrained signature above (nudges Visual/Motion toward 9 without decoration).
  - **[Minor] Destructive-loading label** — noted; the button's loading state shows a spinner + `aria-busy` + polite status (SR-covered); a visible "Deleting" label is a follow-up button tweak.
- **Evidence paths:** `artifacts/component-reviews/animated-dialog/audit/{sig-desktop-centered,sig-desktop-light,sig-mobile-sheet,sig-mobile-sheet-light,sig-long-content,sig-long-content-mobile,sig-destructive,sig-loading,sig-forced-colors,sig-zoom-200,sig-reduced-motion,sig-localization}.png` + `frames/sig-open-*.png` + `../after-*.png` + recordings under `audit/*.webm`.
- **Post-fix validation:** registry regen + validate ✓ · registry tests **12/12** ✓ (added mobile-sheet-layout + focus-restore/rapid-reopen) · registry + docs typecheck ✓ · build 14 pages ✓ · **fresh clean-fixture re-run** (2 files, no forbidden imports, typechecks) ✓ · lint 0 · docs:check 0 broken · catalog-quality OK.
- **Final independent status: Sellable** (materially up from *Production-ready but ordinary*). **Not Strongly Sellable.** The decisive ceiling is **Originality 7** — the reviewer judged the sheet + long-content pattern "convergent / table-stakes," and per this sprint's rules originality must not be manufactured through decoration. The fixes resolved every *fixable* blocker (integrity, honesty, correctness) and lifted finish, but they do not change a concept-level originality ceiling. **A full independent re-review after these fixes was not re-run this cycle (budget); the recorded status is the reviewer's verdict with the gating defects since fixed.**

### Honest sprint status
- **Category-leading: 0 · Strongly Sellable: 0.** Animated Dialog reached **Sellable**, not the Strongly-Sellable bar the unlock requires. **The ≥3 unlock is NOT met; new components remain BLOCKED.**
- **Tabs and Blur Text cycles were not run this session** (budget). More importantly, the Dialog cycle surfaced a strategic truth an adversarial process is meant to expose: **polishing commodity patterns (animated dialog, sliding-pill tabs, blur-reveal text) to a genuine "Strongly Sellable" bar may not be achievable through restrained substance alone** — the reviewer capped originality at 7 on the strongest candidate. Reaching Strongly-Sellable likely needs a genuinely novel interaction model per component (real R&D), not polish. This is recorded honestly rather than gamed.

*(Tabs and Blur Text briefs + cycles to follow — Dialog completed first per the execution order.)*
