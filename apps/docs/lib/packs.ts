// Workflow packs — curated groups of components that compose into one complete
// block (a finished product outcome). Pack pages live at /packs/<slug>; the
// block itself is a catalog item (kind: "block") at /components/<blockSlug>.
// Pricing/license are intentionally NOT set here — see docs/40-commercial-packaging.md.
import { product, installCommand, namespacedInstall } from "./product";

export interface Pack {
  slug: string;
  name: string;
  tagline: string;
  problem: string;
  /** The complete block this pack delivers (a catalog item, kind "block"). */
  blockSlug: string;
  blockName: string;
  /** Component slugs the block composes, in visual order. */
  components: string[];
  /** Pack-level registry item name (installs the block + all components). */
  packRegistryItem: string;
  useCases: string[];
  states: string[];
}

export const packs: Pack[] = [
  {
    slug: "ai-interface",
    name: "AI Interface Pack",
    tagline: "Ship a complete agent workspace — run timeline, tools, streamed answer, and citations.",
    problem:
      "AI products need more than a chat box: teams rebuild run timelines, tool-activity panels, streamed responses, and source attribution from scratch every time. This pack delivers them as one composable, accessible workspace your app drives.",
    blockSlug: "ai-agent-workspace",
    blockName: "AI Agent Workspace",
    components: ["agent-run-timeline", "tool-call-activity", "ai-response-stream", "source-citation-rail"],
    packRegistryItem: "ai-interface-pack",
    useCases: ["Autonomous agent runs", "Research assistants", "Multi-tool orchestration", "Human-in-the-loop approvals"],
    states: ["Idle", "Running", "Waiting for approval", "Completed", "Failed", "Cancelled"],
  },
  {
    slug: "developer-tools",
    name: "Developer Tools Pack",
    tagline: "A deployment command center — environments, pipeline, live logs, and request inspection.",
    problem:
      "Dev platforms stitch together environment pickers, pipelines, log tails, and request inspectors from disparate parts. This pack composes them into one provider-neutral command center you feed with your own data.",
    blockSlug: "deployment-command-center",
    blockName: "Deployment Command Center",
    components: ["environment-switcher", "deployment-pipeline", "live-log-stream", "api-request-inspector"],
    packRegistryItem: "developer-tools-pack",
    useCases: ["Deploy dashboards", "CI/CD consoles", "Integration platforms", "Observability tools"],
    states: ["Environment selection", "Deploying", "Logs following", "Request inspection", "Failure", "Retry", "Completed"],
  },
  {
    slug: "collaboration",
    name: "Collaboration Pack",
    tagline: "A collaborative review workspace — presence, approvals, comments, and activity.",
    problem:
      "Review and sign-off UIs need presence, an approval workflow, threaded comments, and an activity feed working together. This pack delivers a complete multiplayer review surface with your users and permissions.",
    blockSlug: "collaborative-review-workspace",
    blockName: "Collaborative Review Workspace",
    components: ["live-presence-stack", "approval-workflow", "comment-thread", "activity-stream"],
    packRegistryItem: "collaboration-pack",
    useCases: ["Design/content review", "Deployment sign-off", "Document approval", "Change management"],
    states: ["Review open", "Commenting", "Changes requested", "Approval pending", "Approved", "Rejected", "Resolved"],
  },
  {
    slug: "data-motion",
    name: "Data Motion Pack",
    tagline: "A live operations dashboard — KPIs, refresh state, filtered results, and streaming rows.",
    problem:
      "Operational dashboards re-implement KPI counters, refresh indicators, filter transitions, and live tables every build. This pack composes them into one live dashboard shell that animates real state your app owns — without a charting library.",
    blockSlug: "live-operations-dashboard",
    blockName: "Live Operations Dashboard",
    components: ["kpi-number-morph", "data-refresh-state", "filter-result-transition", "streaming-data-rows"],
    packRegistryItem: "data-motion-pack",
    useCases: ["Ops dashboards", "Analytics products", "Monitoring consoles", "Reporting tools"],
    states: ["Initial loading", "Live data", "Filtered data", "Refreshing", "Partial update", "Stale", "Error", "Recovery"],
  },
];

export const packBySlug = new Map(packs.map((p) => [p.slug, p]));

/** Pack-level install command (installs the block + all its components). */
export function packInstall(pack: Pack): string {
  return installCommand(pack.packRegistryItem);
}
/** Block install command (same effect: block registryDependencies pull the components). */
export function blockInstall(pack: Pack): string {
  return installCommand(pack.blockSlug);
}
/** Short namespaced install forms (after the one-time /getting-started setup). */
export function packInstallShort(pack: Pack): string {
  return namespacedInstall(pack.packRegistryItem);
}
export function blockInstallShort(pack: Pack): string {
  return namespacedInstall(pack.blockSlug);
}

export const packNamespace = product.registryNamespace;
