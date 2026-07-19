// Provider-neutral product analytics.
//
// No vendor SDK is bundled. The active adapter comes from product.config.json
// `commerce.analyticsProvider`. Until a provider is approved, the dev-logger
// adapter simply console.debug()s events (visible in the browser console) and
// stores the last N in memory for the dev dashboard.
//
// PRIVACY: only the whitelisted event names + minimal, non-sensitive props are
// tracked. NEVER pass source code, secrets, prompt/comment/request bodies,
// headers, or personal data beyond an approved analytics policy (docs/44).
import { commerce } from "./product";

/** Whitelisted product events. Adding an event here is a deliberate act. */
export type AnalyticsEvent =
  | "homepage_viewed"
  | "catalog_searched"
  | "category_filtered"
  | "component_preview_opened"
  | "component_docs_viewed"
  | "free_install_copied"
  | "pro_item_viewed"
  | "pack_page_viewed"
  | "pack_preview_interacted"
  | "pack_install_copied"
  | "access_cta_clicked"
  | "pack_cta_clicked"
  | "pro_cta_clicked"
  | "complete_catalog_cta_clicked"
  | "contact_sales_clicked"
  | "pack_explore_clicked"
  | "catalog_explore_clicked"
  | "waitlist_submitted"
  | "checkout_started"
  | "checkout_completed"
  | "registry_item_requested"
  | "registry_access_denied"
  | "registry_item_installed"
  | "feedback_submitted"
  | "support_submitted"
  | "missing_component_requested"
  | "preview_onboarding_viewed"
  | "preview_dashboard_viewed"
  | "preview_token_created"
  | "preview_activated";

/** Small, non-sensitive properties only. */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export interface AnalyticsAdapter {
  readonly name: string;
  track(event: AnalyticsEvent, props?: AnalyticsProps): void;
}

// Whitelist enforced at runtime so a typo or a bad caller can't emit free-form data.
const ALLOWED = new Set<string>([
  "homepage_viewed",
  "catalog_searched",
  "category_filtered",
  "component_preview_opened",
  "component_docs_viewed",
  "free_install_copied",
  "pro_item_viewed",
  "pack_page_viewed",
  "pack_preview_interacted",
  "pack_install_copied",
  "access_cta_clicked",
  "pack_cta_clicked",
  "pro_cta_clicked",
  "complete_catalog_cta_clicked",
  "contact_sales_clicked",
  "pack_explore_clicked",
  "catalog_explore_clicked",
  "waitlist_submitted",
  "checkout_started",
  "checkout_completed",
  "registry_item_requested",
  "registry_access_denied",
  "registry_item_installed",
  "feedback_submitted",
  "support_submitted",
  "missing_component_requested",
  "preview_onboarding_viewed",
  "preview_dashboard_viewed",
  "preview_token_created",
  "preview_activated",
]);

// In-memory ring buffer for the dev dashboard (client-side only).
const recent: { event: string; props?: AnalyticsProps; at: number }[] = [];
export function recentEvents() {
  return [...recent];
}

const devLogger: AnalyticsAdapter = {
  name: "dev-logger",
  track(event, props) {
    // `performance.now()` is deterministic-free but only used for local ordering,
    // never rendered server-side — safe on the client.
    const at = typeof performance !== "undefined" ? performance.now() : 0;
    recent.push({ event, props, at });
    if (recent.length > 200) recent.shift();
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug(`[analytics:dev] ${event}`, props ?? {});
    }
  },
};

const noopAdapter: AnalyticsAdapter = { name: "none", track() {} };

function adapter(): AnalyticsAdapter {
  switch (commerce.analyticsProvider) {
    case "dev-logger":
      return devLogger;
    case "none":
      return noopAdapter;
    default:
      // Real providers (posthog/plausible/custom) are not wired until approved.
      // Fall back to the dev logger so nothing silently disappears in preview.
      return devLogger;
  }
}

/** Track a product event. Non-whitelisted events are dropped (dev-warned). */
export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!ALLOWED.has(event)) {
    if (typeof console !== "undefined") console.warn(`[analytics] dropped non-whitelisted event: ${event}`);
    return;
  }
  adapter().track(event, props);
}
