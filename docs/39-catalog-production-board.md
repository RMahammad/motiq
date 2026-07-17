# 39 — Catalog production board

> **Type:** 🟢 Canonical for live component status (the breadth-first workflow) · **Last reviewed:** 2026-07-14
> **Statuses:** `Idea` · `Building` · `Preview-ready` · `Registry-ready` · `Released` · `Experimental` · `Deprecated`. A component becomes **Released** when it passes the lightweight gate ([`rapid-component-release`](../.claude/skills/registry-release/SKILL.md)); `Experimental` = shipped but rough/behind a flag. No subjective 10-dimension scoring here — that is reserved for homepage centerpieces and complex Pro creative pieces ([`docs/36`](36-premium-creative-component-strategy.md), [`premium-visual-review`](../.claude/skills/responsive-review/SKILL.md)).
> Plan & waves: [`docs/38`](38-component-expansion-plan.md). Per-signature-piece deep review still lives in [`docs/32`](32-component-quality-tracker.md).

## Board

| Component | Category | Tier | Complexity | Deps | Block dependency | Status | Released |
|---|---|---|---|---|---|---|---|
| Kinetic Emphasis | text (signature) | Free | medium | motion | — | **Released** (Strongly Sellable, [`docs/32`](32-component-quality-tracker.md)) | 2026-07-14 |
| AI Response Stream | ai | Free | complex | motion, primitives | AI block | **Released** | 2026-07-14 |
| Deployment Pipeline | developer-tools | Free | medium | motion, primitives | Deployment block | **Released** | 2026-07-14 |
| Live Presence Stack | collaboration | Free | medium | motion, primitives | Collaboration block | **Released** | 2026-07-14 |
| KPI Number Morph | data-motion | Free | simple | motion, primitives | Dashboard block | **Released** | 2026-07-14 |
| Motion primitives (`@motionstack/primitives`) | lib | Free | — | — | — | **Released** (internal foundation, incl. status model, timestamp, auto-follow, stream variants) | 2026-07-14 |
| Tool Call Activity | ai | Pro | complex | motion, primitives | AI block | **Released** (batch 2) | 2026-07-14 |
| Live Log Stream | developer-tools | Free | medium | motion, primitives | Deployment block | **Released** (batch 2) | 2026-07-14 |
| Activity Stream | collaboration | Free | medium | motion, primitives | Collaboration block | **Released** (batch 2) | 2026-07-14 |
| Streaming Data Rows | data-motion | Pro | medium | motion, primitives | Dashboard block | **Released** (batch 2) | 2026-07-14 |
| Luminous Topography | backgrounds | Free | medium | primitives (no motion) | — | **Released** (batch 2, creative interleave — pure SVG/CSS) | 2026-07-14 |
| Source Citation Rail | ai | Free | medium | motion, primitives | AI block | **Released** (batch 3) | 2026-07-14 |
| API Request Inspector | developer-tools | Pro | complex | motion, primitives | Deployment block | **Released** (batch 3) | 2026-07-14 |
| Approval Workflow | collaboration | Pro | complex | motion, primitives | Collaboration block | **Released** (batch 3) | 2026-07-14 |
| Filter Result Transition | data-motion | Free | medium | motion, primitives | Dashboard block | **Released** (batch 3) | 2026-07-14 |
| Swipe Action Row | mobile | Free | medium | motion, primitives | Mobile block | **Released** (batch 3 mobile interleave) | 2026-07-14 |
| Agent Run Timeline | ai | Pro | complex | motion, primitives | AI block | **Released** (batch 4) | 2026-07-14 |
| Environment Switcher | developer-tools | Free | medium | motion, primitives | Deployment block | **Released** (batch 4) | 2026-07-14 |
| Comment Thread | collaboration | Pro | complex | motion, primitives | Collaboration block | **Released** (batch 4) | 2026-07-14 |
| Data Refresh State | data-motion | Free | medium | motion, primitives | Dashboard block | **Released** (batch 4) | 2026-07-14 |
| Mobile Filter Sheet | mobile | Free | complex | motion, primitives | Mobile block | **Released** (batch 4 interleave) | 2026-07-14 |
| Prompt Composer | ai | Pro | complex | motion, primitives | AI block (future) | **Released** (batch 5) | 2026-07-14 |
| Webhook Event Stream | developer-tools | Free | medium | motion, primitives | Deployment block (future) | **Released** (batch 5) | 2026-07-14 |
| Mention Suggestions | collaboration | Free | medium | motion, primitives | Collaboration block (future) | **Released** (batch 5) | 2026-07-14 |
| Data Quality Status | data-motion | Free | medium | motion, primitives | Dashboard block (future) | **Released** (batch 5) | 2026-07-14 |
| Keyboard-safe Form | mobile | Free | complex | motion, primitives | Mobile block | **Released** (batch 5, Mobile pack → 3/4) | 2026-07-14 |
| AI Agent Workspace | block (ai) | Pro | — | composes 4 components | AI Interface Pack | **Released** (block) | 2026-07-14 |
| Deployment Command Center | block (dev) | Pro | — | composes 4 components | Developer Tools Pack | **Released** (block) | 2026-07-14 |
| Collaborative Review Workspace | block (collab) | Pro | — | composes 4 components | Collaboration Pack | **Released** (block) | 2026-07-14 |
| Live Operations Dashboard | block (data) | Pro | — | composes 4 components | Data Motion Pack | **Released** (block) | 2026-07-14 |
| Workflow Topology Field | product-backgrounds | Free | medium | primitives (SVG/CSS, no motion) | — | **Released** (batch 6 — product environments) | 2026-07-16 |
| Queue Pulse Lanes | product-backgrounds | Free | medium | primitives (SVG/CSS, no motion) | — | **Released** (batch 6 — product environments) | 2026-07-16 |
| Adaptive Safe-Zone Grid | product-backgrounds | Free | medium | primitives (SVG/CSS, no motion) | — | **Released** (batch 6 — product environments) | 2026-07-16 |
| Runtime Signal Map | product-backgrounds | Pro | complex | primitives (Canvas 2D, no motion) | — | **Released** (batch 6 — product environments) | 2026-07-16 |
| Event Propagation Matrix | product-backgrounds | Pro | complex | primitives (SVG/CSS, no motion) | — | **Released** (batch 6 — product environments) | 2026-07-16 |
| Data Contour Surface | product-backgrounds | Pro | complex | primitives (Canvas 2D, no motion) | — | **Released** (batch 6 — product environments) | 2026-07-16 |
| Agent Operations Hero | block (workflow-heroes) | Pro | — | composes 4 components | — | **Released** (batch 6 — workflow hero) | 2026-07-16 |
| Deployment Control Hero | block (workflow-heroes) | Pro | — | composes 4 components | — | **Released** (batch 6 — workflow hero) | 2026-07-16 |
| Live Data Command Hero | block (workflow-heroes) | Pro | — | composes 4 components | — | **Released** (batch 6 — workflow hero) | 2026-07-16 |
| Collaborative Launch Hero | block (workflow-heroes) | Pro | — | composes 5 components | — | **Released** (batch 6 — workflow hero) | 2026-07-16 |

## Blocks & packs (after batch 4) — all four workflow packs now 4/4

| Pack | Block (Released) | Pack registry item | Pack page | Components (4/4) |
|---|---|---|---|---|
| AI Interface Pack | AI Agent Workspace | `@motionstack/ai-interface-pack` | `/packs/ai-interface` | AI Response Stream · Tool Call Activity · Source Citation Rail · Agent Run Timeline |
| Developer Tools Pack | Deployment Command Center | `@motionstack/developer-tools-pack` | `/packs/developer-tools` | Deployment Pipeline · Live Log Stream · API Request Inspector · Environment Switcher |
| Collaboration Pack | Collaborative Review Workspace | `@motionstack/collaboration-pack` | `/packs/collaboration` | Live Presence Stack · Activity Stream · Approval Workflow · Comment Thread |
| Data Motion Pack | Live Operations Dashboard | `@motionstack/data-motion-pack` | `/packs/data-motion` | KPI Number Morph · Streaming Data Rows · Filter Result Transition · Data Refresh State |

A pack registry item ships its block file + the block's four component `registryDependencies` (deduped on install); installing `@motionstack/<pack>-pack` delivers the complete block + all four components as editable source. Pack pages present the live block, the component list, Free/Pro breakdown, both install commands, and license/pricing placeholders (commercial model: [`docs/40`](40-commercial-packaging.md)). **Pack sales pages / pricing are not built** — placeholders only. Mobile Interaction Pack remains 2/4 (Swipe Action Row + Mobile Filter Sheet); its block is not built yet.

Everything else from [`docs/38`](38-component-expansion-plan.md) sits in **Backlog / Idea** until pulled into a batch.

## Board columns (definitions)

- **Backlog / Idea** — on the plan, not yet scheduled.
- **Selected** — pulled into the current/next batch.
- **Building** — implementation in progress.
- **Preview-ready** — renders in the docs app with a working live preview + controls.
- **Registry-ready** — registry item added, JSON generated, clean-fixture install verified.
- **Released** — passed the full lightweight gate; visible in the catalog and eligible for category sections/homepage "Recently added".
- **Experimental** — shipped but rough or feature-flagged; labeled as such in the catalog.
- **Deprecated** — kept for consumers but no longer promoted.

## Blocks (Wave 4)

A category needs **≥4 released components** before its block is built. Current progress toward first blocks:

| Block | Requires | Released so far | Ready? |
|---|---|---|---|
| AI block → **AI Agent Workspace** | Response stream · Tool activity · Citations · Agent Run Timeline | 4/4 | **Built + Released** |
| Deployment block → **Deployment Command Center** | Environment Switcher · Pipeline · Logs · Request Inspector | 4/4 | **Built + Released** |
| File block | Drop zone · Queue · Processing · Export | 0/4 | No |
| Commerce block | Variant selection · Cart · Checkout progress · Confirmation | 0/4 | No |
| Dashboard block → **Live Operations Dashboard** | KPIs · Streaming rows · Filters · Data Refresh State | 4/4 | **Built + Released** |
| Collaboration block → **Collaborative Review Workspace** | Presence · Activity · Approvals · Comment Thread | 4/4 | **Built + Released** |
| Mobile block | Swipe row · Filter sheet · Bottom sheet · Keyboard-safe form | Swipe Action Row + Mobile Filter Sheet (2/4) | No |

## Pack readiness (after batch 3)

Pricing deferred to a separate commercial decision; **do not build pack pages yet.** Each of the four original workflow packs is now at **3/4** — one anchor each, all scheduled in batch 4. Every released component is built to compose into its block.

| Pack | Released (3/4) | Remaining anchor |
|---|---|---|
| AI Interface Pack | AI Response Stream · Tool Call Activity · Source Citation Rail | Agent Run Timeline / Prompt Composer |
| Developer Tools Pack | Deployment Pipeline · Live Log Stream · API Request Inspector | Environment Switcher |
| Collaboration Pack | Live Presence Stack · Activity Stream · Approval Workflow | Comment Thread |
| Data Motion Pack | KPI Number Morph · Streaming Data Rows · Filter Result Transition | Data Refresh State |
| Mobile Interaction Pack | Swipe Action Row · Mobile Filter Sheet (2/4) | Keyboard-safe Form · Bottom Sheet Workflow |
| Creative Background Pack | Luminous Topography (+ Kinetic Emphasis text) | Additional signature backgrounds |

## Batch 5 (selected — starts after batch 4 blocks + packs install successfully, which they now do)

After completing the four workflow packs to 4/4 + shipping the four blocks + pack pages + pack registry items, Batch 5 broadens the catalog and grows the mobile pack:
Prompt Composer (ai, Pro) · Webhook Event Stream (developer-tools, Free) · Mention Suggestions (collaboration, Free) · Data Quality Status (data-motion, Free) · **mobile interleave:** Keyboard-safe Form (mobile, Free — takes the Mobile pack to 3/4).

## Batch 4 (delivered — components + 4 blocks + 4 packs + pack pages, all Released/installed)

Completes the four original workflow packs to 4/4, then blocks + pack pages follow:
Agent Run Timeline (ai, Pro) · Environment Switcher (developer-tools, Free) · Comment Thread (collaboration, Pro) · Data Refresh State (data-motion, Free) · **mobile interleave:** Mobile Filter Sheet (mobile, Free). After batch 4: build the first four complete workflow blocks, pack landing pages, pack-level installation, and prepare commercial packaging.

## Discovery (catalog filters & tags)

Filters: category · Free/Pro · complexity · dependency · CSS-or-Motion · interactive-or-visual · New · Experimental. Problem-based search tags: `ai`, `upload`, `dashboard`, `checkout`, `collaboration`, `deployment`, `streaming`, `progress`, `notifications`, `mobile`, `media`. **No fabricated popularity rankings.**

## Batch 6 (delivered) — five new commercial categories

Opens File workflows · Commerce · Security & accounts · Communication · Productivity. Rapid-release track; private-preview phase (docs/45).

| Component | Category | Tier | Status | Released |
|---|---|---|---|---|
| File Upload Pipeline | file | Free | **Released** (batch 6) | 2026-07-14 |
| Product Variant Selector | commerce | Free | **Released** (batch 6) | 2026-07-14 |
| Passkey Setup Flow | security | Free | **Released** (batch 6) | 2026-07-14 |
| Message Delivery States | communication | Free | **Released** (batch 6) | 2026-07-14 |
| Kanban Card Movement | productivity | Pro | **Released** (batch 6) | 2026-07-14 |

Catalog now **40 components (31 Free / 9 Pro) + 4 blocks + 4 packs + 2 libs = 50 registry items** across 15 categories. No components marked Experimental.

### New pack tracking (each 1/4 — NO block built at 1/4)

| Pack | Anchor (1/4) | Future components |
|---|---|---|
| File Workflow Pack | File Upload Pipeline | Multi-file Queue · Processing Timeline · Export Progress |
| Commerce Motion Pack | Product Variant Selector | Cart Item Transition · Checkout Progress · Order Tracking |
| Security & Account Pack | Passkey Setup Flow | Two-Factor Setup · Session Manager · API Key Management |
| Communication Pack | Message Delivery States | Typing & Presence · Thread Expansion · Voice Message |
| Productivity Pack | Kanban Card Movement | Task Dependency Map · Project Timeline · Bulk Action Bar |

A pack block is built only at **4/4** (existing rule). The five new packs stay component-only until then; the four original workflow packs remain the only shippable blocks/packs.

## Batch 7 + Batch 8 (delivered) — final component development

The owner fixed the scope to Batch 7 + Batch 8, then **stop** (no Batch 9). All ten Released on the rapid track. Shared primitive added: `useOptimisticAction` (Cart Item Transition, Task Dependency Map, Project Timeline).

| Component | Category | Tier | Batch | Status |
|---|---|---|---|---|
| Multi-file Queue | file | Free | 7 | **Released** |
| Cart Item Transition | commerce | Free | 7 | **Released** |
| Two-Factor Setup Flow | security | Free | 7 | **Released** |
| Typing and Presence | communication | Free | 7 | **Released** |
| Task Dependency Map | productivity | Pro | 7 | **Released** |
| Processing Timeline | file | Pro | 8 | **Released** |
| Checkout Progress | commerce | Pro | 8 | **Released** |
| Session Security Center | security | Pro | 8 | **Released** |
| Thread Expansion | communication | Free | 8 | **Released** |
| Project Timeline | productivity | Pro | 8 | **Released** |

Catalog now **60 registry items = 50 components (35 Free / 15 Pro) + 4 blocks + 4 packs + 2 libs** across 15 categories. None Experimental.

### Pack progress after Batch 8 (each 3/4 — NO block built; blocks require 4/4)

| Pack | Components (3/4) | Deferred 4th anchor — **not approved for implementation** |
|---|---|---|
| File Workflow Pack | File Upload Pipeline · Multi-file Queue · Processing Timeline | Export Progress (Deferred) |
| Commerce Motion Pack | Product Variant Selector · Cart Item Transition · Checkout Progress | Order Tracking (Deferred) |
| Security & Account Pack | Passkey Setup Flow · Two-Factor Setup Flow · Session Security Center | API Key Management (Deferred) |
| Communication Pack | Message Delivery States · Typing and Presence · Thread Expansion | Voice Message (Deferred) |
| Productivity Pack | Kanban Card Movement · Task Dependency Map · Project Timeline | Bulk Action Bar (Deferred) |

**Component development is STOPPED after Batch 8.** No Batch 9 is planned, selected, or recommended. The five Deferred anchors above are recorded for the owner's future reference only and are **not approved for implementation**. No new blocks, pack pages for incomplete packs, templates, backgrounds, text effects, cards, or animated-shadcn components are to be built. The four original workflow packs (AI Interface, Developer Tools, Collaboration, Data Motion) remain the only shippable 4/4 blocks/packs.
