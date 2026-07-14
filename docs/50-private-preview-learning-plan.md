# 50 — Private-preview learning plan

> **Type:** 🟡 Canonical for the private-preview learning program — **a plan for collecting real feedback, not a report of results** · **Last reviewed:** 2026-07-14
> **Status:** this document defines *how* the private preview will answer its open product questions — the questions, the events, the feedback dimensions, the cohort, the cadence, and the decision criteria. **No real preview feedback exists yet.** Every question below is unanswered; every metric below is a formula with no value. Nothing here reports an outcome, validates the product, or approves a launch. When real data arrives it lives in the weekly review log (§Weekly review), never invented here.

## Purpose

The private preview exists to replace assumptions with evidence before any paid launch. We are shipping a premium, commercially-sold motion & component system into an intentionally small cohort to learn whether developers understand the product, install it, adapt it, and would pay for it — and to surface what blocks production use. This plan is the instrument. It is deliberately structured so that the answers can only come from real cohort behaviour and real submitted feedback, not from the team's optimism.

**Honesty rule (binding):** this file must never contain an invented answer, sample datum, illustrative "result", or projected metric value. Ratings, counts, quotes, and conversion numbers are populated only from the dev-recorded analytics (`lib/analytics.ts`), feedback store (`lib/feedback.ts` + `/api/feedback`), and support store (`lib/server/support.ts` + `/api/support`) once a real cohort has used them. Until then, the correct value of every metric is "no data yet".

## Questions the preview must answer

These are the open product questions. All are currently **unanswered**. The preview is designed so each can be answered from tracked events and collected feedback — never from assertion.

### Positioning & comprehension
1. **Do developers understand the niche?** Do cohort members correctly describe what the product is (a semantic motion & animated-component system, not "another component kit") after using it?
2. **Individual components vs. packs vs. complete catalog** — which access shape do developers actually want? (`interestInAccess`)
3. **Is the workflow-differentiation message landing, or are people reading it as a cosmetic effects library?** (feedback free-text + `productionBlocker`)

### Catalog & usage
4. **Which categories do developers care about?** (AI, developer tools, collaboration, data, commerce, file/media, security, productivity, communication, spatial, mobile, onboarding, marketing.)
5. **Which specific components do developers install?** (registry request/install events per slug.)
6. **Which installed components reach a real project** (not a throwaway sandbox)? (`wasInstalled` + `usedInRealProject`.)
7. **Are the component APIs adaptable** enough for real codebases, or do developers fight them? (`apiClarity` + free-text.)
8. **What states/variants are missing?** (`missingState`.) **What components are missing?** (`missingComponent`.)
9. **Do developers perceive workflow value or only visual value?** (usefulness vs. visualQuality ratings + free-text.)

### Access & commercial
10. **Can developers actually install Pro / gated registry items?** (`registry_item_requested` → `registry_item_installed` vs. `registry_access_denied`; installation-failure support tickets.)
11. **Which pack would a developer pay for**, if any? (`interestInAccess` = pack + feedback free-text + waitlist `interestedPack`.)
12. **What blocks production adoption?** (`productionBlocker` + willingness-to-use.)

### Support & friction
13. **What support questions repeat?** Which categories of problem recur across the cohort? (support ticket categories over time.)

> None of the above has an answer in this document. Answers are recorded in §Weekly review as the cohort generates data.

## Events to track

The preview relies on the existing provider-neutral analytics whitelist (`docs/44`, `lib/analytics.ts`) — no new vendor SDK, no new event is invented here without adding it to that whitelist deliberately. The events most load-bearing for the questions above:

| Question area | Existing whitelisted events used |
|---|---|
| Comprehension / discovery | `homepage_viewed`, `catalog_explore_clicked`, `catalog_searched`, `category_filtered` |
| Category interest | `category_filtered`, `component_docs_viewed`, `pack_page_viewed` |
| Component-level interest | `component_preview_opened`, `component_docs_viewed`, `pro_item_viewed` |
| Install intent | `free_install_copied`, `pack_install_copied` |
| Access intent | `access_cta_clicked`, `pack_cta_clicked`, `pro_cta_clicked`, `complete_catalog_cta_clicked`, `contact_sales_clicked` |
| Access shape | `pack_page_viewed`, `pack_preview_interacted`, `waitlist_submitted` |
| Delivery / gated install | `registry_item_requested`, `registry_access_denied`, `registry_item_installed` |

**Note:** feedback submission is captured through the feedback store, **not** an analytics event — there is deliberately **no** `feedback_submitted` event in the whitelist today, so the forms do not emit one (adding it would be a deliberate whitelist change, out of scope for this plan).

## Feedback to collect

Structured feedback is collected via the extended feedback interface (`lib/feedback.ts`) through the in-app form at `/preview/feedback` → `/api/feedback`. All fields are whitelisted server-side; all free text is sanitized (control chars stripped, query strings neutralized, length capped); **no code, payloads, tokens, or secrets are ever accepted**.

Dimensions collected:

- **Per-facet ratings (1–5):** usefulness, visualQuality, apiClarity, installation, documentation, accessibility, performance.
- **Gaps (free-text):** missingState, missingComponent, productionBlocker.
- **Intent:** willingnessToUse (`yes` / `maybe` / `no`), interestInAccess (`free` / `pack` / `complete` / `undecided`).
- **Context (optional, coarse):** productCategory, framework, applicationType, teamSizeRange, wasInstalled, usedInRealProject, contactPermission.

Operational feedback (friction/bugs) is collected separately via the support intake at `/preview/support` → `/api/support` (`lib/server/support.ts`): category, componentOrPack, version, browser, framework, errorSummary, sanitizedLogs (redacted), contactPermission. Support tickets are **redacted on ingest** — token-like values (`mk_test_`/`mk_live_` keys, `Bearer` headers, JWTs, long hex/base64) are scrubbed before storage.

> Both stores are **dev-recorded** in the current posture — nothing is sent to an external system. A real provider is an adapter swap tracked in `docs/45`.

## Cohort size

- **Configurable, default 10.** Driven by `commerce.previewCohortSize` in `product.config.json` (see `lib/product.ts`), defaulting to **10** when unset.
- Small on purpose: the goal is depth of real usage and direct follow-up, not statistical significance. Findings from a cohort this size are **directional signals**, never proof — the plan treats them as such in every decision criterion below.
- The cohort may be expanded deliberately (a config change + a documented reason in §Weekly review), never silently.

## Preview duration

- **Configurable via `commerce.previewEntitlementDurationDays`** for a member's access window; the **program** runs in review cycles rather than a single fixed end date.
- **Default program length: a minimum of 4 weekly review cycles** before any go/no-go decision, so that install → real-project usage → production-blocker feedback has time to appear (installs and opinions lag first contact).
- The program ends only by an explicit decision recorded in §Weekly review (launch, pause, extend, or reposition) — not by a silent timeout.

## Weekly review process

Once per week, with the cohort's real data (never invented):

1. **Pull the numbers.** Read the analytics event counts, feedback submissions, and support tickets from the dev stores for the week.
2. **Update the log.** Append a dated entry below with the actual figures and quotes. If a metric has no data this week, write "no data" — do not interpolate.
3. **Score the questions.** For each of the 13 questions, mark: `unanswered` / `emerging signal` / `answered`. A question moves to `answered` only with corroborating evidence from more than one cohort member.
4. **Triage support.** Cluster recurring support categories; flag any repeated production blocker.
5. **Decide.** Apply the success / failure / prioritization / positioning criteria below and record the decision and its evidence.

### Weekly review log

_No cycles have run yet. Entries are appended here with real data only._

- _(none)_

## Success criteria

The preview is succeeding when the evidence (not assertion) shows:

- Cohort members **correctly describe the niche** in their own words (Q1) — comprehension is not assumed from the homepage copy.
- A **meaningful share of the cohort installs at least one component and uses it in a real project** (`wasInstalled` + `usedInRealProject`), i.e. install intent converts to real usage.
- **Gated Pro installs actually work** — `registry_item_installed` follows `registry_item_requested` without a wall of `registry_access_denied` or installation-failure tickets.
- **Usefulness and willingness-to-use ratings are consistently positive** across multiple members, with usefulness not trailing visualQuality (evidence of workflow value, not just decoration).
- At least one **clear paid signal** emerges (see §Paid-launch signals).

> Concrete thresholds are set at the first weekly review **against real baseline data**, not guessed here. This document must not assert a passing number before data exists.

## Failure criteria

Treat as failing signals when the evidence shows:

- Cohort members **cannot articulate what the product is** or consistently mistake it for a generic effects kit (Q1/Q3 failing).
- **Installs do not convert to real-project usage** — components are previewed but not adopted.
- **Repeated installation / registry-auth failures** block access (support cluster).
- **Willingness-to-use is predominantly `no`**, or usefulness ratings are low while visualQuality is high (pretty but not valuable).
- **No access shape attracts interest** — `interestInAccess` is dominated by `undecided` and no pack earns pull.

## Component prioritization rules

Driven by cohort evidence, in this order:

1. **Real-project usage first** — components that reach real projects (`usedInRealProject`) and earn high usefulness get continued investment and polish.
2. **Requested gaps next** — `missingComponent` / `missingState` items that recur across members feed the expansion plan (`docs/38`) and board (`docs/39`).
3. **Fix before adding** — a component with recurring bugs or a named production blocker is fixed before new components in its category are started.
4. **Deprioritize decoration** — components with high visualQuality but low usefulness and low real-project usage are not featured further; they do not define the catalog identity (per CLAUDE.md).
5. Prioritization decisions cite the specific feedback/events that motivated them in §Weekly review.

## Pack prioritization rules

1. **Build the pack the cohort would pay for** — the pack with the strongest combined signal from `interestInAccess = pack`, waitlist `interestedPack`, and pack-page engagement events is prioritized.
2. A pack is prioritized only when **its constituent components already show real-project usage** — packs are composed of adopted components, not aspirational ones.
3. **One pack at a time** past the preview bar; do not fan out pack work on weak/`undecided` interest.
4. Pack decisions cite the events + feedback that justified them.

## Paid-launch signals

Move toward a paid launch only when the evidence shows, across multiple cohort members:

- **Demonstrated willingness to pay** — `interestInAccess` concentrating on a concrete shape (a specific pack or the complete catalog), corroborated by access-intent CTA events and follow-up.
- **Real production adoption** — components used in real projects with no unresolved production blocker for the target tier.
- **Working paid delivery** — gated registry install works end-to-end (`registry_item_installed`) for entitled members.
- **Comprehension** — members describe the value proposition accurately without prompting.
- **Low, non-blocking support load** for the launch-candidate surface.

No single signal is sufficient; a launch decision requires the cluster, recorded with evidence in §Weekly review.

## Reasons to remain in preview

Stay in private preview (do not launch) when:

- Any success criterion is still `unanswered` for the launch-candidate tier.
- Production blockers named by the cohort are unresolved.
- Paid-launch signals are present for too few members to be directional.
- Delivery/entitlement or registry-auth issues are unresolved.
- Comprehension is shaky — people like it but can't say what it is or who it's for.

## Reasons to pause development

Pause new component/pack development (and concentrate on fixing) when:

- Recurring installation, registry-auth, or hydration/SSR failures block cohort members from using what already exists.
- A featured component has unresolved major findings (per CLAUDE.md's no-new-work-while-featured-broken rule).
- Support load is dominated by a single repeated, unresolved problem class.
- The cohort is not adopting existing components — adding more would compound an adoption problem, not solve it.

## Reasons to change positioning

Revisit the product positioning / message (`docs/27`) when the evidence shows:

- Cohort members consistently **misdescribe the product** (e.g. "an animation effects pack") — a comprehension failure, not a catalog failure.
- **Interest concentrates on a different axis than the message** — e.g. developers value the accessible primitives or a specific workflow more than the "semantic motion system" framing.
- **Usefulness is driven by categories the homepage doesn't lead with**, indicating the above-the-fold proof targets the wrong audience.
- Access-shape interest contradicts the current tiering assumption (e.g. everyone wants the complete catalog, nobody wants individual components — or vice versa).

Positioning changes are proposed with the specific feedback that motivated them and reviewed against `docs/27` and the product moat — never made on a single data point.

## Related

- Product analytics interface & event whitelist — `docs/44-product-analytics-plan.md`
- Provider decisions (analytics / feedback / support / waitlist backends) — `docs/45`
- Product differentiation & moat — `docs/27-product-differentiation.md`
- Component expansion plan — `docs/38` · Catalog production board — `docs/39`
- Feedback interface — `apps/docs/lib/feedback.ts` · Support intake — `apps/docs/lib/server/support.ts`
