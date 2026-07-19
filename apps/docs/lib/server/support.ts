// SERVER-ONLY support-intake layer. Never import from a client component.
//
// Provider-neutral: the /api/support route calls this interface; a real
// helpdesk/ticketing provider (Linear, Zendesk, GitHub Issues, …) is plugged in
// later behind the same shape once approved (docs/45/50 track that decision).
// The bundled adapter is a durable, file-backed DEV STORE (mirrors stores.ts):
// it persists JSON under the git-ignored data dir so support tickets survive a
// restart during preview — but it is NOT an external system and sends nothing
// anywhere.
//
// PRIVACY (enforced, not aspirational): a support ticket may ONLY carry the
// whitelisted fields below. We NEVER store tokens, secrets, request/response
// headers, private source code, or full logs. Free text and pasted logs are
// REDACTED on ingest — token-like sequences (mk_test_/mk_live_ keys, Bearer
// headers, long hex/base64 blobs) are replaced before anything is written. This
// module never logs the ticket body.
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Whitelisted shape
// ---------------------------------------------------------------------------

/** The kind of problem the developer is reporting. */
export type SupportCategory =
  | "installation-failure"
  | "registry-auth"
  | "component-bug"
  | "accessibility"
  | "documentation"
  | "missing-state"
  | "feature-request"
  | "performance"
  | "account-token";

export const SUPPORT_CATEGORIES: readonly SupportCategory[] = [
  "installation-failure",
  "registry-auth",
  "component-bug",
  "accessibility",
  "documentation",
  "missing-state",
  "feature-request",
  "performance",
  "account-token",
] as const;

/** The exact set of top-level keys a support request may carry. Any key not in
 *  this list is dropped before anything is stored (defense in depth). */
export const SUPPORT_FIELDS = [
  "category",
  "componentOrPack",
  "version",
  "browser",
  "framework",
  "errorSummary",
  "sanitizedLogs",
  "contactPermission",
] as const;

/** What a caller may submit. Deliberately NON-SENSITIVE — see module header. */
export interface SupportRequest {
  category: SupportCategory;
  /** Component slug or pack slug the ticket is about. */
  componentOrPack?: string;
  /** Product/catalog version string, for triage. */
  version?: string;
  /** Coarse browser family string (no fingerprinting). */
  browser?: string;
  /** Framework in use (e.g. "next", "vite"). */
  framework?: string;
  /** Short description of the error/problem (sanitized + redacted server-side). */
  errorSummary: string;
  /** Optional pasted logs (redacted server-side — tokens/secrets removed). */
  sanitizedLogs?: string;
  /** Whether the developer permits follow-up contact. Default false. */
  contactPermission?: boolean;
}

/** A stored ticket (dev store). */
export interface SupportTicket extends SupportRequest {
  id: string;
  /** Unix epoch ms when recorded (local dev only). */
  at: number;
}

export type SupportResult =
  | { status: "success"; id: string }
  | { status: "error"; message: string };

export interface SupportProvider {
  readonly name: string;
  /** Whether this provider durably persists (false for a pure in-memory mock). */
  readonly durable: boolean;
  submit(req: SupportRequest): Promise<SupportResult>;
  list(): Promise<SupportTicket[]>;
}

// ---------------------------------------------------------------------------
// Redaction — the security boundary. Applied to EVERY free-text/log field so no
// token or secret can ever reach the store, even if a caller pastes one.
// ---------------------------------------------------------------------------

/** Replace anything token-like with a marker. Conservative on purpose. */
export function redactSecrets(value: string): string {
  return (
    value
      // Our own registry tokens: mk_test_… / mk_live_…
      .replace(/\bmk_(?:test|live)_[A-Za-z0-9._-]+/g, "mk_[REDACTED]")
      // Authorization: Bearer <token> (and bare "Bearer <token>")
      .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
      // Common secret header/kv shapes: authorization: …, x-api-key: …, token=…
      .replace(
        /\b(authorization|x-api-key|api[_-]?key|token|secret|password|cookie)\b\s*[:=]\s*\S+/gi,
        "$1: [REDACTED]",
      )
      // JWT-shaped values (three base64url segments)
      .replace(/\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_JWT]")
      // Long hex blobs (>= 32 hex chars — API keys / hashes)
      .replace(/\b[0-9a-fA-F]{32,}\b/g, "[REDACTED_HEX]")
      // Long base64-ish blobs (>= 40 chars — likely a key/secret)
      .replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, "[REDACTED_TOKEN]")
  );
}

/** Strip control chars, redact secrets, neutralize query strings, cap length. */
function sanitizeText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = redactSecrets(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // Neutralize query strings so no secret rides in URL params.
    .replace(/\?[^\s]*=[^\s]*/g, "?…")
    .trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, max);
}

function shortText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = redactSecrets(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  return t ? t.slice(0, max) : undefined;
}

/** Whitelist + sanitize a raw request. Returns null if required fields fail. */
export function sanitizeSupportRequest(input: unknown): SupportRequest | null {
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;

  const category = typeof src.category === "string" ? src.category : "";
  if (!(SUPPORT_CATEGORIES as readonly string[]).includes(category)) return null;

  const errorSummary = sanitizeText(src.errorSummary, 1000);
  if (!errorSummary) return null;

  const out: SupportRequest = {
    category: category as SupportCategory,
    errorSummary,
  };

  const componentOrPack = shortText(src.componentOrPack, 120);
  if (componentOrPack) out.componentOrPack = componentOrPack;
  const version = shortText(src.version, 40);
  if (version) out.version = version;
  const browser = shortText(src.browser, 200);
  if (browser) out.browser = browser;
  const framework = shortText(src.framework, 40);
  if (framework) out.framework = framework;
  const sanitizedLogs = sanitizeText(src.sanitizedLogs, 4000);
  if (sanitizedLogs) out.sanitizedLogs = sanitizedLogs;
  if (typeof src.contactPermission === "boolean") out.contactPermission = src.contactPermission;

  return out;
}

// ---------------------------------------------------------------------------
// Durable JSON collection (one file; atomic write via rename) — mirrors
// lib/server/stores.ts so a real DB can replace it behind the same interface.
// ---------------------------------------------------------------------------
function dataDir(): string {
  return process.env.MOTIQ_DATA_DIR
    ? resolve(process.env.MOTIQ_DATA_DIR)
    : resolve(process.cwd(), ".data");
}

const FILE = "support-tickets.json";

function loadTickets(): SupportTicket[] {
  try {
    const path = join(dataDir(), FILE);
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, "utf8")) as SupportTicket[];
  } catch {
    // A corrupt/unreadable store must not crash intake — start empty.
    return [];
  }
}

function persistTickets(tickets: SupportTicket[]): void {
  mkdirSync(dataDir(), { recursive: true });
  const path = join(dataDir(), FILE);
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(tickets, null, 2) + "\n");
  renameSync(tmp, path); // atomic replace
}

function newId(): string {
  return `sup_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

// ---------------------------------------------------------------------------
// Durable dev-store provider (default). Persists locally; sends nothing out.
// ---------------------------------------------------------------------------
const devStoreProvider: SupportProvider = {
  name: "dev-store",
  durable: true,
  async submit(req) {
    // Re-sanitize authoritatively — never trust an already-shaped object.
    const clean = sanitizeSupportRequest(req);
    if (!clean) return { status: "error", message: "A category and an error summary are required." };

    const ticket: SupportTicket = { ...clean, id: newId(), at: Date.now() };
    const tickets = loadTickets();
    tickets.push(ticket);
    if (tickets.length > 1000) tickets.shift();
    persistTickets(tickets);
    return { status: "success", id: ticket.id };
  },
  async list() {
    return loadTickets().sort((a, b) => b.at - a.at);
  },
};

/** Select the active support provider. Only the durable dev-store exists today;
 *  real ticketing providers are plugged in once approved (docs/45). */
export function supportProvider(): SupportProvider {
  // Provider selection is config-driven when a real provider is approved. Until
  // then, the durable dev-store is the only wired adapter so preview never
  // dead-ends and tickets persist for the local review dashboard.
  return devStoreProvider;
}
