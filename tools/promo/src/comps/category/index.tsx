import { AvatarsDemo, ComposerDemo, KanbanDemo } from "../Showcase";
import { makeCategory } from "./Layout";
import { ContourSurfaceDemo, QueueLanesDemo, TopologyFieldDemo } from "./demos-backgrounds";
import { AgentOpsHeroDemo, DeployHeroDemo, LiveDataHeroDemo } from "./demos-heroes";
import {
  EnvSwitcherDemo,
  LogStreamDemo,
  PipelineDemo,
  ResponseStreamDemo,
  ToolCallDemo,
} from "./demos-ai-dev";
import {
  ApprovalDemo,
  CommentThreadDemo,
  DependencyMapDemo,
  FilterTransitionDemo,
  KpiMorphDemo,
  ProjectTimelineDemo,
  StreamingRowsDemo,
} from "./demos-collab-data";
import {
  CartTransitionDemo,
  CheckoutProgressDemo,
  DeliveryStatesDemo,
  FileUploadPipelineDemo,
  MultiFileQueueDemo,
  PasskeyDemo,
  ProcessingTimelineDemo,
  SessionSecurityDemo,
  ThreadExpansionDemo,
  TwoFactorDemo,
  TypingPresenceDemo,
  VariantSelectorDemo,
} from "./demos-flows";

const KICKER = "Motiq catalog";

// Tile labels are real catalog component names (apps/docs/lib/catalog.ts).
export const categories = [
  makeCategory(
    "motiq-cat-product-backgrounds",
    { kicker: KICKER, heading: "Product Backgrounds", sub: "Animated canvases that make product surfaces feel alive." },
    [
      { label: "Workflow Topology Field", demo: TopologyFieldDemo },
      { label: "Queue Pulse Lanes", demo: QueueLanesDemo },
      { label: "Data Contour Surface", demo: ContourSurfaceDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-workflow-heroes",
    { kicker: KICKER, heading: "Workflow Heroes", sub: "Full hero blocks with live product surfaces built in." },
    [
      { label: "Agent Operations Hero", demo: AgentOpsHeroDemo },
      { label: "Deployment Control Hero", demo: DeployHeroDemo },
      { label: "Live Data Command Hero", demo: LiveDataHeroDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-ai",
    { kicker: KICKER, heading: "AI interfaces", sub: "Streaming, tool calls and composers for AI products." },
    [
      { label: "AI Response Stream", demo: ResponseStreamDemo },
      { label: "Tool Call Activity", demo: ToolCallDemo },
      { label: "Prompt Composer", demo: ComposerDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-developer-tools",
    { kicker: KICKER, heading: "Developer tools", sub: "Pipelines, logs and environments that feel first-party." },
    [
      { label: "Deployment Pipeline", demo: PipelineDemo },
      { label: "Live Log Stream", demo: LogStreamDemo },
      { label: "Environment Switcher", demo: EnvSwitcherDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-collaboration",
    { kicker: KICKER, heading: "Collaboration", sub: "Presence, comments and approvals for multiplayer apps." },
    [
      { label: "Live Presence Stack", demo: AvatarsDemo },
      { label: "Comment Thread", demo: CommentThreadDemo },
      { label: "Approval Workflow", demo: ApprovalDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-data-motion",
    { kicker: KICKER, heading: "Data motion", sub: "Numbers, rows and filters that move with meaning." },
    [
      { label: "KPI Number Morph", demo: KpiMorphDemo },
      { label: "Streaming Data Rows", demo: StreamingRowsDemo },
      { label: "Filter Result Transition", demo: FilterTransitionDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-productivity",
    { kicker: KICKER, heading: "Productivity", sub: "Boards, dependencies and timelines for work tools." },
    [
      { label: "Kanban Card Movement", demo: KanbanDemo },
      { label: "Task Dependency Map", demo: DependencyMapDemo },
      { label: "Project Timeline", demo: ProjectTimelineDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-file-workflows",
    { kicker: KICKER, heading: "File workflows", sub: "Uploads, queues and processing states users trust." },
    [
      { label: "File Upload Pipeline", demo: FileUploadPipelineDemo },
      { label: "Multi-file Queue", demo: MultiFileQueueDemo },
      { label: "Processing Timeline", demo: ProcessingTimelineDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-commerce",
    { kicker: KICKER, heading: "Commerce", sub: "Variants, carts and checkout flows that convert." },
    [
      { label: "Product Variant Selector", demo: VariantSelectorDemo },
      { label: "Cart Item Transition", demo: CartTransitionDemo },
      { label: "Checkout Progress", demo: CheckoutProgressDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-security",
    { kicker: KICKER, heading: "Security & accounts", sub: "Passkeys, 2FA and session control, beautifully handled." },
    [
      { label: "Passkey Setup Flow", demo: PasskeyDemo },
      { label: "Two-Factor Setup Flow", demo: TwoFactorDemo },
      { label: "Session Security Center", demo: SessionSecurityDemo },
    ],
  ),
  makeCategory(
    "motiq-cat-communication",
    { kicker: KICKER, heading: "Communication", sub: "Delivery states, typing and threads for messaging UIs." },
    [
      { label: "Message Delivery States", demo: DeliveryStatesDemo },
      { label: "Typing and Presence", demo: TypingPresenceDemo },
      { label: "Thread Expansion", demo: ThreadExpansionDemo },
    ],
  ),
];
