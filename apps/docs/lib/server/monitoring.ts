// SERVER-ONLY operational monitoring. Provider-neutral interface + a dev-logger
// adapter. Never import from a client component.
//
// No vendor observability SDK is bundled (no Sentry/Datadog/etc.). The active
// adapter is selected from launch config; until a provider is approved (docs/45)
// the dev-logger adapter console.*()s a structured, redacted line and keeps the
// last N in memory for a local operations view.
//
// PRIVACY: monitoring records operational signals, NOT user content. `context`
// must carry only small, non-sensitive fields (ids, counts, result codes,
// durations). NEVER pass tokens, emails, request/response bodies, or secrets.
import { commerce } from "../product";

/** The operational areas we monitor. Adding one is a deliberate act. */
export type MonitoringArea =
  | "registry-error"
  | "registry-denial"
  | "registry-latency"
  | "checkout-error"
  | "webhook-error"
  | "entitlement-failure"
  | "access-request-failure"
  | "email-failure"
  | "portal-failure"
  | "download-failure";

export type MonitoringSeverity = "info" | "warn" | "error" | "critical";

/** Small, non-sensitive context only. */
export type MonitoringContext = Record<string, string | number | boolean | null | undefined>;

export interface MonitoringEvent {
  area: MonitoringArea;
  severity: MonitoringSeverity;
  /** Short operator-facing message. No user content, no secrets. */
  message: string;
  context?: MonitoringContext;
}

export interface MonitoringProvider {
  readonly name: string;
  record(event: MonitoringEvent): void;
}

const AREAS = new Set<string>([
  "registry-error",
  "registry-denial",
  "registry-latency",
  "checkout-error",
  "webhook-error",
  "entitlement-failure",
  "access-request-failure",
  "email-failure",
  "portal-failure",
  "download-failure",
]);

// In-memory ring buffer for a local operations view (server process only).
const recent: { event: MonitoringEvent; at: number }[] = [];
export function recentMonitoringEvents() {
  return [...recent];
}

// ---------------------------------------------------------------------------
// Development adapter — logs a structured line at the matching console level.
// ---------------------------------------------------------------------------
const devLoggerProvider: MonitoringProvider = {
  name: "dev-logger",
  record(event) {
    recent.push({ event, at: Date.now() });
    if (recent.length > 500) recent.shift();
    if (typeof console === "undefined") return;
    const line = `[monitoring:${event.area}] ${event.message}`;
    const ctx = event.context ?? {};
    switch (event.severity) {
      case "critical":
      case "error":
        // eslint-disable-next-line no-console
        console.error(line, ctx);
        break;
      case "warn":
        // eslint-disable-next-line no-console
        console.warn(line, ctx);
        break;
      default:
        // eslint-disable-next-line no-console
        console.debug(line, ctx);
    }
  },
};

const noopProvider: MonitoringProvider = { name: "none", record() {} };

/** Configured monitoring provider name (optional field; defaults to dev-logger). */
function configuredMonitoringProvider(): string {
  return (commerce as { monitoringProvider?: string }).monitoringProvider ?? "dev-logger";
}

function provider(): MonitoringProvider {
  switch (configuredMonitoringProvider()) {
    case "dev-logger":
      return devLoggerProvider;
    case "none":
      return noopProvider;
    default:
      // Real providers (sentry/datadog/custom) are not wired until approved (docs/45).
      // Fall back to the dev logger so operational signals aren't silently lost.
      return devLoggerProvider;
  }
}

/** Record an operational event. Unknown areas are dropped (dev-warned). */
export function record(event: MonitoringEvent): void {
  if (!AREAS.has(event.area)) {
    if (typeof console !== "undefined") console.warn(`[monitoring] dropped unknown area: ${event.area}`);
    return;
  }
  provider().record(event);
}
