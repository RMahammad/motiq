# ADR-0017 — shadcn primitive foundation for the animated catalog

- **Status:** Proposed (2026-07-14) — becomes Accepted when the vertical slice validates it end-to-end (install into the clean fixture, a11y + SSR green).
- **Deciders:** product + architecture
- **Related:** [ADR-0011 (accessible primitives)](0011-accessible-primitives.md), [ADR-0010 (commercial distribution)](0010-commercial-distribution.md), [`31-competitive-product-review.md`](../31-competitive-product-review.md), [`27-product-differentiation.md`](../27-product-differentiation.md), [`12-accessibility-standard.md`](../12-accessibility-standard.md)

## Context

The product is pivoting to lead with a **catalog of animated shadcn-compatible components** distributed as editable source through a shadcn registry ([`31`](../31-competitive-product-review.md), [`27`](../27-product-differentiation.md)). "Animated shadcn" components (Dialog, Tabs, Accordion, Switch, Popover, Select, …) must not rebuild accessible behavior from scratch — they wrap an accessible headless primitive and add Motion.

We must choose **one** accessible-primitive foundation for the first release. Candidates:

1. **Radix UI** (`@radix-ui/react-*`) — what shadcn/ui defaults to and what this repo **already uses** (`@radix-ui/react-dialog`, `-popover`, `-tooltip` in `@scope/react`, per [ADR-0011](0011-accessible-primitives.md)). Mature, WAI-ARIA-complete, huge adoption, App-Router-safe.
2. **Base UI** (`@base-ui-components/react`) — the newer successor from the Radix/MUI authors. shadcn is adding support; Animate UI already offers a Base variant. Cleaner API in places, but younger, smaller ecosystem, and a second testing matrix.
3. **Existing repo primitives only** — our own `@scope/react` wrappers. Rejected: reinventing focus-trap/portal/typeahead is exactly the work [ADR-0011] said not to do, and a release blocker for a11y.

Animate UI's approach of wrapping **three** foundations (Radix + Base + Headless UI) multiplies API surface and the test matrix — against our "coherence over count" rule ([`CLAUDE.md`](../../CLAUDE.md)).

## Decision

**Use Radix UI as the single accessible-primitive foundation for the first release.** Every "Animated shadcn" catalog item wraps the corresponding shadcn/Radix primitive and adds a Motion/CSS animation layer on the *content/indicator* only, preserving focus management, keyboard interaction, semantics, and portal behavior. Registry items declare the Radix package in `dependencies` and (where an item builds on another catalog item) `registryDependencies`.

Base UI is explicitly **not** supported at launch. Text effects, backgrounds, and creative components that have **no** interactive-a11y surface need no headless primitive and use our own motion utilities directly.

## Alternatives considered

- **Base UI as default:** rejected for launch — it would diverge from the repo's existing Radix components (ADR-0011) and shadcn's current default, adding migration + a parallel test matrix for no launch-critical gain.
- **Multi-foundation (Radix + Base):** rejected for launch — doubles surface area; revisit only on real demand.
- **Own primitives:** rejected — a11y regression risk, release blocker.

## Accessibility considerations

- Radix provides WCAG 2.2 AA-relevant behavior we must **not** re-implement: focus trap + restore (Dialog/Sheet), Escape, roving tabindex/arrow-key nav (Tabs), `aria-expanded`/region semantics (Accordion), `role`/labelling, portal + scroll-lock. Our animation layer must not break these (verified by `axe` + interaction tests per [`12`](../12-accessibility-standard.md)).
- Known tradeoff to document per component: animating a Radix content element can conflict with `forceMount`/exit timing — we handle exit via `AnimatePresence`/data-state CSS and document any prop we cannot support (Animate UI's honest-docs pattern).

## Migration implications

- No migration for existing components — they are already Radix.
- Future Base UI support (if demanded) would be an **additive** registry variant (`@scope/base/*` style), not a replacement — deferred behind a new ADR.

## Registry implications

- "Animated shadcn" items: `type: registry:ui`, `dependencies` include `@radix-ui/react-*` + `motion` (when used) + `clsx`/`tailwind-merge`; `registryDependencies` may reference a base shadcn item or a shared `lib/utils`.
- Text/background/icon items: no Radix dependency; `type: registry:component` (or `registry:ui`), Motion/CSS only.
- Premium items gate via install-time registry auth (headers), never runtime ([`16`](../16-commercial-packaging.md)).

## Revisit conditions

- shadcn makes Base UI the default, **or**
- ≥3 requested catalog items are materially better on Base UI, **or**
- Radix maintenance stalls / a blocking a11y bug appears.

Until then: **Radix only**, one foundation, one test matrix.
