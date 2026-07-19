// Provider-neutral product FEEDBACK collection (client-safe, mirrors analytics.ts).
//
// No vendor SDK is bundled. The active adapter comes from launch config; until a
// provider is approved (docs/45) the dev adapter POSTs to /api/feedback and also
// keeps the last N submissions in memory for the local dev dashboard.
//
// PRIVACY (enforced, not aspirational): feedback may ONLY carry the whitelisted
// fields below. We NEVER collect source code, project/registry code, prompt
// content, API request/response payloads, tokens, headers, secrets, or any data
// beyond an approved feedback policy (docs/44). Non-whitelisted keys are dropped
// before anything leaves the client.
import { commerce } from "./product";

/** What the feedback is about. */
export type FeedbackCategory =
  | "bug"
  | "accessibility"
  | "api"
  | "documentation"
  | "visual"
  | "missing-state"
  | "performance"
  | "installation"
  | "feature-request";

/** How likely the developer is to reach for the library in a real project. */
export type WillingnessToUse = "yes" | "maybe" | "no";

/** Which access shape the developer would consider (individual/pack/complete). */
export type InterestInAccess = "free" | "pack" | "complete" | "undecided";

/** Coarse, non-identifying team-size bucket (mirrors the waitlist buckets). */
export type FeedbackTeamSize = "solo" | "2-10" | "11-50" | "50+";

/** Coarse, non-identifying browser metadata (collected only where approved). */
export interface FeedbackBrowserMeta {
  /** Broad UA family string (e.g. navigator.userAgent) — no fingerprinting. */
  userAgent?: string;
  /** Viewport width bucket in px (rounded) — layout context only. */
  viewportWidth?: number;
  /** "light" | "dark" active theme, for visual reports. */
  theme?: string;
  /** true if the visitor has prefers-reduced-motion set (motion reports). */
  reducedMotion?: boolean;
}

/** The whitelisted feedback payload. Anything not here is not collected. */
export interface FeedbackPayload {
  /** Component slug or pack slug the feedback is about (e.g. "reveal-text"). */
  componentOrPack?: string;
  category: FeedbackCategory;
  /** Optional 1–5 satisfaction/severity rating. */
  rating?: number;
  /** Free-text message from the user (their words — never code or payloads). */
  message: string;
  /** Whether the user permits follow-up contact. Default false. */
  contactPermission?: boolean;
  /** The docs route the feedback was given on (path only, no query/secrets). */
  route?: string;
  /** Product/catalog version string, for triage. */
  productVersion?: string;
  /** Coarse browser metadata, only where approved. */
  browser?: FeedbackBrowserMeta;

  // -------------------------------------------------------------------------
  // Private-preview dimensions (docs/50). These answer the preview learning
  // questions — usefulness, per-facet quality ratings, gaps, and access
  // intent. All ratings are 1–5. All free-text is sanitized (control chars
  // stripped, capped, query strings neutralized). No code/payloads/secrets.
  // -------------------------------------------------------------------------
  /** 1–5: how useful the component/pack is for the developer's work. */
  usefulness?: number;
  /** 1–5: visual/motion quality of the rendered component. */
  visualQuality?: number;
  /** 1–5: clarity and adaptability of the component API. */
  apiClarity?: number;
  /** 1–5: how smooth installation from the registry was. */
  installation?: number;
  /** 1–5: quality/completeness of the documentation. */
  documentation?: number;
  /** 1–5: perceived accessibility (keyboard, SR, reduced motion). */
  accessibility?: number;
  /** 1–5: perceived runtime/animation performance. */
  performance?: number;
  /** Free-text: a state/variant the developer needed but was missing. */
  missingState?: string;
  /** Free-text: a component the developer wished existed. */
  missingComponent?: string;
  /** Free-text: what would block using this in production. */
  productionBlocker?: string;
  /** Whether the developer would use this in a real project. */
  willingnessToUse?: WillingnessToUse;
  /** Which access shape (individual/pack/complete) they'd consider. */
  interestInAccess?: InterestInAccess;

  // Optional context (all coarse / non-identifying).
  /** Broad product category being built (free-text, short). */
  productCategory?: string;
  /** Framework in use (free-text, short — e.g. "next", "vite"). */
  framework?: string;
  /** Kind of application being built (free-text, short). */
  applicationType?: string;
  /** Coarse team-size bucket. */
  teamSizeRange?: FeedbackTeamSize;
  /** Whether the developer actually installed the component. */
  wasInstalled?: boolean;
  /** Whether it reached a real (non-throwaway) project. */
  usedInRealProject?: boolean;
}

/** The exact set of top-level keys allowed to leave the client. Any key not in
 *  this list is dropped before send AND on the server (defense in depth), so no
 *  code, payload, secret, or ad-hoc field can ever ride along. */
export const FEEDBACK_FIELDS = [
  "componentOrPack",
  "category",
  "rating",
  "message",
  "contactPermission",
  "route",
  "productVersion",
  "browser",
  // Private-preview dimensions
  "usefulness",
  "visualQuality",
  "apiClarity",
  "installation",
  "documentation",
  "accessibility",
  "performance",
  "missingState",
  "missingComponent",
  "productionBlocker",
  "willingnessToUse",
  "interestInAccess",
  "productCategory",
  "framework",
  "applicationType",
  "teamSizeRange",
  "wasInstalled",
  "usedInRealProject",
] as const;

/** The exact set of nested browser keys allowed. */
export const FEEDBACK_BROWSER_FIELDS = ["userAgent", "viewportWidth", "theme", "reducedMotion"] as const;

const CATEGORIES = new Set<string>([
  "bug",
  "accessibility",
  "api",
  "documentation",
  "visual",
  "missing-state",
  "performance",
  "installation",
  "feature-request",
]);

const WILLINGNESS = new Set<string>(["yes", "maybe", "no"]);
const INTEREST = new Set<string>(["free", "pack", "complete", "undecided"]);
const TEAM_SIZES = new Set<string>(["solo", "2-10", "11-50", "50+"]);

// ---------------------------------------------------------------------------
// Free-text sanitizer — strip control characters, neutralize anything that
// looks like a URL query string (so secrets/tokens can't ride in params), and
// cap length. Applied to EVERY free-text field before it can leave the client.
// ---------------------------------------------------------------------------
function sanitizeText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value
    // Strip control chars but keep tab/newline for multi-line messages.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // Neutralize query strings (?a=b&c=d) so no accidental secret rides along.
    .replace(/\?[^\s]*=[^\s]*/g, "?…")
    .trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, max);
}

/** Clamp an arbitrary value to an integer 1–5 rating, or undefined. */
function clampRating(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export type FeedbackResult =
  | { status: "success" }
  | { status: "error"; message: string };

export interface FeedbackAdapter {
  readonly name: string;
  submit(payload: FeedbackPayload): Promise<FeedbackResult>;
}

// ---------------------------------------------------------------------------
// Whitelist enforcement — strip any unknown key so nothing sensitive can ride
// along even if a caller passes extra fields. Applied before send AND on the
// server route (defense in depth).
// ---------------------------------------------------------------------------

/** Return a payload containing ONLY whitelisted, correctly-typed fields. */
export function sanitizeFeedback(input: unknown): FeedbackPayload | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;

  const category = typeof src.category === "string" ? src.category : "";
  if (!CATEGORIES.has(category)) return null;

  const message = typeof src.message === "string" ? src.message.trim() : "";
  if (!message) return null;

  const out: FeedbackPayload = {
    category: category as FeedbackCategory,
    message: sanitizeText(message, 2000) ?? message.slice(0, 2000),
  };

  if (typeof src.componentOrPack === "string" && src.componentOrPack.trim()) {
    out.componentOrPack = src.componentOrPack.trim().slice(0, 120);
  }
  const rating = clampRating(src.rating);
  if (rating !== undefined) out.rating = rating;
  if (typeof src.contactPermission === "boolean") {
    out.contactPermission = src.contactPermission;
  }

  // --- Private-preview rating dimensions (all 1–5) --------------------------
  const usefulness = clampRating(src.usefulness);
  if (usefulness !== undefined) out.usefulness = usefulness;
  const visualQuality = clampRating(src.visualQuality);
  if (visualQuality !== undefined) out.visualQuality = visualQuality;
  const apiClarity = clampRating(src.apiClarity);
  if (apiClarity !== undefined) out.apiClarity = apiClarity;
  const installation = clampRating(src.installation);
  if (installation !== undefined) out.installation = installation;
  const documentation = clampRating(src.documentation);
  if (documentation !== undefined) out.documentation = documentation;
  const accessibility = clampRating(src.accessibility);
  if (accessibility !== undefined) out.accessibility = accessibility;
  const performance = clampRating(src.performance);
  if (performance !== undefined) out.performance = performance;

  // --- Private-preview free-text (sanitized) --------------------------------
  const missingState = sanitizeText(src.missingState, 500);
  if (missingState) out.missingState = missingState;
  const missingComponent = sanitizeText(src.missingComponent, 300);
  if (missingComponent) out.missingComponent = missingComponent;
  const productionBlocker = sanitizeText(src.productionBlocker, 500);
  if (productionBlocker) out.productionBlocker = productionBlocker;

  // --- Private-preview enums ------------------------------------------------
  if (typeof src.willingnessToUse === "string" && WILLINGNESS.has(src.willingnessToUse)) {
    out.willingnessToUse = src.willingnessToUse as WillingnessToUse;
  }
  if (typeof src.interestInAccess === "string" && INTEREST.has(src.interestInAccess)) {
    out.interestInAccess = src.interestInAccess as InterestInAccess;
  }
  if (typeof src.teamSizeRange === "string" && TEAM_SIZES.has(src.teamSizeRange)) {
    out.teamSizeRange = src.teamSizeRange as FeedbackTeamSize;
  }

  // --- Optional context -----------------------------------------------------
  const productCategory = sanitizeText(src.productCategory, 80);
  if (productCategory) out.productCategory = productCategory;
  const framework = sanitizeText(src.framework, 40);
  if (framework) out.framework = framework;
  const applicationType = sanitizeText(src.applicationType, 80);
  if (applicationType) out.applicationType = applicationType;
  if (typeof src.wasInstalled === "boolean") out.wasInstalled = src.wasInstalled;
  if (typeof src.usedInRealProject === "boolean") out.usedInRealProject = src.usedInRealProject;
  if (typeof src.route === "string" && src.route.trim()) {
    // Path only — strip any query string so no accidental secrets ride along.
    out.route = src.route.trim().split("?")[0].slice(0, 200);
  }
  if (typeof src.productVersion === "string" && src.productVersion.trim()) {
    out.productVersion = src.productVersion.trim().slice(0, 40);
  }

  if (src.browser && typeof src.browser === "object") {
    const b = src.browser as Record<string, unknown>;
    const browser: FeedbackBrowserMeta = {};
    if (typeof b.userAgent === "string") browser.userAgent = b.userAgent.slice(0, 300);
    if (typeof b.viewportWidth === "number" && Number.isFinite(b.viewportWidth)) {
      browser.viewportWidth = Math.max(0, Math.round(b.viewportWidth));
    }
    if (typeof b.theme === "string") browser.theme = b.theme.slice(0, 16);
    if (typeof b.reducedMotion === "boolean") browser.reducedMotion = b.reducedMotion;
    if (Object.keys(browser).length > 0) out.browser = browser;
  }

  return out;
}

// In-memory ring buffer for the dev dashboard (client-side only).
const recent: { payload: FeedbackPayload; at: number }[] = [];
export function recentFeedback() {
  return [...recent];
}

// ---------------------------------------------------------------------------
// Development adapter — POSTs the sanitized payload to /api/feedback and keeps a
// local copy. Logs a redacted summary only (no message body in the console).
// ---------------------------------------------------------------------------
const devAdapter: FeedbackAdapter = {
  name: "dev",
  async submit(payload) {
    const clean = sanitizeFeedback(payload);
    if (!clean) return { status: "error", message: "Please choose a category and enter a message." };

    const at = typeof performance !== "undefined" ? performance.now() : 0;
    recent.push({ payload: clean, at });
    if (recent.length > 200) recent.shift();

    if (typeof console !== "undefined") {
      // Redacted: category + target only, never the free-text message.
      // eslint-disable-next-line no-console
      console.debug(`[feedback:dev] ${clean.category}`, { about: clean.componentOrPack, rating: clean.rating });
    }

    try {
      if (typeof fetch === "function") {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(clean),
        });
        if (!res.ok) return { status: "error", message: "Could not submit feedback right now." };
      }
      return { status: "success" };
    } catch {
      return { status: "error", message: "Could not submit feedback right now." };
    }
  },
};

const noopAdapter: FeedbackAdapter = { name: "none", async submit() { return { status: "success" }; } };

/** Configured feedback provider name (optional field; defaults to dev). */
function configuredFeedbackProvider(): string {
  return (commerce as { feedbackProvider?: string }).feedbackProvider ?? "dev";
}

function adapter(): FeedbackAdapter {
  switch (configuredFeedbackProvider()) {
    case "dev":
      return devAdapter;
    case "none":
      return noopAdapter;
    default:
      // Real providers (linear/github/custom) are not wired until approved (docs/45).
      // Fall back to the dev adapter so feedback isn't silently lost in preview.
      return devAdapter;
  }
}

/** Submit product feedback. Only whitelisted fields are ever transmitted. */
export function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResult> {
  return adapter().submit(payload);
}
