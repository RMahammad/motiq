"use client";

import * as React from "react";

import { ActivityStreamCatalogPreview } from "./catalog/activity-stream";
import { AgentRunTimelineCatalogPreview } from "./catalog/agent-run-timeline";
import { AiAgentWorkspaceCatalogPreview } from "./catalog/ai-agent-workspace";
import { AiResponseStreamCatalogPreview } from "./catalog/ai-response-stream";
import { AnimatedListCatalogPreview } from "./catalog/animated-list";
import { ApiRequestInspectorCatalogPreview } from "./catalog/api-request-inspector";
import { ApprovalWorkflowCatalogPreview } from "./catalog/approval-workflow";
import { CartItemTransitionCatalogPreview } from "./catalog/cart-item-transition";
import { CheckoutProgressCatalogPreview } from "./catalog/checkout-progress";
import { CollaborativeReviewWorkspaceCatalogPreview } from "./catalog/collaborative-review-workspace";
import { CommentThreadCatalogPreview } from "./catalog/comment-thread";
import { DataQualityStatusCatalogPreview } from "./catalog/data-quality-status";
import { DataRefreshStateCatalogPreview } from "./catalog/data-refresh-state";
import { DeploymentCommandCenterCatalogPreview } from "./catalog/deployment-command-center";
import { DeploymentPipelineCatalogPreview } from "./catalog/deployment-pipeline";
import { EnvironmentSwitcherCatalogPreview } from "./catalog/environment-switcher";
import { FileUploadPipelineCatalogPreview } from "./catalog/file-upload-pipeline";
import { FilterResultTransitionCatalogPreview } from "./catalog/filter-result-transition";
import { KanbanCardMovementCatalogPreview } from "./catalog/kanban-card-movement";
import { KeyboardSafeFormCatalogPreview } from "./catalog/keyboard-safe-form";
import { KineticEmphasisCatalogPreview } from "./catalog/kinetic-emphasis";
import { KpiNumberMorphCatalogPreview } from "./catalog/kpi-number-morph";
import { LiveLogStreamCatalogPreview } from "./catalog/live-log-stream";
import { LiveOperationsDashboardCatalogPreview } from "./catalog/live-operations-dashboard";
import { LivePresenceStackCatalogPreview } from "./catalog/live-presence-stack";
import { LuminousTopographyCatalogPreview } from "./catalog/luminous-topography";
import { MentionSuggestionsCatalogPreview } from "./catalog/mention-suggestions";
import { MessageDeliveryStatesCatalogPreview } from "./catalog/message-delivery-states";
import { MobileFilterSheetCatalogPreview } from "./catalog/mobile-filter-sheet";
import { MultiFileQueueCatalogPreview } from "./catalog/multi-file-queue";
import { PasskeySetupFlowCatalogPreview } from "./catalog/passkey-setup-flow";
import { ProcessingTimelineCatalogPreview } from "./catalog/processing-timeline";
import { ProductVariantSelectorCatalogPreview } from "./catalog/product-variant-selector";
import { ProjectTimelineCatalogPreview } from "./catalog/project-timeline";
import { PromptComposerCatalogPreview } from "./catalog/prompt-composer";
import { SessionSecurityCenterCatalogPreview } from "./catalog/session-security-center";
import { SourceCitationRailCatalogPreview } from "./catalog/source-citation-rail";
import { StreamingDataRowsCatalogPreview } from "./catalog/streaming-data-rows";
import { SwipeActionRowCatalogPreview } from "./catalog/swipe-action-row";
import { TaskDependencyMapCatalogPreview } from "./catalog/task-dependency-map";
import { ThreadExpansionCatalogPreview } from "./catalog/thread-expansion";
import { ToolCallActivityCatalogPreview } from "./catalog/tool-call-activity";
import { TwoFactorSetupFlowCatalogPreview } from "./catalog/two-factor-setup-flow";
import { TypingAndPresenceCatalogPreview } from "./catalog/typing-and-presence";
import { WebhookEventStreamCatalogPreview } from "./catalog/webhook-event-stream";

/**
 * Compact catalog adapters (docs/55 §7). Each renders the REAL component (or an
 * honest compact composition of it) in ONE representative state, sized for a
 * discovery card: no control panels, no every-state dumps, deterministic content,
 * readable at card scale, light/dark + reduced-motion safe.
 *
 * Components without an entry here fall back to their full detail preview, which
 * `CatalogStage` bounds and crops. See docs/55 §9 for per-component status.
 */

export const catalogPreviewMap: Record<string, React.ComponentType> = {
  "activity-stream": ActivityStreamCatalogPreview,
  "agent-run-timeline": AgentRunTimelineCatalogPreview,
  "ai-agent-workspace": AiAgentWorkspaceCatalogPreview,
  "ai-response-stream": AiResponseStreamCatalogPreview,
  "animated-list": AnimatedListCatalogPreview,
  "api-request-inspector": ApiRequestInspectorCatalogPreview,
  "approval-workflow": ApprovalWorkflowCatalogPreview,
  "cart-item-transition": CartItemTransitionCatalogPreview,
  "checkout-progress": CheckoutProgressCatalogPreview,
  "collaborative-review-workspace": CollaborativeReviewWorkspaceCatalogPreview,
  "comment-thread": CommentThreadCatalogPreview,
  "data-quality-status": DataQualityStatusCatalogPreview,
  "data-refresh-state": DataRefreshStateCatalogPreview,
  "deployment-command-center": DeploymentCommandCenterCatalogPreview,
  "deployment-pipeline": DeploymentPipelineCatalogPreview,
  "environment-switcher": EnvironmentSwitcherCatalogPreview,
  "file-upload-pipeline": FileUploadPipelineCatalogPreview,
  "filter-result-transition": FilterResultTransitionCatalogPreview,
  "kanban-card-movement": KanbanCardMovementCatalogPreview,
  "keyboard-safe-form": KeyboardSafeFormCatalogPreview,
  "kinetic-emphasis": KineticEmphasisCatalogPreview,
  "kpi-number-morph": KpiNumberMorphCatalogPreview,
  "live-log-stream": LiveLogStreamCatalogPreview,
  "live-operations-dashboard": LiveOperationsDashboardCatalogPreview,
  "live-presence-stack": LivePresenceStackCatalogPreview,
  "luminous-topography": LuminousTopographyCatalogPreview,
  "mention-suggestions": MentionSuggestionsCatalogPreview,
  "message-delivery-states": MessageDeliveryStatesCatalogPreview,
  "mobile-filter-sheet": MobileFilterSheetCatalogPreview,
  "multi-file-queue": MultiFileQueueCatalogPreview,
  "passkey-setup-flow": PasskeySetupFlowCatalogPreview,
  "processing-timeline": ProcessingTimelineCatalogPreview,
  "product-variant-selector": ProductVariantSelectorCatalogPreview,
  "project-timeline": ProjectTimelineCatalogPreview,
  "prompt-composer": PromptComposerCatalogPreview,
  "session-security-center": SessionSecurityCenterCatalogPreview,
  "source-citation-rail": SourceCitationRailCatalogPreview,
  "streaming-data-rows": StreamingDataRowsCatalogPreview,
  "swipe-action-row": SwipeActionRowCatalogPreview,
  "task-dependency-map": TaskDependencyMapCatalogPreview,
  "thread-expansion": ThreadExpansionCatalogPreview,
  "tool-call-activity": ToolCallActivityCatalogPreview,
  "two-factor-setup-flow": TwoFactorSetupFlowCatalogPreview,
  "typing-and-presence": TypingAndPresenceCatalogPreview,
  "webhook-event-stream": WebhookEventStreamCatalogPreview,
};
