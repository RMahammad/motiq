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
  /**
   * For components whose motion comes from DATA ARRIVING OVER TIME rather than
   * from anything the component does by itself. They are presentation-only:
   * hand one a finished array and every item mounts in the same frame, so it
   * animates once and looks static — while the preview above, fed by a timer,
   * looks alive. That is by design, but it is invisible from this page, so every
   * such component documents its driver here, in the same shape.
   */
  driving?: string;
  api: ApiRow[];
  accessibility: string[];
  performance: string[];
}

export const docsContent: Record<string, DocContent> = {
  "processing-timeline": {
    usage: `import { ProcessingTimeline, type ProcessingStage } from "@/components/motiq/processing-timeline";

// The app owns the pipeline; the component renders one item's stages.
<ProcessingTimeline
  title="clip-2043.mov"
  stages={stages}
  currentStageId={current}
  onRetryStage={(s) => retry(s.id)}
  onCancel={cancel}
  layout="vertical"
/>`,
    api: [
      { prop: "stages", type: "ProcessingStage[]", def: "-", desc: "{ id, label, description?, status, progress?, startTime?, endTime?, duration?, attempt?, error?, warning?, output?, logs?, metadata?, skippable? }. App-owned." },
      { prop: "currentStageId / jobStatus / layout / compact", type: "misc", def: "vertical", desc: "Current-stage focus, overall job status, vertical/horizontal layout, and a compact mode." },
      { prop: "onRetryStage / onSkipStage / onCancel / onRestart", type: "cb", def: "-", desc: "Stage + workflow intents (skip only where allowed). Progress is never faked - only app-supplied progress renders." },
      { prop: "activeStageId / onActiveStageChange / renderStageOutput / formatTimestamp", type: "misc", def: "-", desc: "Controlled expansion, custom output rendering, and timestamp formatting." },
    ],
    accessibility: [
      "Ordered-stage semantics with the current stage marked (aria-current); progress uses progressbar semantics.",
      "Status is icon + text (never colour alone); errors + warnings are associated with their stage.",
      "Stage expansion is keyboard-operable; retry/cancel are real buttons.",
      "Reduced motion; mobile stacked layout.",
    ],
    performance: [
      "Only the active stage pulses; completed stages do not animate; overall progress counts resolved stages.",
      "Presentation-only - the host owns the pipeline; no timers/network.",
      "Output/logs mount lazily on expansion.",
    ],
  },
  "checkout-progress": {
    usage: `import { CheckoutProgress, type CheckoutStep } from "@/components/motiq/checkout-progress";

// You own step content + validation; this orchestrates progress.
<CheckoutProgress
  steps={steps}
  currentStepId={current}
  state={checkoutState}
  onNext={next}
  onPrevious={prev}
  onSaveStep={async (id) => save(id)}
  onSubmit={submit}
  orderSummary={<OrderSummary />}
/>`,
    api: [
      { prop: "steps", type: "CheckoutStep[]", def: "-", desc: "App-defined (Cart/Customer/Delivery/Billing/Payment/Review/Confirmation or custom). Step states incomplete·current·valid·invalid·saving·completed·blocked·skipped." },
      { prop: "state / mode", type: "CheckoutState / guest|account", def: "editing", desc: "Checkout-level state (editing·validating·submitting·processing·completed·failed·cancelled) and guest/account mode." },
      { prop: "onNext / onPrevious / onGoToStep / onSaveStep / onSubmit / onRetry", type: "cb", def: "-", desc: "Controlled navigation + async step save. Never collects or processes payment (the payment field is your renderStep)." },
      { prop: "orderSummary / renderStep", type: "ReactNode / cb", def: "-", desc: "Sticky order-summary slot and per-step content renderer." },
    ],
    accessibility: [
      "Ordered step semantics with current-step indication; a validation summary lists errors.",
      "Focus moves after a step change; keyboard navigation between steps; blocked reason is surfaced.",
      "Status is not colour-only; 200%-zoom + mobile keyboard-safe.",
      "Reduced motion keeps transitions minimal.",
    ],
    performance: [
      "No artificial delays or fake processing progress; async save reflects the app's real state (useAsyncStatus).",
      "Presentation-only - the host owns pricing, validation, and payment.",
      "Completed steps render statically.",
    ],
  },
  "session-security-center": {
    usage: `import { SessionSecurityCenter, type Session } from "@/components/motiq/session-security-center";

// The app owns revocation; this presents + confirms it.
<SessionSecurityCenter
  sessions={sessions}
  onRevoke={(s) => revoke(s.id)}
  onRevokeAllOthers={revokeOthers}
  onRefresh={refresh}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(SESSIONS, { intervalMs: 900, paused: !visible });

<SessionSecurityCenter sessions={SESSIONS.slice(0, index + 1)} />

// In production this comes from your sessions endpoint; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "sessions", type: "Session[]", def: "-", desc: "{ id, device, browser, os, location?, ipSummary?, createdTime, lastActiveTime, current?, trustLabel?, riskLabel?, authMethod?, organization?, metadata? }. IP/location/risk are app-supplied verbatim." },
      { prop: "onRevoke / onRevokeAllOthers / onRenameDevice / onMarkTrusted / onRemoveTrust / onRefresh", type: "cb", def: "-", desc: "Intents. Bulk revocation is confirmed and provably excludes the current session unless allowRevokeCurrent." },
      { prop: "allowRevokeCurrent / error / onRetry / refreshing", type: "misc", def: "false", desc: "Current-session protection, honest failed-revocation banner + retry, and a refreshing state." },
      { prop: "filter / sort / now / formatTimestamp", type: "misc", def: "-", desc: "Controlled filter/sort and deterministic relative timestamps." },
    ],
    accessibility: [
      "Semantic list; the current session is identified in text; revocation buttons are labelled.",
      "Confirmation dialogs are accessible; focus is preserved onto a neighbour after removal.",
      "Risk/trust is icon + text (never colour alone); no alarming pulsing for app-supplied risk.",
      "Reduced motion; mobile details view; timestamps are understandable.",
    ],
    performance: [
      "Presentation-only - the host owns session data + revocation; never labels a session compromised itself.",
      "Motion communicates insertion/removal/status only.",
      "Never exposes full IPs or precise location unless the app supplies them.",
    ],
  },
  "thread-expansion": {
    usage: `import { ThreadExpansion, type ThreadNode } from "@/components/motiq/thread-expansion";

// Navigate + expand a nested discussion (Comment Thread owns authoring).
<ThreadExpansion
  nodes={nodes}
  selectedId={selected}
  onSelect={setSelected}
  onLoadMore={(id) => loadReplies(id)}
  onNavigateUnread={jumpUnread}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(NODES, { intervalMs: 900, paused: !visible });

<ThreadExpansion nodes={NODES.slice(0, index + 1)} />

// In production this comes from your thread query; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "nodes", type: "ThreadNode[]", def: "-", desc: "{ id, parentId?, author, body?, timestamp, replyCount?, unreadCount?, unread?, resolved?, deleted?, collapsed?, metadata?, children? }. Flat parentId or nested." },
      { prop: "expandedIds / onExpandedChange / defaultExpandDepth / maxAutoDepth", type: "misc", def: "-", desc: "Controlled expansion; auto-expand/expand-all are depth-capped so deep threads never render unbounded." },
      { prop: "onLoadMore / loadingId / errorId / onRetryLoad", type: "cb / id", def: "-", desc: "Lazy reply loading with loading/error/retry rows." },
      { prop: "onNavigateParent / onNavigateUnread / collapseResolved", type: "cb / bool", def: "-", desc: "Go-to-parent, jump-to-next-unread (expands the path), and collapse-resolved branches." },
    ],
    accessibility: [
      "Rendered as an accessible tree (role=tree/treeitem, aria-level/expanded/selected) with roving tabindex.",
      "Expand/collapse are buttons; parent/child relationships and the selected path are conveyed in text.",
      "Focus is preserved across jumps and when a focus-containing branch collapses.",
      "Unread is text (\"N unread in branch\"), not colour alone; loading/error labelled; reduced motion.",
    ],
    performance: [
      "Indentation + auto-expand are capped; no large stagger for deep conversations.",
      "Replies load lazily via onLoadMore; the component never renders every nested reply indefinitely.",
      "Presentation-only - the host owns the conversation data.",
    ],
  },
  "project-timeline": {
    usage: `import { ProjectTimeline, type TimelineItem } from "@/components/motiq/project-timeline";

// App owns dates + persistence; pass \`today\` for the current-date marker.
<ProjectTimeline
  items={items}
  groups={groups}
  today={todayMs}
  scale="week"
  selectedItemId={selected}
  onSelectedItemChange={setSelected}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(ITEMS, { intervalMs: 900, paused: !visible });

<ProjectTimeline items={ITEMS.slice(0, index + 1)} />

// In production this comes from your project data; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "items", type: "TimelineItem[]", def: "-", desc: "{ id, title, type, startDate, endDate, status, progress?, group?, milestone?, dependencyIds?, assignee?, priority?, metadata? }. type phase/task/milestone/release/event; status planned/active/blocked/completed/delayed/cancelled." },
      { prop: "today / scale / onScaleChange", type: "number / day|week|month / cb", def: "-", desc: "Current-date marker from a prop (never Date.now); day/week/month scale (onScaleChange = zoom)." },
      { prop: "mode / compact / groups / loading / empty", type: "misc", def: "-", desc: "Timeline or structured list/mobile fallback, group collapse, and loading/empty states." },
      { prop: "onMove / onResize / nudgeUnits / renderItem / renderDetails", type: "cb / misc", def: "-", desc: "Optional non-drag keyboard reschedule (optimistic + rollback). No scheduling algorithms - the app owns dates." },
    ],
    accessibility: [
      "A structured grouped list fallback with dates as text; keyboard item navigation + selection.",
      "Selected-item details show the date range + duration in words; status is icon + text (never colour alone).",
      "Reduced motion; focus preservation; a mobile alternative; 200%-zoom safe.",
      "Dependency connectors are decorative (aria-hidden) with a textual dependency list.",
    ],
    performance: [
      "Deterministic layout (x from time, greedy row-packing, UTC ticks); no continuous ambient movement.",
      "Presentation-only - no charting/Gantt library; the host owns date calc/persistence.",
      "Non-drag reschedule uses the shared useOptimisticAction (optimistic + rollback).",
    ],
  },
  "multi-file-queue": {
    usage: `import { MultiFileQueue, type QueueItem } from "@/components/motiq/multi-file-queue";

// Your app owns scheduling + uploading; this manages the collection.
<MultiFileQueue
  items={items}
  concurrency={3}
  onPauseAll={pauseAll}
  onResumeAll={resumeAll}
  onRetryFailed={retryFailed}
  onClearCompleted={clearCompleted}
  onReorder={(from, to) => reorder(from, to)}
  onPriorityChange={(id, p) => setPriority(id, p)}
/>`,
    api: [
      { prop: "items", type: "QueueItem[]", def: "-", desc: "{ id, fileName, fileType, fileSize, priority, queuePosition, status, progress, speed?, remainingTime?, retryCount?, error?, thumbnail?, dependency?, destination?, metadata? }. App-owned." },
      { prop: "concurrency", type: "number", def: "-", desc: "App-supplied active-slot limit; the queue shows slot occupancy and which items are active vs waiting." },
      { prop: "onPauseAll / onResumeAll / onRetryFailed / onClearCompleted", type: "cb", def: "-", desc: "Queue-level batch operations." },
      { prop: "onReorder / onPriorityChange / onPause / onResume / onRetry / onCancel / onRemove / onAdd", type: "cb", def: "-", desc: "Per-item intents + reorder. Never uploads - the app executes transfers." },
    ],
    accessibility: [
      "Semantic list; status + priority are icon + text (never colour alone); progress uses progressbar semantics.",
      "Keyboard reorder / move-menu alternative with position announcements; focus preserved after removal or movement.",
      "Errors are associated with their item; blocked items expose their reason.",
      "Reduced motion renders final state; progress announcements are throttled to status changes.",
    ],
    performance: [
      "No React state update per animation frame; progress supplied by the app; a changed item doesn't replay all item animations.",
      "Presentation-only - no network/scheduling; the host owns concurrency + transfers.",
      "Large queues should be virtualized by the host.",
    ],
  },
  "cart-item-transition": {
    usage: `import { CartItemTransition, type CartLineItem } from "@/components/motiq/cart-item-transition";

// App owns price/inventory/backend; this animates the line + optimistic state.
<CartItemTransition
  item={line}
  onQuantityChange={(q) => updateQty(line.id, q)}
  onRemove={() => remove(line.id)}
  onUndoRemove={() => undo(line.id)}
  onRetry={retry}
  maxQuantity={line.availability?.limit}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: item } = useSequence([ITEM, { ...ITEM, quantity: 2 }] as const, { intervalMs: 1200, loop: true, paused: !visible });

<CartItemTransition item={item} />

// In production this comes from your cart mutations; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "item", type: "CartLineItem", def: "-", desc: "{ id, productName, variantSummary?, image?, unitPrice, quantity, total, previousPrice?, discount?, availability?, inventoryMessage?, fulfilmentMessage?, subscriptionInterval?, metadata? }. App-owned." },
      { prop: "onQuantityChange / onRemove / onUndoRemove / onChangeVariant / onSaveForLater / onRetry", type: "cb", def: "-", desc: "Intents. Mutations are optimistic (via useOptimisticAction) and roll back on a rejected handler; never touches a backend/payment." },
      { prop: "mutationState / minQuantity / maxQuantity / confirmRemove", type: "misc", def: "min 1", desc: "App-driven mutation status, quantity bounds, and optional remove confirmation." },
      { prop: "formatPrice / currency / locale / layout", type: "misc", def: "comfortable", desc: "Locale-aware price formatting and comfortable/compact layout." },
    ],
    accessibility: [
      "Quantity controls labelled; price + total changes are conveyed in text (not animation alone).",
      "Unavailable/limited state is text; remove + undo are keyboard-accessible.",
      "Focus is preserved on the pressed quantity control; after removal, focus falls back to Undo then Remove.",
      "Reduced motion keeps transitions brief/none; no colour-only price or stock.",
    ],
    performance: [
      "Brief, interruptible animation (number morph on quantity/total); no exaggerated fly-to-cart.",
      "Presentation-only - the host owns pricing/inventory/backend.",
      "Optimistic value + rollback handled by the shared useOptimisticAction primitive.",
    ],
  },
  "two-factor-setup-flow": {
    usage: `import { TwoFactorSetupFlow, type TwoFactorState } from "@/components/motiq/two-factor-setup-flow";

// The APP performs QR/secret generation, delivery, and verification.
<TwoFactorSetupFlow
  state={state}
  methods={methods}
  setupData={setupData} // app-supplied QR/secret (synthetic in the demo)
  onBegin={begin}
  onVerify={(code) => verify(code)}
  onUseAlternative={usePasskey}
  onConfirmRecoveryCodes={saveCodes}
/>`,
    api: [
      { prop: "state", type: "TwoFactorState", def: "-", desc: "App-owned phase: introduction · method-selection · preparing · secret-or-QR-ready · waiting-for-code · verifying · success · invalid-code · expired-code · method-unavailable · cancelled · recovery-codes · complete." },
      { prop: "methods / selectedMethod / setupData / recoveryCodes / error", type: "app-supplied", def: "-", desc: "authenticator/security-key/SMS/email/recovery-codes/custom (with app tradeoff notes). Secrets + codes are app-owned; the component never generates or stores them." },
      { prop: "onBegin / onVerify / onResend / onCancel / onRetry / onUseAlternative / onComplete", type: "cb", def: "-", desc: "Lifecycle intents; an alternative method is always offered." },
      { prop: "onCopySetupKey / onConfirmRecoveryCodes", type: "cb", def: "-", desc: "Copy passes intent only (no auto-copy); recovery codes are gated behind an explicit \"I've saved\" confirmation." },
    ],
    accessibility: [
      "Step labels; focus moves between states; verification errors associated with the input (aria-describedby/aria-invalid).",
      "Code input keyboard support (paste left to normal input); recovery codes remain selectable and are marked sensitive.",
      "No forced countdown pressure; status is text; mobile layout.",
      "Reduced motion; never claims the account is secure merely because setup completed.",
    ],
    performance: [
      "Presentation-only - no crypto/WebAuthn/SMS; the host owns generation + verification.",
      "Motion animates step progression/verification/reveal only; no distracting celebration.",
      "No secret ever enters analytics; demo uses obvious synthetic placeholders.",
    ],
  },
  "typing-and-presence": {
    usage: `import { TypingAndPresence, type Participant } from "@/components/motiq/typing-and-presence";

// App supplies presence + typing (e.g. from your realtime channel).
<TypingAndPresence
  participants={participants}
  typingParticipantIds={typingIds}
  mode="inline" // compact | inline | floating-panel
  maxVisible={4}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(PARTICIPANTS, { intervalMs: 900, paused: !visible });

<TypingAndPresence participants={PARTICIPANTS.slice(0, index + 1)} />

// In production this comes from your presence channel; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "participants", type: "Participant[]", def: "-", desc: "{ id, displayName, avatar?, presenceState, typingState?, activeContext?, lastActiveTime?, color?, role?, connectionState? }. Presence online/active/idle/away/offline/reconnecting; typing typing/recording/uploading/editing." },
      { prop: "typingParticipantIds / context", type: "string[] / string", def: "-", desc: "Who is currently typing; summarised (\"Jamie and Morgan are typing\" / \"Three people are typing\")." },
      { prop: "mode / maxVisible / compact", type: "misc", def: "inline / 4", desc: "compact/inline/floating-panel layout, overflow threshold, and a density modifier." },
      { prop: "onParticipantSelect / renderParticipant / formatActivity / announceTyping", type: "misc", def: "announce true", desc: "Selection, custom rendering, activity formatting, and whether to voice typing." },
    ],
    accessibility: [
      "Presence conveyed by shape + text (away/offline hollow, never colour-only); avatars fall back to initials.",
      "A debounced polite live region voices the settled summary + reconnection - never every keystroke.",
      "Overflow opens a keyboard-navigable participant list (Arrow/Home/End/Escape); touch-friendly detail panel.",
      "Reduced motion; the low-energy typing pulse pauses when hidden.",
    ],
    performance: [
      "Only join/leave/presence/typing/overflow/reconnection animate; no endless high-energy typing motion.",
      "Ambient motion pauses offscreen/hidden (useVisibilityPause).",
      "Presentation-only - the host supplies all presence/typing; no socket opened.",
    ],
  },
  "task-dependency-map": {
    usage: `import { TaskDependencyMap, type Task } from "@/components/motiq/task-dependency-map";

// App owns tasks + persistence; supply cycleError when a dependency would loop.
<TaskDependencyMap
  tasks={tasks}
  selectedTaskId={selected}
  onSelectedTaskChange={setSelected}
  onAddDependency={(id, dep) => addDep(id, dep)}
  onRemoveDependency={(id, dep) => removeDep(id, dep)}
  onMoveTask={async (id, group) => move(id, group)}
  activePath={activePath}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(TASKS, { intervalMs: 900, paused: !visible });

<TaskDependencyMap tasks={TASKS.slice(0, index + 1)} />

// In production this comes from your task store; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "tasks", type: "Task[]", def: "-", desc: "{ id, title, status, priority?, assignee?, startDate?, dueDate?, progress?, dependencyIds, blockedReason?, group?, milestone?, metadata? }. Statuses planned/ready/active/blocked/completed/cancelled." },
      { prop: "onAddDependency / onRemoveDependency / onMoveTask", type: "cb", def: "-", desc: "Intents. onMoveTask may be async → optimistic move with rollback (useOptimisticAction). The app updates tasks + supplies cycleError on a loop." },
      { prop: "selectedTaskId / onSelectedTaskChange / activePath / cycleError", type: "misc", def: "-", desc: "Controlled selection, highlighted dependency path, and an app-supplied cycle-error banner." },
      { prop: "layout / groups / compact / renderTask / renderDetails", type: "misc", def: 'map', desc: "map or list view (list doubles as the mobile detail mode), groups, and custom renderers." },
    ],
    accessibility: [
      "Keyboard-first - roving-tabindex arrow navigation; dragging is never required.",
      "SVG dependency lines are decorative (aria-hidden); all relationships are conveyed in text and announced.",
      "Focus is preserved on selection/move; status is icon + text (never colour alone).",
      "Reduced motion; a compact list fallback works on mobile and at 200% zoom.",
    ],
    performance: [
      "Deterministic dependency-depth layout computed in plain JS (cycle-guarded); SVG lines are static (not continuously animated).",
      "Presentation-only - the host owns scheduling/critical-path/persistence.",
      "Optimistic move + rollback via the shared useOptimisticAction primitive.",
    ],
  },
  "file-upload-pipeline": {
    usage: `import { FileUploadPipeline, type UploadItem } from "@/components/motiq/file-upload-pipeline";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(UPLOADS, { intervalMs: 900, paused: !visible });

<FileUploadPipeline items={UPLOADS.slice(0, index + 1)} />

// In production this comes from your upload progress events; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "items", type: "UploadItem[]", def: "-", desc: "{ id, fileName, fileType, fileSize, progress, status, speed?, remainingTime?, error?, retryCount?, processingStage?, thumbnail?, metadata? }. App-owned (required)." },
      { prop: "onAddFiles", type: "(files: File[]) => void", def: "-", desc: "Fired from the file input or keyboard drop-zone alternative; your app starts the upload." },
      { prop: "onPause / onResume / onRetry / onCancel / onRemove", type: "(item) => void", def: "-", desc: "Per-item intents. The component transfers no bytes - it reflects the status your app sets." },
      { prop: "onClearCompleted / onReorder / onCopyError", type: "cb", def: "-", desc: "Clear finished items, reorder the queue (when enabled), copy an item's error." },
      { prop: "accept / multiple / offline / formatBytes", type: "misc", def: "-", desc: "File-input constraints, an offline banner, and a byte formatter." },
    ],
    accessibility: [
      "Real <input type=file> plus a keyboard-operable drop-zone alternative (button) - never drag-only.",
      "Per-item progress uses role=progressbar with aria-valuenow/min/max; status is icon + text (never colour alone).",
      "Errors are associated via aria-describedby; focus is preserved after an item is removed.",
      "Progress announcements are throttled to status changes (not every percent); reduced motion renders final state.",
    ],
    performance: [
      "No React state update per animation frame; progress values are supplied by the app.",
      "Thumbnail lifecycle (revoke object URLs) is the app's responsibility - documented in props.",
      "Very large queues should be virtualized by the host; the component renders the passed set.",
    ],
  },
  "product-variant-selector": {
    usage: `import { ProductVariantSelector, type OptionGroup } from "@/components/motiq/product-variant-selector";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: loadingAvailability } = useSequence([true, false] as const, { intervalMs: 1200, loop: true, paused: !visible });

<ProductVariantSelector loadingAvailability={loadingAvailability} value={variant} onChange={setVariant} />

// In production this comes from your availability lookup; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "groups", type: "OptionGroup[]", def: "-", desc: "color/size/material/finish/storage/plan/bundle/custom; each value = { value, label, swatch?, image?, priceAdjustment?, availability, inventoryState, disabledReason?, recommended?, metadata? }." },
      { prop: "value / defaultValue / onValueChange", type: "VariantSelection / cb", def: "-", desc: "Controlled or uncontrolled selection." },
      { prop: "getVariantState", type: "(sel) => VariantState", def: "-", desc: "App resolves dependent options + unavailable combinations. Inventory is app-supplied - no fabricated scarcity." },
      { prop: "onPriceChange / basePrice / priceFormatter / currency / locale", type: "misc", def: "-", desc: "Price adjustment is shown as text (animation is additive); formatting is locale-aware (no hardcoded symbol position)." },
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
      "Presentation-only - the host owns availability/inventory/pricing; no network.",
      "Inline SVG icons + data-URI demo images; no external assets.",
    ],
  },
  "passkey-setup-flow": {
    usage: `import { PasskeySetupFlow, type PasskeyState } from "@/components/motiq/passkey-setup-flow";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: state } = useSequence(["intro", "naming", "registration-starting", "system-prompt-waiting", "success"] as const, { intervalMs: 1200, loop: true, paused: !visible });

<PasskeySetupFlow state={state} />

// In production this comes from the WebAuthn ceremony's real stages; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "state", type: "PasskeyState", def: "-", desc: "App-owned phase. The component never calls navigator.credentials or fakes success." },
      { prop: "capability / error / existingCredential", type: "app-supplied", def: "-", desc: "Device capability, the app's failure detail (shown verbatim), and any existing credential." },
      { prop: "name / defaultName / onNameChange", type: "string / cb", def: "-", desc: "A human-readable passkey nickname - the only user input. No key material is ever handled." },
      { prop: "onBegin / onCancel / onRetry / onComplete / onUseAlternative", type: "cb", def: "-", desc: "Lifecycle intents. An alternative sign-in path is always offered." },
    ],
    accessibility: [
      "Ordered step semantics (aria-current=step); focus moves to the active phase heading on each transition.",
      "Failure detail is shown with role=alert and associated to the retry action via aria-describedby.",
      "Status is icon + text; no countdown/time pressure; keyboard operable; mobile layout.",
      "Reduced motion replaces the waiting spinner with a static affordance.",
    ],
    performance: [
      "Presentation-only - no crypto, no WebAuthn, no timers; the host owns the ceremony.",
      "Motion animates transform/opacity only; keyed on phase to play a transition once.",
      "No perpetual animation.",
    ],
  },
  "message-delivery-states": {
    usage: `import { MessageDeliveryStates, type DeliveryMessage } from "@/components/motiq/message-delivery-states";

// App owns delivery; the component presents app-supplied states.
<MessageDeliveryStates
  messages={messages}
  currentUserId={me}
  onRetry={(m) => resend(m.id)}
  onCancel={(m) => cancel(m.id)}
  onEdit={(m) => edit(m.id)}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(MESSAGES, { intervalMs: 900, paused: !visible });

<MessageDeliveryStates messages={MESSAGES.slice(0, index + 1)} />

// In production this comes from your chat transport's delivery receipts; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "messages", type: "DeliveryMessage[]", def: "-", desc: "{ id, body, author, timestamp, deliveryState, readRecipients?, error?, attachmentState? }. deliveryState ∈ draft|sending|sent|delivered|read|failed|retrying|scheduled|cancelled|edited." },
      { prop: "currentUserId", type: "string", def: "-", desc: "Distinguishes own vs others' messages for alignment + receipts." },
      { prop: "onRetry / onCancel / onEdit / onCopy", type: "(message) => void", def: "-", desc: "Message intents. The component never simulates network delivery." },
      { prop: "formatTimestamp / now / maxHeight", type: "misc", def: "-", desc: "Deterministic relative-time formatting and a scroll region." },
    ],
    accessibility: [
      "Delivery state is available as text (icon never alone); read receipts are labelled.",
      "Retry is keyboard-accessible; errors are associated with their message; body stays selectable.",
      "Live-region updates are restrained (only meaningful advances announced, one at a time).",
      "Reduced motion renders final frames instantly.",
    ],
    performance: [
      "Motion communicates transitions only (keyed on deliveryState) - no constant bouncing/typing dots.",
      "Presentation-only - no network/timers; the host drives the lifecycle.",
      "Rows keyed by id.",
    ],
  },
  "kanban-card-movement": {
    usage: `import { KanbanCardMovement, type KanbanColumn, type KanbanCard } from "@/components/motiq/kanban-card-movement";

// App owns the board data + persistence; onMove may be async (optimistic + rollback).
<KanbanCardMovement
  columns={columns}
  cards={cards}
  onMove={async (cardId, toColumnId, toIndex) => persist(cardId, toColumnId, toIndex)}
  moveValidation={(from, to) => allowed(from, to)}
  onAddCard={(columnId) => addCard(columnId)}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(CARDS, { intervalMs: 900, paused: !visible });

<KanbanCardMovement cards={CARDS.slice(0, index + 1)} />

// In production this comes from your board's realtime updates; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "columns / cards", type: "KanbanColumn[] / KanbanCard[]", def: "-", desc: "column = { id, title, limit? }; card = { id, columnId, title, order, disabled?, meta? }. App-owned." },
      { prop: "onMove", type: "(cardId, toColumnId, toIndex) => void | Promise", def: "-", desc: "May be async: movement is optimistic and rolls back if the promise rejects." },
      { prop: "moveValidation", type: "(from, to) => boolean | reason", def: "-", desc: "Reject invalid moves (e.g. column limit); the reason is surfaced." },
      { prop: "selectedCardId / onAddCard / columnLimits", type: "misc", def: "-", desc: "Controlled selection, add-card intent, and app-supplied per-column limits." },
    ],
    accessibility: [
      "Dragging is never required - keyboard/menu movement is always available; origin + destination are announced (aria-live).",
      "Focus returns to the moved card; drop targets are labelled; disabled cards can't be moved.",
      "No colour-only column/status meaning; reduced motion disables transform animation.",
      "Cancel a drag with Escape.",
    ],
    performance: [
      "Only the dragged card moves via transform/ref during pointer movement - no per-pointermove React state.",
      "Transform-based layout animation; drag math kept outside large React state loops.",
      "Very large boards should be virtualized by the host (documented).",
    ],
  },
  "prompt-composer": {
    usage: `import { PromptComposer, type PromptModel } from "@/components/motiq/prompt-composer";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: value } = useSequence(["Summarise", "Summarise the incident", "Summarise the incident report"] as const, { intervalMs: 1200, loop: true, paused: !visible });

<PromptComposer value={value} onChange={setValue} />

// In production this comes from the user typing (drop the hook and use plain state); useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "value / defaultValue / onValueChange", type: "string / cb", def: "-", desc: "Controlled or uncontrolled prompt text; the app owns the value." },
      { prop: "models / selectedModelId / onModelChange", type: "PromptModel[] / string / cb", def: "-", desc: "Model selector integration point. Real model names come from your app; the component hardcodes none." },
      { prop: "tokenCount / maxTokens / tokenNoun", type: "number / number / string", def: "-", desc: "App-supplied estimate; remaining budget shown by icon + text (never colour alone). The component never counts tokens itself." },
      { prop: "status", type: '"idle"|"loading"|"streaming"|"error"', def: '"idle"', desc: "Drives Send / Stop / Retry affordances and aria-live status." },
      { prop: "onSubmit / onStop / onRetry", type: "cb", def: "-", desc: "Cmd/Ctrl+Enter submits. The app performs the actual request - the composer sends nothing." },
      { prop: "variables / onInsertVariable · templates / onInsertTemplate · attachments / onRemoveAttachment / onAddAttachment", type: "arrays / cb", def: "-", desc: "App-supplied variables, templates, and attachments; caret-aware insertion + removal callbacks." },
    ],
    accessibility: [
      "Labelled textarea; Send/Stop/Retry are real buttons with text labels; menus are keyboard operable and Esc-closable.",
      "Token budget and status use icon + text (never colour alone) and are announced via aria-live.",
      "Cmd/Ctrl+Enter to submit is documented in a visible helper row and JSDoc; focus is preserved across state changes.",
      "Reduced motion renders the final state with no essential animation.",
    ],
    performance: [
      "Motion animates only opacity/transform; no perpetual loops.",
      "Presentation-only - no model, network, timers, or token counting; the host owns all of it.",
      "Controlled/uncontrolled via a single state primitive; menus and rows are memoised.",
    ],
  },
  "webhook-event-stream": {
    usage: `import { WebhookEventStream, type WebhookEvent } from "@/components/motiq/webhook-event-stream";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index, done } = useSequence(EVENTS, { intervalMs: 900, paused: !visible });

<WebhookEventStream events={EVENTS.slice(0, index + 1)} status={done ? "delivered" : "pending"} />

// In production this comes from your webhook delivery feed; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "events", type: "WebhookEvent[]", def: "-", desc: "{ id, endpoint, status, statusCode?, retryCount?, timestamp, payload?, headers? }. App-owned (required)." },
      { prop: "status / errorMessage", type: '"streaming"|"paused"|"idle"|"error" / string', def: '"streaming"', desc: "Stream lifecycle; error surfaces a banner with onReconnect." },
      { prop: "follow / onFollowChange · paused / onPausedChange", type: "boolean / cb", def: "-", desc: "Auto-follow that doesn't fight your scroll; pause/resume without losing position." },
      { prop: "redact", type: "boolean | string[] | (ctx) => boolean", def: "-", desc: "Redaction rule; matched header/payload values render as ••••••, never in DOM, search, or copies." },
      { prop: "query / onQueryChange · statuses", type: "string / cb · WebhookDeliveryStatus[]", def: "-", desc: "Search + status/event-type filtering." },
      { prop: "onRetry / onReplay / onInspect / onReconnect", type: "cb", def: "-", desc: "Retry (failed only), replay, expand inspection, and reconnect callbacks. Nothing is sent by the component." },
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
      "Presentation-only - no sockets/network/timers; the host feeds the stream.",
    ],
  },
  "mention-suggestions": {
    usage: `import { MentionSuggestions, type MentionUser } from "@/components/motiq/mention-suggestions";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: loading } = useSequence([true, false] as const, { intervalMs: 1200, loop: true, paused: !visible });

<MentionSuggestions loading={loading} open query={query} />

// In production this comes from your mention search; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "open / query / items", type: "boolean / string / MentionUser[]", def: "-", desc: "Fully controlled: the app detects the trigger and drives open/query; items are app-owned." },
      { prop: "inputRef", type: "RefObject<HTMLInputElement | HTMLTextAreaElement>", def: "-", desc: "The app's field. DOM focus stays there; the popup uses aria-activedescendant." },
      { prop: "onSelect / onOpenChange", type: "cb", def: "-", desc: "Selection returns the item + context for the app to insert; Esc/blur closes." },
      { prop: "groups / loading / filter / limit", type: "MentionGroup[] / boolean / cb / number", def: "limit 8", desc: "Labelled groups, loading state, custom filter, and a result cap." },
      { prop: "align / label / emptyLabel / loadingLabel", type: "misc", def: "-", desc: "Placement + SR labels for empty/loading." },
    ],
    accessibility: [
      "ARIA combobox pattern wired onto the app's field: aria-controls + aria-activedescendant; DOM focus never leaves the input.",
      "Arrow/Home/End navigate; Enter selects; Esc closes; disabled entries expose a reason and can't be selected.",
      "Result count announced via aria-live; avatars are initials with a deterministic hue (no external images).",
      "Presence/disabled use distinct icon shapes + text (never colour alone); reduced motion shows the final state.",
    ],
    performance: [
      "Filtering + roving index memoised; rows keyed by id.",
      "No portal thrash - the popup mounts/unmounts with the open prop.",
      "Presentation-only - no network/persistence; the host owns text editing.",
    ],
  },
  "data-quality-status": {
    usage: `import { DataQualityStatus, type QualityCheck } from "@/components/motiq/data-quality-status";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: validating } = useSequence([true, false] as const, { intervalMs: 1200, loop: true, paused: !visible });

<DataQualityStatus validating={validating} />

// In production this comes from your validation job; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "metrics", type: "DataQualityMetrics", def: "-", desc: "{ freshness, completeness, accuracy }, each QualityMetric | null. A null metric renders \"Unknown\" - the component never invents a value." },
      { prop: "checks", type: "QualityCheck[]", def: "-", desc: "{ id, label, state: pass|warning|failure|unknown, summary, affectedRecords?, issues? }. App-owned." },
      { prop: "lastChecked / totalRecords", type: "Date|number|string|null / number", def: "-", desc: "Last validation time (pass `now` for deterministic relative formatting) and record scope." },
      { prop: "filter / defaultFilter / onFilterChange", type: "CheckFilter / cb", def: "-", desc: "Filter checks by status; controlled or uncontrolled." },
      { prop: "onRetry / validating", type: "cb / boolean", def: "-", desc: "Re-run validation; the app performs the actual check. The component only reflects state." },
    ],
    accessibility: [
      "Overall verdict + per-check state are icon + text (never colour alone) and survive forced-colors.",
      "Issue lists are keyboard-expandable (Enter/Space, aria-expanded); counts announced via aria-live.",
      "Unmeasured metrics are explicitly \"Unknown\", not zero or a colour.",
      "Reduced motion renders the final state with no essential animation.",
    ],
    performance: [
      "Derivation + filtering memoised; checks keyed by id; number morphs animate transform only.",
      "Presentation-only - no validation runs here; the host supplies all evidence.",
      "No timers/network; expandable rows mount lazily.",
    ],
  },
  "keyboard-safe-form": {
    usage: `import { KeyboardSafeForm, type FieldError } from "@/components/motiq/keyboard-safe-form";

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
      { prop: "children / onSubmit", type: "ReactNode / () => Promise<void>|void", def: "-", desc: "Your fields + the async submit the app performs. Nothing is sent by the component." },
      { prop: "errors / onValidate", type: "FieldError[] / () => FieldError[]|null", def: "-", desc: "App-owned validation; a summary lists errors linked to fields via aria." },
      { prop: "dirty / confirmDiscard / onCancel", type: "boolean / boolean / cb", def: "confirmDiscard true", desc: "Unsaved-changes discard guard (Keep editing / Discard) before cancel." },
      { prop: "onSubmitSuccess / successMessage", type: "cb / string", def: "-", desc: "Success state + live-region message after a resolved submit." },
      { prop: "disableViewportTracking / reducedMotion", type: "boolean / boolean", def: "false", desc: "Opt out of VisualViewport tracking (falls back to a plain sticky footer); force reduced motion." },
    ],
    accessibility: [
      "Validation summary links each error to its field; summary links move focus to the field.",
      "Async status uses aria-live; errors are icon + text (never colour alone) with aria-invalid/aria-describedby.",
      "Sticky action bar stays reachable above the virtual keyboard; safe-area insets respected; 200%-zoom-safe.",
      "VisualViewport and beforeunload are feature-detected - SSR- and jsdom-safe with a graceful desktop fallback.",
    ],
    performance: [
      "Viewport tracking uses a passive listener and is disabled when unsupported.",
      "Motion animates only transform/opacity; reduced motion removes it.",
      "Presentation-only - the host owns fields, validation, and submission.",
    ],
  },
  "ai-agent-workspace": {
    usage: `import { AiAgentWorkspace } from "@/components/motiq/blocks/ai-agent-workspace";

// A full-page AI agent workspace composing 4 components. Presentation-only:
// your app owns the state end-to-end; it never talks to a model. Renders
// standalone with fictional demo data; make phase controlled to drive real state.
export default function AgentPage() {
  return <AiAgentWorkspace phase="running" prompt="Plan and apply the migration" />;
}`,
    api: [
      { prop: "phase / onPhaseChange", type: `WorkspacePhase / cb`, def: "-", desc: "Controlled workspace state: idle | running | waiting | completed | failed | cancelled. Every child's state is derived from it." },
      { prop: "defaultPhase", type: "WorkspacePhase", def: `"running"`, desc: "Uncontrolled initial phase." },
      { prop: "prompt / assistantName", type: "string", def: "-", desc: "Header + answer copy." },
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
      "Presentation-only and event-driven - no polling, timers, or per-frame work in the block; motion comes from the children (transform/opacity only).",
      "Per-phase snapshots are memoized; no Date.now()/Math.random()/new Date() at module scope, render, or initializers - server and client render identical markup.",
      "Installs the block + its 4 components as editable source; Pro components require Pro access.",
    ],
  },
  "deployment-command-center": {
    usage: `import { DeploymentCommandCenter } from "@/components/motiq/blocks/deployment-command-center";

// A composed, app-controlled deploy console. It owns a small demo state machine
// and wires each component's callbacks together; rewire to your real backend.
// It never talks to a provider.
<DeploymentCommandCenter repo="acme/ledger-web" defaultEnvironmentId="staging" />`,
    api: [
      { prop: "environments", type: "Environment[]", def: "3 demo envs", desc: "Environments in the top-bar switcher (app-owned). Switching to production is gated behind a confirmation dialog." },
      { prop: "defaultEnvironmentId", type: "string", def: "staging", desc: "Environment selected on first render." },
      { prop: "repo", type: "string", def: `"acme/ledger-web"`, desc: "Repository slug shown in the header + request body (fictional)." },
      { prop: "(internal) run machine", type: "-", def: "-", desc: "Deploy / Run-with-failure / Retry / Cancel / Reset drive a deterministic timeline: stages, revealed log lines, and the POST /v1/deployments inspector state derive from it." },
    ],
    accessibility: [
      "Composes four accessible primitives unchanged: the switcher's ARIA combobox + production alertdialog, the pipeline's ordered-list stages, the log region (role=log) with pause/copy, and the inspector's disclosure sections - all keyboard reachable.",
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
    usage: `import { CollaborativeReviewWorkspace } from "@/components/motiq/blocks/collaborative-review-workspace";

// Renders standalone with fictional demo data. The block owns a state machine
// that wires the four components together: approving a stage advances the
// workflow AND appends an activity event; posting a comment appears in the
// thread AND the feed. The app owns persistence + authorization.
<CollaborativeReviewWorkspace />`,
    api: [
      { prop: "workflow / comments / events / presence", type: "override data", def: "inline demo", desc: "Optional starting data for each composed component; omit any to fall back to the fictional demo seed." },
      { prop: "currentUser", type: "CommentAuthor", def: `{ id: "you", name: "You" }`, desc: "The viewer - drives approval authorization, comment authorship, and reaction toggles." },
      { prop: "mentionable / title / showControls", type: "misc", def: "-", desc: "@-mention cast, workspace heading, and the phase-preset toolbar toggle." },
    ],
    accessibility: [
      "Composes four accessible components; the block adds only a labelled section, a semantic status pill (icon + text), and an aria-pressed phase-preset toolbar of real buttons.",
      "The approval workflow keeps app-owned authorization: the viewer can only act on stages they review and only once; disabled reasons surface via aria-describedby.",
      "No nested interactive elements - each child owns its focus/keyboard behavior; the layout only arranges them.",
      "Every piece honors reduced motion; status/unread state use text + shape and survive forced-colors.",
    ],
    performance: [
      "Presentation-only: no network; the demo state machine is plain in-memory reducers over the shared data.",
      "Timestamps seed from a fixed epoch for first render and re-anchor to the real clock in a mount effect - no hydration drift.",
      "Motion is opacity/transform/height inside the children; the activity rail + thread cap their own scroll height so long feeds don't reflow the page.",
    ],
  },
  "live-operations-dashboard": {
    usage: `import { LiveOperationsDashboard, type OpsService } from "@/components/motiq/blocks/live-operations-dashboard";

// Presentation-only: your app owns the data and every lifecycle transition. Ships
// with fictional demo services so it renders standalone; it never fetches.
<LiveOperationsDashboard />`,
    api: [
      { prop: "services", type: "OpsService[]", def: "8 demo services", desc: "Baseline dataset (app-owned): { id, name, region, category, status, rpm, p95, errorRate, sessions }. Refresh snapshots derive deterministically from this - no fetching." },
      { prop: "className", type: "string", def: "-", desc: "Extra classes on the outer shell." },
    ],
    accessibility: [
      "Composes only accessible primitives: KPI aria-labels + aria-busy; refresh/filter/table each own polite rate-limited live regions and real semantics (a semantic table with scope=col headers + aria-sort).",
      "Status is never color-only - each service badge pairs a shape glyph with a text label (Operational / Degraded / Down), legible in forced-colors.",
      "Every control is a real button with a focus ring; filter toggles expose aria-pressed; no nested interactive elements.",
      "Reduced motion snaps number morphs and disables row/pulse animation; layout unchanged.",
    ],
    performance: [
      "Presentation-only and self-contained: no fetch/poll/timers at rest; the demo schedules short setTimeouts only inside control handlers and clears them on unmount.",
      "Deterministic - no Date.now()/Math.random()/new Date() at render/init/module scope, so first paint matches across server + client.",
      "Numeric morphs animate via rAF (no layout thrash); rows animate transform/opacity. For very large datasets, page/window before handing them in (the table is not virtualized).",
    ],
  },
  "agent-run-timeline": {
    usage: `import { AgentRunTimeline, type AgentRun } from "@/components/motiq/agent-run-timeline";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(STEPS, { intervalMs: 900, paused: !visible });

<AgentRunTimeline run={{ ...RUN, steps: STEPS.slice(0, index + 1) }} />

// In production this comes from your agent's run events; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "run", type: "AgentRun", def: "-", desc: "App-owned: { title, status, startedAt?, endedAt?, currentStepId?, steps[], summary? }. Run statuses: queued|running|waiting|completed|failed|cancelled|paused (required)." },
      { prop: "run.steps[]", type: "RunStep[]", def: "-", desc: "Ordered steps { id, title, description?, status, toolCall?, output?, error?, attempts?, stages?, summary? }. Step statuses: pending|active|completed|failed|skipped|waiting_approval|cancelled." },
      { prop: "activeStepId / onActiveStepChange", type: "string / cb", def: "run.currentStepId", desc: "Selected/emphasized step - controlled or internal." },
      { prop: "followActive", type: "boolean", def: "true", desc: "When run.currentStepId moves, select it and scroll it into view." },
      { prop: "onApprove / onReject / onRetryStep", type: "(id) => void", def: "-", desc: "Inline approval on a waiting_approval step; Retry on a failed step." },
      { prop: "onCancelRun / onResumeRun / onCopyRun", type: "callbacks", def: "-", desc: "Run-level cancel/resume and copy-run-details." },
      { prop: "compactCompleted / renderStepDetails / renderOutput / formatTimestamp", type: "misc", def: "-", desc: "Compress resolved steps; custom detail/output renderers; timestamp override." },
    ],
    accessibility: [
      "Run and step status are icon + text label + border - never color alone; survives forced-colors.",
      "Steps are a semantic ordered list; each header is a disclosure button (aria-expanded) with aria-current on the current step; details mount only while open.",
      "Approve/Reject/Retry/Cancel/Resume/Copy are real buttons; a polite role=status region announces run + step lifecycle transitions only.",
      "After approve/reject/retry, focus moves to that step's header; reduced motion renders the final state with no perpetual pulse.",
    ],
    performance: [
      "Motion drives only opacity/transform/height/width; the active-step pulse stops the moment a step resolves.",
      "Expanded panels mount lazily via AnimatePresence; presentation-only - no model, timers, or network.",
      "Pair with useVisibilityPause in the host to pause run-advancing updates offscreen.",
    ],
  },
  "environment-switcher": {
    usage: `import { EnvironmentSwitcher, type Environment } from "@/components/motiq/environment-switcher";

// Presentation + control only: your app owns the data AND the actual switch.
const environments: Environment[] = [
  { id: "staging", name: "Staging", type: "staging", status: "degraded", region: "iad1", branch: "release/2.9", health: 71 },
  { id: "prod", name: "Production", type: "production", status: "available", region: "iad1", warning: "Live customer traffic" },
];

<EnvironmentSwitcher environments={environments} value={envId} onValueChange={runSwitch} switching={switching} error={error} onRetry={retry} requireProductionConfirmation />`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: switching } = useSequence([true, false] as const, { intervalMs: 1200, loop: true, paused: !visible });

<EnvironmentSwitcher switching={switching} value={env} onChange={setEnv} />

// In production this comes from your environment switch request; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "environments", type: "Environment[]", def: "-", desc: "{ id, name, type, status, region?, branch?, version?, lastDeploy?, url?, health?, warning?, disabled?, disabledReason?, group? }. App-owned (required)." },
      { prop: "value / defaultValue / onValueChange", type: "string / cb", def: "-", desc: "Controlled or uncontrolled selection; onValueChange fires only after production confirmation when required. Your app performs the real switch." },
      { prop: "switching / error / onRetry", type: "boolean / string / cb", def: "-", desc: "App-owned in-flight + failure; the trigger shows loading, the banner surfaces Retry. The component never switches anything itself." },
      { prop: "requireProductionConfirmation", type: "boolean", def: "false", desc: "Gate a switch to a production environment behind a role=alertdialog confirmation." },
      { prop: "recentIds / favoriteIds / groups", type: "string[] / EnvGroup[]", def: "-", desc: "Float recents + favorites to the top; groups render labelled sections." },
      { prop: "renderEnvironment / formatTimestamp / now", type: "misc", def: "-", desc: "Custom row renderer + last-deploy formatting (pass `now` for deterministic relative times)." },
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
      "Presentation-only - no model/socket/timers/network; the host owns the switch and all status.",
    ],
  },
  "comment-thread": {
    usage: `import { CommentThread, type Comment, type CommentAuthor } from "@/components/motiq/comment-thread";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(COMMENTS, { intervalMs: 900, paused: !visible });

<CommentThread comments={COMMENTS.slice(0, index + 1)} />

// In production this comes from your comments subscription; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "comments", type: "Comment[]", def: "-", desc: "App-owned; flat via parentId or nested via replies. Each: { id, author, body, createdAt, editedAt?, parentId?, replies?, mentions?, reactions?, attachments?, status?, resolved?, permissions? }." },
      { prop: "currentUser", type: "CommentAuthor", def: "-", desc: "The composer; drives optimistic authorship + reaction toggles (required)." },
      { prop: "onAddComment / onReply / onEdit", type: "(draft) => void | Promise<Comment|void>", def: "-", desc: "Return a Promise - resolve/reject drives the internal pending → sent / failed; a returned Comment supplies the confirmed id (temp id replaced)." },
      { prop: "onRetry / onDelete / onResolve / onReopen / onReact / onCopyLink", type: "callbacks", def: "-", desc: "Retry a failed send; delete; resolve/reopen; toggle a reaction; permalink-copied. The app performs the mutation." },
      { prop: "mentionable / permissions", type: "CommentAuthor[] / CommentPermissions", def: "[] / all", desc: "People for the accessible @ menu; per-action capability gates (per-comment overrides global)." },
      { prop: "sort / unreadAfter / reactionChoices / collapseRepliesAfter / formatTimestamp", type: "misc", def: "-", desc: "Order, unread divider boundary, reaction picker set, auto-collapse threshold, timestamp override." },
    ],
    accessibility: [
      "Each comment is a semantic <article> with author, <time datetime>, and an explicit (edited) label; replies are a labelled <ul> so the parent relationship is conveyed, not just indented.",
      "Optimistic state is text + icon (Sending…, Failed to send, Resolved) - never color-only; failures announce politely and expose Retry. Reaction counts are announced with the emoji aria-hidden.",
      "Focus is preserved across pending → sent/failed; opening reply/edit moves focus into the composer and returns it on cancel; the @ menu uses aria-autocomplete + aria-activedescendant.",
      "Reduced motion renders final states with opacity-only fades; all actions are keyboard-operable buttons; forced-colors safe.",
    ],
    performance: [
      "Motion drives only opacity/transform/height; AnimatePresence handles insertion/removal/reply expansion; no looping animation.",
      "Presentation-only - no network/timers; the optimistic layer is a small in-memory overlay reconciled by id, keeping re-renders local.",
      "`now` for relative timestamps is set in an effect (never during render) - no hydration mismatch; mobile layout is CSS-driven.",
    ],
  },
  "data-refresh-state": {
    usage: `import { DataRefreshState, type RefreshState } from "@/components/motiq/data-refresh-state";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: state } = useSequence(["idle", "checking", "refreshing", "success"] as const, { intervalMs: 1200, loop: true, paused: !visible });

<DataRefreshState state={state} />

// In production this comes from your refresh lifecycle; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "state", type: "RefreshState", def: "-", desc: "Host-owned: idle · checking · refreshing · partially_updated · success · stale · offline · error · paused · cancelled (required)." },
      { prop: "progress", type: "number | null", def: "-", desc: "Determinate 0–1 (role=progressbar + aria-valuenow); omit/null → an honestly-labelled indeterminate bar (never a fake number)." },
      { prop: "updatedCount / totalCount", type: "number", def: "-", desc: "Records updated / in scope; drives the animated count readout." },
      { prop: "lastUpdated / nextRefresh / source / staleness / connection / errorSummary", type: "misc", def: "-", desc: "Contextual info surfaced as text - stale + offline detail is always textual, never color alone." },
      { prop: "automatic / interval / intervalOptions", type: "bool / ms / ms[]", def: "false", desc: "Auto mode reveals pause/resume + an interval select wired to onIntervalChange." },
      { prop: "mode / onRefresh / onCancel / onRetry / onPause / onResume", type: "misc", def: `"panel"`, desc: "Density (compact/inline/panel) and the keyboard-accessible controls (visibility follows state)." },
    ],
    accessibility: [
      "Every state pairs a distinct glyph with a text label (Refreshing, Stale, Offline, Refresh failed…) - status is never color alone; legible in forced-colors.",
      "Determinate progress is role=progressbar with aria-valuenow/min/max; indeterminate is a labelled bar shown only while busy - never spins on idle.",
      "A polite role=status region announces on lifecycle change only; errors use role=alert; refresh/cancel/retry/pause/resume/interval/dismiss are real controls.",
      "prefers-reduced-motion removes the icon spin and progress sweep, snaps counts, and makes the indeterminate bar static.",
    ],
    performance: [
      "Presentation-only and tiny: no fetching, timers, or polling - the host owns all work, so it adds no background cost when idle.",
      "Animations are transform/opacity/width only; the spin + indeterminate sweep run only while busy and stop on completion.",
      "Timestamps never call Date.now()/new Date() during render - pass a client-updated `now` for relative times.",
    ],
  },
  "mobile-filter-sheet": {
    usage: `import { MobileFilterSheet, type FilterGroup, type FilterValue } from "@/components/motiq/mobile-filter-sheet";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: mode } = useSequence(["sheet", "fullscreen"] as const, { intervalMs: 1200, loop: true, paused: !visible });

<MobileFilterSheet mode={mode} open onOpenChange={setOpen} />

// In production this comes from your own breakpoint or route state; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "groups", type: "FilterGroup[]", def: "-", desc: "App-defined groups: checkbox · radio · range · date · search · hierarchical · custom. Options support { count, disabled, disabledReason, children }." },
      { prop: "open / defaultOpen / onOpenChange", type: "boolean / cb", def: "false", desc: "Controlled or uncontrolled sheet visibility." },
      { prop: "value / defaultValue / onValueChange", type: "FilterValue / cb", def: "{}", desc: "The APPLIED value. onValueChange fires only when the draft is committed via Apply." },
      { prop: "onDraftChange", type: "(draft) => void", def: "-", desc: "Fires on every uncommitted draft edit - use it to compute the live resultCount before Apply." },
      { prop: "onApply / onCancel / onClear", type: "cb", def: "-", desc: "Apply commits the draft; Cancel restores the applied value; onClear fires when Clear-all empties the draft." },
      { prop: "resultCount / loading / error / mode / confirmDiscard / renderFilter / renderFooter", type: "misc", def: "-", desc: "App-computed count (animated + announced), count-area states, sheet/fullscreen/panel surface, unsaved-change prompt, custom body/footer." },
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
    usage: `import { SourceCitationRail, CitationMarker, type CitationSource } from "@/components/motiq/source-citation-rail";

// Presentation-only: your app owns the sources and decides "active".
const sources: CitationSource[] = [
  { id: "s1", index: 1, title: "Streaming responses guide", domain: "docs.example.dev",
    url: "https://example.dev/streaming", type: "docs", excerpt: "Flush tokens as produced…", verified: true },
];

<SourceCitationRail sources={sources} activeSourceId={activeId} onActiveSourceChange={setActiveId} layout="rail">
  <article>Stream tokens as they are produced <CitationMarker source="s1" />.</article>
</SourceCitationRail>`,
    api: [
      { prop: "sources", type: "CitationSource[]", def: "-", desc: "Sources in rail order { id, index, title, domain?, url?, type?, excerpt?, author?, publishedAt?, retrievedAt?, relevance?, verified? }. `verified` is displayed as an app-provided state, never inferred (required)." },
      { prop: "children", type: "ReactNode", def: "-", desc: "The answer/article body; place <CitationMarker source=\"id\" /> inline." },
      { prop: "activeSourceId / onActiveSourceChange", type: "string | null / cb", def: "null", desc: "Controlled active source, synced with markers and rail." },
      { prop: "onOpenSource", type: "(source) => void", def: "-", desc: "Fired when a source's external link is opened." },
      { prop: "layout", type: `"rail" | "list" | "cards"`, def: `"rail"`, desc: "Side rail, compact list, or expandable cards." },
      { prop: "showExcerpts / mobileBehavior / formatDate / renderSource", type: "misc", def: "-", desc: "Excerpt disclosure, mobile stacked/bottom, date + row renderers." },
    ],
    accessibility: [
      "Inline markers are real buttons with aria-pressed; active state is never color-only (accent bar + weight + \"Active\" label + aria-current).",
      "The rail is a <nav> with Up/Down/Home/End roving selection; a source URL is a semantic <a target=_blank rel=noopener> with a clear new-tab name.",
      "Excerpts are disclosures (aria-expanded); copy-link announces via a polite live region.",
      "Reduced motion renders the final state and scrolls instantly; the component never asserts verification.",
    ],
    performance: [
      "Motion drives only opacity/transform/width + a shared layout indicator; no looping animation.",
      "Presentation-only - no model/network/timers; excerpt panels mount lazily via AnimatePresence.",
      "Mobile layout is CSS-breakpoint driven (no matchMedia during render) - no hydration mismatch.",
    ],
  },
  "api-request-inspector": {
    usage: `import { ApiRequestInspector, type ApiRequest } from "@/components/motiq/api-request-inspector";

// Presentation only: your app owns the data + state. It never sends the request.
const request: ApiRequest = {
  method: "POST", url: "https://api.acme.dev/v1/deployments", environment: "production",
  requestId: "req_9fa2c1e7b0", headers: { "Content-Type": "application/json", Authorization: "Bearer ••••••" },
  body: { project: "web", ref: "main" },
};

<ApiRequestInspector request={request} response={response} state={state} redact={["x-internal-id"]} onRetry={resend} onCancel={abort} />`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: state } = useSequence(["idle", "loading", "success"] as const, { intervalMs: 1200, loop: true, paused: !visible });

<ApiRequestInspector state={state} response={RESPONSE} />

// In production this comes from your fetch lifecycle; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "request", type: "ApiRequest", def: "-", desc: "{ method, url, headers?, query?, body?, requestId?, environment?, timestamp? }. The app owns it (required)." },
      { prop: "response", type: "ApiResponse", def: "-", desc: "{ status?, durationMs?, headers?, body?, error?, retryCount?, phases? }. Timing phases draw a proportional breakdown." },
      { prop: "state", type: "InspectorState", def: "-", desc: "idle | loading | success | client_error | server_error | timeout | cancelled | retrying (required)." },
      { prop: "redact", type: "boolean | string[] | (ctx) => boolean", def: "built-in list", desc: "Default masks well-known credential keys; array adds keys; predicate = full control; false disables. Redacted values never reach the DOM, search, or copies." },
      { prop: "onRetry / onCancel / onCopy", type: "callbacks", def: "-", desc: "Retry, cancel, and copy notifications. The component never sends a request." },
      { prop: "view / wrap / defaultSection / renderBody", type: "misc", def: "-", desc: "Formatted vs raw, wrapped vs scrolling, initial open section, custom body renderer (receives redacted value)." },
    ],
    accessibility: [
      "Status, method, and redaction are icon + text label - never color alone; survives forced-colors.",
      "Each section is a disclosure button (aria-expanded) controlling a labelled region; payload text stays selectable and long lines scroll horizontally.",
      "Search never exposes redacted values; a polite role=status region announces copy success and state changes only.",
      "Reduced motion renders final state with no perpetual spinner; controls are focus-visible.",
    ],
    performance: [
      "Motion animates only opacity/transform/width/height; the in-flight pulse stops the moment a terminal state arrives.",
      "Body serialization + redaction are memoised; section panels mount lazily via AnimatePresence.",
      "Presentation-only - no model/socket/timers/network.",
    ],
  },
  "approval-workflow": {
    usage: `import { ApprovalWorkflow, type ApprovalWorkflowData } from "@/components/motiq/approval-workflow";

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
      { prop: "workflow", type: "ApprovalWorkflowData", def: "-", desc: "{ id, title, requester, status, stages, currentStageId?, risk?, priority?, deadline?, attachments?, history? }. Statuses: draft|pending|in_review|approved|rejected|changes_requested|cancelled|expired (required)." },
      { prop: "stages[]", type: "WorkflowStage[]", def: "-", desc: "{ id, name, status, reviewers[], mode?, requiredApprovals? }. mode: 'all' (sequential) | 'any' (parallel) | 'quorum' (min N)." },
      { prop: "currentUserId", type: "string", def: "-", desc: "The viewer - surfaces the current-user action state." },
      { prop: "canAct", type: "(action, ctx) => boolean | { allowed; reason? }", def: "allow", desc: "App authorization gate. The component never decides permissions; false disables the action and shows the reason." },
      { prop: "onApprove / onReject / onRequestChanges / onComment / onCancel / onResubmit", type: "callbacks", def: "-", desc: "Fired by the current-stage actions; your app updates the workflow prop in response." },
      { prop: "compactCompleted / confirmReject / now", type: "misc", def: "-", desc: "Collapse resolved stages; require a confirm before reject; stable epoch for relative timestamps." },
    ],
    accessibility: [
      "Every status (workflow, stage, reviewer decision) is icon + text label + border - never color alone.",
      "Actions are real buttons in a labelled group; app-denied actions are disabled with the host's reason via title + aria-describedby + visible text.",
      "Destructive reject opens a role=alertdialog confirm; comment composer + decision history are disclosures with a labelled textarea.",
      "Focus moves to a polite role=status region after each action; reduced motion renders the final state.",
    ],
    performance: [
      "Motion drives only opacity/transform/width (progress, disclosures, list insert/exit); nothing animates per frame.",
      "Presentation-only - no timers/network/model; the host owns state.",
      "Collapsed stages and closed panels mount lazily; history rows keyed for continuity.",
    ],
  },
  "filter-result-transition": {
    usage: `import { FilterResultTransition, type ActiveFilter } from "@/components/motiq/filter-result-transition";

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
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { value: state } = useSequence(["loading", "idle"] as const, { intervalMs: 1200, loop: true, paused: !visible });

<FilterResultTransition state={state} items={RESULTS} getItemId={(i) => i.id} renderItem={renderItem} />

// In production this comes from your own query lifecycle — set it while a search request is in flight; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "items / getItemId", type: "T[] / (item) => string", def: "-", desc: "Already-filtered items + stable identity - the key to continuity, focus preservation, and not replaying survivors (required)." },
      { prop: "renderItem", type: "(item, ctx) => ReactNode", def: "-", desc: "Renders one card; ctx = { index, layout, focused }. Keep controls inside the card, not nested (required)." },
      { prop: "layout", type: `"cards" | "list" | "grid"`, def: `"cards"`, desc: "Arrangement; grid reflows responsively with layout animation." },
      { prop: "focusedItemId / onFocusFallback", type: "string | null / cb", def: "-", desc: "If the focused item disappears after a filter, the fallback fires so focus never drops to the page root." },
      { prop: "activeFilters / onRemoveFilter / onClearFilters", type: "ActiveFilter[] / callbacks", def: "-", desc: "Removable filter chips with keyboard-accessible removal + clear-all." },
      { prop: "state / loading / error / empty / resultLabel / staggerLimit", type: "misc", def: "- / 8", desc: "Lifecycle + labels, count-line override, and entrance-stagger cap." },
    ],
    accessibility: [
      "Results render in a semantic list labelled by the morphing result count; the count is announced politely and rate-limited.",
      "Active filters are chips with real remove buttons + a clear-all - fully keyboard operable.",
      "Focus contract: when focusedItemId is filtered out, onFocusFallback fires (or a results anchor is focused) so focus is never lost to the page root.",
      "Loading uses aria-busy + label; error uses role=alert; empty gives actionable guidance; reduced motion updates instantly.",
    ],
    performance: [
      "Results appear synchronously - animation never gates the data; only entering cards animate, survivors keep their DOM node.",
      "Entrance stagger is capped (staggerLimit); transforms are opacity/scale/layout only (compositor).",
      "For very large collections keep passed items bounded (page/virtualize upstream) - this is a transition layer for the visible set.",
    ],
  },
  "swipe-action-row": {
    usage: `import { SwipeActionRow, SwipeActionGroup, type SwipeAction } from "@/components/motiq/swipe-action-row";

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
      { prop: "children", type: "ReactNode", def: "-", desc: "The row's main content (title, meta, thumbnail)." },
      { prop: "leftActions / rightActions", type: "SwipeAction[]", def: "[]", desc: "Actions per edge { id, label, icon?, tone?, destructive?, confirm? }. tone maps to a semantic --color-* token." },
      { prop: "onAction", type: "(actionId, side) => void", def: "-", desc: "Fired when an action commits; for destructive/confirm actions only after the inline Confirm step." },
      { prop: "threshold / fullSwipe / confirmAction", type: "number / boolean / boolean", def: "48 / false / false", desc: "Snap-open distance; opt-in full-swipe-to-fire (off by default); force confirm on every action." },
      { prop: "open / defaultOpen / onOpenChange", type: `"left" | "right" | null`, def: "null", desc: "Controlled/uncontrolled open side with change callback." },
      { prop: "renderActionMenu / disabled / reducedMotion / label", type: "misc", def: "-", desc: "Custom overflow menu, disable gestures, force reduced motion, accessible row label." },
      { prop: "<SwipeActionGroup>", type: "component", def: "-", desc: "Wrap rows so opening one snaps any other open row shut (only-one-open)." },
    ],
    accessibility: [
      "Never touch-only: every action is a real button reachable by Tab (focus reveals its side) and via an aria-haspopup overflow menu - actions work with no swiping.",
      "Destructive actions are guarded by a two-step inline confirm (role=alertdialog); they carry label + icon + --color-error, never color alone.",
      "A polite role=status region announces completed and cancelled actions; confirm moves focus to Confirm, cancel restores focus.",
      "Targets are ≥44px; the menu closes on Escape/outside-click; reduced motion drops drag physics while every action stays operable.",
    ],
    performance: [
      "Motion animates only transform (x) via a single useMotionValue; threshold/full-swipe feedback uses useTransform (no React re-render during a drag).",
      "Springs are interruption-safe and torn down on unmount; the overflow menu + confirm bar mount lazily via AnimatePresence.",
      "Presentation-only - no timers/network/per-frame loops; the host owns list state, removal, and undo.",
    ],
  },
  "tool-call-activity": {
    usage: `import { ToolCallActivity, type ToolCall } from "@/components/motiq/tool-call-activity";

// Presentation-only: your app owns the calls + statuses. It never runs a tool.
<ToolCallActivity
  calls={calls}          // { id, name, status, input?, output?, error?, progress? }[]
  onApprove={(id) => approve(id)}
  onReject={(id) => reject(id)}
  onRetry={(id) => retry(id)}
  compactCompleted
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(CALLS, { intervalMs: 900, paused: !visible });

<ToolCallActivity calls={CALLS.slice(0, index + 1)} />

// In production this comes from your agent's tool-call events; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "calls", type: "ToolCall[]", def: "-", desc: "Tool calls in display order: { id, name, category?, status, startedAt?, durationMs?, input?, output?, error?, progress?, details? }. Statuses: queued|running|completed|failed|cancelled|waiting_approval|approved|rejected (required)." },
      { prop: "activeCallId", type: "string", def: "first running", desc: "Call emphasized as current (accent bar + ring)." },
      { prop: "onApprove / onReject", type: "(id) => void", def: "-", desc: "Fired by inline controls on a waiting_approval call." },
      { prop: "onRetry", type: "(id) => void", def: "-", desc: "Fired by Retry on a failed call." },
      { prop: "onToggle / onCopyDetails", type: "callbacks", def: "-", desc: "Expand/collapse and copy-details callbacks." },
      { prop: "compactCompleted", type: "boolean", def: "true", desc: "Compress resolved calls to a slim line." },
      { prop: "showDurations / renderInput / renderOutput", type: "misc", def: "-", desc: "Show durations; custom expanded-panel renderers." },
    ],
    accessibility: [
      "Every status is icon + text label + border - never color alone - so it survives forced-colors.",
      "Each call header is a real disclosure button with aria-expanded; details are a labelled region via aria-controls, mounted only while open.",
      "Approve/Reject/Retry/Copy are real buttons with descriptive names; a polite role=status region announces lifecycle transitions only.",
      "After approve or retry, focus moves to that call's header; under reduced motion everything renders in final state with no perpetual spinner.",
    ],
    performance: [
      "Motion drives only opacity/transform/width; the running indicator stops once a call resolves.",
      "Expanded details mount lazily via AnimatePresence; presentation-only - no model, timers, or network.",
      "Pair with useVisibilityPause in the host to pause progress updates offscreen/when the tab is hidden.",
    ],
  },
  "live-log-stream": {
    usage: `import { LiveLogStream, type LogEntry } from "@/components/motiq/live-log-stream";

// Your app owns the buffer; append as lines arrive.
const [entries, setEntries] = React.useState<LogEntry[]>([]);

<LiveLogStream
  entries={entries}        // { id, level, message, timestamp?, source? }[]
  status="streaming"       // "streaming" | "idle" | "completed" | "error"
  maxEntries={500}
  onClear={() => setEntries([])}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index, done } = useSequence(ENTRIES, { intervalMs: 900, paused: !visible });

<LiveLogStream entries={ENTRIES.slice(0, index + 1)} status={done ? "completed" : "streaming"} />

// In production this comes from your log socket or SSE endpoint; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "entries", type: "LogEntry[]", def: "-", desc: "Lines { id, level, message, timestamp?, source? }; level debug|info|success|warning|error. The app owns this (required)." },
      { prop: "status", type: `"streaming" | "idle" | "completed" | "error"`, def: `"streaming"`, desc: "Lifecycle; streaming shows a live pulse; error shows a banner." },
      { prop: "follow / paused / query", type: "controlled state", def: "auto", desc: "Auto-follow, freeze-with-count, and search - controlled when provided, else internal." },
      { prop: "levels / maxEntries", type: "LogLevel[] / number", def: "all / 500", desc: "Selectable levels and bounded retained history." },
      { prop: "formatTimestamp / renderEntry", type: "callbacks", def: "-", desc: "Override timestamp or full line markup." },
      { prop: "onClear / onRetry", type: "() => void", def: "-", desc: "Clear (app empties entries) and Retry (error state)." },
    ],
    accessibility: [
      "Level is icon + text label + monospace prefix - never color alone; survives forced-colors.",
      "Keyboard-focusable role=log region; user scrolling is never disabled; search/filter/pause/copy/clear/jump are focus-visible controls.",
      "Log text stays selectable; the live region announces only lifecycle changes, never line-by-line.",
      "Reduced motion makes new lines appear instantly and disables the live pulse.",
    ],
    performance: [
      "No React state per frame - follow scrolls via requestAnimationFrame (shared useAutoFollow); only the new-lines counter is state.",
      "History bounded by maxEntries; rows memoised; entrance motion pauses offscreen (useVisibilityPause).",
      "Virtualization integration point: rows render 1:1 with the visible set, so very large/high-frequency streams should wrap the list body in a windowing layer (e.g. a virtualizer) with useAutoFollow's onScroll on the same container; no virtualization dependency ships by default - lower maxEntries until then.",
    ],
  },
  "activity-stream": {
    usage: `import { ActivityStream, type ActivityEvent } from "@/components/motiq/activity-stream";

// Your app owns the events (from any realtime or history source).
const events: ActivityEvent[] = [
  { id: "1", type: "mentioned", actor: { id: "riley", name: "Riley Okafor" }, target: "the Q3 review", timestamp: Date.now() - 120000 },
  { id: "2", type: "approved", actor: { id: "morgan", name: "Morgan Vale" }, target: "the launch checklist", timestamp: Date.now() - 540000 },
];

<ActivityStream events={events} collapseThreshold={3} unreadAfter={lastSeenAt} />`,
    api: [
      { prop: "events", type: "ActivityEvent[]", def: "-", desc: "Controlled events { id, type, actor, target?, action?, timestamp, metadata?, preview?, link? } (required)." },
      { prop: "collapseThreshold", type: "number", def: "3", desc: "Consecutive same-key events collapse into an expandable group; 0/1 disables." },
      { prop: "groupBy", type: "(event) => string", def: "actor+type+target", desc: "Override the grouping bucket key." },
      { prop: "unreadAfter", type: "Date | number | string", def: "-", desc: "Events strictly newer are unread and draw a labelled divider + jump control." },
      { prop: "filters / defaultFilters / onFiltersChange", type: "ActivityFilters", def: "-", desc: "Controlled/initial type+actor filters; the chip bar drives changes." },
      { prop: "onEventAction / renderMetadata / formatTimestamp", type: "callbacks", def: "-", desc: "Inline action, custom metadata, timestamp override (defaults to relative)." },
    ],
    accessibility: [
      "Semantic list; each row reads as meaningful text with an avatar carrying an accessible name.",
      "Event type and unread state use icon + tone + text label, never color alone; survives forced-colors.",
      "Groups collapse behind a button with aria-expanded/aria-controls, operable via click, Enter, and Space.",
      "Reduced motion makes live-arrival and group expansion instant; layout stays stable.",
    ],
    performance: [
      "Presentation only - re-renders only when events or filters change.",
      "AnimatePresence drives arrivals and group open/close (transform/opacity + gated height).",
      "Chevron/idle motion pauses offscreen (useVisibilityPause); rows/groups derived via memoized passes.",
    ],
  },
  "streaming-data-rows": {
    usage: `import { StreamingDataRows, StatusPill, type Column } from "@/components/motiq/streaming-data-rows";

const columns: Column<Order>[] = [
  { key: "ref", header: "Order", sortable: true, value: (r) => r.ref },
  { key: "amount", header: "Amount", align: "end", sortable: true, numeric: true, value: (r) => r.amount },
  { key: "status", header: "Status", sortable: true, value: (r) => r.status, render: (r) => <StatusPill status={r.status} /> },
];

<StreamingDataRows rows={orders} columns={columns} getRowId={(r) => r.id} sort={sort} onSortChange={setSort} caption="Live order queue." />`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const { index } = useSequence(ORDERS, { intervalMs: 900, paused: !visible });

<StreamingDataRows rows={ORDERS.slice(0, index + 1)} />

// In production this comes from your realtime table feed — rows arriving, changing status, and disappearing; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "rows / columns", type: "T[] / Column<T>[]", def: "-", desc: "Controlled rows + column defs (header, render?, value, sortable?, numeric?, format?, align?) (required)." },
      { prop: "getRowId", type: "(row) => string", def: "-", desc: "Stable identity - the key to focus preservation and continuity on update/resort (required)." },
      { prop: "sort / onSortChange", type: "SortState | null", def: "-", desc: "Controlled sort (none → asc → desc); omit for uncontrolled." },
      { prop: "paused / highlightDuration", type: "boolean / ms", def: "false / 1400", desc: "Freeze change emphasis + morphs; emphasis duration." },
      { prop: "rowActions / onRowAction", type: "callbacks", def: "-", desc: "Keyboard-accessible per-row action buttons." },
      { prop: "state / onRetry / renderMobileRow", type: "misc", def: `"idle"`, desc: "Lifecycle (idle/loading/error), retry, and stacked mobile layout." },
    ],
    accessibility: [
      "Real semantic table with caption, th[scope=col], and thead/tbody; sortable headers are buttons that set aria-sort.",
      "Change is signalled by a ▲/▼ glyph and status label/shape - never color alone.",
      "Stable row keys keep focus on update/resort; a rate-limited polite live region summarizes activity.",
      "Reduced motion makes every emphasis an instant swap; loading uses aria-busy, error uses role=alert.",
    ],
    performance: [
      "For live SUBSETS, not bulk data - it renders every row and has no virtualization; keep the visible window bounded (latest 50–200 rows).",
      "For large/scrollable datasets, pair with a windowing layer (TanStack Virtual / react-window) or server paging and feed only the on-screen slice.",
      "Layout/opacity-only transforms keep reorders on the compositor; numeric morphs snap under reduced motion; the announcer coalesces bursts (~1.6s throttle).",
    ],
  },
  "luminous-topography": {
    usage: `import { LuminousTopography } from "@/components/motiq/luminous-topography";

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
      { prop: "pauseWhenHidden / interactive / reducedMotion", type: "boolean", def: "true / false / -", desc: "Offscreen pause, optional pointer highlight, force-static." },
    ],
    accessibility: [
      "The animated field is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area.",
      "prefers-reduced-motion stops all drift and the light sweep; markup does not vary by preference, so there is no hydration mismatch.",
      "forced-colors: active falls back to plain CanvasText contours so structure and overlaid text stay legible.",
      "The pointer highlight is additive only and disabled under reduced motion; the component never depends on hover.",
    ],
    performance: [
      "SVG paths + gradients only; drift + light animate transform via CSS keyframes - no canvas, no WebGL, no JS animation loop, no per-frame React state.",
      "Geometry is memoised and deterministically seeded, identical on server and client.",
      "Pauses drift + light offscreen and when the tab is hidden (useVisibilityPause); mobile drops the deepest layer for reduced density.",
    ],
  },
  "workflow-topology-field": {
    usage: `import { WorkflowTopologyField } from "@/components/motiq/workflow-topology-field";

// Your app owns the topology + status; this component only renders it.
<WorkflowTopologyField
  nodes={nodes}
  connections={connections}
  activeNodeIds={activeNodeIds}
  activeConnectionIds={activeConnectionIds}
  safeArea={{ x: 0.04, y: 0.14, w: 0.5, h: 0.72 }}
  className="min-h-[440px]"
>
  <YourHeroContent />
</WorkflowTopologyField>`,
    api: [
      { prop: "nodes / connections", type: "TopologyNode[] / TopologyConnection[]", def: "deterministic default", desc: "Application-defined workflow graph. Nodes carry x,y (0–1), status, group, label." },
      { prop: "activeNodeIds / activeConnectionIds", type: "string[]", def: "-", desc: "The live path - active connections animate a directional flow." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where lattice + topology thin so foreground text stays readable." },
      { prop: "density / depth / intensity / speed", type: "number", def: "1 / 2 / 1 / 1", desc: "Lattice density, parallax layers (0–3), luminance (0–1.4), flow speed (0 stops flow)." },
      { prop: "interactive / pauseWhenHidden / reducedMotion", type: "boolean", def: "false / true / -", desc: "Optional pointer highlight, offscreen pause, force-static." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for the lattice + default topology (SSR-stable)." },
    ],
    accessibility: [
      "The topology field is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area.",
      "Node status is carried by shape + glyph (check / cross / filled / hollow) and a ring, never color alone - failures stay understandable in monochrome.",
      "prefers-reduced-motion removes flow, pulse, and drift; markup does not vary by preference, so there is no hydration mismatch.",
      "forced-colors: active falls back to CanvasText strokes so structure + status stay legible; the pointer highlight is additive and never required.",
    ],
    performance: [
      "SVG paths + circles only; the active path animates stroke-dashoffset and the active-node ring pulses via CSS keyframes - no canvas, no WebGL, no JS animation loop, no per-frame React state.",
      "Topology + lattice geometry is memoised and deterministically seeded, identical on server and client.",
      "Pauses flow + drift offscreen and when the tab is hidden (useVisibilityPause); mobile drops the deepest lattice layer and node labels.",
    ],
  },
  "queue-pulse-lanes": {
    usage: `import { QueuePulseLanes } from "@/components/motiq/queue-pulse-lanes";

// Your app owns the lane data; this component only renders it.
<QueuePulseLanes
  lanes={lanes}
  safeArea={{ x: 0.04, y: 0.12, w: 0.5, h: 0.76 }}
  className="min-h-[440px]"
>
  <YourHeroContent />
</QueuePulseLanes>`,
    api: [
      { prop: "lanes", type: "LaneData[]", def: "deterministic default", desc: "Each lane: id, label?, queued, active, completed, delayed?, blocked?, throughput?, capacity?, status?." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where lanes quiet so foreground text stays readable." },
      { prop: "density / intensity / speed", type: "number", def: "1 / 1 / 1", desc: "Pulse-count multiplier, luminance (0–1.4), flow speed (0 freezes)." },
      { prop: "interactive / pauseWhenHidden / reducedMotion", type: "boolean", def: "false / true / -", desc: "Optional pointer highlight, offscreen pause, force-static snapshot." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for pulse phase/jitter (SSR-stable)." },
    ],
    accessibility: [
      "The lanes are decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area.",
      "Blocked lanes stop at a bar cap + square glyph and delayed lanes carry a clock-tick glyph + dashed rail - status is legible in monochrome, never color alone.",
      "prefers-reduced-motion (and the reducedMotion prop) hide the flowing pulses and keep a meaningful static snapshot (occupancy fill bars + status markers); markup does not vary by preference, so no hydration mismatch.",
      "forced-colors: active falls back to CanvasText rails + Canvas glyphs so lane structure + status stay legible.",
    ],
    performance: [
      "SVG rects animated by a single translateX keyframe (per-pulse CSS vars) - no canvas, no WebGL, no JS animation loop, no per-frame React state.",
      "Lane geometry is memoised and deterministically seeded, identical on server and client; congestion raises pulse count and duration.",
      "Pauses the pulses offscreen and when the tab is hidden (useVisibilityPause); mobile collapses lanes past the first few.",
    ],
  },
  "adaptive-safe-zone-grid": {
    usage: `import { AdaptiveSafeZoneGrid } from "@/components/motiq/adaptive-safe-zone-grid";

<AdaptiveSafeZoneGrid
  safeArea={[{ x: 0.06, y: 0.16, w: 0.5, h: 0.66 }]}
  focalPoint={{ x: 0.32, y: 0.5 }}
  className="min-h-[440px]"
>
  <YourHeroContent />
</AdaptiveSafeZoneGrid>`,
    api: [
      { prop: "safeArea", type: "{x,y,w,h} | […]", def: "left column", desc: "One or many regions (0–1) the grid quiets so foreground copy stays readable." },
      { prop: "focalPoint", type: "{x,y}", def: "{0.32,0.5}", desc: "Where structure concentrates; the perspective skew leans toward it." },
      { prop: "density / intensity / speed", type: "number", def: "1 / 1 / 1", desc: "Grid line-count multiplier, luminance (0–1.4), shimmer speed (0 stops)." },
      { prop: "perspective / depth / highlightCells", type: "misc", def: "false / 1 / -", desc: "Optional subtle skew toward the focal point and accent-tinted cells." },
      { prop: "interactive / pauseWhenHidden / reducedMotion / seed", type: "misc", def: "false / true / - / 1", desc: "Pointer glow, offscreen pause, force-static, deterministic seed." },
    ],
    accessibility: [
      "The grid is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the quieted safe areas.",
      "prefers-reduced-motion (and the reducedMotion prop) stop the shimmer; the static grid remains fully designed. Markup does not vary by preference - no hydration mismatch.",
      "forced-colors: active falls back to plain CanvasText grid lines so structure stays legible; the pointer glow is additive and never required.",
    ],
    performance: [
      "SVG lines + an SVG mask only; the shimmer is a single CSS translate behind a grid-shaped mask - no canvas, no WebGL, no JS animation loop, no per-frame React state.",
      "The safe-area attenuation is a composed radial-fade mask (multiple zones compose without seams); geometry is memoised and deterministically seeded.",
      "Pauses the shimmer offscreen and when the tab is hidden (useVisibilityPause); mobile drops the fine detail layer + shimmer.",
    ],
  },
  "runtime-signal-map": {
    usage: `import { RuntimeSignalMap } from "@/components/motiq/runtime-signal-map";

// Your app owns the topology + health; this component only renders it.
<RuntimeSignalMap
  services={services}
  regions={regions}
  connections={connections}
  safeArea={{ x: 0.02, y: 0.12, w: 0.52, h: 0.76 }}
  className="min-h-[440px]"
>
  <YourHeroContent />
</RuntimeSignalMap>`,
    api: [
      { prop: "services / regions / connections", type: "ServiceData[] / RegionData[] / ConnectionData[]", def: "fictional default", desc: "The service topology: services carry x,y (0–1), health, region; connections carry direction, latencyBand, activity." },
      { prop: "activity / density / intensity / speed", type: "number", def: "1 / 1 / 1 / 1", desc: "Global request rate, packet density, luminance (0–1.4), flow speed (0 stalls)." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where signals thin so foreground text stays readable." },
      { prop: "interactive / pauseWhenHidden / reducedMotion / seed", type: "misc", def: "false / true / - / 1", desc: "Pointer highlight, offscreen pause, force-static snapshot, deterministic seed." },
    ],
    accessibility: [
      "The map is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area.",
      "Health is carried by three non-color cues - dashed vs solid strokes, a per-node/edge glyph (× error, ~ degraded, dot healthy), and slowed/stalled flow - never color alone.",
      "prefers-reduced-motion (and the reducedMotion prop) draw a single static frame (topology + signals at rest); the loop never starts, so there is no motion and no wasted work.",
      "forced-colors: active hides the canvas and shows a plain CanvasText-bordered box behind the foreground copy so text stays legible.",
    ],
    performance: [
      "A single <canvas> + one requestAnimationFrame loop - no per-frame React state, no WebGL, no global heavy dep (canvas is native and isolated to this item).",
      "DPR is capped at 2; a ResizeObserver re-measures on resize; packet budget scales with container width (mobile floor) and density; tokens are re-read only every ~30 frames.",
      "The loop is gated on visibility + reduced motion: it stops entirely offscreen / when the tab is hidden and draws one static frame instead. No Math.random/Date.now at render → deterministic first paint.",
    ],
  },
  "event-propagation-matrix": {
    usage: `import { EventPropagationMatrix } from "@/components/motiq/event-propagation-matrix";

// Your app owns the events; this component only renders their propagation.
<EventPropagationMatrix
  events={events}
  rows={6}
  cols={10}
  safeArea={{ x: 0.04, y: 0.12, w: 0.5, h: 0.76 }}
  className="min-h-[440px]"
>
  <YourHeroContent />
</EventPropagationMatrix>`,
    api: [
      { prop: "events", type: "EventData[]", def: "deterministic default", desc: "Each event: id, origin cell, category, severity, direction, affectedRegions?, acknowledged?, failed?." },
      { prop: "rows / cols", type: "number", def: "matrix shape", desc: "The structured matrix dimensions events propagate through." },
      { prop: "safeArea / density / intensity / speed", type: "misc", def: "left / 1 / 1 / 1", desc: "Readable region (0–1), cell density, luminance (0–1.4), propagation speed." },
      { prop: "interactive / pauseWhenHidden / reducedMotion / seed", type: "misc", def: "false / true / - / 1", desc: "Pointer highlight, offscreen pause, force-static, deterministic seed." },
    ],
    accessibility: [
      "The matrix is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area.",
      "Failed propagation halts with a × glyph and acknowledged events dim with a check glyph - relationships stay legible in monochrome, never color alone.",
      "prefers-reduced-motion (and the reducedMotion prop) keep origin + propagated cells lit statically (a current-relationships view) with no movement; markup does not vary by preference, so no hydration mismatch.",
      "forced-colors: active falls back to CanvasText cells/links so the matrix structure stays legible.",
    ],
    performance: [
      "SVG cells animated by staggered per-cell CSS keyframes (animation-delay in reach order) - no canvas, no WebGL, no JS animation loop, no per-frame React state.",
      "Propagation follows the grid (each lit cell links to a parent one orthogonal step closer to the origin); live events are capped and per-cell intensity is damped so overlaps never turn to noise.",
      "Pauses offscreen and when the tab is hidden (useVisibilityPause); mobile renders a smaller matrix. Geometry is memoised and deterministically seeded.",
    ],
  },
  "data-contour-surface": {
    usage: `import { DataContourSurface } from "@/components/motiq/data-contour-surface";

// Your app owns the data; contours are computed from it.
<DataContourSurface
  points={[{ x: 0.7, y: 0.4, value: 1 }, { x: 0.4, y: 0.7, value: -0.6 }]}
  thresholds={[0.3, 0.6]}
  activeRegion={{ x: 0.6, y: 0.3, w: 0.3, h: 0.3 }}
  safeArea={{ x: 0.04, y: 0.12, w: 0.5, h: 0.76 }}
  className="min-h-[440px]"
>
  <YourHeroContent />
</DataContourSurface>`,
    api: [
      { prop: "points", type: "{x,y,value,radius?}[]", def: "fictional default", desc: "Signed pressure points (0–1). Positive raises the field, negative lowers it - contours are computed from this." },
      { prop: "thresholds", type: "number[]", def: "auto", desc: "Levels to emphasize with heavier bands (a non-color weight cue)." },
      { prop: "activeRegion / comparisonRegions", type: "{x,y,w,h} / […]", def: "-", desc: "Active region brightens with corner ticks; comparison regions render ghosted (dashed, muted)." },
      { prop: "safeArea / density / intensity / speed", type: "misc", def: "left / 1 / 1 / 1", desc: "Readable region, grid resolution, luminance (0–1.4), drift speed (0 idles)." },
      { prop: "pauseWhenHidden / reducedMotion / seed", type: "misc", def: "true / - / 1", desc: "Offscreen pause, force-static, deterministic seed." },
    ],
    accessibility: [
      "The surface is decorative (aria-hidden); children render in a separate non-hidden layer that stays readable over the safe area (only emphasized thresholds survive there, faintly).",
      "Threshold emphasis and the active region are carried by stroke weight + corner ticks, not color alone; light and dark are each intentionally tinted from semantic tokens.",
      "prefers-reduced-motion (and the reducedMotion prop) draw a single deterministic frame from the data with no drift and snap on data changes; there is no hydration mismatch.",
      "forced-colors: active hides the canvas and shows a plain CanvasText-bordered box behind the foreground copy so text stays legible.",
    ],
    performance: [
      "A single <canvas> + one requestAnimationFrame loop running marching-squares over a coarse scalar grid - no per-frame React state, no WebGL, no global heavy dep (isolated to this item).",
      "Grid resolution is capped (mobile coarsens automatically); DPR capped at 2; a ResizeObserver re-measures; the loop idles when there is nothing to animate.",
      "Data changes ease via a 600ms grid interpolation; drift is exactly 0 at t=0 so the first frame is a pure function of the data → deterministic first paint (no Math.random/Date.now at render).",
    ],
  },
  "agent-operations-hero": {
    usage: `import { AgentOperationsHero } from "@/components/motiq/blocks/agent-operations-hero";

// Your app owns the phase + data; the hero only renders it.
<AgentOperationsHero
  headline="Ship agents that show their work"
  copy="Watch a run move from prompt to approval to answer - grounded in your sources."
  primaryCta={{ label: "Start building", href: "/signup" }}
  secondaryCta={{ label: "See a live run", href: "/demo" }}
  defaultPhase="running"
/>`,
    api: [
      { prop: "headline / copy", type: "ReactNode", def: "demo copy", desc: "Outcome headline (renders as the section heading) and supporting copy." },
      { prop: "primaryCta / secondaryCta", type: "{label,href?,onClick?} | ReactNode", def: "demo CTAs", desc: "Real link/button CTAs." },
      { prop: "phase / defaultPhase / onPhaseChange", type: "AgentHeroPhase", def: "idle", desc: "idle · running · tool-active · waiting · completed · failed. App-controlled; child callbacks advance it." },
      { prop: "defaultDetailsOpen", type: "boolean", def: "false", desc: "Phones collapse the tool-call and sources panels behind a disclosure; set true to open it from the start. From lg the panels are always shown and this prop has no effect." },
      { prop: "dataset / background", type: "misc", def: "fictional / -", desc: "Overridable deterministic demo data; optional decorative background slot." },
    ],
    accessibility: [
      "The headline is a real section heading and the CTAs are real links/buttons; the live status is announced as text, never color alone.",
      "Approval controls come from the composed Agent Run Timeline and are keyboard-operable; reduced motion is inherited from the children.",
      "Never renders private chain-of-thought and never executes or simulates a model - it only renders the supplied phase + data.",
    ],
    performance: [
      "A presentation composition: Agent Run Timeline (trimmed), Prompt Composer (compact), Tool Call Activity (one active tool), and Source Citation Rail (one result) at reduced complexity.",
      "All timestamps are fixed epoch constants - no Date.now/Math.random/new Date at render → identical server/client markup (no hydration mismatch).",
      "Children pause their own continuous work offscreen; the initial state is static.",
    ],
  },
  "deployment-control-hero": {
    usage: `import { DeploymentControlHero } from "@/components/motiq/blocks/deployment-control-hero";

<DeploymentControlHero
  headline="Ship to production with confidence"
  primaryCta={{ label: "Deploy now", href: "/new" }}
  secondaryCta={{ label: "Read the docs", href: "/docs" }}
  defaultPhase="deploying"
/>`,
    api: [
      { prop: "headline / copy", type: "ReactNode", def: "demo copy", desc: "Outcome headline (section heading) and supporting copy." },
      { prop: "primaryCta / secondaryCta", type: "{label,href?,onClick?} | ReactNode", def: "demo CTAs", desc: "Real link/button CTAs; a primary without href advances the demo phase." },
      { prop: "phase / defaultPhase / onPhaseChange", type: "DeployHeroPhase", def: "ready", desc: "ready · deploying · validating · failed · retrying · completed. App-controlled." },
      { prop: "defaultDetailPanelsOpen", type: "boolean", def: "false", desc: "Phones collapse the deploy-output and release-response panels behind a disclosure; set true to open it from the start. From sm the panels are always shown and this prop has no effect." },
      { prop: "dataset / environments / background", type: "misc", def: "provider-neutral / - / -", desc: "Overridable demo data, environment list, optional decorative slot." },
    ],
    accessibility: [
      "The headline is a real heading bound to the section; the environment switcher is keyboard-operable; the log region has an accessible name.",
      "Stage status is carried by the Deployment Pipeline as text + glyph, never color alone; reduced motion is inherited from the children.",
      "Provider-neutral, clearly-fictional demo data - nothing is really deployed.",
    ],
    performance: [
      "A presentation composition: Environment Switcher (compact), Deployment Pipeline (four stages), a short Live Log Stream, and one API Request Inspector result.",
      "Fixed epoch timestamps; the surface is a pure function of phase → identical server/client markup.",
      "The log stream pauses offscreen; the initial state is static; readable on laptop and mobile (stacks).",
    ],
  },
  "live-data-command-hero": {
    usage: `import { LiveDataCommandHero } from "@/components/motiq/blocks/live-data-command-hero";

<LiveDataCommandHero
  headline="Operational data you can trust in the moment"
  primaryCta={{ label: "Get started", href: "/signup" }}
  secondaryCta={{ label: "Watch it live", href: "/demo" }}
  defaultPhase="live"
/>`,
    api: [
      { prop: "headline / copy", type: "ReactNode", def: "demo copy", desc: "Outcome headline (section heading) and supporting copy." },
      { prop: "primaryCta / secondaryCta", type: "{label,href?,onClick?} | ReactNode", def: "demo CTAs", desc: "Real link/button CTAs." },
      { prop: "phase / defaultPhase / onPhaseChange", type: "DataHeroPhase", def: "initial", desc: "initial · live · filtering · refreshing · partial-update · stale · error · recovery." },
      { prop: "dataset / background", type: "misc", def: "fictional / -", desc: "Overridable deterministic demo data; optional decorative slot." },
    ],
    accessibility: [
      "The headline is a real heading; metric changes are announced politely via the children's live regions, not per-frame.",
      "Stale/error are carried by text + glyph, never color alone; reduced motion snaps the number morphs (inherited from the children).",
      "Clearly-fictional demo data - not real telemetry.",
    ],
    performance: [
      "A presentation composition: KPI Number Morph (three metrics), Data Refresh State, a small Streaming Data Rows subset, and Filter Result Transition.",
      "Fixed epoch timestamps; the only motion-over-time is a live-phase interval started in an effect and paused offscreen - no Date.now/Math.random at render.",
      "The streaming subset pauses offscreen; the initial state is static; stacks on mobile.",
    ],
  },
  "collaborative-launch-hero": {
    usage: `import { CollaborativeLaunchHero } from "@/components/motiq/blocks/collaborative-launch-hero";

<CollaborativeLaunchHero
  headline="Reviews that reach a decision"
  primaryCta={{ label: "Start a review", href: "/new" }}
  secondaryCta={{ label: "Take the tour", href: "/tour" }}
  defaultPhase="approval-pending"
/>`,
    api: [
      { prop: "headline / copy", type: "ReactNode", def: "demo copy", desc: "Outcome headline (section heading) and supporting copy." },
      { prop: "primaryCta / secondaryCta", type: "{label,href?,onClick?} | ReactNode", def: "demo CTAs", desc: "Real link/button CTAs." },
      { prop: "phase / defaultPhase / onPhaseChange", type: "CollabHeroPhase", def: "review-open", desc: "review-open · commenting · changes-requested · approval-pending · approved · rejected · resolved." },
      { prop: "dataset / background", type: "misc", def: "fictional / -", desc: "Overridable deterministic cast; optional decorative slot." },
    ],
    accessibility: [
      "The headline is a real heading; approval controls (from Approval Workflow) are keyboard-operable and advance the phase.",
      "Status is carried by text + a non-color glyph; presence and typing announce politely via the composed components; reduced motion is inherited.",
      "Clearly-fictional cast and content - not real users.",
    ],
    performance: [
      "A presentation composition: Live Presence Stack, Typing and Presence, Approval Workflow (one pending decision), Comment Thread (compact), and Activity Stream.",
      "Fixed epoch demo data; a mount effect re-anchors relative timestamps to the current minute (post-hydration), so server/client markup match.",
      "Streams/typing pause offscreen; the initial state is static; stacks on mobile.",
    ],
  },
  "ai-response-stream": {
    usage: `import { AiResponseStream } from "@/components/motiq/ai-response-stream";

// Your app owns the stream; this component only renders it.
<AiResponseStream
  segments={segments}   // text | code | citation, streamed in by your app
  state={state}         // "streaming" | "stopped" | "complete" | "error"
  sources={sources}
  onStop={() => controller.abort()}
  onRetry={() => refetch()}
/>`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
// Text streams word-by-word, so split the segments into atoms and re-join them; a
// component-level array grows one whole segment at a time, which reads as chunky.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

const ATOMS = PIECES.flatMap((p) =>
  p.type === "text"
    ? p.text.split(/(\\s+)/).filter(Boolean).map((text) => ({ type: "text", text }) as ResponseSegment)
    : [p],
);

const { index, done } = useSequence(ATOMS, { intervalMs: 95, paused: !visible });

// Re-join consecutive text atoms so the rendered paragraphs stay intact.
const segments = React.useMemo(() => {
  const out: ResponseSegment[] = [];
  for (const atom of ATOMS.slice(0, index + 1)) {
    const last = out[out.length - 1];
    if (atom.type === "text" && last?.type === "text") last.text += atom.text;
    else out.push({ ...atom });
  }
  return out;
}, [index]);

<AiResponseStream segments={segments} state={done ? "complete" : "streaming"} sources={SOURCES} />

// In production this comes from your model's token stream — append to \`segments\` as chunks arrive, then set \`state\` to "complete"; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "segments", type: "ResponseSegment[]", def: "-", desc: "Ordered content: text | code | citation. The app streams these in (required)." },
      { prop: "state", type: `"streaming" | "stopped" | "complete" | "error"`, def: "-", desc: "Lifecycle state, owned by the application (required)." },
      { prop: "sources", type: "StreamSource[]", def: "-", desc: "Sources referenced by inline [n] citations; rendered as a numbered rail." },
      { prop: "assistantName", type: "string", def: `"Assistant"`, desc: "Name in the header and announcements." },
      { prop: "caret", type: "boolean", def: "true", desc: "Blinking caret while streaming; ignored under reduced motion." },
      { prop: "onStop / onRetry / onCopy", type: "() => void", def: "-", desc: "Stop (while streaming), Retry (error/stopped), Copy (plain text)." },
    ],
    accessibility: [
      "Rendered text is real and readable (not aria-hidden), so a completed response is read in one pass; a polite role=status region announces lifecycle changes only, never token-by-token.",
      "State uses icon + label + border, not color alone - survives forced-colors.",
      "Stop, Retry, Copy, code-copy, and citations are real buttons/links with accessible names and focus-visible rings.",
      "Under prefers-reduced-motion there is no per-token motion and no caret; content appears immediately.",
    ],
    performance: [
      "Word reveal animates transform + opacity only; existing text never re-animates as new words arrive.",
      "Presentation only - no model, no network; the app owns the stream.",
      "Client component; demo stream pauses offscreen and when the tab is hidden (useVisibilityPause).",
    ],
  },
  "deployment-pipeline": {
    usage: `import { DeploymentPipeline, type Stage } from "@/components/motiq/deployment-pipeline";

const stages: Stage[] = [
  { id: "install", name: "Install", status: "passed", durationMs: 8400, logs: ["$ pnpm install", "Done in 8.4s"] },
  { id: "build", name: "Build", status: "passed", durationMs: 22600, logs: ["$ next build", "Compiled successfully"] },
  { id: "test", name: "Test", status: "failed", durationMs: 14200, logs: ["$ vitest run", "1 failed | 78 passed"] },
  { id: "deploy", name: "Deploy", status: "cancelled" },
];

<DeploymentPipeline stages={stages} defaultExpandedId="test" onRetry={(id) => rerun(id)} />`,
    driving: `import * as React from "react";
import { useSequence, useVisibilityPause } from "@/lib/motiq";

// This component renders what it is handed and animates each item AS IT ARRIVES,
// so a finished array animates once and then sits still. The motion in the preview
// comes from the data being fed in over time — that feed is the app's job.
const ref = React.useRef<HTMLDivElement>(null);
const visible = useVisibilityPause(ref); // hold position offscreen / in a background tab

// One index walks the run: stages before it have passed, the one at it is running.
const { index } = useSequence(STAGES, { intervalMs: 1400, paused: !visible });

const stages = STAGES.map((stage, i) => ({
  ...stage,
  status: i < index ? "passed" : i === index ? "running" : "queued",
}));

<DeploymentPipeline stages={stages} />

// In production this comes from your CI provider's stage events; useSequence is only for demos,
// fixtures, and onboarding tours.`,
    api: [
      { prop: "stages", type: "Stage[]", def: "-", desc: "Ordered stages { id, name, status, durationMs?, logs? }. Status: queued|running|passed|failed|cancelled|skipped. The app owns this data (required)." },
      { prop: "onRetry", type: "(stageId: string) => void", def: "-", desc: "Called when Retry on a failed/cancelled stage is activated." },
      { prop: "defaultExpandedId", type: "string", def: "-", desc: "Id of a stage whose logs start expanded." },
      { prop: "label", type: "string", def: `"Deployment pipeline"`, desc: "Accessible name for the pipeline list." },
    ],
    accessibility: [
      "Ordered list; each stage status is a real text label (Passed, Failed, …) paired with an icon - never color alone.",
      "Log toggles are real buttons with aria-expanded / aria-controls; logs are collapsed by default.",
      "Retry is a real button with an accessible name and focus ring; the component is fully keyboard operable.",
      "Reduced motion disables the running pulse and connector travel - state is shown statically.",
    ],
    performance: [
      "Animates transform/opacity only (pulse, connector, chevron); running motion pauses offscreen / when hidden.",
      "AnimatePresence drives log open/close; only expanded stages render their log block.",
      "No timers or network - purely presentational; re-renders only when stages change.",
    ],
  },
  "live-presence-stack": {
    usage: `import { LivePresenceStack, type PresenceUser } from "@/components/motiq/live-presence-stack";

const users: PresenceUser[] = [
  { id: "1", name: "Ada L.", status: "editing" },
  { id: "2", name: "Kit M.", status: "active" },
  { id: "3", name: "Ravi P.", status: "viewing" },
  { id: "4", name: "Noor S.", status: "idle" },
];

<LivePresenceStack users={users} max={5} onSelect={(id) => focusUser(id)} />`,
    api: [
      { prop: "users", type: "PresenceUser[]", def: "-", desc: "Controlled presence: { id, name, status, color? }. Status: active | idle | editing | viewing (required)." },
      { prop: "max", type: "number", def: "5", desc: "Visible avatars before collapsing into a +N overflow." },
      { prop: "onSelect", type: "(userId: string) => void", def: "-", desc: "Called when a participant is chosen from the detail list." },
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
    usage: `import { KpiNumberMorph } from "@/components/motiq/kpi-number-morph";

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
      { prop: "value", type: "number", def: "-", desc: "Current value (controlled); morphs from the previous value." },
      { prop: "label", type: "string", def: "-", desc: "Metric name above the number." },
      { prop: "prefix / suffix", type: "string", def: "-", desc: "Text around the number (e.g. $, %)." },
      { prop: "decimals", type: "number", def: "0", desc: "Fixed decimals (standard notation)." },
      { prop: "notation", type: `"standard" | "compact"`, def: `"standard"`, desc: "Compact renders 12.4K / 3.1M." },
      { prop: "currency / locale", type: "string", def: "-", desc: "ISO currency and Intl locale for formatting." },
      { prop: "change", type: "number", def: "-", desc: "Signed change; drives the direction-aware trend row." },
      { prop: "state", type: `"idle" | "loading" | "error"`, def: `"idle"`, desc: "Loading shows a skeleton (aria-busy); error shows a status." },
    ],
    accessibility: [
      "Trend direction is carried by an arrow glyph AND a sign in the text - never color alone; survives forced-colors.",
      "The tile exposes a combined aria-label (label + value + change) and does not spam a live region.",
      "Loading uses aria-busy and hides the number until data resolves.",
    ],
    performance: [
      "The count is an eased requestAnimationFrame transition (useAnimatedNumber) - no animation library, zero runtime deps.",
      "Reduced motion snaps to the value; interrupts resume from the current display; rAF is cancelled on unmount.",
      "tabular-nums keeps width stable while counting.",
    ],
  },
  "kinetic-emphasis": {
    usage: `import { KineticEmphasis } from "@/components/motiq/kinetic-emphasis";

export function Hero() {
  return (
    <KineticEmphasis as="h1" speed="normal">
      Motion that <em>understands emphasis</em>, not just easing.
    </KineticEmphasis>
  );
}`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The sentence; mark phrases with real <em>/<strong> (required). No index/strings props - emphasis is semantic markup." },
      { prop: "as", type: `"h1"–"h4" | "p" | "span"`, def: `"p"`, desc: "Semantic wrapper element." },
      { prop: "play", type: `"in-view" | "mount" | "controlled"`, def: `"in-view"`, desc: "When the sweep plays; controlled plays on each rising edge of active." },
      { prop: "active", type: "boolean", def: "-", desc: "Trigger for play=\"controlled\"." },
      { prop: "speed", type: `"slow" | "normal" | "fast"`, def: `"normal"`, desc: "Stagger/duration preset." },
      { prop: "trail", type: "number 0–1", def: "0.6", desc: "Intensity of the decaying activation trace." },
      { prop: "emphasisStyle", type: `"underline" | "none"`, def: `"underline"`, desc: "Persistent treatment for ignited phrases." },
      { prop: "reducedMotion", type: "boolean", def: "OS preference", desc: "Force reduced motion (renders the final state instantly)." },
      { prop: "onComplete", type: "() => void", def: "-", desc: "Fires when a sweep finishes." },
    ],
    accessibility: [
      "Screen readers get the original children exactly once - with native <em>/<strong> semantics; the animated layer is aria-hidden and excluded from selection.",
      "Server markup, no-JS, and reduced motion all render the FINAL designed state - content is never hidden behind the animation.",
      "Forced colors: emphasis falls back to a real underline (decorative bars are hidden), so emphasis never relies on color alone.",
      "Not interactive: no focus stops, no keyboard traps; safe inside links/buttons.",
    ],
    performance: [
      "Animates transform, opacity, and color only - no layout properties, no blur, no filters.",
      "in-view playback via IntersectionObserver; zero work before entering the viewport and after completion.",
      "Interruption-safe: re-triggers cancel in-flight animations; all animations cancelled on unmount.",
      "Soft cap ~40 words (dev warning) to keep the sweep legible and cheap.",
    ],
  },
  "blur-text": {
    usage: `import { BlurText } from "@/components/motiq/blur-text";

export function Hero() {
  return <BlurText text="Ship animated interfaces" as="h1" animateBy="words" delay={80} />;
}`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The string to reveal (required)." },
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
    usage: `import { RotatingText } from "@/components/motiq/rotating-text";

<RotatingText words={["faster", "accessible", "in motion"]} interval={2200} />`,
    api: [
      { prop: "words", type: "string[]", def: "-", desc: "Phrases to cycle (required)." },
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
    usage: `import { AnimatedButton } from "@/components/motiq/animated-button";

<AnimatedButton variant="solid" loading={saving}>Save changes</AnimatedButton>`,
    api: [
      { prop: "variant", type: `"solid" | "outline" | "ghost"`, def: `"solid"`, desc: "Visual style." },
      { prop: "loading", type: "boolean", def: "false", desc: "Shows spinner + aria-busy." },
      { prop: "success", type: "boolean", def: "false", desc: "Shows a success check." },
      { prop: "…button", type: "ButtonHTMLAttributes", def: "-", desc: "All native button props; forwards ref." },
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
} from "@/components/motiq/animated-dialog";

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
      { prop: "open / defaultOpen", type: "boolean", def: "-", desc: "Controlled / uncontrolled state." },
      { prop: "showClose", type: "boolean", def: "true", desc: "Built-in top-right close button." },
    ],
    accessibility: [
      "Radix owns portal, focus trap + restore, Esc, overlay click, and aria-modal - not re-implemented.",
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
} from "@/components/motiq/animated-tabs";

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
      { prop: "defaultValue / value", type: "string", def: "-", desc: "Radix controlled/uncontrolled state." },
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
} from "@/components/motiq/animated-accordion";

<AnimatedAccordion type="single" collapsible>
  <AnimatedAccordionItem value="a">
    <AnimatedAccordionTrigger>Question?</AnimatedAccordionTrigger>
    <AnimatedAccordionContent>Answer.</AnimatedAccordionContent>
  </AnimatedAccordionItem>
</AnimatedAccordion>`,
    api: [
      { prop: "type", type: `"single" | "multiple"`, def: "-", desc: "Radix mode (required on root)." },
      { prop: "collapsible", type: "boolean", def: "false", desc: "Allow closing the open item (single)." },
    ],
    accessibility: [
      "Trigger semantics, keyboard activation, and disabled state preserved from Radix.",
      "Reduced motion opens/closes instantly; content stays reachable.",
    ],
    performance: ["Animates height (auto) + opacity; chevron rotates via transform."],
  },
  "animated-list": {
    usage: `import { AnimatedList, AnimatedListItem } from "@/components/motiq/animated-list";

<AnimatedList>
  {items.map((it) => (
    <AnimatedListItem key={it.id}>{it.label}</AnimatedListItem>
  ))}
</AnimatedList>`,
    api: [
      { prop: "stagger", type: "number", def: "60", desc: "ms between item entrances." },
      { prop: "children", type: "ReactNode", def: "-", desc: "Keyed <AnimatedListItem> children." },
    ],
    accessibility: [
      "Semantic <ul>/<li>; add/remove never steals keyboard focus.",
      "Requires stable keys; reduced motion appears instantly.",
    ],
    performance: ["layout + AnimatePresence; transform/opacity only."],
  },
  "spotlight-card": {
    usage: `import { SpotlightCard } from "@/components/motiq/spotlight-card";

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
      "Updates two CSS custom properties on pointer move - no React re-render, no layout.",
      "Glow is a compositor-only opacity fade.",
    ],
  },
  "animated-grid": {
    usage: `import { AnimatedGrid } from "@/components/motiq/animated-grid";

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
    usage: `import { AnimatedArrow, AnimatedCopy } from "@/components/motiq/animated-icons";

<button>Next <AnimatedArrow triggerOn="hover" /></button>
<button onClick={copy}><AnimatedCopy copied={copied} /> Copy</button>`,
    api: [
      { prop: "size", type: "number", def: "18", desc: "Icon size in px." },
      { prop: "triggerOn", type: `"hover" | "tap" | "focus" | "mount" | "none"`, def: `"hover"`, desc: "Animation trigger." },
      { prop: "copied", type: "boolean", def: "-", desc: "(Copy) controlled copied→check state." },
    ],
    accessibility: [
      "Decorative: aria-hidden, focusable=\"false\", never independently tabbable.",
      "Label inherited from the containing button; reduced motion renders static.",
    ],
    performance: ["Tiny transform animations; no layout."],
  },
  "loom-draft": {
    usage: `import { LoomDraft } from "@/components/motiq/loom-draft";

<LoomDraft
  safeArea={{ x: 0.05, y: 0.14, w: 0.5, h: 0.72 }}
  seed={7}
  className="min-h-[440px]"
>
  <YourHeroContent />
</LoomDraft>`,
    api: [
      { prop: "density", type: "number", def: "1", desc: "Warp/weft spacing multiplier (~0.4–1.6) — more threads and rows as it increases." },
      { prop: "intensity / speed", type: "number", def: "1 / 1", desc: "Overall ink contrast (0–1.4) and breathing rate; speed 0 freezes the fabric." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where the jacquard draft simplifies to a plain weave so foreground text stays readable." },
      { prop: "accent / seed", type: "misc", def: "accent / 1", desc: "Color of the pattern-thread weft rows; deterministic seed (SSR-stable)." },
      { prop: "pauseWhenHidden / interactive / reducedMotion", type: "boolean", def: "true / false / -", desc: "Offscreen pause, optional pointer highlight, force-static." },
    ],
    accessibility: [
      "Decorative background: the canvas layer is aria-hidden, with `children` rendered in a separate, fully readable layer on top.",
      "Committed dark design: colors are the fixed Motion Lab palette (a violet→cyan→pink weft ramp on a #0a0b10 ground), painted identically on any host page or theme - not resolved from theme tokens. The `accent` prop overrides the ramp's cyan mid-stop.",
      "Respects prefers-reduced-motion (or the reducedMotion prop) by freezing on one rich, representative frame instead of animating.",
      "Under forced-colors mode the canvas is hidden and replaced with a neutral bordered fallback box, since a canvas bitmap can't be restyled by the user's forced palette.",
    ],
    performance: [
      "One <canvas> element and a single requestAnimationFrame loop - no per-frame React state, no SVG, no WebGL.",
      "Device-pixel-ratio capped at 2x so painting cost stays bounded on high-DPI displays.",
      "Pauses the rAF loop automatically when scrolled offscreen or the browser tab is hidden (useVisibilityPause), and again under reduced motion or speed=0 - a single designed still frame is drawn instead of looping.",
    ],
  },
  "copperplate-hatch": {
    usage: `import { CopperplateHatch } from "@/components/motiq/copperplate-hatch";

<CopperplateHatch
  focalPoint={[{ x: 0.7, y: 0.32 }]}
  safeArea={{ x: 0.05, y: 0.14, w: 0.5, h: 0.72 }}
  seed={7}
  className="min-h-[440px]"
>
  <YourHeroContent />
</CopperplateHatch>`,
    api: [
      { prop: "density", type: "number", def: "1", desc: "Hatch-stroke density multiplier (~0.4–1.6) — smaller pitch means more strokes." },
      { prop: "intensity / speed", type: "number", def: "1 / 1", desc: "Ink opacity/tonal contrast (0–1.4) and breathing rate; speed 0 freezes the plate." },
      { prop: "focalPoint", type: "{x,y} | {x,y}[]", def: "{x:0.68,y:0.36}", desc: "One or two \"light source\" points the tonal shading builds up around (0–1 coords)." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where hatching thins to near-blank paper so foreground text stays readable." },
      { prop: "accent / seed", type: "misc", def: "accent / 1", desc: "Color of the single embossed contour outlining the darkest mass; deterministic seed (SSR-stable)." },
      { prop: "pauseWhenHidden / interactive / reducedMotion", type: "boolean", def: "true / false / -", desc: "Offscreen pause, optional pointer highlight, force-static." },
    ],
    accessibility: [
      "Decorative background: the canvas layer is aria-hidden, with `children` rendered in a separate, fully readable layer on top.",
      "Committed dark design: the fixed Motion Lab palette (candle-gold glint over slate ink on a #0a0b10 ground) renders identically on any host page or theme - not resolved from theme tokens. The `accent` prop overrides the gold.",
      "Respects prefers-reduced-motion (or the reducedMotion prop) by freezing on one rich, representative frame instead of animating.",
      "Under forced-colors mode the canvas is hidden and replaced with a neutral bordered fallback box, since a canvas bitmap can't be restyled by the user's forced palette.",
    ],
    performance: [
      "One <canvas> element and a single requestAnimationFrame loop - no per-frame React state, no SVG, no WebGL.",
      "Device-pixel-ratio capped at 2x so painting cost stays bounded on high-DPI displays; per-layer hatch-stroke count is capped so the payload stays bounded on large canvases.",
      "Pauses the rAF loop automatically when scrolled offscreen or the browser tab is hidden (useVisibilityPause), and again under reduced motion or speed=0 - a single designed still frame is drawn instead of looping.",
    ],
  },
  "chart-recorder": {
    usage: `import { ChartRecorderBackground } from "@/components/motiq/chart-recorder";

<ChartRecorderBackground
  lanes={3}
  safeArea={{ x: 0.05, y: 0.14, w: 0.5, h: 0.72 }}
  seed={7}
  className="min-h-[440px]"
>
  <YourHeroContent />
</ChartRecorderBackground>`,
    api: [
      { prop: "lanes", type: "number", def: "5", desc: "Number of instrument lanes (clamped 2-5); the full violet→cyan spectrum." },
      { prop: "density / intensity", type: "number", def: "1 / 1", desc: "Tick/lattice detail density (~0.6-1.6) and overall ink glow (0-1.4)." },
      { prop: "speed", type: "number", def: "1", desc: "Pen-sweep speed multiplier. 0 freezes on a single rich still frame." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0-1) where a quiet-zone scrim dims the field so foreground text stays readable." },
      { prop: "accent / seed", type: "misc", def: "token / 1", desc: "Violet end of the lane spectrum (overrides --color-accent; cyan end tracks --color-secondary-accent); deterministic seed." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen pause, force-static." },
    ],
    accessibility: [
      "Decorative background: the canvas layer is aria-hidden, with `children` rendered in a separate, fully readable layer on top.",
      "Committed dark design: the fixed Motion Lab palette (a five-lane violet→cyan spectrum on a #0a0b10 ground) renders identically on any host page or theme - not resolved from theme tokens. The `accent` prop overrides the first lane.",
      "Respects prefers-reduced-motion (or the reducedMotion prop) by freezing on one rich, representative frame instead of animating.",
      "Under forced-colors mode the canvas is hidden and replaced with a neutral bordered fallback box, since a canvas bitmap can't be restyled by the user's forced palette.",
    ],
    performance: [
      "One <canvas> element and a single requestAnimationFrame loop - no per-frame React state, no SVG, no WebGL.",
      "Device-pixel-ratio capped at 2x so painting cost stays bounded on high-DPI displays.",
      "Pauses the rAF loop automatically when scrolled offscreen or the browser tab is hidden (useVisibilityPause), and again under reduced motion or speed=0 - a single designed still frame is drawn instead of looping.",
    ],
  },
  "riso-registration": {
    usage: `import { RisoRegistrationBackground } from "@/components/motiq/riso-registration";

<RisoRegistrationBackground
  safeArea={{ x: 0.05, y: 0.14, w: 0.5, h: 0.72 }}
  seed={7}
  className="min-h-[440px]"
>
  <YourHeroContent />
</RisoRegistrationBackground>`,
    api: [
      { prop: "density / intensity", type: "number", def: "1 / 1", desc: "Dot pitch/count multiplier (~0.6-1.6) and overall ink opacity (0-1.4)." },
      { prop: "speed", type: "number", def: "1", desc: "Drift amplitude multiplier. 0 freezes both plates in their resting register (still legible)." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0-1) where a quiet-zone scrim dims the field so foreground text stays readable." },
      { prop: "accent / secondary", type: "misc", def: "tokens", desc: "Plate A / Plate B ink colors (override --color-accent / --color-secondary-accent; omit to resolve from the theme)." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for the plate drift + corner-blink phasing (SSR-stable)." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen pause, force-static." },
    ],
    accessibility: [
      "Decorative background: the canvas layer is aria-hidden, with `children` rendered in a separate, fully readable layer on top.",
      "Committed dark design: the fixed Motion Lab palette (pink + blue ink plates screen-blended on a #0a0b10 ground) renders identically on any host page or theme - not resolved from theme tokens. `accent`/`secondary` override the two plate inks.",
      "Respects prefers-reduced-motion (or the reducedMotion prop) by freezing on one rich, representative register-lock frame instead of animating.",
      "Under forced-colors mode both canvas ink plates are hidden (blend modes are unavailable there and would otherwise render as a flat, muddy block) and replaced with a neutral bordered fallback box.",
    ],
    performance: [
      "One <canvas> element and a single requestAnimationFrame loop - no per-frame React state, no SVG, no WebGL.",
      "Device-pixel-ratio capped at 2x so painting cost stays bounded on high-DPI displays.",
      "Pauses the rAF loop automatically when scrolled offscreen or the browser tab is hidden (useVisibilityPause), and again under reduced motion or speed=0 - a single designed still frame is drawn instead of looping.",
    ],
  },
  "core-strata": {
    usage: `import { CoreStrata } from "@/components/motiq/core-strata";

<CoreStrata
  density={1.1}
  faults={3}
  safeArea={{ x: 0.05, y: 0.14, w: 0.5, h: 0.72 }}
  seed={7}
  className="min-h-[440px]"
>
  <YourHeroContent />
</CoreStrata>`,
    api: [
      { prop: "density", type: "number", def: "1", desc: "Sediment band density multiplier (~0.5–1.6); more, thinner bands at higher values." },
      { prop: "intensity / speed", type: "number", def: "1 / 1", desc: "Overall luminance (0–1.4) and vertical scroll speed (0 freezes the core-scroll)." },
      { prop: "faults", type: "number", def: "3", desc: "Number of baked fault breaks (clamped 1–6) that vertically offset the strata columns." },
      { prop: "readingLine", type: "number", def: "0.62", desc: "0–1 datum line position; also where the survey beam parks when motion stops." },
      { prop: "safeArea", type: "{x,y,w,h}", def: "left column", desc: "Region (0–1) where a quiet-zone scrim dims the strata so foreground text stays readable." },
      { prop: "accent / seed", type: "misc", def: "token / 1", desc: "Marker + reading-line color (resolves --color-warning when unset); deterministic seed (SSR-stable)." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Committed dark design: the fixed Motion Lab palette (amber marker seams + violet sediment on a #0a0b10 ground) renders identically on any host page or theme - not resolved from theme tokens. The `accent` prop overrides the amber.",
      "Respects prefers-reduced-motion and the reducedMotion prop: renders one rich static frame (survey beam parked at the reading line, a marker seam lit) instead of animating.",
      "Under forced-colors (Windows High Contrast) mode the canvas is hidden and replaced with a plain bordered fallback box, since a painted bitmap can't be restyled by the user's contrast theme.",
      "The whole field is decorative and marked aria-hidden; foreground content passed as children renders in a separate, fully readable layer over a canvas-painted quiet zone (no DOM blur layer).",
    ],
    performance: [
      "One <canvas> element driven by a single requestAnimationFrame loop - no per-frame React state, no WebGL.",
      "Device-pixel-ratio capped at 2x so retina displays never over-render.",
      "Pauses automatically when scrolled offscreen or the browser tab is hidden (IntersectionObserver + visibilitychange), and renders a single static frame under reduced motion instead of looping.",
      "Strata geometry is a deterministic mulberry32 model keyed by `seed`, baked once into a fixed logical field and re-projected on resize - no per-resize regeneration, no layout thrash.",
    ],
  },
  "magnetic-dock": {
    usage: `import { MagneticDock } from "@/components/motiq/magnetic-dock";

<MagneticDock
  items={[
    { id: "compose", label: "Compose", icon: <ComposeIcon /> },
    { id: "search", label: "Search", icon: <SearchIcon /> },
  ]}
  magnetRadius={78}
  onSelect={(id) => launch(id)}
/>`,
    api: [
      { prop: "items", type: "DockItem[]", def: "-", desc: "Each item is { id, label, icon?, tint? }. The label is the accessible name and the tooltip text; tint overrides the built-in gradient ramp." },
      { prop: "magnetRadius", type: "number", def: "78", desc: "Sigma of the shared gaussian field, in px. Larger values widen the cascade across neighbours." },
      { prop: "maxScale / lift", type: "number", def: "1.5 / 24", desc: "Scale of the icon directly under the pointer, and its peak vertical lift in px. Defaults stay clear of surrounding content; 1.95 / 40 recreates the Motion Lab showpiece." },
      { prop: "stiffness / damping", type: "number", def: "420 / 26", desc: "Scale-spring constants (zeta about 0.63). Lift and drift springs are tuned relative to these." },
      { prop: "idleWave", type: "boolean", def: "true", desc: "Sweeps a virtual pointer across the bar at 42% strength when nothing is hovering, so the dock breathes on load." },
      { prop: "tooltip", type: "boolean", def: "true", desc: "Spring-chased label chip above the dominant icon (appears past 0.55 influence)." },
      { prop: "onSelect", type: "(id: string) => void", def: "-", desc: "Fired when an icon is activated by click, Enter, or Space." },
      { prop: "seed / pauseWhenHidden / reducedMotion", type: "misc", def: "1 / true / -", desc: "Deterministic idle phase (SSR-stable), offscreen + tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Every icon is a real <button> with the item label as its accessible name, so the dock is fully operable by keyboard and reported correctly by assistive tech.",
      "Keyboard parity: a focused icon bends the field exactly like a hover, so Tab users see the same swell, lift, and label chip that pointer users get.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the springs stop and each icon keeps a 120ms CSS hover/focus lift, so the affordance survives without any tracking.",
      "The tooltip chip is decorative and aria-hidden - it only mirrors the label already on the focused button - and icons are 52px targets, well past the 24px minimum.",
    ],
    performance: [
      "One requestAnimationFrame loop per dock with delta-time springs and substeps, driving transform only - no per-frame React state and no layout writes.",
      "Base icon centres are cached from offsetLeft/offsetTop, which ignore transforms, so a scaled icon can never feed back into the field it samples.",
      "Pauses when scrolled offscreen or the tab is hidden (IntersectionObserver + visibilitychange) and re-measures through a ResizeObserver, not on every frame.",
      "Pointer events cover mouse, pen and touch; touch-action: pan-y keeps the page scrollable while a finger sweeps the dock.",
    ],
  },
  "cursor-comet": {
    usage: `import { CursorComet } from "@/components/motiq/cursor-comet";

<CursorComet sparkThreshold={900} seed={7} className="rounded-2xl">
  <YourHeroContent />
</CursorComet>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The region the comet paints over. Content stays fully interactive - the canvas never receives pointer events." },
      { prop: "particleBudget", type: "number", def: "240", desc: "Fixed pool size (clamped 24-800). Particles are recycled, so no allocation happens per frame." },
      { prop: "velocityGain / drag", type: "number", def: "0.22 / 2.2", desc: "Fraction of pointer velocity each particle inherits (reversed), and the exponential drag coefficient per second." },
      { prop: "headColor / tailColor / sparkColor", type: "string", def: "accent / secondary / signature", desc: "Any CSS color; token values are resolved against this component's own theme scope and re-read on theme changes." },
      { prop: "sparkThreshold", type: "number", def: "900", desc: "Pointer speed in px/s above which coral ionization sparks fire at the head." },
      { prop: "idleOrbit", type: "boolean", def: "true", desc: "Coils the particles into a 62px orbit ring around a wandering virtual head when the pointer is away." },
      { prop: "seed / pauseWhenHidden / reducedMotion", type: "misc", def: "1 / true / -", desc: "Deterministic jitter (SSR-stable markup), offscreen + tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Purely decorative: the canvas is aria-hidden and pointer-events-none, so assistive tech skips it and the wrapped content stays clickable and focusable.",
      "Respects prefers-reduced-motion and the reducedMotion prop: renders a single static frame - an orbit ring of glow dots - redrawn only on resize, never looping.",
      "Carries no information by colour or motion alone; removing the effect entirely leaves the underlying content unchanged.",
      "Pointer handling covers mouse, pen and touch, and touch-action: pan-y keeps the page scrollable while a finger drags the comet.",
    ],
    performance: [
      "One <canvas> and one requestAnimationFrame loop with delta-time integration - no per-frame React state, no WebGL.",
      "Fixed particle pool (no GC churn) drawn from four pre-rendered 64px radial-gradient sprites with 'lighter' compositing, instead of per-particle gradients or shadowBlur.",
      "Device-pixel-ratio capped at 2x, and the canvas is re-measured through a ResizeObserver rather than per frame.",
      "Sprites are rebuilt only when the resolved token colours actually change (checked twice a second), and the loop hard-stops when scrolled offscreen or the tab is hidden.",
    ],
  },
  "lens-card": {
    usage: `import { LensCard } from "@/components/motiq/lens-card";

<LensCard magnification={1.35} chromatic={2.2} radius={104}>
  <YourMetricGrid />
</LensCard>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The content under the glass - text, charts, images, code all work, since the lens is a clipped clone, not a filter." },
      { prop: "radius / magnification", type: "number", def: "104 / 1.35", desc: "Lens radius in px and the optical magnification of the clipped clone." },
      { prop: "chromatic", type: "number", def: "2.2", desc: "Chromatic fringe offset in px (a second clone, hue-rotated and blended). 0 removes the dispersion layer entirely." },
      { prop: "lag", type: "{ stiffness, damping }", def: "{ 300, 27 }", desc: "Follow spring for the lens centre - about 90ms of lag, which is what sells the glass having mass." },
      { prop: "gridBend", type: "boolean", def: "true", desc: "Draws the canvas grid whose lines displace radially around the lens rim (gaussian, sigma 60px, 16px amplitude)." },
      { prop: "idleDrift / showRing", type: "boolean", def: "true / true", desc: "Slow two-frequency orbit when the pointer is away, and the rim highlight ring." },
      { prop: "seed / pauseWhenHidden / reducedMotion", type: "misc", def: "1 / true / -", desc: "Deterministic drift phase (SSR-stable), offscreen + tab-hidden pause, and force-static regardless of system preference." },
    ],
    accessibility: [
      "The magnified and chromatic layers are clones of your content: both are aria-hidden and pointer-events-none, so assistive tech reads the base layer exactly once and base content stays clickable.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the lens parks centre-stage as a still magnifier - the zoom affordance remains, the chase does not.",
      "The lens adds no information of its own; every value it magnifies is already legible in the base layer at full contrast.",
      "Pointer handling covers mouse, pen and touch, and touch-action: pan-y keeps the page scrollable while a finger carries the lens.",
    ],
    performance: [
      "clip-path plus transform are compositor-side in Chromium; the only CPU work is the grid canvas (about 90 warped polylines) on a single delta-time rAF loop.",
      "The optical trick is translate = (1 - scale) x lens on a scaled clone, so the point under the lens centre stays fixed with no filters and no repaint storms.",
      "Device-pixel-ratio capped at 2x, with resize handled by a ResizeObserver rather than per frame.",
      "Pauses when scrolled offscreen or the tab is hidden, and renders a single parked frame instead of looping under reduced motion.",
    ],
  },
  "torch-reveal": {
    usage: `import { TorchReveal } from "@/components/motiq/torch-reveal";

<TorchReveal
  front={<FinishedHero />}
  reveal={<BlueprintTwin />}
  radius={175}
  reducedFallback="split"
/>`,
    api: [
      { prop: "front", type: "ReactNode", def: "-", desc: "The finished, always-readable layer. It sits in flow and defines the component's height." },
      { prop: "reveal", type: "ReactNode", def: "-", desc: "The layer the torch uncovers - a blueprint twin, wireframe, or before/after render. Decorative by contract." },
      { prop: "radius / softness", type: "number", def: "175 / 0.48", desc: "Torch radius in px, and 0-1 edge softness (softness maps to the opaque core stop of the mask gradient)." },
      { prop: "flicker", type: "number", def: "0.35", desc: "0-1 flame flicker: two incommensurate sines (9Hz and 23Hz). 0 holds a perfectly steady beam." },
      { prop: "lag", type: "{ stiffness, damping }", def: "{ 260, 24 }", desc: "Follow spring - just enough lag that the torch feels hand-held rather than parented to the cursor." },
      { prop: "idlePatrol", type: "boolean", def: "true", desc: "Patrols a Lissajous path across the hero when the pointer is away, so the story tells itself." },
      { prop: "reducedFallback", type: '"split" | "off"', def: '"split"', desc: 'Static presentation when motion is off: a 55/45 comparison with a dashed divider, or hide the reveal layer.' },
      { prop: "revealClassName / seed / pauseWhenHidden / reducedMotion", type: "misc", def: "- / 1 / true / -", desc: "Classes for the reveal wrapper (it paints an opaque backdrop by default), deterministic patrol phase, offscreen pause, and force-static." },
    ],
    accessibility: [
      "The reveal twin is aria-hidden and pointer-events-none - the readable hero is always the front layer, torch or no torch, so nothing is gated behind pointer movement.",
      "Respects prefers-reduced-motion and the reducedMotion prop: swaps to a static 55/45 split with a dashed divider (or hides the twin), so the two-layer story survives without tracking.",
      "Interactive elements inside the front layer keep their own focus and semantics; the mask layer never intercepts events.",
      "Pointer handling covers mouse, pen and touch, and touch-action: pan-y keeps the page scrollable while a finger carries the torch.",
    ],
    performance: [
      "The reveal uses a CSS alpha mask (radial-gradient) whose centre and radius live in custom properties, so JS writes three numbers per frame and never a new layout.",
      "Alpha masks only, deliberately: SVG luminance masks with gradient content are a silent no-op in Chromium, which is why they are not used here.",
      "One delta-time requestAnimationFrame loop per instance; the glow halo animates with transform alone on a composited layer.",
      "Pauses when scrolled offscreen or the tab is hidden, and never starts the loop at all in the static path.",
    ],
  },
  "gooey-actions": {
    usage: `import { GooeyActions } from "@/components/motiq/gooey-actions";

<GooeyActions
  actions={[
    { id: "reply", label: "Reply", icon: <ReplyIcon /> },
    { id: "star", label: "Star", icon: <StarIcon /> },
  ]}
  onSelect={(id) => run(id)}
/>`,
    api: [
      { prop: "actions", type: "GooeyAction[]", def: "-", desc: "Each action is { id, label, icon? }. Three to six read best in the arc; the label is the accessible name and the hover/focus chip." },
      { prop: "radius / arc", type: "number / [number, number]", def: "118 / [-160, -20]", desc: "Distance from the core in px, and the degrees the satellites spread across (-90 is straight up)." },
      { prop: "stagger", type: "number", def: "45", desc: "Per-satellite launch delay in ms - the goo stretches, necks, then snaps free." },
      { prop: "stiffness / damping", type: "number", def: "230 / 13", desc: "Bloom springs, deliberately underdamped (zeta about 0.43, roughly 18% overshoot)." },
      { prop: "magnetRange", type: "number", def: "52", desc: "Pointer distance in px within which a satellite leans up to 35% of the gap toward the cursor and scales to 1.16." },
      { prop: "open / defaultOpen / onOpenChange", type: "boolean / boolean / fn", def: "- / false / -", desc: "Controlled or uncontrolled bloom state; the callback fires with the resolved value." },
      { prop: "onSelect / label", type: "(id: string) => void / string", def: '- / "Actions"', desc: "Commit callback for a satellite, and the accessible name of the core button and its menu." },
      { prop: "autoPeek / seed / pauseWhenHidden / reducedMotion", type: "misc", def: "true / 1 / true / -", desc: "Tease the bloom every ~7s until first interaction, deterministic ember phase, offscreen pause, and force-static." },
    ],
    accessibility: [
      "The core is a real button with aria-haspopup and aria-expanded pointing at a role=menu; satellites are role=menuitem buttons with roving tabindex, so exactly one is tabbable while open.",
      "Arrow keys, Home and End move focus between satellites; Escape closes the dial and returns focus to the core, and committing an action does the same.",
      "While closed the satellites are disabled and the menu is aria-hidden, so they are neither tabbable nor announced; opening with Enter or Space moves focus into the menu, opening with a click does not.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the goo look stays but the dial opens instantly with a fade - no springs, no orbiting embers. Targets are 46px and 74px, well past the 24px minimum.",
    ],
    performance: [
      "One SVG filter (blur + alpha contrast) over a single fixed-size offscreen surface; blobs animate with transforms only, so the blur re-runs but nothing re-lays-out.",
      "Icons live on an unfiltered twin layer that shares the same transforms, so glyphs stay crisp and never enter the filtered subtree.",
      "One delta-time requestAnimationFrame loop with substepped springs - no per-frame React state; open/close is the only state change.",
      "Pauses when scrolled offscreen or the tab is hidden, and the static path never starts the loop.",
    ],
  },
  "decrypt-text": {
    usage: `import { DecryptText } from "@/components/motiq/decrypt-text";

<DecryptText text="Ship interfaces that feel alive." as="h1" />

<DecryptText
  text="motiq add decrypt-text — resolved in 84ms"
  variant="terminal"
  startDelay={900}
  loop={7000}
/>`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The real string. Rendered readable on the server and exposed once to screen readers." },
      { prop: "glyphs", type: "string", def: "pool", desc: "Scramble pool. Defaults to a symbol pool for `display` and a hex/CLI pool for `terminal`." },
      { prop: "speed / stagger", type: "number", def: "45 / 55", desc: "Glyph cycle floor in ms (each char jitters up to +35ms) and per-character lock-in stagger." },
      { prop: "startDelay / jitter", type: "number", def: "350 / 120", desc: "Delay before the first lock, and the ± ms spread that makes the resolve ragged rather than metronomic." },
      { prop: "trigger", type: '"mount" | "inview" | "hover"', def: '"inview"', desc: "What starts the first run. `hover` leaves the line readable until the pointer arrives." },
      { prop: "variant", type: '"display" | "terminal"', def: '"display"', desc: "Headline scale, or a monospace CLI card with a prompt and a blinking caret." },
      { prop: "loop / retriggerOnHover", type: "number | false / boolean", def: "7000 / true", desc: "Auto re-run delay after settling, and hover re-scramble with a 1.5s cooldown." },
      { prop: "seed / as / reducedMotion / onDecrypted", type: "misc", def: "1 / \"p\" / - / -", desc: "Deterministic jitter seed (SSR-stable), element tag, forced-static override, and a callback per completed resolve." },
    ],
    accessibility: [
      "The real string is rendered in a visually-hidden sibling and the animated glyph layer is aria-hidden, so screen readers hear the sentence once and never the scramble.",
      "Server markup and no-JS render the finished, readable line - the scramble only ever exists after mount (progressive enhancement).",
      "Respects prefers-reduced-motion and the reducedMotion prop: the text renders resolved, hover re-triggering becomes a no-op, and the caret stops blinking.",
      "The animated layer is unselectable, so copying the headline copies the real sentence.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance writes textContent plus a state attribute per glyph - zero layout writes and no per-character React state.",
      "The loop parks completely when the line scrolls offscreen or the tab is hidden (IntersectionObserver + visibilitychange) and re-arms when it returns.",
      "Per-character jitter comes from an inline mulberry32 seeded by `seed`, so runs are deterministic and never call Math.random during render.",
      "Lock-in colour and glow are a scoped CSS keyframe, not a per-frame style write.",
    ],
  },
  "proximity-type": {
    usage: `import { ProximityType } from "@/components/motiq/proximity-type";

<ProximityType
  text="Gravity has a typeface."
  as="h1"
  radius={180}
  weightRange={[340, 900]}
/>`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The real string. Rendered readable on the server and exposed once to screen readers." },
      { prop: "radius", type: "number", def: "180", desc: "Reaction radius around the pointer, in px." },
      { prop: "weightRange", type: "[number, number]", def: "[340, 900]", desc: "Numeric font weight far from the pointer, and directly under it." },
      { prop: "restWeight", type: "number", def: "430", desc: "Weight the line rests at, and the centre of the idle breathing wave (± 170)." },
      { prop: "spacing", type: "string", def: '"0.06em"', desc: "Peak letter-spacing under the pointer; falls off with the same curve as weight." },
      { prop: "glow / idleWave", type: "boolean", def: "true / true", desc: "Accent glow on the hottest characters, and the breathing wave that travels the line after 2s of pointer idle." },
      { prop: "falloff", type: '"smooth" | "linear"', def: '"smooth"', desc: "Distance curve. `smooth` is a smoothstep, which reads as gravity rather than a spotlight." },
      { prop: "as / reducedMotion", type: "misc", def: '"p" / -', desc: "Element tag, and the forced-static override (the line renders at `restWeight`)." },
    ],
    accessibility: [
      "The real string sits in a visually-hidden sibling; the per-character layer is aria-hidden and unselectable, so AT hears one clean sentence.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the line renders static at its rest weight and the loop never starts.",
      "Pointer Events cover mouse, pen and touch identically - there is no mouse-only path, and nothing is conveyed by colour alone (weight and glow move together).",
      "Server markup renders the plain readable headline; weights are only ever applied after mount.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance mutates inline fontWeight/color/letter-spacing directly on the character spans - no per-character React state.",
      "Character centres are measured once, cached, and refreshed at most every 0.7s while the pointer is active (plus a rAF-coalesced pass on resize/scroll) - never read mid-frame.",
      "font-weight is layout-affecting by design; the cost is bounded to one short line, and characters drop back to their plain rest style below a heat floor so idle work stays near zero.",
      "The loop pauses when the headline scrolls offscreen or the tab is hidden.",
    ],
  },
  "split-flap": {
    usage: `import { SplitFlap } from "@/components/motiq/split-flap";

<SplitFlap
  messages={[
    ["SHIP MOTION    ON TIME", "SPLIT-FLAP    BOARDING"],
    ["OPEN SOURCE    ALL DAY", "ZERO LOCK-IN   ON TIME"],
  ]}
  interval={6000}
/>`,
    api: [
      { prop: "messages", type: "(string | string[])[]", def: "-", desc: "Pages the board rotates through. A plain string is a one-row ticker page; an array is a multi-row board." },
      { prop: "cols", type: "number", def: "longest line", desc: "Cells per row. The board font-size is measured from the container so any width fits." },
      { prop: "interval", type: "number", def: "6000", desc: "ms each page is held. `0` disables auto-rotation (drive it with `index` instead)." },
      { prop: "flipMs / stagger", type: "number / {col,row,jitter}", def: "80 / {38,110,90}", desc: "One drum step in ms, and the per-column/per-row/random offsets that sweep the change across the board." },
      { prop: "charset", type: "string", def: "A-Z 0-9 + punctuation", desc: "Drum contents. Characters outside it fall back to a blank." },
      { prop: "flutter", type: "boolean", def: "true", desc: "Random idle twitches on settled cells - the mechanical restlessness of a real board." },
      { prop: "index / defaultIndex / onIndexChange", type: "number / number / (i) => void", def: "- / 0 / -", desc: "Controlled or uncontrolled page index; the callback fires with the resolved index." },
      { prop: "seed / reducedMotion", type: "number / boolean", def: "1 / -", desc: "Deterministic jitter + twitch seed (SSR-stable), and the forced-static override." },
    ],
    accessibility: [
      "The board itself is aria-hidden; a polite aria-live region announces each page as one sentence, and only once every cell has come to rest - so AT is never read a spinning drum.",
      "Respects prefers-reduced-motion and the reducedMotion prop: pages swap as instant text. The content still rotates; nothing flips.",
      "Status is carried by the words on the board, never by colour alone.",
      "Server markup renders the current page as static cells - no flip is required for the content to be correct.",
    ],
    performance: [
      "One requestAnimationFrame loop drives every cell on the board; flaps animate transform only (GPU-composited) and glyph text is written at flip boundaries, never per frame.",
      "The loop parks completely when the board scrolls offscreen or the tab is hidden, and auto-rotation stops with it.",
      "Long drum runs restart closer to their target (max 14 steps), so a full page change is bounded work rather than a 40-step spin.",
      "Board font-size is measured with a ResizeObserver and committed only when it actually changes - the cell grid itself never re-renders per frame.",
    ],
  },
  "liquid-fill-headline": {
    usage: `import { LiquidFillHeadline } from "@/components/motiq/liquid-fill-headline";

<LiquidFillHeadline text="Set it in motion" as="h1" />

{/* progress-driven */}
<LiquidFillHeadline text="Set it in motion" level={0.62} />`,
    api: [
      { prop: "text", type: "string", def: "-", desc: "The real string. Rendered readable on the server and exposed once to screen readers." },
      { prop: "fillMs / holdMs / drainMs", type: "number", def: "3000 / 1400 / 1000", desc: "Rise, hold-at-full and drain durations of the pour timeline." },
      { prop: "amplitude", type: "number", def: "4.5", desc: "Wave height at full slosh, in % of the headline box. Decays to zero as the liquid settles." },
      { prop: "gradient", type: "string[]", def: "cyan → azure", desc: "Two or more CSS colors for the liquid, top to bottom. Defaults to the theme's accent ramp." },
      { prop: "shimmer / loop", type: "boolean", def: "true / true", desc: "The coral signature sweep at the moment the headline fills, and whether the pour repeats." },
      { prop: "level", type: "number", def: "-", desc: "Controlled fill level 0-1. Supplying it replaces the timeline with a gently sloshing surface at that height." },
      { prop: "trigger / replayOnPointer", type: '"inview" | "manual" / boolean', def: '"inview" / true', desc: "What starts the pour, and whether a pointer press re-pours from empty." },
      { prop: "as / reducedMotion / onFilled", type: "misc", def: '"p" / - / -', desc: "Element tag, forced-static override (renders fully poured), and a callback each time the headline reaches full." },
    ],
    accessibility: [
      "All four text layers sit under one aria-hidden stack; the readable string is a visually-hidden sibling, so the headline is announced exactly once.",
      "Respects prefers-reduced-motion and the reducedMotion prop: the headline renders fully poured with no loop - still a handsome gradient wordmark.",
      "Server markup and no-JS render the filled headline; the glass is only emptied after mount.",
      "The coral shimmer is decoration on top of an already-legible fill, never the only way to read the state.",
    ],
    performance: [
      "Two clip-path writes and one background-position write per frame from a single rAF loop - no SVG filters, no canvas, no per-character work.",
      "Uses clip-path alpha clipping over background-clip: text, NOT an SVG luminance mask (gradient luminance masks silently no-op in Chromium).",
      "Pauses when the headline scrolls offscreen or the tab is hidden.",
      "The controlled `level` path skips the timeline entirely and only maintains a low-amplitude surface.",
    ],
  },
  "word-cascade": {
    usage: `import { WordCascade } from "@/components/motiq/word-cascade";

<WordCascade replayToken={step}>
  <h2>Every launch deserves an entrance.</h2>
  <p>Wire it to the viewport and your hero copy directs itself.</p>
</WordCascade>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The passage: plain text, or headings/paragraphs containing plain text. Element structure is preserved in both layers." },
      { prop: "lineStagger / wordStagger", type: "number", def: "150 / 40", desc: "ms added per visual line and per word within that line - words are measured into their REAL wrapped lines after layout." },
      { prop: "stiffness / damping", type: "number", def: "180 / 16", desc: "Per-word spring constants (k and c). The default pair is underdamped, giving ~6% overshoot." },
      { prop: "fromY / blur / rotate", type: "number", def: "-44 / 8 / 7", desc: "Drop distance in px, entry blur in px, and the max random rotation per word in degrees." },
      { prop: "replayOnReenter", type: "boolean", def: "true", desc: "Re-run the cascade each time the block re-enters the viewport; false plays it once." },
      { prop: "replayToken", type: "string | number", def: "-", desc: "Change this value to replay on demand - no imperative ref needed." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for the per-word rotation (SSR-stable)." },
      { prop: "reducedMotion / onSettled", type: "boolean / () => void", def: "- / -", desc: "Forced-static override, and a callback fired once the whole passage has settled." },
    ],
    accessibility: [
      "The animated copy is aria-hidden and the full passage lives in a visually-hidden block, so reading order, heading semantics and selection stay intact.",
      "Respects prefers-reduced-motion and the reducedMotion prop: words render in place instantly and replay is inert.",
      "Words are parked before the first client paint, so there is no flash of finished copy followed by a jump.",
      "Server markup and no-JS render the passage in place - the cascade is pure enhancement.",
    ],
    performance: [
      "Each word runs its own dt-integrated spring inside ONE rAF loop; the loop writes transform/opacity/filter directly and stops the moment every word settles.",
      "Blur is dropped as soon as a word is near rest and will-change is cleared after it settles, so a settled passage costs nothing.",
      "Line measurement is a single read pass per play, after the reset writes - never interleaved with writes, never per frame.",
      "The cascade pauses and re-arms when the block leaves the viewport, and per-word rotation comes from an inline seeded mulberry32.",
    ],
  },
  "holo-card": {
    usage: `import { HoloCard } from "@/components/motiq/holo-card";

<HoloCard foil="spectral" maxTilt={14} glare shadow>
  <div className="flex items-center justify-between">
    <span className="font-extrabold tracking-[0.22em]">MOTIQ</span>
    <span className="text-[9px] tracking-[0.2em]">OPEN PASS</span>
  </div>
  <div className="text-[26px] font-bold">128</div>
  <div className="font-mono text-[10px]">MIT · SINCE 2026</div>
</HoloCard>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "Card content, laid out as a full-height column so a header/mid/footer trio reads like a pass." },
      { prop: "maxTilt", type: "number", def: "14", desc: "Peak lean in degrees at the card edge; 14 reproduces the lab's ±11° rotateX / ±15° rotateY pair." },
      { prop: "spring", type: "{ stiffness, damping }", def: "{ 120, 10 }", desc: "Tilt spring. Deliberately underdamped (ζ≈0.46) so release overshoots ~6% once before settling." },
      { prop: "foil / glare / shadow", type: "\"azure\" | \"spectral\" | \"none\" / boolean / boolean", def: "\"spectral\" / true / true", desc: "Iridescent conic foil sheet, specular pointer hotspot, and the counter-moving ground shadow." },
      { prop: "idleSway / aspect", type: "boolean / number", def: "true / 1.586", desc: "Ambient sway before any input, and the card aspect ratio (pass 0 to let content size the card)." },
      { prop: "label / onTilt", type: "string / (rx, ry) => void", def: "\"Interactive tilt card\" / -", desc: "Accessible name for the tilt surface, and a callback with the settled spring angles." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force the static resting pose regardless of system preference." },
    ],
    accessibility: [
      "The foil, glare and ground shadow are decorative and aria-hidden; your children keep normal semantics and focus order.",
      "The card is a focusable group with a visible focus ring: arrow keys nudge the tilt targets ±4° per press and Escape levels it, described by an sr-only hint.",
      "Respects prefers-reduced-motion and the reducedMotion prop: renders a fixed -6°/8° pose with static light - still dimensional, zero movement.",
      "Pointer handling covers mouse and touch (touch-action is confined to the card, so the page still scrolls); under forced colors the light layers are dropped.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance with delta-time clamped at 50ms - no per-frame React state.",
      "Motion is transform-only; the foil and glare are pre-painted layers whose custom properties move gradient origins, so card content never repaints.",
      "IntersectionObserver plus visibilitychange park the loop when the card scrolls offscreen or the tab is hidden.",
    ],
  },
  "border-beam-panel": {
    usage: `import { BorderBeamPanel } from "@/components/motiq/border-beam-panel";

<BorderBeamPanel beams={2} idleSpeed={42} hoverSpeed={240} glow>
  <h3>One command, zero setup</h3>
  <p>Every Motiq component installs straight from the registry.</p>
</BorderBeamPanel>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "Panel content - layout and semantics are entirely yours; the beams never touch them." },
      { prop: "beams / colors", type: "1 | 2 / [string, string?]", def: "2 / theme", desc: "One comet or two opposed comets. The second defaults to the rare coral signature." },
      { prop: "idleSpeed / hoverSpeed", type: "number", def: "42 / 240", desc: "Resting and hover angular velocity in deg/s (~8.5s per lap at 42)." },
      { prop: "spring", type: "{ stiffness, damping }", def: "{ 30, 11 }", desc: "The velocity spring - speed itself is sprung, so the comets wind up and coast instead of snapping." },
      { prop: "thickness / radius", type: "number", def: "2 / 16", desc: "Ring thickness and corner radius in px." },
      { prop: "glow / seed", type: "boolean / number", def: "true / 1", desc: "Blurred copy of the ring behind the panel as cast light, and the deterministic start angle (SSR-stable)." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force the parked lit-border state regardless of system preference." },
    ],
    accessibility: [
      "The ring and the cast glow are aria-hidden and pointer-events-none; content semantics are untouched.",
      "The surge fires on keyboard focus as well as hover, so keyboard users get the same affordance.",
      "Reduced motion parks the orbit at 40° with both comets visible - it reads as a lit border, not a broken one.",
      "Under forced colors the gradient layers are dropped and the panel falls back to a plain CanvasText border.",
    ],
    performance: [
      "Only one custom property (--mk-beam-a) changes per frame; the conic gradient re-rasterizes on the ring layer and content never repaints.",
      "The ring is a two-layer CSS alpha mask with mask-composite: exclude - SVG luminance masks are avoided because they silently no-op in Chromium.",
      "Delta-time integration means a janky or backgrounded tab can never skip the beam ahead; the loop is IntersectionObserver-paused offscreen.",
    ],
  },
  "card-stack-deck": {
    usage: `import { CardStackDeck } from "@/components/motiq/card-stack-deck";

<CardStackDeck
  items={categories.map((c) => ({ id: c.id, label: c.name, content: <CategoryFace {...c} /> }))}
  arcWidth={210}
  onTopChange={setTop}
/>`,
    api: [
      { prop: "items", type: "{ id, content?, label? }[]", def: "-", desc: "The cards, front to back at rest. `label` is what the live region announces." },
      { prop: "renderItem", type: "(item, { index, slot, isFront }) => ReactNode", def: "-", desc: "Render override for the front face; receives the card's live slot." },
      { prop: "topIndex / defaultTopIndex / onTopChange", type: "number / number / (index) => void", def: "- / 0 / -", desc: "Controlled or uncontrolled front card, and the change callback." },
      { prop: "fan / arcWidth / lift", type: "{ y, z, rotate } / number / number", def: "{ 18, 62, 2.2 } / 210 / 150", desc: "Rest-fan geometry per slot, and the peak sideways travel + z-lift of the sent card." },
      { prop: "spring", type: "{ stiffness, damping }", def: "{ 90, 12 }", desc: "Slot spring driving both the send arc and the one-slot ripple of the remaining cards." },
      { prop: "cardBack / dragToShuffle / showControls", type: "ReactNode / boolean / boolean", def: "pattern / true / true", desc: "Back face shown mid-flip, drag-and-tap shuffling, and the visible prev/next buttons." },
      { prop: "height / cardHeight / label", type: "number / number / string", def: "300 / 210 / \"Card deck\"", desc: "Scene height (room for the fan), card height, and the accessible group name." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force instant motion-free reordering." },
    ],
    accessibility: [
      "The deck is a focusable group with aria-roledescription=\"card deck\": ArrowRight/Enter/Space send the front card, ArrowLeft brings the previous one back, and the visible buttons do the same.",
      "An aria-live=\"polite\" region announces the new front card (name and position) after every shuffle.",
      "Only the front card is exposed to assistive tech; the cards behind it are aria-hidden, so a stack never reads as duplicate content.",
      "Reduced motion reorders instantly with no arc or flip - the fan itself stays as static depth and every control keeps working.",
    ],
    performance: [
      "One requestAnimationFrame loop drives the whole deck; springs stop the busy gate as soon as every card is within 0.002 of target.",
      "Transforms only - the depth dim is an opacity overlay rather than a filter, because a filter would flatten the preserve-3d context and kill the flip.",
      "preserve-3d lets the browser depth-sort the stack, so there is no per-frame z-index management, and the loop parks offscreen.",
    ],
  },
  "glass-refraction-panel": {
    usage: `import { GlassRefractionPanel } from "@/components/motiq/glass-refraction-panel";

<GlassRefractionPanel
  layers={[{ id: "stat", node: <InstallStat />, depth: 26, position: { top: "13%", left: "8%" } }]}
  blur={16}
>
  <h3>Everything ships free</h3>
  <p>The full Motiq catalog is open source and yours to keep.</p>
</GlassRefractionPanel>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "Content of the main (front) glass pane." },
      { prop: "layers", type: "{ id, node, depth?, position? }[]", def: "[]", desc: "Extra floating glass panes, each with its own parallax depth in px and percentage placement." },
      { prop: "scene / seed", type: "\"orbs\" | \"none\" / number", def: "\"orbs\" / 1", desc: "The live canvas scene behind the glass, and the deterministic seed for its orb phases (SSR-stable)." },
      { prop: "blur / tint", type: "number / string", def: "16 / -", desc: "Backdrop blur radius in px, and a glass fill override (any CSS color)." },
      { prop: "parallax / spring", type: "number / { stiffness, damping }", def: "1 / { 110, 21 }", desc: "Depth multiplier (0 disables parallax) and the critically damped spring (ζ≈1.0) each pane rides." },
      { prop: "mainDepth / paneWidth / minHeight", type: "number / string / number", def: "16 / \"min(340px, 82%)\" / 380", desc: "Depth, width and panel height. The panel itself is always fluid; only the inner pane has a width." },
      { prop: "streakOnEnter", type: "boolean", def: "true", desc: "Sweep a rotated specular band across the main pane on every viewport entry, delayed 180ms." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force one static orb frame with parallax and streak disabled." },
    ],
    accessibility: [
      "The scene canvas and the specular streak are aria-hidden; every real element lives in the DOM layers with normal semantics and focus order.",
      "Reduced motion paints a single static orb frame, parks all panes at zero offset and never sweeps the streak - the glass treatment itself carries the design.",
      "The canvas palette is read from theme tokens and re-read live on a prefers-color-scheme change or a data-theme/class swap, so the scene stays legible in both themes.",
      "Under forced colors the canvas and streak are hidden and the panes fall back to solid Canvas/CanvasText surfaces.",
    ],
    performance: [
      "One canvas plus one requestAnimationFrame loop, with the device pixel ratio capped at 2x so retina displays never over-render.",
      "Layer motion is translate3d-only and the backdrop blur cost is paid once per pane by the compositor.",
      "The orb loop pauses offscreen or when the tab is hidden; the entrance streak runs as a one-shot CSS animation rather than in JS.",
    ],
  },
  "aurora-panel": {
    usage: `import { AuroraPanel } from "@/components/motiq/aurora-panel";

<AuroraPanel roofHeight={210} ribbons={3} speed={1} overlay={<Badge>Live surface</Badge>}>
  <h3>aurora-panel</h3>
  <p>A contained sky for cards, not another full-page background.</p>
</AuroraPanel>`,
    api: [
      { prop: "children / overlay", type: "ReactNode", def: "-", desc: "Card body below the roof, and a badge slot pinned to the roof itself." },
      { prop: "roofHeight / ribbons", type: "number", def: "210 / 3", desc: "Roof height in px, and the ribbon count (clamped 2-5)." },
      { prop: "colors / intensity", type: "string[] / number", def: "theme / 1", desc: "Ribbon colors front to back (defaults to the theme cyan/azure pair) and an opacity multiplier (0-1.6)." },
      { prop: "speed", type: "number", def: "1", desc: "Time multiplier for the ribbon drift; 0 freezes the sky on a hand-tuned frame." },
      { prop: "lean / grain", type: "boolean / number", def: "true / 0.4", desc: "Pointer lean over the roof, and the grain overlay opacity (0-1)." },
      { prop: "seed", type: "number", def: "1", desc: "Deterministic seed for the grain tile and the star field (SSR-stable)." },
      { prop: "pauseWhenHidden / reducedMotion", type: "boolean", def: "true / -", desc: "Offscreen/tab-hidden pause, and force the still sky regardless of system preference." },
    ],
    accessibility: [
      "The roof canvas, the grain tile and the bottom fade are decorative and aria-hidden; the card body below is plain DOM with normal semantics.",
      "Reduced motion (and speed={0}) paints a single hand-tuned frame and never starts the loop - the roof reads as a still sky.",
      "touch-action: pan-y on the roof keeps mobile scrolling intact while the pointer lean still tracks horizontally.",
      "Sky, ribbon and star colors resolve from theme tokens and re-resolve on a theme change, so the roof is designed in both light and dark.",
    ],
    performance: [
      "Ribbon paths sample every 8px (~60 points each), so the per-frame cost is trivial; the expensive softening is a single CSS blur done once on the compositor.",
      "One canvas, one requestAnimationFrame loop, device pixel ratio capped at 2x, and the grain tile is generated once from a seeded PRNG.",
      "IntersectionObserver plus visibilitychange park the loop offscreen or in a hidden tab.",
    ],
  },
  "sticky-zoom-hero": {
    usage: `import { StickyZoomHero } from "@/components/motiq/sticky-zoom-hero";

// Page mode: a tall sticky wrapper drives the zoom from the document scroll.
<StickyZoomHero
  stages={[
    { caption: "Meet the workspace", body: "Every metric on one calm surface.", label: "framed", at: 0 },
    { caption: "Zoom into the detail", body: "The frame gives way.", label: "zooming", at: 0.34 },
    { caption: "Full bleed, full focus", body: "The border disappears.", label: "full bleed", at: 0.7 },
  ]}
  startScale={0.45}
  scrollLength={3.2}
  onStageChange={(i) => track("hero-beat", i)}
>
  <YourProductScreenshot />
</StickyZoomHero>`,
    api: [
      { prop: "children", type: "ReactNode", def: "-", desc: "The hero scene held inside the frame - a screenshot, a live UI, anything. You own it." },
      { prop: "stages", type: "StickyZoomStage[]", def: "-", desc: "{ caption, body?, label?, at? }. `at` is the 0-1 progress where the beat becomes active; it defaults to index / stages.length." },
      { prop: "scrollMode", type: '"page" | "container"', def: '"page"', desc: "Page mode drives the zoom from the document scroll with a tall sticky wrapper. Container mode gives the component its own keyboard-scrollable stage for cards and previews." },
      { prop: "startScale / scrollLength / radius", type: "number", def: "0.45 / 3.2 / 16", desc: "Resting scale of the framed card, scroll distance as a multiple of the scene height, and the corner radius at rest (it reaches 0 at full bleed)." },
      { prop: "vignette / showProgress", type: "boolean", def: "true / true", desc: "Lift a vignette off the scene as it opens, and render the progress bar + stage pills." },
      { prop: "height / smoothing", type: "number | string / number", def: "100vh (page), 540px (container) / 10", desc: "Scene height, and the progress smoothing rate (lambda per second) - higher tracks the scroll more tightly." },
      { prop: "onStageChange / label / reducedMotion", type: "misc", def: "-", desc: "Active-beat callback, the accessible name for the internal scroll region, and force-static regardless of system preference." },
      { prop: "--mk-progress / --mk-zoom", type: "CSS custom property", def: "1", desc: "Published on the scene every frame (raw progress and the eased zoom). Your children can choreograph off them in pure CSS with no React re-render." },
    ],
    accessibility: [
      "Container mode's stage is a real focusable region: arrow keys, Page Up/Down and Home/End scrub it, and the wheel is relayed to the page at both ends - the component never calls preventDefault on a wheel event, so there is no scroll jacking.",
      "Server markup is the settled scene at full size with every caption present, so the hero is complete and readable with JavaScript disabled.",
      "Reduced motion (system preference or the reducedMotion prop) pins the scene at full bleed and moves the captions into normal flow, so all beats are readable at once and the page stays plain scrollable content.",
      "The frame, glow, vignette and progress HUD are decorative and aria-hidden; only your children and the captions are in the accessible tree.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance; progress is read with getBoundingClientRect inside the loop, never from a scroll event handler, so there is at most one layout read per frame.",
      "Only transform and opacity animate. The border-radius write is quantized to whole pixels, so a full pass costs at most `radius` repaints instead of one per frame.",
      "The loop pauses when the hero scrolls offscreen or the tab is hidden (IntersectionObserver + visibilitychange) and is fully cancelled on unmount.",
      "Caption crossfades are CSS transitions on class-free inline styles - no React state changes per frame, and the stage callback fires only when the beat actually changes.",
    ],
  },
  "depth-parallax-scene": {
    usage: `import { DepthParallaxScene } from "@/components/motiq/depth-parallax-scene";

// Layers are yours: SVG ridges, gradients, floating cards - anything renderable.
<DepthParallaxScene
  layers={[
    { node: <Sky />, depth: 0.06 },
    { node: <FarRidge />, depth: 0.16, blurAtDepth: 2.5 },
    { node: <City />, depth: 0.32 },
    { node: <FloatingCards />, depth: 0.78 },
  ]}
  range={180}
  height={560}
  label="Layered ridge scene with floating interface cards."
/>`,
    api: [
      { prop: "layers", type: "ParallaxLayer[]", def: "-", desc: "{ node, depth, blurAtDepth? } back to front. `depth` is 0 (far, barely travels) to 1 (near, travels most); `blurAtDepth` is the max depth-of-field blur in px for that layer." },
      { prop: "scrollMode", type: '"page" | "container"', def: '"page"', desc: "Page mode reads the scene's position in the viewport and creates no scroll container at all. Container mode brackets the scene with lead-in/lead-out spacers inside its own keyboard-scrollable stage." },
      { prop: "range / pointerStrength", type: "number", def: "180 / 26", desc: "Total vertical travel in px at depth 1 across the pass, and the horizontal pointer travel in px at depth 1 (vertical is ~54% of it)." },
      { prop: "pointer / depthOfField / ambientDrift", type: "boolean", def: "true", desc: "Pointer nudge, per-layer defocus, and the idle sine drift that gives the scene life before the pointer ever enters." },
      { prop: "height / scrollLength / smoothing", type: "misc", def: "560 / 2 / 8", desc: "Scene height, container-mode pass distance as a multiple of that height, and the progress smoothing rate (lambda per second)." },
      { prop: "label / reducedMotion", type: "string / boolean", def: "-", desc: "The single accessible description for the whole scene, and force-static regardless of system preference." },
    ],
    accessibility: [
      "The scene is purely decorative: it carries one role=\"img\" with your `label`, and every layer inside it is aria-hidden - assistive tech gets one description, not six anonymous divs.",
      "Page mode adds no scroll container, so there is nothing to trap the wheel or the keyboard; container mode's stage is focusable, arrow-key scrollable and overscroll-contained.",
      "Reduced motion freezes the centred composition with zero blur and no pointer response.",
      "Server markup is the centred composition with no transforms, so the scene is complete without JavaScript.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance; the scene position is measured with getBoundingClientRect inside the loop and smoothed through an exponential lerp.",
      "Layers move on translate3d only. The depth-of-field blur is quantized to 0.2px steps and written only when it changes, so a filter is never re-parsed every frame.",
      "Layers are oversized 14% on each axis, so travel never reveals an edge and no layout ever reflows.",
      "The loop pauses when the scene scrolls offscreen or the tab is hidden, and pointer listeners are removed on unmount.",
    ],
  },
  "mask-wipe-sections": {
    usage: `import { MaskWipeSections } from "@/components/motiq/mask-wipe-sections";

// The first section is the base layer; each later one wipes over it.
<MaskWipeSections
  sections={[
    { node: <Draft />, label: "draft" },
    { node: <Build />, wipe: "sweep", label: "angled sweep" },
    { node: <Ship />, wipe: "iris", origin: [78, 30], label: "iris" },
    { node: <Learn />, wipe: "curtain", label: "curtain" },
  ]}
  scrollLength={3.8}
  dwell={0.05}
  onSectionChange={setChapter}
/>`,
    api: [
      { prop: "sections", type: "WipeSection[]", def: "-", desc: "{ node, wipe?, origin?, accent?, label? }. `wipe` is \"sweep\" | \"iris\" | \"curtain\" (ignored on the first section); `origin` is the iris centre as [x%, y%]; `accent` overrides the leading-edge colour." },
      { prop: "scrollMode", type: '"page" | "container"', def: '"page"', desc: "Page mode drives the cuts from the document scroll with a tall sticky wrapper. Container mode gives the component its own keyboard-scrollable stage." },
      { prop: "scrollLength / dwell", type: "number", def: "3.8 / 0.05", desc: "Scroll distance as a multiple of the scene height, and the held beat between wipes in progress units. Windows are derived from the section count, so 3 or 6 chapters both pace evenly." },
      { prop: "edgeGlow / showProgress", type: "boolean", def: "true / true", desc: "Render the lit leading edge on each cut, and the per-wipe progress HUD." },
      { prop: "height / smoothing", type: "misc", def: "100vh (page), 540px (container) / 9", desc: "Scene height and the progress smoothing rate (lambda per second)." },
      { prop: "onSectionChange / label / reducedMotion", type: "misc", def: "-", desc: "Frontmost-chapter callback, the accessible name for the internal scroll region, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Reduced motion collapses the sticky stack entirely: all chapters render as plain stacked sections with no clip-path, fully readable and scrollable in normal flow.",
      "Server markup carries no clip-path either, so every chapter is readable with JavaScript disabled; the closed state is installed in a layout effect before the first paint.",
      "Container mode's stage is a focusable, arrow-key scrollable region with overscroll-behavior: contain, and the wheel is relayed to the page at both ends rather than trapped - the component never preventDefaults.",
      "Edge glows, the iris ring and the wipe HUD are decorative and aria-hidden; chapter content is ordinary DOM you own.",
    ],
    performance: [
      "Basic-shape clip-path (polygon/circle/inset) animates on the compositor in Chromium, and only the currently active wipe's style is written each frame.",
      "The iris ring is an SVG circle whose `r` attribute animates - a bordered element scaled to the same radius thickens its border as it grows, which is exactly the artefact this avoids.",
      "One requestAnimationFrame loop per instance, progress read from layout inside the loop and smoothed through an exponential lerp; edge glows are transform + opacity only.",
      "The loop pauses offscreen or when the tab is hidden and is cancelled on unmount; the chapter callback fires only when the frontmost chapter actually changes.",
    ],
  },
  "scroll-count-stats": {
    usage: `import { ScrollCountStats } from "@/components/motiq/scroll-count-stats";

<ScrollCountStats
  title="Numbers that rewind"
  description="scroll back — the whole band unwinds"
  stats={[
    { value: 48210, label: "registry installs, trailing 90 days", sparkline: [6, 10, 8, 14, 19, 24, 31] },
    { value: "99.98", suffix: "%", label: "of scroll frames inside the 16.6 ms budget" },
    { value: 312, label: "easing-curve commits behind this batch" },
  ]}
/>`,
    api: [
      { prop: "stats", type: "CountStat[]", def: "-", desc: "{ value, label, suffix?, sparkline?, format? }. Numbers are formatted with `format` (default: deterministic comma grouping); strings pass through verbatim, so \"48,210\" and \"99.98\" keep their separators." },
      { prop: "title / description / underline", type: "misc", def: '- / - / "signature"', desc: "Band heading, the small line under it, and whether the coral signature underline draws itself beneath the heading. This underline is the only place the batch spends --color-signature." },
      { prop: "scrollMode / scrollLength", type: "misc", def: '"page" / 2.6', desc: "Page mode scrubs the band from the document scroll with a tall sticky wrapper; container mode gives it its own keyboard-scrollable stage. scrollLength is the pass distance as a multiple of the scene height." },
      { prop: "stagger / overshoot", type: "number", def: "0.055 / 0.35", desc: "Per-digit roll stagger in progress units (most significant digit first), and the overshoot past the target in rows - it passes the target and settles exactly on it." },
      { prop: "rowHeight / height / smoothing", type: "misc", def: "46 / 100vh (page), 520px (container) / 9", desc: "Odometer row height in px (it drives the numeral size), scene height, and the progress smoothing rate." },
      { prop: "showProgress / label / reducedMotion", type: "misc", def: "false / - / -", desc: "The scrub percentage readout, the accessible name for the internal scroll region, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Every stat's true value is in the accessible tree as visually-hidden text next to a visible label; the rolling glyph columns are aria-hidden decoration, so a screen reader hears \"48,210 registry installs\", never thirty digits.",
      "The band is a list (role=\"list\" / \"listitem\"), so the number of stats is announced.",
      "Reduced motion and the no-JS path both rest on the final values: the resting column transform is expressed in row units, so the real number is on screen before any script runs, with the underline and sparklines fully drawn.",
      "Container mode's stage is focusable and arrow-key scrollable with overscroll-behavior: contain; the wheel is relayed at both ends rather than trapped.",
    ],
    performance: [
      "Each digit column is a fixed-height overflow crop around a 30-row strip, so a roll is one translate3d per column - no layout, no text re-measure, and glyphs can never spill into the neighbouring column.",
      "Everything is a pure function of smoothed progress, which is why reversing the scroll rewinds perfectly rather than replaying an animation.",
      "The crop height is measured once after layout and re-measured on resize (ResizeObserver), so a font or zoom change never desyncs the roll from the crop.",
      "Digits use tabular-nums so columns never shift; the single rAF loop pauses offscreen and is cancelled on unmount.",
    ],
  },
  "velocity-skew-feed": {
    usage: `import { VelocitySkewFeed } from "@/components/motiq/velocity-skew-feed";

// You own the cards; each one gets its own shear/stretch wrapper.
<VelocitySkewFeed
  items={events.map((e) => <ActivityCard key={e.id} event={e} />)}
  scrollMode="container"
  height={540}
  maxSkew={6.5}
/>`,
    api: [
      { prop: "items", type: "ReactNode[]", def: "-", desc: "The feed cards. Each one is wrapped individually, so the cards shear as separate objects rather than the list shearing as one block." },
      { prop: "scrollMode / axis / height", type: "misc", def: '"container" / "y" / 540', desc: "Container mode scrolls the feed inside its own keyboard-operable stage; page mode reacts to the document scroll and flows at its content height. `axis` switches to a horizontal rail." },
      { prop: "maxSkew / stretch / sensitivity", type: "number", def: "6.5 / 0.008 / 0.0035", desc: "Maximum shear in degrees, extra stretch along the scroll axis per degree of shear, and degrees of target shear per px/s of smoothed velocity." },
      { prop: "stiffness / damping", type: "number", def: "90 / 14", desc: "The spring the shear is integrated through. Damping below ~2·sqrt(stiffness) overshoots once on a hard stop - that overshoot is the rubber snap." },
      { prop: "smoothing", type: "number", def: "12", desc: "Velocity smoothing rate (lambda per second) applied before the spring, so a jittery trackpad never reaches the cards raw." },
      { prop: "meter / meterScale", type: "boolean / number", def: "false / 2600", desc: "The velocity meter readout (a debugging surface, off by default) and its full-scale velocity in px/s." },
      { prop: "label / reducedMotion", type: "string / boolean", def: "-", desc: "The accessible name for the internal scroll region, and force-static regardless of system preference." },
    ],
    accessibility: [
      "Reduced motion disables shear, stretch and the meter entirely - the feed stays a plain, fully scrollable list, because the effect carries no information.",
      "The stage is a focusable region with overscroll-behavior: contain; arrow keys, Page Up/Down and Home/End scroll it, and the wheel is relayed to the page at both ends rather than trapped.",
      "The velocity meter is decorative and aria-hidden; its readouts use tabular-nums and refresh on a fixed cadence so nothing reflows.",
      "Server markup is an untransformed feed, so every card is readable without JavaScript.",
    ],
    performance: [
      "Velocity is a smoothed delta-scroll/delta-time read inside the single rAF loop, and the shear it targets is integrated with real frame time - a dropped frame changes the timing, never the destination.",
      "One transform write per card per frame, transforms only. The loop stops writing entirely once spring energy falls under threshold, with one final identity write so cards settle exactly square.",
      "The loop pauses when the feed scrolls offscreen or the tab is hidden and is cancelled on unmount.",
      "Meter text is written imperatively and only when the rounded value changes, so the readout never triggers a React re-render.",
    ],
  },
  "orbital-gallery": {
    usage: `import { OrbitalGallery, type OrbitalGalleryItem } from "@/components/motiq/orbital-gallery";

const items: OrbitalGalleryItem[] = [
  { id: "a", src: "/covers/basin.jpg", alt: "Basin at noon", caption: "Basin at noon" },
  { id: "b", node: <TemplateCard />, caption: "Signal bloom" },
  // 6-12 cards read best
];

<OrbitalGallery
  items={items}
  autoRotate={0.14}
  onActiveIndexChange={(i, item) => track(item.id)}
/>`,
    api: [
      { prop: "items", type: "OrbitalGalleryItem[]", def: "-", desc: "{ id, src?, alt?, node?, caption? }. `src` renders a plain <img>; `node` takes any media you like." },
      { prop: "radius / cardWidth / cardHeight", type: "number", def: "auto / 190 / 250", desc: "Ring radius (derived from card width and item count when unset) and card size; the ring auto-scales down on narrow containers." },
      { prop: "autoRotate / friction", type: "number", def: "0.14 / 2.2", desc: "Idle drift in rad/s after 2.5s of stillness, and the inertia decay constant - a flick decays as v·e^(−friction·t)." },
      { prop: "dimRear / blurRear", type: "number", def: "0.78 / 2.2", desc: "Depth cue at the back of the ring: dim amount (0-1) and blur in px, both driven by cos θ." },
      { prop: "activeIndex / defaultActiveIndex / onActiveIndexChange", type: "misc", def: "- / 0 / -", desc: "Controlled or uncontrolled fronted card; the callback fires with (index, item) whenever a different card reaches the front." },
      { prop: "showCaptionBar / hint", type: "misc", def: "true / drag · flick · arrows", desc: "Footer bar with the fronted caption + position, and its trailing affordance text." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Force the static variant (no drift, no inertia - input maps 1:1), and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "The ring is a labelled carousel group with a roving tabindex: one tab stop, then arrows rotate a card, Home/End jump to the ends, and Enter/Space front the focused card.",
      "Every drag gesture has a keyboard equivalent, and the fronted card is announced through a polite live region as well as shown in the caption bar.",
      "Cards are real buttons at 190x250px (far past the 24px target minimum) with a visible focus ring; the floor bloom and depth dimmers are aria-hidden.",
      "Reduced motion (system preference or the prop) removes drift and inertia entirely - drag maps 1:1 and arrows jump instantly, with every card still reachable.",
    ],
    performance: [
      "One requestAnimationFrame loop per instance with delta-time integration; per frame it writes only transform, opacity and a quantized blur straight to the card elements - no per-frame React state.",
      "Blur is quantized to 0.25px steps so the filter string rarely invalidates, and only rotateY/translateZ/scale change, keeping the ring fully composited.",
      "The loop stops the moment the gallery scrolls offscreen or the tab is hidden (IntersectionObserver + visibilitychange).",
      "No runtime dependencies: the inertia, focus spring and drift are inline physics, and images are plain <img> elements you supply.",
    ],
  },
  "flow-warp-image": {
    usage: `import { FlowWarpImage } from "@/components/motiq/flow-warp-image";

<FlowWarpImage
  src="/photos/ridgeline.jpg"
  alt="Mountain ridgeline at dusk"
  grid={[32, 20]}
  overlay={<h2 className="absolute left-4 top-4">Ridgeline, dusk</h2>}
/>`,
    api: [
      { prop: "src / alt", type: "string | canvas | image / string", def: "- / \"\"", desc: "The picture sampled into the mesh (URL, or an already-painted canvas/image). An empty alt marks the whole surface decorative." },
      { prop: "grid", type: "[number, number]", def: "[32, 20]", desc: "Mesh resolution as [columns, rows] - 32x20 is 640 sub-rect draws per frame." },
      { prop: "stiffness / damping", type: "number", def: "90 / 8", desc: "Per-node return spring; the tuned pair makes the wake ripple for roughly 700ms." },
      { prop: "radius / strength", type: "number", def: "140 / 1", desc: "Pointer push radius in px (falloff is (1−d/R)²) and an overall impulse gain multiplier." },
      { prop: "splashOnLeave / idleWave", type: "boolean", def: "true / true", desc: "Radial splash from the last position on pointer exit, and a virtual pointer riding a Lissajous path after 3s of stillness." },
      { prop: "seed / overlay", type: "misc", def: "12 / -", desc: "Deterministic seed for the built-in fallback surface (used before/without `src`), and content rendered above the canvas." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Render the still image and never start the physics loop, and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "With alt text the surface is a labelled image that takes focus; arrow keys steer a ripple point and Space fires a splash, so the pointer effect is never mouse-only.",
      "An empty alt marks the surface as pure decoration: it is aria-hidden AND not focusable, so no focusable node is ever hidden from assistive tech.",
      "The canvas itself is aria-hidden - the picture's meaning lives in the label, and the warp adds no information.",
      "Reduced motion renders the still image with the mesh at rest; touch-action is pan-y so horizontal strokes warp while vertical swipes still scroll the page.",
    ],
    performance: [
      "One canvas and one requestAnimationFrame loop; the picture is drawn once into an offscreen source and redrawn per frame as sub-rects - no per-pixel work, no getImageData.",
      "Device-pixel-ratio is capped at 2 so retina displays never over-render, and the mesh is one flat Float32Array (no per-node allocation).",
      "Pointer speed is clamped before it becomes impulse, so a fast flick can't blow the mesh apart or spike a frame.",
      "The loop pauses when scrolled offscreen or the tab is hidden, and never starts at all under reduced motion.",
    ],
  },
  "velocity-marquee": {
    usage: `import { VelocityMarquee, type VelocityMarqueeRow } from "@/components/motiq/velocity-marquee";

const rows: VelocityMarqueeRow[] = [
  { id: "media", label: "Recent work", direction: 1, items: shots.map((s) => ({ id: s.id, node: <ShotCard {...s} /> })) },
  { id: "logos", label: "Customers", direction: -1, items: logos.map((l) => ({ id: l.id, node: <LogoChip {...l} /> })) },
];

<VelocityMarquee rows={rows} baseSpeed={36} />`,
    api: [
      { prop: "rows", type: "VelocityMarqueeRow[]", def: "-", desc: "{ id, items, direction?, label? }; each item is { id, node }. Direction alternates by index when unset." },
      { prop: "baseSpeed", type: "number", def: "36", desc: "Resting drift speed in px/s." },
      { prop: "velocityGain / maxBoost", type: "number", def: "0.006 / 5", desc: "Scroll-velocity gain and its ceiling: boost = 1 + min(|v|·gain, maxBoost), so the default peaks at ~6× speed." },
      { prop: "maxSkew", type: "number", def: "10", desc: "Peak shear in degrees, signed by row direction; both boost and shear bleed off over roughly 600ms." },
      { prop: "hoverSlow", type: "number", def: "0.25", desc: "Speed multiplier for the rail under the pointer or keyboard focus." },
      { prop: "showMeter / gap", type: "misc", def: "true / 18", desc: "Live boost meter chip, and the gap between items in px (it also sets the seamless wrap distance)." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Freeze the rails at their rest offsets, and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "Each rail is a named group and the content is duplicated only for a seamless wrap: the duplicate copy is aria-hidden and inert, so links and cards are announced exactly once.",
      "Rails slow on keyboard focus as well as hover, and the lift/scale treatment fires on focus-within - keyboard users get the same affordance as pointer users.",
      "The boost meter is decorative (aria-hidden); nothing in the component conveys state by colour alone.",
      "Reduced motion freezes both rails at their rest offsets while every item stays present, hoverable and focusable.",
    ],
    performance: [
      "Page scroll is read by ONE passive scroll listener that caches the position; the rAF loop never touches the DOM for layout, so scrolling stays smooth.",
      "Each row costs a single translate3d + skewX per frame; the card lift is a pure CSS transition, so hovering costs nothing in the loop.",
      "The boost meter is written imperatively and only when the rounded value actually changes - no React re-render per frame.",
      "The loop and its scroll listener are torn down when the marquee scrolls offscreen, the tab is hidden, or the component unmounts.",
    ],
  },
  "filmstrip-scrub": {
    usage: `import { FilmstripScrub, type FilmstripFrame } from "@/components/motiq/filmstrip-scrub";

const frames: FilmstripFrame[] = shots.map((s, i) => ({
  id: s.id,
  src: s.url,
  alt: \`Step \${i + 1}: \${s.title}\`,
  label: s.phase,
}));

<FilmstripScrub frames={frames} fps={24} onFrameIndexChange={setStep} />`,
    api: [
      { prop: "frames", type: "FilmstripFrame[]", def: "-", desc: "{ id, src?, alt?, node?, label? }; 8-24 stills read best. `label` is the phase name in the readout and the slider's value text." },
      { prop: "fps", type: "number", def: "24", desc: "Timecode base for the monospace readout." },
      { prop: "idleSpeed / resumeAfter / loop", type: "misc", def: "0.9 / 3 / true", desc: "Idle auto-scrub in frames/s (0 disables it), seconds of stillness before it resumes, and ping-pong at the ends." },
      { prop: "stiffness / damping", type: "number", def: "90 / 16", desc: "Playhead spring (ζ≈0.84) - it lands with exactly one soft overshoot." },
      { prop: "hoverScrub", type: "boolean", def: "true", desc: "Scrub on hover as well as drag." },
      { prop: "frameIndex / defaultFrameIndex / onFrameIndexChange", type: "misc", def: "- / 0 / -", desc: "Controlled or uncontrolled frame selection; the callback fires when the nearest frame changes." },
      { prop: "scrubberLabel / reducedMotion / pauseWhenHidden", type: "misc", def: "- / - / true", desc: "Accessible name for the strip, the forced-static variant, and offscreen/tab-hidden pausing." },
    ],
    accessibility: [
      "The strip is a real slider: focusable, arrow keys step one frame, Home/End jump to the ends, aria-valuenow tracks the frame and aria-valuetext reads \"Frame 3 of 12, midday\".",
      "Preview frames carry your alt text; the strip thumbnails are decorative duplicates and are aria-hidden, so the sequence is announced once.",
      "touch-action is pan-y on the strip, so dragging scrubs horizontally while a vertical swipe still scrolls the page.",
      "Reduced motion removes autoplay and the spring entirely - the playhead and preview snap directly to the pointer or key press.",
    ],
    performance: [
      "One requestAnimationFrame loop writes frame opacities, the playhead offset and the timecode straight to the DOM; React only re-renders when the nearest frame changes.",
      "The preview crossfades exactly two layers at a time (every other frame sits at opacity 0), and thumbnails are static.",
      "The playhead moves via a percentage offset on a composited layer, never through layout.",
      "The loop pauses when the strip scrolls offscreen or the tab is hidden, and never starts under reduced motion.",
    ],
  },
  "compare-reveal": {
    usage: `import { CompareReveal } from "@/components/motiq/compare-reveal";

<CompareReveal
  before={{ src: "/v1.png", alt: "Design v1 wireframe" }}
  after={{ src: "/v2.png", alt: "Design v2 render" }}
  labels={["v1 wireframe", "v2 render"]}
  onPositionChange={(pct) => console.log(pct)}
/>`,
    api: [
      { prop: "before / after", type: "ReactNode | { src, alt? }", def: "-", desc: "The two sides. Pass an image descriptor for a plain <img>, or any node (a live component, a video, a chart) to render yourself." },
      { prop: "position / defaultPosition / onPositionChange", type: "misc", def: "- / 50 / -", desc: "Controlled or uncontrolled divider percentage; every input path (drag, keys, double-click) commits through state." },
      { prop: "introSweep", type: "boolean", def: "true", desc: "Self-demonstrating sweep on first viewport entry - 50 → 96 → 4 → 50 over 2.6s, replayed only if it was interrupted." },
      { prop: "stiffness / damping", type: "number", def: "140 / 18", desc: "Divider spring (ζ≈0.76); the lag reads as elastic resistance and the release as a soft snap." },
      { prop: "labels", type: "[string, string]", def: "[\"Before\", \"After\"]", desc: "Corner chips; each fades out when its side narrows past 12%." },
      { prop: "snapOnDoubleClick", type: "number", def: "50", desc: "Percentage the divider snaps to on double-click." },
      { prop: "reducedMotion / pauseWhenHidden", type: "boolean", def: "- / true", desc: "Drop the sweep and the spring so the divider maps 1:1 to input, and stop the loop offscreen or when the tab is hidden." },
    ],
    accessibility: [
      "The handle is a native button with slider semantics: arrows move 2%, Shift+arrows 10%, Home/End pin the ends, and aria-valuenow/aria-valuetext track the reveal live.",
      "The 46px handle is well past the 24px target minimum and keeps a visible focus ring; the divider rule that contains it is never aria-hidden, so the control stays reachable.",
      "Both sides carry your alt text; the corner chips and the divider rule are decorative and add nothing to the accessibility tree.",
      "touch-action is pan-y so dragging the divider on touch never blocks page scrolling, and reduced motion removes the intro sweep and the spring while leaving the comparator fully operable.",
    ],
    performance: [
      "The reveal is a clip-path inset on a composited layer - both sides are painted once and never per frame.",
      "One requestAnimationFrame loop carries the intro sweep and the spring; it stops offscreen, when the tab is hidden, and never starts under reduced motion.",
      "Per frame the loop writes one clip-path, one left offset and two opacities imperatively - no per-frame React state.",
      "The coral signature glow is a static box-shadow, so the handle's emphasis costs nothing at runtime.",
    ],
  },
};
