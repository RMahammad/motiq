// Per-component documentation content (usage, API, a11y, performance). Kept
// separate from catalog metadata. Content is authored to match the real
// component props in packages/registry/registry/**.

export interface ApiRow {
  prop: string;
  type: string;
  def: string;
  desc: string;
}

export interface DocContent {
  usage: string;
  api: ApiRow[];
  accessibility: string[];
  performance: string[];
}

export const docsContent: Record<string, DocContent> = {
  "file-upload-pipeline": {
    usage: `import { FileUploadPipeline, type UploadItem } from "@/components/motionkit/file-upload-pipeline";

// Your app owns uploading; the component presents app-supplied items + emits intent.
<FileUploadPipeline
  items={items}
  onAddFiles={(files) => enqueue(files)}
  onPause={(i) => pause(i.id)}
  onResume={(i) => resume(i.id)}
  onRetry={(i) => retry(i.id)}
  onCancel={(i) => cancel(i.id)}
  onRemove={(i) => remove(i.id)}
  onClearCompleted={clearCompleted}
/>`,
    api: [
      { prop: "items", type: "UploadItem[]", def: "—", desc: "{ id, fileName, fileType, fileSize, progress, status, speed?, remainingTime?, error?, retryCount?, processingStage?, thumbnail?, metadata? }. App-owned (required)." },
      { prop: "onAddFiles", type: "(files: File[]) => void", def: "—", desc: "Fired from the file input or keyboard drop-zone alternative; your app starts the upload." },
      { prop: "onPause / onResume / onRetry / onCancel / onRemove", type: "(item) => void", def: "—", desc: "Per-item intents. The component transfers no bytes — it reflects the status your app sets." },
      { prop: "onClearCompleted / onReorder / onCopyError", type: "cb", def: "—", desc: "Clear finished items, reorder the queue (when enabled), copy an item's error." },
      { prop: "accept / multiple / offline / formatBytes", type: "misc", def: "—", desc: "File-input constraints, an offline banner, and a byte formatter." },
    ],
    accessibility: [
      "Real <input type=file> plus a keyboard-operable drop-zone alternative (button) — never drag-only.",
      "Per-item progress uses role=progressbar with aria-valuenow/min/max; status is icon + text (never colour alone).",
      "Errors are associated via aria-describedby; focus is preserved after an item is removed.",
      "Progress announcements are throttled to status changes (not every percent); reduced motion renders final state.",
    ],
    performance: [
      "No React state update per animation frame; progress values are supplied by the app.",
      "Thumbnail lifecycle (revoke object URLs) is the app's responsibility — documented in props.",
      "Very large queues should be virtualized by the host; the component renders the passed set.",
    ],
  },
  "product-variant-selector": {
    usage: `import { ProductVariantSelector, type OptionGroup } from "@/components/motionkit/product-variant-selector";

// App owns inventory, availability, and pricing.
<ProductVariantSelector
  groups={groups}
  basePrice={base}
  value={selection}
  onValueChange={setSelection}
  onPriceChange={(total, delta) => setPrice(total)}
  getVariantState={(sel) => availability(sel)}
  loadingAvailability={checking}
/>`,
    api: [
      { prop: "groups", type: "OptionGroup[]", def: "—", desc: "color/size/material/finish/storage/plan/bundle/custom; each value = { value, label, swatch?, image?, priceAdjustment?, availability, inventoryState, disabledReason?, recommended?, metadata? }." },
      { prop: "value / defaultValue / onValueChange", type: "VariantSelection / cb", def: "—", desc: "Controlled or uncontrolled selection." },
      { prop: "getVariantState", type: "(sel) => VariantState", def: "—", desc: "App resolves dependent options + unavailable combinations. Inventory is app-supplied — no fabricated scarcity." },
      { prop: "onPriceChange / basePrice / priceFormatter / currency / locale", type: "misc", def: "—", desc: "Price adjustment is shown as text (animation is additive); formatting is locale-aware (no hardcoded symbol position)." },
      { prop: "loadingAvailability / resolveImage / onImageChange / layout", type: "misc", def: "comfortable", desc: "Availability loading, product-image callback, and comfortable/compact (mobile) layout." },
    ],
    accessibility: [
      "role=radiogroup / radio with roving Arrow/Home/End selection where appropriate.",
      "Colour swatches always carry text labels; unavailable options expose their reason to AT.",
      "Price changes are conveyed in text, never by animation alone; focus-visible throughout.",
      "Reduced motion keeps selection/price legible without motion.",
    ],
    performance: [
      "Selection + price are memoised; motion animates transform/opacity only.",
      "Presentation-only — the host owns availability/inventory/pricing; no network.",
      "Inline SVG icons + data-URI demo images; no external assets.",
    ],
  },
  "passkey-setup-flow": {
    usage: `import { PasskeySetupFlow, type PasskeyState } from "@/components/motionkit/passkey-setup-flow";

// The APP performs WebAuthn and sets state; this component presents it.
<PasskeySetupFlow
  state={state} // intro | starting | waiting | success | failure | unsupported | existing | cancelled
  capability={capability}
  error={error}
  onBegin={beginRegistration}
  onRetry={beginRegistration}
  onComplete={finish}
  onUseAlternative={usePassword}
/>`,
    api: [
      { prop: "state", type: "PasskeyState", def: "—", desc: "App-owned phase. The component never calls navigator.credentials or fakes success." },
      { prop: "capability / error / existingCredential", type: "app-supplied", def: "—", desc: "Device capability, the app's failure detail (shown verbatim), and any existing credential." },
      { prop: "name / defaultName / onNameChange", type: "string / cb", def: "—", desc: "A human-readable passkey nickname — the only user input. No key material is ever handled." },
      { prop: "onBegin / onCancel / onRetry / onComplete / onUseAlternative", type: "cb", def: "—", desc: "Lifecycle intents. An alternative sign-in path is always offered." },
    ],
    accessibility: [
      "Ordered step semantics (aria-current=step); focus moves to the active phase heading on each transition.",
      "Failure detail is shown with role=alert and associated to the retry action via aria-describedby.",
      "Status is icon + text; no countdown/time pressure; keyboard operable; mobile layout.",
      "Reduced motion replaces the waiting spinner with a static affordance.",
    ],
    performance: [
      "Presentation-only — no crypto, no WebAuthn, no timers; the host owns the ceremony.",
      "Motion animates transform/opacity only; keyed on phase to play a transition once.",
      "No perpetual animation.",
    ],
  },
  "message-delivery-states": {
    usage: `import { MessageDeliveryStates, type DeliveryMessage } from "@/components/motionkit/message-delivery-states";

// App owns delivery; the component presents app-supplied states.
<MessageDeliveryStates
  messages={messages}
  currentUserId={me}
  onRetry={(m) => resend(m.id)}
  onCancel={(m) => cancel(m.id)}
  onEdit={(m) => edit(m.id)}
/>`,
    api: [
      { prop: "messages", type: "DeliveryMessage[]", def: "—", desc: "{ id, body, author, timestamp, deliveryState, readRecipients?, error?, attachmentState? }. deliveryState ∈ draft|sending|sent|delivered|read|failed|retrying|scheduled|cancelled|edited." },
      { prop: "currentUserId", type: "string", def: "—", desc: "Distinguishes own vs others' messages for alignment + receipts." },
      { prop: "onRetry / onCancel / onEdit / onCopy", type: "(message) => void", def: "—", desc: "Message intents. The component never simulates network delivery." },
      { prop: "formatTimestamp / now / maxHeight", type: "misc", def: "—", desc: "Deterministic relative-time formatting and a scroll region." },
    ],
    accessibility: [
      "Delivery state is available as text (icon never alone); read receipts are labelled.",
      "Retry is keyboard-accessible; errors are associated with their message; body stays selectable.",
      "Live-region updates are restrained (only meaningful advances announced, one at a time).",
      "Reduced motion renders final frames instantly.",
    ],
    performance: [
      "Motion communicates transitions only (keyed on deliveryState) — no constant bouncing/typing dots.",
      "Presentation-only — no network/timers; the host drives the lifecycle.",
      "Rows keyed by id.",
    ],
  },
  "kanban-card-movement": {
    usage: `import { KanbanCardMovement, type KanbanColumn, type KanbanCard } from "@/components/motionkit/kanban-card-movement";

// App owns the board data + persistence; onMove may be async (optimistic + rollback).
<KanbanCardMovement
  columns={columns}
  cards={cards}
  onMove={async (cardId, toColumnId, toIndex) => persist(cardId, toColumnId, toIndex)}
  moveValidation={(from, to) => allowed(from, to)}
  onAddCard={(columnId) => addCard(columnId)}
/>`,
    api: [
      { prop: "columns / cards", type: "KanbanColumn[] / KanbanCard[]", def: "—", desc: "column = { id, title, limit? }; card = { id, columnId, title, order, disabled?, meta? }. App-owned." },
      { prop: "onMove", type: "(cardId, toColumnId, toIndex) => void | Promise", def: "—", desc: "May be async: movement is optimistic and rolls back if the promise rejects." },
      { prop: "moveValidation", type: "(from, to) => boolean | reason", def: "—", desc: "Reject invalid moves (e.g. column limit); the reason is surfaced." },
      { prop: "selectedCardId / onAddCard / columnLimits", type: "misc", def: "—", desc: "Controlled selection, add-card intent, and app-supplied per-column limits." },
    ],
    accessibility: [
      "Dragging is never required — keyboard/menu movement is always available; origin + destination are announced (aria-live).",
      "Focus returns to the moved card; drop targets are labelled; disabled cards can't be moved.",
      "No colour-only column/status meaning; reduced motion disables transform animation.",
      "Cancel a drag with Escape.",
    ],
    performance: [
      "Only the dragged card moves via transform/ref during pointer movement — no per-pointermove React state.",
      "Transform-based layout animation; drag math kept outside large React state loops.",
      "Very large boards should be virtualized by the host (documented).",
    ],
  },
  "prompt-composer": {
    usage: `import { PromptComposer, type PromptModel } from "@/components/motionkit/prompt-composer";

// Presentation only: your app owns models, token counts, submission — nothing is sent here.
const models: PromptModel[] = [{ id: "fast", name: "Fast" }, { id: "long", name: "Long context" }];

<PromptComposer
  models={models}
  selectedModelId={modelId}
  onModelChange={setModelId}
  tokenCount={estimate}
  maxTokens={8000}
  status={status} // "idle" | "loading" | "streaming" | "error"
  onSubmit={runPrompt}
  onStop={stop}
  onRetry={retry}
  variables={[{ id: "name", label: "Customer name" }]}
  templates={templates}
/>`,
    api: [
      { prop: "value / defaultValue / onValueChange", type: "string / cb", def: "—", desc: "Controlled or uncontrolled prompt text; the app owns the value." },
      { prop: "models / selectedModelId / onModelChange", type: "PromptModel[] / string / cb", def: "—", desc: "Model selector integration point. Real model names come from your app; the component hardcodes none." },
      { prop: "tokenCount / maxTokens / tokenNoun", type: "number / number / string", def: "—", desc: "App-supplied estimate; remaining budget shown by icon + text (never colour alone). The component never counts tokens itself." },
      { prop: "status", type: '"idle"|"loading"|"streaming"|"error"', def: '"idle"', desc: "Drives Send / Stop / Retry affordances and aria-live status." },
      { prop: "onSubmit / onStop / onRetry", type: "cb", def: "—", desc: "Cmd/Ctrl+Enter submits. The app performs the actual request — the composer sends nothing." },
      { prop: "variables / onInsertVariable · templates / onInsertTemplate · attachments / onRemoveAttachment / onAddAttachment", type: "arrays / cb", def: "—", desc: "App-supplied variables, templates, and attachments; caret-aware insertion + removal callbacks." },
    ],
    accessibility: [
      "Labelled textarea; Send/Stop/Retry are real buttons with text labels; menus are keyboard operable and Esc-closable.",
      "Token budget and status use icon + text (never colour alone) and are announced via aria-live.",
      "Cmd/Ctrl+Enter to submit is documented in a visible helper row and JSDoc; focus is preserved across state changes.",
      "Reduced motion renders the final state with no essential animation.",
    ],
    performance: [
      "Motion animates only opacity/transform; no perpetual loops.",
      "Presentation-only — no model, network, timers, or token counting; the host owns all of it.",
      "Controlled/uncontrolled via a single state primitive; menus and rows are memoised.",
    ],
  },
  "webhook-event-stream": {
    usage: `import { WebhookEventStream, type WebhookEvent } from "@/components/motionkit/webhook-event-stream";

// Your app owns the events; secrets are redacted and never enter the DOM/search/copies.
<WebhookEventStream
  events={events}
  status={connected ? "streaming" : "error"}
  follow={follow}
  onFollowChange={setFollow}
  redact={["authorization", "x-signature"]}
  onRetry={(e) => resend(e.id)}
  onReplay={(e) => replay(e.id)}
/>`,
    api: [
      { prop: "events", type: "WebhookEvent[]", def: "—", desc: "{ id, endpoint, status, statusCode?, retryCount?, timestamp, payload?, headers? }. App-owned (required)." },
      { prop: "status / errorMessage", type: '"streaming"|"paused"|"idle"|"error" / string', def: '"streaming"', desc: "Stream lifecycle; error surfaces a banner with onReconnect." },
      { prop: "follow / onFollowChange · paused / onPausedChange", type: "boolean / cb", def: "—", desc: "Auto-follow that doesn't fight your scroll; pause/resume without losing position." },
      { prop: "redact", type: "boolean | string[] | (ctx) => boolean", def: "—", desc: "Redaction rule; matched header/payload values render as ••••••, never in DOM, search, or copies." },
      { prop: "query / onQueryChange · statuses", type: "string / cb · WebhookDeliveryStatus[]", def: "—", desc: "Search + status/event-type filtering." },
      { prop: "onRetry / onReplay / onInspect / onReconnect", type: "cb", def: "—", desc: "Retry (failed only), replay, expand inspection, and reconnect callbacks. Nothing is sent by the component." },
    ],
    accessibility: [
      "Delivery status is icon + text (never colour alone) and survives forced-colors.",
      "Arriving events are announced politely via aria-live; the log is keyboard operable and expandable.",
      "Redacted values never reach the accessibility tree, search index, or clipboard.",
      "Reduced motion renders arrivals without transition; auto-follow still works.",
    ],
    performance: [
      "Bounded history via maxEvents; rows keyed by id; filtering/search memoised.",
      "Auto-follow + visibility pause avoid off-screen work.",
      "Presentation-only — no sockets/network/timers; the host feeds the stream.",
    ],
  },
  "mention-suggestions": {
    usage: `import { MentionSuggestions, type MentionUser } from "@/components/motionkit/mention-suggestions";

// The app owns the input + text insertion; this renders the accessible popup only.
<MentionSuggestions
  open={open}
  query={query}
  items={people}
  inputRef={inputRef}
  groups={[{ id: "people", label: "People" }, { id: "teams", label: "Teams" }]}
  onSelect={(user, ctx) => insertMention(user, ctx)}
  onOpenChange={setOpen}
/>`,
    api: [
      { prop: "open / query / items", type: "boolean / string / MentionUser[]", def: "—", desc: "Fully controlled: the app detects the trigger and drives open/query; items are app-owned." },
      { prop: "inputRef", type: "RefObject<HTMLInputElement | HTMLTextAreaElement>", def: "—", desc: "The app's field. DOM focus stays there; the popup uses aria-activedescendant." },
      { prop: "onSelect / onOpenChange", type: "cb", def: "—", desc: "Selection returns the item + context for the app to insert; Esc/blur closes." },
      { prop: "groups / loading / filter / limit", type: "MentionGroup[] / boolean / cb / number", def: "limit 8", desc: "Labelled groups, loading state, custom filter, and a result cap." },
      { prop: "align / label / emptyLabel / loadingLabel", type: "misc", def: "—", desc: "Placement + SR labels for empty/loading." },
    ],
    accessibility: [
      "ARIA combobox pattern wired onto the app's field: aria-controls + aria-activedescendant; DOM focus never leaves the input.",
      "Arrow/Home/End navigate; Enter selects; Esc closes; disabled entries expose a reason and can't be selected.",
      "Result count announced via aria-live; avatars are initials with a deterministic hue (no external images).",
      "Presence/disabled use distinct icon shapes + text (never colour alone); reduced motion shows the final state.",
    ],
    performance: [
      "Filtering + roving index memoised; rows keyed by id.",
      "No portal thrash — the popup mounts/unmounts with the open prop.",
      "Presentation-only — no network/persistence; the host owns text editing.",
    ],
  },
  "data-quality-status": {
    usage: `import { DataQualityStatus, type QualityCheck } from "@/components/motionkit/data-quality-status";

// Metrics + checks are app-supplied. Unmeasured metrics render "Unknown" — never fabricated.
<DataQualityStatus
  label="Orders dataset"
  source="warehouse.orders"
  metrics={{ freshness, completeness, accuracy: null /* -> Unknown */ }}
  checks={checks}
  lastChecked={checkedAt}
  totalRecords={total}
  onRetry={revalidate}
  validating={validating}
/>`,
    api: [
      { prop: "metrics", type: "DataQualityMetrics", def: "—", desc: "{ freshness, completeness, accuracy }, each QualityMetric | null. A null metric renders \"Unknown\" — the component never invents a value." },
      { prop: "checks", type: "QualityCheck[]", def: "—", desc: "{ id, label, state: pass|warning|failure|unknown, summary, affectedRecords?, issues? }. App-owned." },
      { prop: "lastChecked / totalRecords", type: "Date|number|string|null / number", def: "—", desc: "Last validation time (pass `now` for deterministic relative formatting) and record scope." },
      { prop: "filter / defaultFilter / onFilterChange", type: "CheckFilter / cb", def: "—", desc: "Filter checks by status; controlled or uncontrolled." },
      { prop: "onRetry / validating", type: "cb / boolean", def: "—", desc: "Re-run validation; the app performs the actual check. The component only reflects state." },
    ],
    accessibility: [
      "Overall verdict + per-check state are icon + text (never colour alone) and survive forced-colors.",
      "Issue lists are keyboard-expandable (Enter/Space, aria-expanded); counts announced via aria-live.",
      "Unmeasured metrics are explicitly \"Unknown\", not zero or a colour.",
      "Reduced motion renders the final state with no essential animation.",
    ],
    performance: [
      "Derivation + filtering memoised; checks keyed by id; number morphs animate transform only.",
      "Presentation-only — no validation runs here; the host supplies all evidence.",
      "No timers/network; expandable rows mount lazily.",
    ],
  },
  "keyboard-safe-form": {
    usage: `import { KeyboardSafeForm, type FieldError } from "@/components/motionkit/keyboard-safe-form";

// Your app owns the fields + submission; the sticky bar stays above the mobile keyboard.
<KeyboardSafeForm
  onValidate={() => validate()}    // return FieldError[] | null
  onSubmit={async () => await save()}
  dirty={isDirty}
  onCancel={close}
>
  {/* your inputs */}
</KeyboardSafeForm>`,
    api: [
      { prop: "children / onSubmit", type: "ReactNode / () => Promise<void>|void", def: "—", desc: "Your fields + the async submit the app performs. Nothing is sent by the component." },
      { prop: "errors / onValidate", type: "FieldError[] / () => FieldError[]|null", def: "—", desc: "App-owned validation; a summary lists errors linked to fields via aria." },
      { prop: "dirty / confirmDiscard / onCancel", type: "boolean / boolean / cb", def: "confirmDiscard true", desc: "Unsaved-changes discard guard (Keep editing / Discard) before cancel." },
      { prop: "onSubmitSuccess / successMessage", type: "cb / string", def: "—", desc: "Success state + live-region message after a resolved submit." },
      { prop: "disableViewportTracking / reducedMotion", type: "boolean / boolean", def: "false", desc: "Opt out of VisualViewport tracking (falls back to a plain sticky footer); force reduced motion." },
    ],
    accessibility: [
      "Validation summary links each error to its field; summary links move focus to the field.",
      "Async status uses aria-live; errors are icon + text (never colour alone) with aria-invalid/aria-describedby.",
      "Sticky action bar stays reachable above the virtual keyboard; safe-area insets respected; 200%-zoom-safe.",
      "VisualViewport and beforeunload are feature-detected — SSR- and jsdom-safe with a graceful desktop fallback.",
    ],
    performance: [
      "Viewport tracking uses a passive listener and is disabled when unsupported.",
      "Motion animates only transform/opacity; reduced motion removes it.",
      "Presentation-only — the host owns fields, validation, and submission.",
    ],
  },
  "ai-agent-workspace": {
    usage: `import { AiAgentWorkspace } from "@/components/motionkit/blocks/ai-agent-workspace";

// A full-page AI agent workspace composing 4 components. Presentation-only:
// your app owns the state end-to-end; it never talks to a model. Renders
// standalone with fictional demo data; make phase controlled to drive real state.
export default function AgentPage() {
  return <AiAgentWorkspace phase="running" prompt="Plan and apply the migration" />;
}`,
    api: [
      { prop: "phase / onPhaseChange", type: `WorkspacePhase / cb`, def: "—", desc: "Controlled workspace state: idle | running | waiting | completed | failed | cancelled. Every child's state is derived from it." },
      { prop: "defaultPhase", type: "WorkspacePhase", def: `"running"`, desc: "Uncontrolled initial phase." },
      { prop: "prompt / assistantName", type: "string", def: "—", desc: "Header + answer copy." },
      { prop: "dataset", type: "WorkspaceDataset", def: "demo", desc: "Fully override the fictional demo data (run title, steps, answer segments, sources, claims, summary, error)." },
      { prop: "showStateControls", type: "boolean", def: "true", desc: "Hide the built-in state buttons when the host supplies its own." },
    ],
    accessibility: [
      "Inherits every composed component's accessibility: status is icon + text label + border (never color alone); approvals/retries/cancel/stop/citations are real buttons/links with names and focus rings.",
      "Each child owns one polite live region announcing lifecycle transitions only; the citation rail supports roving keyboard selection synced with inline markers.",
      "The block adds a labelled role=group state switcher (aria-pressed) and introduces no nested interactive elements.",
      "Under prefers-reduced-motion everything renders in its final state with no motion.",
    ],
    performance: [
      "Presentation-only and event-driven — no polling, timers, or per-frame work in the block; motion comes from the children (transform/opacity only).",
      "Per-phase snapshots are memoized; no Date.now()/Math.random()/new Date() at module scope, render, or initializers — server and client render identical markup.",
      "Installs the block + its 4 components as editable source; Pro components require Pro access.",
    ],
  },
  "deployment-command-center": {
    usage: `import { DeploymentCommandCenter } from "@/components/motionkit/blocks/deployment-command-center";

// A composed, app-controlled deploy console. It owns a small demo state machine
// and wires each component's callbacks together; rewire to your real backend.
// It never talks to a provider.
<DeploymentCommandCenter repo="acme/ledger-web" defaultEnvironmentId="staging" />`,
    api: [
      { prop: "environments", type: "Environment[]", def: "3 demo envs", desc: "Environments in the top-bar switcher (app-owned). Switching to production is gated behind a confirmation dialog." },
      { prop: "defaultEnvironmentId", type: "string", def: "staging", desc: "Environment selected on first render." },
      { prop: "repo", type: "string", def: `"acme/ledger-web"`, desc: "Repository slug shown in the header + request body (fictional)." },
      { prop: "(internal) run machine", type: "—", def: "—", desc: "Deploy / Run-with-failure / Retry / Cancel / Reset drive a deterministic timeline: stages, revealed log lines, and the POST /v1/deployments inspector state derive from it." },
    ],
    accessibility: [
      "Composes four accessible primitives unchanged: the switcher's ARIA combobox + production alertdialog, the pipeline's ordered-list stages, the log region (role=log) with pause/copy, and the inspector's disclosure sections — all keyboard reachable.",
      "Every status is icon + text label (never color alone) and survives forced-colors; the top-bar phase indicator is a polite role=status region.",
      "The log stream never disables user scrolling; a Following/Paused indicator + jump-to-latest resume on the reader's terms.",
      "Reduced motion renders the final state; controls remain ≥40px touch targets.",
    ],
    performance: [
      "Presentation-only: no network/model. The demo advances one scripted log line per interval and clears the timer on completion/cancel/unmount.",
      "Motion animates only opacity/transform; child components pause offscreen work via useVisibilityPause.",
      "Derived stages, visible entries, and the request object are memoized; no hydration-nondeterministic clocks/RNG at render.",
    ],
  },
  "collaborative-review-workspace": {
    usage: `import { CollaborativeReviewWorkspace } from "@/components/motionkit/blocks/collaborative-review-workspace";

// Renders standalone with fictional demo data. The block owns a state machine
// that wires the four components together: approving a stage advances the
// workflow AND appends an activity event; posting a comment appears in the
// thread AND the feed. The app owns persistence + authorization.
<CollaborativeReviewWorkspace />`,
    api: [
      { prop: "workflow / comments / events / presence", type: "override data", def: "inline demo", desc: "Optional starting data for each composed component; omit any to fall back to the fictional demo seed." },
      { prop: "currentUser", type: "CommentAuthor", def: `{ id: "you", name: "You" }`, desc: "The viewer — drives approval authorization, comment authorship, and reaction toggles." },
      { prop: "mentionable / title / showControls", type: "misc", def: "—", desc: "@-mention cast, workspace heading, and the phase-preset toolbar toggle." },
    ],
    accessibility: [
      "Composes four accessible components; the block adds only a labelled section, a semantic status pill (icon + text), and an aria-pressed phase-preset toolbar of real buttons.",
      "The approval workflow keeps app-owned authorization: the viewer can only act on stages they review and only once; disabled reasons surface via aria-describedby.",
      "No nested interactive elements — each child owns its focus/keyboard behavior; the layout only arranges them.",
      "Every piece honors reduced motion; status/unread state use text + shape and survive forced-colors.",
    ],
    performance: [
      "Presentation-only: no network; the demo state machine is plain in-memory reducers over the shared data.",
      "Timestamps seed from a fixed epoch for first render and re-anchor to the real clock in a mount effect — no hydration drift.",
      "Motion is opacity/transform/height inside the children; the activity rail + thread cap their own scroll height so long feeds don't reflow the page.",
    ],
  },
  "live-operations-dashboard": {
    usage: `import { LiveOperationsDashboard, type OpsService } from "@/components/motionkit/blocks/live-operations-dashboard";

// Presentation-only: your app owns the data and every lifecycle transition. Ships
// with fictional demo services so it renders standalone; it never fetches.
<LiveOperationsDashboard />`,
    api: [
      { prop: "services", type: "OpsService[]", def: "8 demo services", desc: "Baseline dataset (app-owned): { id, name, region, category, status, rpm, p95, errorRate, sessions }. Refresh snapshots derive deterministically from this — no fetching." },
      { prop: "className", type: "string", def: "—", desc: "Extra classes on the outer shell." },
    ],
    accessibility: [
      "Composes only accessible primitives: KPI aria-labels + aria-busy; refresh/filter/table each own polite rate-limited live regions and real semantics (a semantic table with scope=col headers + aria-sort).",
      "Status is never color-only — each service badge pairs a shape glyph with a text label (Operational / Degraded / Down), legible in forced-colors.",
      "Every control is a real button with a focus ring; filter toggles expose aria-pressed; no nested interactive elements.",
      "Reduced motion snaps number morphs and disables row/pulse animation; layout unchanged.",
    ],
    performance: [
      "Presentation-only and self-contained: no fetch/poll/timers at rest; the demo schedules short setTimeouts only inside control handlers and clears them on unmount.",
      "Deterministic — no Date.now()/Math.random()/new Date() at render/init/module scope, so first paint matches across server + client.",
      "Numeric morphs animate via rAF (no layout thrash); rows animate transform/opacity. For very large datasets, page/window before handing them in (the table is not virtualized).",
    ],
  },
  "agent-run-timeline": {
    usage: `import { AgentRunTimeline, type AgentRun } from "@/components/motionkit/agent-run-timeline";

// Presentation-only: your app owns the run + every status. It never runs an agent.
const run: AgentRun = {
  title: "Apply database migration",
  status: "running",
  currentStepId: "s3",
  steps: [
    { id: "s1", title: "Inspect repository", status: "completed", toolCall: { name: "repo.scan", result: { files: 214 } } },
    { id: "s2", title: "Generate proposal", status: "active", description: "Draft a reversible plan." },
    { id: "s3", title: "Wait for approval", status: "waiting_approval" },
  ],
};

<AgentRunTimeline run={run} followActive compactCompleted onApprove={approve} onReject={reject} onRetryStep={retry} onCancelRun={cancel} />`,
    api: [
      { prop: "run", type: "AgentRun", def: "—", desc: "App-owned: { title, status, startedAt?, endedAt?, currentStepId?, steps[], summary? }. Run statuses: queued|running|waiting|completed|failed|cancelled|paused (required)." },
      { prop: "run.steps[]", type: "RunStep[]", def: "—", desc: "Ordered steps { id, title, description?, status, toolCall?, output?, error?, attempts?, stages?, summary? }. Step statuses: pending|active|completed|failed|skipped|waiting_approval|cancelled." },
      { prop: "activeStepId / onActiveStepChange", type: "string / cb", def: "run.currentStepId", desc: "Selected/emphasized step — controlled or internal." },
      { prop: "followActive", type: "boolean", def: "true", desc: "When run.currentStepId moves, select it and scroll it into view." },
      { prop: "onApprove / onReject / onRetryStep", type: "(id) => void", def: "—", desc: "Inline approval on a waiting_approval step; Retry on a failed step." },
      { prop: "onCancelRun / onResumeRun / onCopyRun", type: "callbacks", def: "—", desc: "Run-level cancel/resume and copy-run-details." },
      { prop: "compactCompleted / renderStepDetails / renderOutput / formatTimestamp", type: "misc", def: "—", desc: "Compress resolved steps; custom detail/output renderers; timestamp override." },
    ],
    accessibility: [
      "Run and step status are icon + text label + border — never color alone; survives forced-colors.",
      "Steps are a semantic ordered list; each header is a disclosure button (aria-expanded) with aria-current on the current step; details mount only while open.",
      "Approve/Reject/Retry/Cancel/Resume/Copy are real buttons; a polite role=status region announces run + step lifecycle transitions only.",
      "After approve/reject/retry, focus moves to that step's header; reduced motion renders the final state with no perpetual pulse.",
    ],
    performance: [
      "Motion drives only opacity/transform/height/width; the active-step pulse stops the moment a step resolves.",
      "Expanded panels mount lazily via AnimatePresence; presentation-only — no model, timers, or network.",
      "Pair with useVisibilityPause in the host to pause run-advancing updates offscreen.",
    ],
  },
  "environment-switcher": {
    usage: `import { EnvironmentSwitcher, type Environment } from "@/components/motionkit/environment-switcher";

// Presentation + control only: your app owns the data AND the actual switch.
const environments: Environment[] = [
  { id: "staging", name: "Staging", type: "staging", status: "degraded", region: "iad1", branch: "release/2.9", health: 71 },
  { id: "prod", name: "Production", type: "production", status: "available", region: "iad1", warning: "Live customer traffic" },
];

<EnvironmentSwitcher environments={environments} value={envId} onValueChange={runSwitch} switching={switching} error={error} onRetry={retry} requireProductionConfirmation />`,
    api: [
      { prop: "environments", type: "Environment[]", def: "—", desc: "{ id, name, type, status, region?, branch?, version?, lastDeploy?, url?, health?, warning?, disabled?, disabledReason?, group? }. App-owned (required)." },
      { prop: "value / defaultValue / onValueChange", type: "string / cb", def: "—", desc: "Controlled or uncontrolled selection; onValueChange fires only after production confirmation when required. Your app performs the real switch." },
      { prop: "switching / error / onRetry", type: "boolean / string / cb", def: "—", desc: "App-owned in-flight + failure; the trigger shows loading, the banner surfaces Retry. The component never switches anything itself." },
      { prop: "requireProductionConfirmation", type: "boolean", def: "false", desc: "Gate a switch to a production environment behind a role=alertdialog confirmation." },
      { prop: "recentIds / favoriteIds / groups", type: "string[] / EnvGroup[]", def: "—", desc: "Float recents + favorites to the top; groups render labelled sections." },
      { prop: "renderEnvironment / formatTimestamp / now", type: "misc", def: "—", desc: "Custom row renderer + last-deploy formatting (pass `now` for deterministic relative times)." },
    ],
    accessibility: [
      "ARIA combobox pattern: button trigger (aria-haspopup=listbox) → search (role=combobox, aria-activedescendant) → role=listbox of role=option rows; full Arrow/Home/End/Enter/Escape, focus restored on close.",
      "Status, type, and production are icon + text label (never color alone) and survive forced-colors.",
      "Disabled environments keep their app-provided reason via aria-describedby and can't be selected; production opens a focus-trapped alertdialog with the hazard in text.",
      "Rows are ≥44px; reduced motion renders the final state with no perpetual spinner.",
    ],
    performance: [
      "Motion animates only opacity/transform/width/height; the in-flight pulse stops on a terminal status.",
      "Filtering + section ordering + the keyboard-nav list are memoised; rows keyed by id.",
      "Presentation-only — no model/socket/timers/network; the host owns the switch and all status.",
    ],
  },
  "comment-thread": {
    usage: `import { CommentThread, type Comment, type CommentAuthor } from "@/components/motionkit/comment-thread";

// Presentation + optimistic UX only: your app owns persistence + permissions.
const currentUser: CommentAuthor = { id: "you", name: "You", role: "Reviewer" };

<CommentThread
  comments={comments}
  currentUser={currentUser}
  mentionable={people}
  unreadAfter={lastSeen}
  onAddComment={async (draft) => await api.add(draft)}  // return a Promise → drives pending→sent/failed
  onReply={async (draft) => await api.reply(draft)}     // draft.parentId set
  onReact={(c, emoji, active) => api.react(c.id, emoji, active)}
  onResolve={(c) => api.resolve(c.id)}
  onReopen={(c) => api.reopen(c.id)}
/>`,
    api: [
      { prop: "comments", type: "Comment[]", def: "—", desc: "App-owned; flat via parentId or nested via replies. Each: { id, author, body, createdAt, editedAt?, parentId?, replies?, mentions?, reactions?, attachments?, status?, resolved?, permissions? }." },
      { prop: "currentUser", type: "CommentAuthor", def: "—", desc: "The composer; drives optimistic authorship + reaction toggles (required)." },
      { prop: "onAddComment / onReply / onEdit", type: "(draft) => void | Promise<Comment|void>", def: "—", desc: "Return a Promise — resolve/reject drives the internal pending → sent / failed; a returned Comment supplies the confirmed id (temp id replaced)." },
      { prop: "onRetry / onDelete / onResolve / onReopen / onReact / onCopyLink", type: "callbacks", def: "—", desc: "Retry a failed send; delete; resolve/reopen; toggle a reaction; permalink-copied. The app performs the mutation." },
      { prop: "mentionable / permissions", type: "CommentAuthor[] / CommentPermissions", def: "[] / all", desc: "People for the accessible @ menu; per-action capability gates (per-comment overrides global)." },
      { prop: "sort / unreadAfter / reactionChoices / collapseRepliesAfter / formatTimestamp", type: "misc", def: "—", desc: "Order, unread divider boundary, reaction picker set, auto-collapse threshold, timestamp override." },
    ],
    accessibility: [
      "Each comment is a semantic <article> with author, <time datetime>, and an explicit (edited) label; replies are a labelled <ul> so the parent relationship is conveyed, not just indented.",
      "Optimistic state is text + icon (Sending…, Failed to send, Resolved) — never color-only; failures announce politely and expose Retry. Reaction counts are announced with the emoji aria-hidden.",
      "Focus is preserved across pending → sent/failed; opening reply/edit moves focus into the composer and returns it on cancel; the @ menu uses aria-autocomplete + aria-activedescendant.",
      "Reduced motion renders final states with opacity-only fades; all actions are keyboard-operable buttons; forced-colors safe.",
    ],
    performance: [
      "Motion drives only opacity/transform/height; AnimatePresence handles insertion/removal/reply expansion; no looping animation.",
      "Presentation-only — no network/timers; the optimistic layer is a small in-memory overlay reconciled by id, keeping re-renders local.",
      "`now` for relative timestamps is set in an effect (never during render) — no hydration mismatch; mobile layout is CSS-driven.",
    ],
  },
  "data-refresh-state": {
    usage: `import { DataRefreshState, type RefreshState } from "@/components/motionkit/data-refresh-state";

// Presentation-only: your app owns the fetch, the progress, and every state.
<DataRefreshState
  state={state}                 // idle | checking | refreshing | partially_updated | success | stale | offline | error | paused | cancelled
  label="Growth overview"
  source="Warehouse · replica-2"
  lastUpdated={lastUpdatedMs}
  progress={progress}           // 0–1 while refreshing; omit for indeterminate
  updatedCount={updated}
  totalCount={200}
  automatic
  interval={30000}
  now={now}                     // client-only ms → relative times, hydration-safe
  onRefresh={startFetch}
  onCancel={abortFetch}
  onRetry={startFetch}
  onPause={pause}
  onResume={resume}
/>`,
    api: [
      { prop: "state", type: "RefreshState", def: "—", desc: "Host-owned: idle · checking · refreshing · partially_updated · success · stale · offline · error · paused · cancelled (required)." },
      { prop: "progress", type: "number | null", def: "—", desc: "Determinate 0–1 (role=progressbar + aria-valuenow); omit/null → an honestly-labelled indeterminate bar (never a fake number)." },
      { prop: "updatedCount / totalCount", type: "number", def: "—", desc: "Records updated / in scope; drives the animated count readout." },
      { prop: "lastUpdated / nextRefresh / source / staleness / connection / errorSummary", type: "misc", def: "—", desc: "Contextual info surfaced as text — stale + offline detail is always textual, never color alone." },
      { prop: "automatic / interval / intervalOptions", type: "bool / ms / ms[]", def: "false", desc: "Auto mode reveals pause/resume + an interval select wired to onIntervalChange." },
      { prop: "mode / onRefresh / onCancel / onRetry / onPause / onResume", type: "misc", def: `"panel"`, desc: "Density (compact/inline/panel) and the keyboard-accessible controls (visibility follows state)." },
    ],
    accessibility: [
      "Every state pairs a distinct glyph with a text label (Refreshing, Stale, Offline, Refresh failed…) — status is never color alone; legible in forced-colors.",
      "Determinate progress is role=progressbar with aria-valuenow/min/max; indeterminate is a labelled bar shown only while busy — never spins on idle.",
      "A polite role=status region announces on lifecycle change only; errors use role=alert; refresh/cancel/retry/pause/resume/interval/dismiss are real controls.",
      "prefers-reduced-motion removes the icon spin and progress sweep, snaps counts, and makes the indeterminate bar static.",
    ],
    performance: [
      "Presentation-only and tiny: no fetching, timers, or polling — the host owns all work, so it adds no background cost when idle.",
      "Animations are transform/opacity/width only; the spin + indeterminate sweep run only while busy and stop on completion.",
      "Timestamps never call Date.now()/new Date() during render — pass a client-updated `now` for relative times.",
    ],
  },
  "mobile-filter-sheet": {
    usage: `import { MobileFilterSheet, type FilterGroup, type FilterValue } from "@/components/motionkit/mobile-filter-sheet";

// Your app owns the data, the applied value, and the result count.
const groups: FilterGroup[] = [
  { id: "status", label: "Status", type: "checkbox", options: [{ value: "active", label: "Active", count: 5 }] },
  { id: "owner", label: "Owner", type: "radio", options: [{ value: "ada", label: "Ada" }] },
  { id: "price", label: "Price", type: "range", min: 0, max: 200, step: 4 },
];

<MobileFilterSheet
  groups={groups}
  open={open}
  onOpenChange={setOpen}
  value={applied}             // APPLIED value
  onValueChange={setApplied}  // commit — fires on Apply only
  onDraftChange={setDraft}    // live draft → compute the result count
  resultCount={count}
  mode="sheet"                // "sheet" | "fullscreen" | "panel" (desktop)
  confirmDiscard
/>`,
    api: [
      { prop: "groups", type: "FilterGroup[]", def: "—", desc: "App-defined groups: checkbox · radio · range · date · search · hierarchical · custom. Options support { count, disabled, disabledReason, children }." },
      { prop: "open / defaultOpen / onOpenChange", type: "boolean / cb", def: "false", desc: "Controlled or uncontrolled sheet visibility." },
      { prop: "value / defaultValue / onValueChange", type: "FilterValue / cb", def: "{}", desc: "The APPLIED value. onValueChange fires only when the draft is committed via Apply." },
      { prop: "onDraftChange", type: "(draft) => void", def: "—", desc: "Fires on every uncommitted draft edit — use it to compute the live resultCount before Apply." },
      { prop: "onApply / onCancel / onClear", type: "cb", def: "—", desc: "Apply commits the draft; Cancel restores the applied value; onClear fires when Clear-all empties the draft." },
      { prop: "resultCount / loading / error / mode / confirmDiscard / renderFilter / renderFooter", type: "misc", def: "—", desc: "App-computed count (animated + announced), count-area states, sheet/fullscreen/panel surface, unsaved-change prompt, custom body/footer." },
    ],
    accessibility: [
      "role=dialog aria-modal with a manual focus trap; focus lands on Close on open and is restored to the trigger on close; Escape closes (via the same confirm path).",
      "Options are native checkboxes/radios inside real <label>s (no nested interactive elements); disabled options expose their reason via text + aria-describedby, never color-only.",
      "The result count is announced through a polite role=status region; active state uses a dot + label, not color alone (forced-colors safe).",
      "Sticky header + scrollable body + sticky footer stay reachable at 200% zoom; targets are ≥44px; swipe-to-close is available but never the only way out; disabled under reduced motion.",
    ],
    performance: [
      "Motion drives only opacity/transform + chip layout + per-group height; no looping animation and no matchMedia read during render (no hydration mismatch).",
      "Presentation-only: the app owns data, filtering, and the count; body scroll is locked only for the fixed overlay; group bodies mount lazily via AnimatePresence.",
      "Reduced motion snaps the sheet, count, and group transitions instantly while keeping every control operable.",
    ],
  },
  "source-citation-rail": {
    usage: `import { SourceCitationRail, CitationMarker, type CitationSource } from "@/components/motionkit/source-citation-rail";

// Presentation-only: your app owns the sources and decides "active".
const sources: CitationSource[] = [
  { id: "s1", index: 1, title: "Streaming responses guide", domain: "docs.example.dev",
    url: "https://example.dev/streaming", type: "docs", excerpt: "Flush tokens as produced…", verified: true },
];

<SourceCitationRail sources={sources} activeSourceId={activeId} onActiveSourceChange={setActiveId} layout="rail">
  <article>Stream tokens as they are produced <CitationMarker source="s1" />.</article>
</SourceCitationRail>`,
    api: [
      { prop: "sources", type: "CitationSource[]", def: "—", desc: "Sources in rail order { id, index, title, domain?, url?, type?, excerpt?, author?, publishedAt?, retrievedAt?, relevance?, verified? }. `verified` is displayed as an app-provided state, never inferred (required)." },
      { prop: "children", type: "ReactNode", def: "—", desc: "The answer/article body; place <CitationMarker source=\"id\" /> inline." },
      { prop: "activeSourceId / onActiveSourceChange", type: "string | null / cb", def: "null", desc: "Controlled active source, synced with markers and rail." },
      { prop: "onOpenSource", type: "(source) => void", def: "—", desc: "Fired when a source's external link is opened." },
      { prop: "layout", type: `"rail" | "list" | "cards"`, def: `"rail"`, desc: "Side rail, compact list, or expandable cards." },
      { prop: "showExcerpts / mobileBehavior / formatDate / renderSource", type: "misc", def: "—", desc: "Excerpt disclosure, mobile stacked/bottom, date + row renderers." },
    ],
    accessibility: [
      "Inline markers are real buttons with aria-pressed; active state is never color-only (accent bar + weight + \"Active\" label + aria-current).",
      "The rail is a <nav> with Up/Down/Home/End roving selection; a source URL is a semantic <a target=_blank rel=noopener> with a clear new-tab name.",
      "Excerpts are disclosures (aria-expanded); copy-link announces via a polite live region.",
      "Reduced motion renders the final state and scrolls instantly; the component never asserts verification.",
    ],
    performance: [
      "Motion drives only opacity/transform/width + a shared layout indicator; no looping animation.",
      "Presentation-only — no model/network/timers; excerpt panels mount lazily via AnimatePresence.",
      "Mobile layout is CSS-breakpoint driven (no matchMedia during render) — no hydration mismatch.",
    ],
  },
  "api-request-inspector": {
    usage: `import { ApiRequestInspector, type ApiRequest } from "@/components/motionkit/api-request-inspector";

// Presentation only: your app owns the data + state. It never sends the request.
const request: ApiRequest = {
  method: "POST", url: "https://api.acme.dev/v1/deployments", environment: "production",
  requestId: "req_9fa2c1e7b0", headers: { "Content-Type": "application/json", Authorization: "Bearer ••••••" },
  body: { project: "web", ref: "main" },
};

<ApiRequestInspector request={request} response={response} state={state} redact={["x-internal-id"]} onRetry={resend} onCancel={abort} />`,
    api: [
      { prop: "request", type: "ApiRequest", def: "—", desc: "{ method, url, headers?, query?, body?, requestId?, environment?, timestamp? }. The app owns it (required)." },
      { prop: "response", type: "ApiResponse", def: "—", desc: "{ status?, durationMs?, headers?, body?, error?, retryCount?, phases? }. Timing phases draw a proportional breakdown." },
      { prop: "state", type: "InspectorState", def: "—", desc: "idle | loading | success | client_error | server_error | timeout | cancelled | retrying (required)." },
      { prop: "redact", type: "boolean | string[] | (ctx) => boolean", def: "built-in list", desc: "Default masks well-known credential keys; array adds keys; predicate = full control; false disables. Redacted values never reach the DOM, search, or copies." },
      { prop: "onRetry / onCancel / onCopy", type: "callbacks", def: "—", desc: "Retry, cancel, and copy notifications. The component never sends a request." },
      { prop: "view / wrap / defaultSection / renderBody", type: "misc", def: "—", desc: "Formatted vs raw, wrapped vs scrolling, initial open section, custom body renderer (receives redacted value)." },
    ],
    accessibility: [
      "Status, method, and redaction are icon + text label — never color alone; survives forced-colors.",
      "Each section is a disclosure button (aria-expanded) controlling a labelled region; payload text stays selectable and long lines scroll horizontally.",
      "Search never exposes redacted values; a polite role=status region announces copy success and state changes only.",
      "Reduced motion renders final state with no perpetual spinner; controls are focus-visible.",
    ],
    performance: [
      "Motion animates only opacity/transform/width/height; the in-flight pulse stops the moment a terminal state arrives.",
      "Body serialization + redaction are memoised; section panels mount lazily via AnimatePresence.",
      "Presentation-only — no model/socket/timers/network.",
    ],
  },
  "approval-workflow": {
    usage: `import { ApprovalWorkflow, type ApprovalWorkflowData } from "@/components/motionkit/approval-workflow";

// Presentation + control only: your app owns the data AND authorization.
<ApprovalWorkflow
  workflow={workflow}          // { title, requester, status, stages, currentStageId?, history?, ... }
  currentUserId={me.id}
  compactCompleted
  confirmReject
  canAct={(action, { stage }) => stage?.reviewers.some((r) => r.id === me.id) || { allowed: false, reason: "Not a reviewer." }}
  onApprove={({ stage, comment }) => api.approve(stage.id, comment)}
  onReject={({ stage, comment }) => api.reject(stage.id, comment)}
  onRequestChanges={({ stage, comment }) => api.requestChanges(stage.id, comment)}
/>`,
    api: [
      { prop: "workflow", type: "ApprovalWorkflowData", def: "—", desc: "{ id, title, requester, status, stages, currentStageId?, risk?, priority?, deadline?, attachments?, history? }. Statuses: draft|pending|in_review|approved|rejected|changes_requested|cancelled|expired (required)." },
      { prop: "stages[]", type: "WorkflowStage[]", def: "—", desc: "{ id, name, status, reviewers[], mode?, requiredApprovals? }. mode: 'all' (sequential) | 'any' (parallel) | 'quorum' (min N)." },
      { prop: "currentUserId", type: "string", def: "—", desc: "The viewer — surfaces the current-user action state." },
      { prop: "canAct", type: "(action, ctx) => boolean | { allowed; reason? }", def: "allow", desc: "App authorization gate. The component never decides permissions; false disables the action and shows the reason." },
      { prop: "onApprove / onReject / onRequestChanges / onComment / onCancel / onResubmit", type: "callbacks", def: "—", desc: "Fired by the current-stage actions; your app updates the workflow prop in response." },
      { prop: "compactCompleted / confirmReject / now", type: "misc", def: "—", desc: "Collapse resolved stages; require a confirm before reject; stable epoch for relative timestamps." },
    ],
    accessibility: [
      "Every status (workflow, stage, reviewer decision) is icon + text label + border — never color alone.",
      "Actions are real buttons in a labelled group; app-denied actions are disabled with the host's reason via title + aria-describedby + visible text.",
      "Destructive reject opens a role=alertdialog confirm; comment composer + decision history are disclosures with a labelled textarea.",
      "Focus moves to a polite role=status region after each action; reduced motion renders the final state.",
    ],
    performance: [
      "Motion drives only opacity/transform/width (progress, disclosures, list insert/exit); nothing animates per frame.",
      "Presentation-only — no timers/network/model; the host owns state.",
      "Collapsed stages and closed panels mount lazily; history rows keyed for continuity.",
    ],
  },
  "filter-result-transition": {
    usage: `import { FilterResultTransition, type ActiveFilter } from "@/components/motionkit/filter-result-transition";

// You own filtering; the component animates the resulting delta.
const items = assets.filter(matchesQueryAndFacets);

<FilterResultTransition
  items={items}
  getItemId={(a) => a.id}
  layout="grid"
  activeFilters={activeFilters}
  onRemoveFilter={removeFilter}
  focusedItemId={focusedId}
  onFocusFallback={() => searchRef.current?.focus()}
  renderItem={(a) => <AssetCard asset={a} />}
/>`,
    api: [
      { prop: "items / getItemId", type: "T[] / (item) => string", def: "—", desc: "Already-filtered items + stable identity — the key to continuity, focus preservation, and not replaying survivors (required)." },
      { prop: "renderItem", type: "(item, ctx) => ReactNode", def: "—", desc: "Renders one card; ctx = { index, layout, focused }. Keep controls inside the card, not nested (required)." },
      { prop: "layout", type: `"cards" | "list" | "grid"`, def: `"cards"`, desc: "Arrangement; grid reflows responsively with layout animation." },
      { prop: "focusedItemId / onFocusFallback", type: "string | null / cb", def: "—", desc: "If the focused item disappears after a filter, the fallback fires so focus never drops to the page root." },
      { prop: "activeFilters / onRemoveFilter / onClearFilters", type: "ActiveFilter[] / callbacks", def: "—", desc: "Removable filter chips with keyboard-accessible removal + clear-all." },
      { prop: "state / loading / error / empty / resultLabel / staggerLimit", type: "misc", def: "— / 8", desc: "Lifecycle + labels, count-line override, and entrance-stagger cap." },
    ],
    accessibility: [
      "Results render in a semantic list labelled by the morphing result count; the count is announced politely and rate-limited.",
      "Active filters are chips with real remove buttons + a clear-all — fully keyboard operable.",
      "Focus contract: when focusedItemId is filtered out, onFocusFallback fires (or a results anchor is focused) so focus is never lost to the page root.",
      "Loading uses aria-busy + label; error uses role=alert; empty gives actionable guidance; reduced motion updates instantly.",
    ],
    performance: [
      "Results appear synchronously — animation never gates the data; only entering cards animate, survivors keep their DOM node.",
      "Entrance stagger is capped (staggerLimit); transforms are opacity/scale/layout only (compositor).",
      "For very large collections keep passed items bounded (page/virtualize upstream) — this is a transition layer for the visible set.",
    ],
  },
  "swipe-action-row": {
    usage: `import { SwipeActionRow, SwipeActionGroup, type SwipeAction } from "@/components/motionkit/swipe-action-row";

const right: SwipeAction[] = [
  { id: "snooze", label: "Snooze", tone: "info" },
  { id: "delete", label: "Delete", tone: "error", destructive: true }, // confirm-gated
];

<SwipeActionGroup>
  {mail.map((m) => (
    <SwipeActionRow key={m.id} label={m.subject} rightActions={right} onAction={(id) => run(id, m.id)}>
      <MailRow item={m} />
    </SwipeActionRow>
  ))}
</SwipeActionGroup>`,
    api: [
      { prop: "children", type: "ReactNode", def: "—", desc: "The row's main content (title, meta, thumbnail)." },
      { prop: "leftActions / rightActions", type: "SwipeAction[]", def: "[]", desc: "Actions per edge { id, label, icon?, tone?, destructive?, confirm? }. tone maps to a semantic --color-* token." },
      { prop: "onAction", type: "(actionId, side) => void", def: "—", desc: "Fired when an action commits; for destructive/confirm actions only after the inline Confirm step." },
      { prop: "threshold / fullSwipe / confirmAction", type: "number / boolean / boolean", def: "48 / false / false", desc: "Snap-open distance; opt-in full-swipe-to-fire (off by default); force confirm on every action." },
      { prop: "open / defaultOpen / onOpenChange", type: `"left" | "right" | null`, def: "null", desc: "Controlled/uncontrolled open side with change callback." },
      { prop: "renderActionMenu / disabled / reducedMotion / label", type: "misc", def: "—", desc: "Custom overflow menu, disable gestures, force reduced motion, accessible row label." },
      { prop: "<SwipeActionGroup>", type: "component", def: "—", desc: "Wrap rows so opening one snaps any other open row shut (only-one-open)." },
    ],
    accessibility: [
      "Never touch-only: every action is a real button reachable by Tab (focus reveals its side) and via an aria-haspopup overflow menu — actions work with no swiping.",
      "Destructive actions are guarded by a two-step inline confirm (role=alertdialog); they carry label + icon + --color-error, never color alone.",
      "A polite role=status region announces completed and cancelled actions; confirm moves focus to Confirm, cancel restores focus.",
      "Targets are ≥44px; the menu closes on Escape/outside-click; reduced motion drops drag physics while every action stays operable.",
    ],
    performance: [
      "Motion animates only transform (x) via a single useMotionValue; threshold/full-swipe feedback uses useTransform (no React re-render during a drag).",
      "Springs are interruption-safe and torn down on unmount; the overflow menu + confirm bar mount lazily via AnimatePresence.",
      "Presentation-only — no timers/network/per-frame loops; the host owns list state, removal, and undo.",
    ],
  },
  "tool-call-activity": {
    usage: `import { ToolCallActivity, type ToolCall } from "@/components/motionkit/tool-call-activity";

// Presentation-only: your app owns the calls + statuses. It never runs a tool.
<ToolCallActivity
  calls={calls}          // { id, name, status, input?, output?, error?, progress? }[]
  onApprove={(id) => approve(id)}
  onReject={(id) => reject(id)}
  onRetry={(id) => retry(id)}
  compactCompleted
/>`,
    api: [
      { prop: "calls", type: "ToolCall[]", def: "—", desc: "Tool calls in display order: { id, name, category?, status, startedAt?, durationMs?, input?, output?, error?, progress?, details? }. Statuses: queued|running|completed|failed|cancelled|waiting_approval|approved|rejected (required)." },
      { prop: "activeCallId", type: "string", def: "first running", desc: "Call emphasized as current (accent bar + ring)." },
      { prop: "onApprove / onReject", type: "(id) => void", def: "—", desc: "Fired by inline controls on a waiting_approval call." },
      { prop: "onRetry", type: "(id) => void", def: "—", desc: "Fired by Retry on a failed call." },
      { prop: "onToggle / onCopyDetails", type: "callbacks", def: "—", desc: "Expand/collapse and copy-details callbacks." },
      { prop: "compactCompleted", type: "boolean", def: "true", desc: "Compress resolved calls to a slim line." },
      { prop: "showDurations / renderInput / renderOutput", type: "misc", def: "—", desc: "Show durations; custom expanded-panel renderers." },
    ],
    accessibility: [
      "Every status is icon + text label + border — never color alone — so it survives forced-colors.",
      "Each call header is a real disclosure button with aria-expanded; details are a labelled region via aria-controls, mounted only while open.",
      "Approve/Reject/Retry/Copy are real buttons with descriptive names; a polite role=status region announces lifecycle transitions only.",
      "After approve or retry, focus moves to that call's header; under reduced motion everything renders in final state with no perpetual spinner.",
    ],
    performance: [
      "Motion drives only opacity/transform/width; the running indicator stops once a call resolves.",
      "Expanded details mount lazily via AnimatePresence; presentation-only — no model, timers, or network.",
      "Pair with useVisibilityPause in the host to pause progress updates offscreen/when the tab is hidden.",
    ],
  },
  "live-log-stream": {
    usage: `import { LiveLogStream, type LogEntry } from "@/components/motionkit/live-log-stream";

// Your app owns the buffer; append as lines arrive.
const [entries, setEntries] = React.useState<LogEntry[]>([]);

<LiveLogStream
  entries={entries}        // { id, level, message, timestamp?, source? }[]
  status="streaming"       // "streaming" | "idle" | "completed" | "error"
  maxEntries={500}
  onClear={() => setEntries([])}
/>`,
    api: [
      { prop: "entries", type: "LogEntry[]", def: "—", desc: "Lines { id, level, message, timestamp?, source? }; level debug|info|success|warning|error. The app owns this (required)." },
      { prop: "status", type: `"streaming" | "idle" | "completed" | "error"`, def: `"streaming"`, desc: "Lifecycle; streaming shows a live pulse; error shows a banner." },
      { prop: "follow / paused / query", type: "controlled state", def: "auto", desc: "Auto-follow, freeze-with-count, and search — controlled when provided, else internal." },
      { prop: "levels / maxEntries", type: "LogLevel[] / number", def: "all / 500", desc: "Selectable levels and bounded retained history." },
      { prop: "formatTimestamp / renderEntry", type: "callbacks", def: "—", desc: "Override timestamp or full line markup." },
      { prop: "onClear / onRetry", type: "() => void", def: "—", desc: "Clear (app empties entries) and Retry (error state)." },
    ],
    accessibility: [
      "Level is icon + text label + monospace prefix — never color alone; survives forced-colors.",
      "Keyboard-focusable role=log region; user scrolling is never disabled; search/filter/pause/copy/clear/jump are focus-visible controls.",
      "Log text stays selectable; the live region announces only lifecycle changes, never line-by-line.",
      "Reduced motion makes new lines appear instantly and disables the live pulse.",
    ],
    performance: [
      "No React state per frame — follow scrolls via requestAnimationFrame (shared useAutoFollow); only the new-lines counter is state.",
      "History bounded by maxEntries; rows memoised; entrance motion pauses offscreen (useVisibilityPause).",
      "Virtualization integration point: rows render 1:1 with the visible set, so very large/high-frequency streams should wrap the list body in a windowing layer (e.g. a virtualizer) with useAutoFollow's onScroll on the same container; no virtualization dependency ships by default — lower maxEntries until then.",
    ],
  },
  "activity-stream": {
    usage: `import { ActivityStream, type ActivityEvent } from "@/components/motionkit/activity-stream";

// Your app owns the events (from any realtime or history source).
const events: ActivityEvent[] = [
  { id: "1", type: "mentioned", actor: { id: "riley", name: "Riley Okafor" }, target: "the Q3 review", timestamp: Date.now() - 120000 },
  { id: "2", type: "approved", actor: { id: "morgan", name: "Morgan Vale" }, target: "the launch checklist", timestamp: Date.now() - 540000 },
];

<ActivityStream events={events} collapseThreshold={3} unreadAfter={lastSeenAt} />`,
    api: [
      { prop: "events", type: "ActivityEvent[]", def: "—", desc: "Controlled events { id, type, actor, target?, action?, timestamp, metadata?, preview?, link? } (required)." },
      { prop: "collapseThreshold", type: "number", def: "3", desc: "Consecutive same-key events collapse into an expandable group; 0/1 disables." },
      { prop: "groupBy", type: "(event) => string", def: "actor+type+target", desc: "Override the grouping bucket key." },
      { prop: "unreadAfter", type: "Date | number | string", def: "—", desc: "Events strictly newer are unread and draw a labelled divider + jump control." },
      { prop: "filters / defaultFilters / onFiltersChange", type: "ActivityFilters", def: "—", desc: "Controlled/initial type+actor filters; the chip bar drives changes." },
      { prop: "onEventAction / renderMetadata / formatTimestamp", type: "callbacks", def: "—", desc: "Inline action, custom metadata, timestamp override (defaults to relative)." },
    ],
    accessibility: [
      "Semantic list; each row reads as meaningful text with an avatar carrying an accessible name.",
      "Event type and unread state use icon + tone + text label, never color alone; survives forced-colors.",
      "Groups collapse behind a button with aria-expanded/aria-controls, operable via click, Enter, and Space.",
      "Reduced motion makes live-arrival and group expansion instant; layout stays stable.",
    ],
    performance: [
      "Presentation only — re-renders only when events or filters change.",
      "AnimatePresence drives arrivals and group open/close (transform/opacity + gated height).",
      "Chevron/idle motion pauses offscreen (useVisibilityPause); rows/groups derived via memoized passes.",
    ],
  },
  "streaming-data-rows": {
    usage: `import { StreamingDataRows, StatusPill, type Column } from "@/components/motionkit/streaming-data-rows";

const columns: Column<Order>[] = [
  { key: "ref", header: "Order", sortable: true, value: (r) => r.ref },
  { key: "amount", header: "Amount", align: "end", sortable: true, numeric: true, value: (r) => r.amount },
  { key: "status", header: "Status", sortable: true, value: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
];

<StreamingDataRows rows={orders} columns={columns} getRowId={(r) => r.id} sort={sort} onSortChange={setSort} caption="Live order queue." />`,
    api: [
      { prop: "rows / columns", type: "T[] / Column<T>[]", def: "—", desc: "Controlled rows + column defs (header, render?, value, sortable?, numeric?, format?, align?) (required)." },
      { prop: "getRowId", type: "(row) => string", def: "—", desc: "Stable identity — the key to focus preservation and continuity on update/resort (required)." },
      { prop: "sort / onSortChange", type: "SortState | null", def: "—", desc: "Controlled sort (none → asc → desc); omit for uncontrolled." },
      { prop: "paused / highlightDuration", type: "boolean / ms", def: "false / 1400", desc: "Freeze change emphasis + morphs; emphasis duration." },
      { prop: "rowActions / onRowAction", type: "callbacks", def: "—", desc: "Keyboard-accessible per-row action buttons." },
      { prop: "state / onRetry / renderMobileRow", type: "misc", def: `"idle"`, desc: "Lifecycle (idle/loading/error), retry, and stacked mobile layout." },
    ],
    accessibility: [
      "Real semantic table with caption, th[scope=col], and thead/tbody; sortable headers are buttons that set aria-sort.",
      "Change is signalled by a ▲/▼ glyph and status label/shape — never color alone.",
      "Stable row keys keep focus on update/resort; a rate-limited polite live region summarizes activity.",
      "Reduced motion makes every emphasis an instant swap; loading uses aria-busy, error uses role=alert.",
    ],
    performance: [
      "For live SUBSETS, not bulk data — it renders every row and has no virtualization; keep the visible window bounded (latest 50–200 rows).",
      "For large/scrollable datasets, pair with a windowing layer (TanStack Virtual / react-window) or server paging and feed only the on-screen slice.",
      "Layout/opacity-only transforms keep reorders on the compositor; numeric morphs snap under reduced motion; the announcer coalesces bursts (~1.6s throttle).",
    ],
  },
  "luminous-topography": {
    usage: `import { LuminousTopography } from "@/components/motionkit/luminous-topography";

<LuminousTopography
  focalPoint={[{ x: 0.74, y: 0.32 }, { x: 0.9, y: 0.72 }]}
  safeArea={{ x: 0.05, y: 0.14, w: 0.5, h: 0.72 }}
  seed={7}
  className="min-h-[440px]"
>
  <YourHeroContent />
</LuminousTopography>`,
    api: [
      { prop: "density", type: "number", def: "1", desc: "Contour density multiplier (~0.4–1.6)." },
      { prop: "depth", type: "number", def: "3", desc: "Parallax depth layers (1–4); each drifts at its own speed." },
      { prop: "drift / intensity", type: "number", def: "1 / 1", desc: "Drift speed (0 disables) and overall luminance (0–1.4)." },
      { prop: "focalPoint", type: "{x,y} | {x,y}[]", def: "{x:0.72,y:0.34}", desc: "Region(s) the contours flow around (0–1 coords)." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where density thins so foreground text stays readable." },
      { prop: "accent / lineWidth / seed", type: "misc", def: "accent / 1.4 / 1", desc: "Light + brightest-contour color, stroke width, deterministic seed (SSR-stable)." },
      { prop: "pauseWhenHidden / interactive / reducedMotion", type: "boolean", def: "true / false / —", desc: "Offscreen pause, optional pointer highlight, force-static." },
    ],
    accessibility: [
      "The animated field is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area.",
      "prefers-reduced-motion stops all drift and the light sweep; markup does not vary by preference, so there is no hydration mismatch.",
      "forced-colors: active falls back to plain CanvasText contours so structure and overlaid text stay legible.",
      "The pointer highlight is additive only and disabled under reduced motion; the component never depends on hover.",
    ],
    performance: [
      "SVG paths + gradients only; drift + light animate transform via CSS keyframes — no canvas, no WebGL, no JS animation loop, no per-frame React state.",
      "Geometry is memoised and deterministically seeded, identical on server and client.",
      "Pauses drift + light offscreen and when the tab is hidden (useVisibilityPause); mobile drops the deepest layer for reduced density.",
    ],
  },
  "ai-response-stream": {
    usage: `import { AiResponseStream } from "@/components/motionkit/ai-response-stream";

// Your app owns the stream; this component only renders it.
<AiResponseStream
  segments={segments}   // text | code | citation, streamed in by your app
  state={state}         // "streaming" | "stopped" | "complete" | "error"
  sources={sources}
  onStop={() => controller.abort()}
  onRetry={() => refetch()}
/>`,
    api: [
      { prop: "segments", type: "ResponseSegment[]", def: "—", desc: "Ordered content: text | code | citation. The app streams these in (required)." },
      { prop: "state", type: `"streaming" | "stopped" | "complete" | "error"`, def: "—", desc: "Lifecycle state, owned by the application (required)." },
      { prop: "sources", type: "StreamSource[]", def: "—", desc: "Sources referenced by inline [n] citations; rendered as a numbered rail." },
      { prop: "assistantName", type: "string", def: `"Assistant"`, desc: "Name in the header and announcements." },
      { prop: "caret", type: "boolean", def: "true", desc: "Blinking caret while streaming; ignored under reduced motion." },
      { prop: "onStop / onRetry / onCopy", type: "() => void", def: "—", desc: "Stop (while streaming), Retry (error/stopped), Copy (plain text)." },
    ],
    accessibility: [
      "Rendered text is real and readable (not aria-hidden), so a completed response is read in one pass; a polite role=status region announces lifecycle changes only, never token-by-token.",
      "State uses icon + label + border, not color alone — survives forced-colors.",
      "Stop, Retry, Copy, code-copy, and citations are real buttons/links with accessible names and focus-visible rings.",
      "Under prefers-reduced-motion there is no per-token motion and no caret; content appears immediately.",
    ],
    performance: [
      "Word reveal animates transform + opacity only; existing text never re-animates as new words arrive.",
      "Presentation only — no model, no network; the app owns the stream.",
      "Client component; demo stream pauses offscreen and when the tab is hidden (useVisibilityPause).",
    ],
  },
  "deployment-pipeline": {
    usage: `import { DeploymentPipeline, type Stage } from "@/components/motionkit/deployment-pipeline";

const stages: Stage[] = [
  { id: "install", name: "Install", status: "passed", durationMs: 8400, logs: ["$ pnpm install", "Done in 8.4s"] },
  { id: "build", name: "Build", status: "passed", durationMs: 22600, logs: ["$ next build", "Compiled successfully"] },
  { id: "test", name: "Test", status: "failed", durationMs: 14200, logs: ["$ vitest run", "1 failed | 78 passed"] },
  { id: "deploy", name: "Deploy", status: "cancelled" },
];

<DeploymentPipeline stages={stages} defaultExpandedId="test" onRetry={(id) => rerun(id)} />`,
    api: [
      { prop: "stages", type: "Stage[]", def: "—", desc: "Ordered stages { id, name, status, durationMs?, logs? }. Status: queued|running|passed|failed|cancelled|skipped. The app owns this data (required)." },
      { prop: "onRetry", type: "(stageId: string) => void", def: "—", desc: "Called when Retry on a failed/cancelled stage is activated." },
      { prop: "defaultExpandedId", type: "string", def: "—", desc: "Id of a stage whose logs start expanded." },
      { prop: "label", type: "string", def: `"Deployment pipeline"`, desc: "Accessible name for the pipeline list." },
    ],
    accessibility: [
      "Ordered list; each stage status is a real text label (Passed, Failed, …) paired with an icon — never color alone.",
      "Log toggles are real buttons with aria-expanded / aria-controls; logs are collapsed by default.",
      "Retry is a real button with an accessible name and focus ring; the component is fully keyboard operable.",
      "Reduced motion disables the running pulse and connector travel — state is shown statically.",
    ],
    performance: [
      "Animates transform/opacity only (pulse, connector, chevron); running motion pauses offscreen / when hidden.",
      "AnimatePresence drives log open/close; only expanded stages render their log block.",
      "No timers or network — purely presentational; re-renders only when stages change.",
    ],
  },
  "live-presence-stack": {
    usage: `import { LivePresenceStack, type PresenceUser } from "@/components/motionkit/live-presence-stack";

const users: PresenceUser[] = [
  { id: "1", name: "Ada L.", status: "editing" },
  { id: "2", name: "Kit M.", status: "active" },
  { id: "3", name: "Ravi P.", status: "viewing" },
  { id: "4", name: "Noor S.", status: "idle" },
];

<LivePresenceStack users={users} max={5} onSelect={(id) => focusUser(id)} />`,
    api: [
      { prop: "users", type: "PresenceUser[]", def: "—", desc: "Controlled presence: { id, name, status, color? }. Status: active | idle | editing | viewing (required)." },
      { prop: "max", type: "number", def: "5", desc: "Visible avatars before collapsing into a +N overflow." },
      { prop: "onSelect", type: "(userId: string) => void", def: "—", desc: "Called when a participant is chosen from the detail list." },
      { prop: "label", type: "string", def: `"N people here"`, desc: "Accessible group label." },
    ],
    accessibility: [
      "The stack has a group label; each avatar has an accessible name combining name + status; status is a dot + text label, never color alone.",
      "The detail view is a real button (aria-expanded, aria-haspopup) opening a keyboard-navigable list; Escape closes it and returns focus to the trigger.",
      "Avatars carry a visible ring so they stay legible under forced-colors.",
      "Reduced motion drops join/leave scale/slide and the idle pulse; layout stays stable so nothing jumps.",
    ],
    performance: [
      "AnimatePresence handles join/leave; the row reserves space so adding/removing users doesn't reflow surrounding content.",
      "The idle pulse pauses offscreen and when the tab is hidden (useVisibilityPause).",
      "Client component; animates transform/opacity only.",
    ],
  },
  "kpi-number-morph": {
    usage: `import { KpiNumberMorph } from "@/components/motionkit/kpi-number-morph";

<KpiNumberMorph
  label="Revenue"
  value={48250}
  currency="USD"
  notation="compact"
  change={12.4}
  changeAsPercent
  changeLabel="7d"
/>`,
    api: [
      { prop: "value", type: "number", def: "—", desc: "Current value (controlled); morphs from the previous value." },
      { prop: "label", type: "string", def: "—", desc: "Metric name above the number." },
      { prop: "prefix / suffix", type: "string", def: "—", desc: "Text around the number (e.g. $, %)." },
      { prop: "decimals", type: "number", def: "0", desc: "Fixed decimals (standard notation)." },
      { prop: "notation", type: `"standard" | "compact"`, def: `"standard"`, desc: "Compact renders 12.4K / 3.1M." },
      { prop: "currency / locale", type: "string", def: "—", desc: "ISO currency and Intl locale for formatting." },
      { prop: "change", type: "number", def: "—", desc: "Signed change; drives the direction-aware trend row." },
      { prop: "state", type: `"idle" | "loading" | "error"`, def: `"idle"`, desc: "Loading shows a skeleton (aria-busy); error shows a status." },
    ],
    accessibility: [
      "Trend direction is carried by an arrow glyph AND a sign in the text — never color alone; survives forced-colors.",
      "The tile exposes a combined aria-label (label + value + change) and does not spam a live region.",
      "Loading uses aria-busy and hides the number until data resolves.",
    ],
    performance: [
      "The count is an eased requestAnimationFrame transition (useAnimatedNumber) — no animation library, zero runtime deps.",
      "Reduced motion snaps to the value; interrupts resume from the current display; rAF is cancelled on unmount.",
      "tabular-nums keeps width stable while counting.",
    ],
  },
  "kinetic-emphasis": {
    usage: `import { KineticEmphasis } from "@/components/motionkit/kinetic-emphasis";

export function Hero() {
  return (
    <KineticEmphasis as="h1" speed="normal">
      Motion that <em>understands emphasis</em>, not just easing.
    </KineticEmphasis>
  );
}`,
    api: [
      { prop: "children", type: "ReactNode", def: "—", desc: "The sentence; mark phrases with real <em>/<strong> (required). No index/strings props — emphasis is semantic markup." },
      { prop: "as", type: `"h1"–"h4" | "p" | "span"`, def: `"p"`, desc: "Semantic wrapper element." },
      { prop: "play", type: `"in-view" | "mount" | "controlled"`, def: `"in-view"`, desc: "When the sweep plays; controlled plays on each rising edge of active." },
      { prop: "active", type: "boolean", def: "—", desc: "Trigger for play=\"controlled\"." },
      { prop: "speed", type: `"slow" | "normal" | "fast"`, def: `"normal"`, desc: "Stagger/duration preset." },
      { prop: "trail", type: "number 0–1", def: "0.6", desc: "Intensity of the decaying activation trace." },
      { prop: "emphasisStyle", type: `"underline" | "none"`, def: `"underline"`, desc: "Persistent treatment for ignited phrases." },
      { prop: "reducedMotion", type: "boolean", def: "OS preference", desc: "Force reduced motion (renders the final state instantly)." },
      { prop: "onComplete", type: "() => void", def: "—", desc: "Fires when a sweep finishes." },
    ],
    accessibility: [
      "Screen readers get the original children exactly once — with native <em>/<strong> semantics; the animated layer is aria-hidden and excluded from selection.",
      "Server markup, no-JS, and reduced motion all render the FINAL designed state — content is never hidden behind the animation.",
      "Forced colors: emphasis falls back to a real underline (decorative bars are hidden), so emphasis never relies on color alone.",
      "Not interactive: no focus stops, no keyboard traps; safe inside links/buttons.",
    ],
    performance: [
      "Animates transform, opacity, and color only — no layout properties, no blur, no filters.",
      "in-view playback via IntersectionObserver; zero work before entering the viewport and after completion.",
      "Interruption-safe: re-triggers cancel in-flight animations; all animations cancelled on unmount.",
      "Soft cap ~40 words (dev warning) to keep the sweep legible and cheap.",
    ],
  },
  "blur-text": {
    usage: `import { BlurText } from "@/components/motionkit/blur-text";

export function Hero() {
  return <BlurText text="Ship animated interfaces" as="h1" animateBy="words" delay={80} />;
}`,
    api: [
      { prop: "text", type: "string", def: "—", desc: "The string to reveal (required)." },
      { prop: "animateBy", type: `"words" | "chars"`, def: `"words"`, desc: "Segment granularity." },
      { prop: "direction", type: `"top" | "bottom"`, def: `"top"`, desc: "Side each segment drifts in from." },
      { prop: "delay", type: "number", def: "60", desc: "Milliseconds of stagger between segments." },
      { prop: "once", type: "boolean", def: "true", desc: "Animate only the first time in view." },
      { prop: "as", type: "ElementType", def: `"span"`, desc: "Semantic wrapper element." },
    ],
    accessibility: [
      "Full string exposed once via aria-label; animated segments are aria-hidden.",
      "Under prefers-reduced-motion the text renders in final state, no animation.",
    ],
    performance: [
      "Animates transform + opacity + filter (compositor-friendly).",
      "Client component; uses whileInView so offscreen instances don't animate.",
    ],
  },
  "rotating-text": {
    usage: `import { RotatingText } from "@/components/motionkit/rotating-text";

<RotatingText words={["faster", "accessible", "in motion"]} interval={2200} />`,
    api: [
      { prop: "words", type: "string[]", def: "—", desc: "Phrases to cycle (required)." },
      { prop: "interval", type: "number", def: "2200", desc: "ms between changes (min 1200)." },
      { prop: "transition", type: `"slide" | "fade"`, def: `"slide"`, desc: "Enter/exit style." },
    ],
    accessibility: [
      "aria-live=\"polite\" announces the current word only.",
      "Pauses on hover and focus; reduced motion swaps instantly.",
    ],
    performance: ["Single AnimatePresence node; stable inline-grid layout avoids reflow."],
  },
  "animated-button": {
    usage: `import { AnimatedButton } from "@/components/motionkit/animated-button";

<AnimatedButton variant="solid" loading={saving}>Save changes</AnimatedButton>`,
    api: [
      { prop: "variant", type: `"solid" | "outline" | "ghost"`, def: `"solid"`, desc: "Visual style." },
      { prop: "loading", type: "boolean", def: "false", desc: "Shows spinner + aria-busy." },
      { prop: "success", type: "boolean", def: "false", desc: "Shows a success check." },
      { prop: "…button", type: "ButtonHTMLAttributes", def: "—", desc: "All native button props; forwards ref." },
    ],
    accessibility: [
      "Real <button> with focus-visible ring and disabled semantics preserved.",
      "Loading announces politely (aria-busy + live label); reduced motion drops the press scale.",
    ],
    performance: ["whileTap scale only; no layout animation."],
  },
  "animated-dialog": {
    usage: `import {
  AnimatedDialog, AnimatedDialogTrigger, AnimatedDialogContent,
  AnimatedDialogHeader, AnimatedDialogBody, AnimatedDialogFooter,
  AnimatedDialogTitle, AnimatedDialogDescription, AnimatedDialogClose,
} from "@/components/motionkit/animated-dialog";

// mobileVariant="sheet" (default) → centered modal on desktop, bottom sheet on mobile.
<AnimatedDialog mobileVariant="sheet">
  <AnimatedDialogTrigger asChild><button>Edit profile</button></AnimatedDialogTrigger>
  <AnimatedDialogContent>
    <AnimatedDialogHeader>
      <AnimatedDialogTitle>Edit profile</AnimatedDialogTitle>
      <AnimatedDialogDescription>Header + footer stay pinned.</AnimatedDialogDescription>
    </AnimatedDialogHeader>
    <AnimatedDialogBody>{/* long form — the only scroll region */}</AnimatedDialogBody>
    <AnimatedDialogFooter>
      <AnimatedDialogClose asChild><button>Cancel</button></AnimatedDialogClose>
      <button type="submit">Save</button>
    </AnimatedDialogFooter>
  </AnimatedDialogContent>
</AnimatedDialog>`,
    api: [
      { prop: "mobileVariant", type: `"sheet" | "centered"`, def: `"sheet"`, desc: "≤640px: bottom sheet or stay centered." },
      { prop: "animation", type: `"scale" | "slide-up" | "fade"`, def: `"scale"`, desc: "Desktop content entrance." },
      { prop: "duration", type: "number", def: "0.22", desc: "Enter/exit duration in seconds." },
      { prop: "origin", type: `"center" | "top" | "bottom"`, def: `"center"`, desc: "Transform origin (desktop)." },
      { prop: "open / defaultOpen", type: "boolean", def: "—", desc: "Controlled / uncontrolled state." },
      { prop: "showClose", type: "boolean", def: "true", desc: "Built-in top-right close button." },
    ],
    accessibility: [
      "Radix owns portal, focus trap + restore, Esc, overlay click, and aria-modal — not re-implemented.",
      "Header/Body/Footer keep actions visible over long content (capped by max-h); only the body scrolls.",
      "Close control and dialog surface keep a boundary in forced-colors; focus uses an outline that survives high contrast.",
      "AnimatePresence drives exit off controlled open state; rapid open/close leaves no stale layer.",
    ],
    performance: [
      "Animates transform + opacity only (compositor-friendly).",
      "Client component; content mounts only when open; a single matchMedia listener drives the sheet switch.",
    ],
  },
  "animated-tabs": {
    usage: `import {
  AnimatedTabs, AnimatedTabsList, AnimatedTabsTrigger, AnimatedTabsContent,
} from "@/components/motionkit/animated-tabs";

<AnimatedTabs defaultValue="a">
  <AnimatedTabsList>
    <AnimatedTabsTrigger value="a">One</AnimatedTabsTrigger>
    <AnimatedTabsTrigger value="b">Two</AnimatedTabsTrigger>
  </AnimatedTabsList>
  <AnimatedTabsContent value="a">…</AnimatedTabsContent>
  <AnimatedTabsContent value="b">…</AnimatedTabsContent>
</AnimatedTabs>`,
    api: [
      { prop: "directionAware", type: "boolean", def: "false", desc: "Slide content by tab order." },
      { prop: "transition", type: `"spring" | "tween"`, def: `"spring"`, desc: "Indicator/content motion." },
      { prop: "defaultValue / value", type: "string", def: "—", desc: "Radix controlled/uncontrolled state." },
    ],
    accessibility: [
      "Arrow-key navigation, tab roles, and roving focus preserved from Radix.",
      "Reduced motion disables the layout indicator and slide; content still switches.",
    ],
    performance: ["Indicator uses a single shared layoutId; content keyed in AnimatePresence mode=\"wait\"."],
  },
  "animated-accordion": {
    usage: `import {
  AnimatedAccordion, AnimatedAccordionItem,
  AnimatedAccordionTrigger, AnimatedAccordionContent,
} from "@/components/motionkit/animated-accordion";

<AnimatedAccordion type="single" collapsible>
  <AnimatedAccordionItem value="a">
    <AnimatedAccordionTrigger>Question?</AnimatedAccordionTrigger>
    <AnimatedAccordionContent>Answer.</AnimatedAccordionContent>
  </AnimatedAccordionItem>
</AnimatedAccordion>`,
    api: [
      { prop: "type", type: `"single" | "multiple"`, def: "—", desc: "Radix mode (required on root)." },
      { prop: "collapsible", type: "boolean", def: "false", desc: "Allow closing the open item (single)." },
    ],
    accessibility: [
      "Trigger semantics, keyboard activation, and disabled state preserved from Radix.",
      "Reduced motion opens/closes instantly; content stays reachable.",
    ],
    performance: ["Animates height (auto) + opacity; chevron rotates via transform."],
  },
  "animated-list": {
    usage: `import { AnimatedList, AnimatedListItem } from "@/components/motionkit/animated-list";

<AnimatedList>
  {items.map((it) => (
    <AnimatedListItem key={it.id}>{it.label}</AnimatedListItem>
  ))}
</AnimatedList>`,
    api: [
      { prop: "stagger", type: "number", def: "60", desc: "ms between item entrances." },
      { prop: "children", type: "ReactNode", def: "—", desc: "Keyed <AnimatedListItem> children." },
    ],
    accessibility: [
      "Semantic <ul>/<li>; add/remove never steals keyboard focus.",
      "Requires stable keys; reduced motion appears instantly.",
    ],
    performance: ["layout + AnimatePresence; transform/opacity only."],
  },
  "spotlight-card": {
    usage: `import { SpotlightCard } from "@/components/motionkit/spotlight-card";

<SpotlightCard radius={320}>…</SpotlightCard>`,
    api: [
      { prop: "radius", type: "number", def: "320", desc: "Glow radius in px." },
      { prop: "color", type: "string", def: "accent @35%", desc: "Glow color (any CSS color)." },
    ],
    accessibility: [
      "Glow is decorative (aria-hidden); no essential info conveyed by motion.",
      "Pointer tracking is skipped where pointer capability is absent; content stays usable.",
    ],
    performance: [
      "Updates two CSS custom properties on pointer move — no React re-render, no layout.",
      "Glow is a compositor-only opacity fade.",
    ],
  },
  "animated-grid": {
    usage: `import { AnimatedGrid } from "@/components/motionkit/animated-grid";

<div className="relative">
  <AnimatedGrid />
  <YourContent />
</div>`,
    api: [
      { prop: "size", type: "number", def: "36", desc: "Base grid cell size in px." },
      { prop: "color", type: "string", def: "border token", desc: "Line color." },
      { prop: "accent", type: "string", def: "accent token", desc: "Ambient glow color." },
      { prop: "opacity", type: "number", def: "0.7", desc: "Grid line opacity." },
      { prop: "fade", type: "boolean", def: "true", desc: "Radial fade mask." },
    ],
    accessibility: [
      "Decorative (aria-hidden).",
      "prefers-reduced-motion stops all motion.",
      "forced-colors falls back to a static CanvasText grid (stays visible in high contrast).",
    ],
    performance: ["CSS-only: two gradient grid layers (background-position drift) + one radial glow (transform/opacity pulse). No JS loop, no canvas."],
  },
  "animated-icons": {
    usage: `import { AnimatedArrow, AnimatedCopy } from "@/components/motionkit/animated-icons";

<button>Next <AnimatedArrow triggerOn="hover" /></button>
<button onClick={copy}><AnimatedCopy copied={copied} /> Copy</button>`,
    api: [
      { prop: "size", type: "number", def: "18", desc: "Icon size in px." },
      { prop: "triggerOn", type: `"hover" | "tap" | "focus" | "mount" | "none"`, def: `"hover"`, desc: "Animation trigger." },
      { prop: "copied", type: "boolean", def: "—", desc: "(Copy) controlled copied→check state." },
    ],
    accessibility: [
      "Decorative: aria-hidden, focusable=\"false\", never independently tabbable.",
      "Label inherited from the containing button; reduced motion renders static.",
    ],
    performance: ["Tiny transform animations; no layout."],
  },
};
