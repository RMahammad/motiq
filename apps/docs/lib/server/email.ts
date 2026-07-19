// SERVER-ONLY transactional email. Provider-neutral interface + a dev-logger
// adapter. Never import from a client component.
//
// No vendor email SDK is bundled. The active adapter is selected from launch
// config; until a provider is approved (docs/45) only the dev-logger adapter
// exists and every other provider throws "not configured".
//
// PRIVACY / SECURITY:
//   - A payload carries only the recipient email + the minimal context needed to
//     render one message. No secrets, no full registry tokens, no payloads.
//   - A registry token is NEVER placed in an email body. Prefer a link to the
//     authenticated portal; if a token must be referenced at all, only its short
//     PREFIX (e.g. "mk_live_AbCd") may appear — never the plaintext secret.
//   - The dev-logger adapter console.debug()s a REDACTED summary only (masked
//     recipient, no token, no personal free-text).
//
// NO PROVIDER SDK IS ADDED UNTIL APPROVED (dependency-review + docs/45).
import { commerce } from "../product";
import type { EntitlementId } from "../commerce";
import type { EntitlementState, LicenseType, TokenEnvironment } from "./model";

// ---------------------------------------------------------------------------
// Payloads — each operation takes only what it needs to render one email.
// `to` is always the recipient address. Optional context stays non-sensitive.
// ---------------------------------------------------------------------------

/** Common shape: every email is addressed to exactly one recipient. */
export interface EmailRecipient {
  /** Recipient email address. The only required field on every payload. */
  to: string;
}

export interface PreviewInvitationPayload extends EmailRecipient {
  /** What the preview unlocks, e.g. "pack.ai-interface" or "catalog.complete". */
  scope?: EntitlementId;
  /** When the preview access expires (epoch ms) — shown as a date, not a secret. */
  expiresAt?: number;
  /** Link to the authenticated portal where the invitee activates access. */
  portalUrl?: string;
}

export interface AccessRequestConfirmationPayload extends EmailRecipient {
  /** Pack/tier the visitor expressed interest in (slug only). */
  interest?: string;
}

export interface PurchaseConfirmationPayload extends EmailRecipient {
  /** What was purchased (entitlement id) — not an order/receipt with amounts. */
  entitlementId?: EntitlementId;
  licenseType?: LicenseType;
  /** Link to the portal for invoices/receipts (kept out of email bodies). */
  portalUrl?: string;
}

export interface RegistryAccessInstructionsPayload extends EmailRecipient {
  /** ONLY the token prefix may appear (identification), never the plaintext. */
  tokenPrefix?: string;
  environment?: TokenEnvironment;
  /** Authenticated portal link where the customer copies/rotates their token. */
  portalUrl?: string;
}

export interface TokenCreatedPayload extends EmailRecipient {
  /** Prefix only (e.g. "mk_live_AbCd"). The plaintext token is never emailed. */
  tokenPrefix: string;
  label?: string;
  environment?: TokenEnvironment;
}

export interface TokenRevokedPayload extends EmailRecipient {
  /** Prefix of the revoked token, for the customer to recognize which one. */
  tokenPrefix: string;
  label?: string;
}

export interface EntitlementChangedPayload extends EmailRecipient {
  entitlementId: EntitlementId;
  state: EntitlementState;
}

export interface TeamInvitationPayload extends EmailRecipient {
  /** Team/org display name (non-sensitive). */
  organizationName?: string;
  /** Inviter address so the invitee recognizes the request. */
  inviterEmail?: string;
  /** Portal link to accept the invitation (no token in the mail body). */
  portalUrl?: string;
}

export interface SupportAcknowledgementPayload extends EmailRecipient {
  /** Opaque ticket reference — not the message content the user submitted. */
  ticketRef?: string;
}

export interface UpdateNotificationPayload extends EmailRecipient {
  /** Version or release tag the update refers to. */
  version?: string;
  /** One-line, non-sensitive summary of what changed. */
  summary?: string;
}

/** Result of an email dispatch attempt. Never carries recipient PII back. */
export type EmailResult =
  | { status: "sent"; provider: string; operation: EmailOperation }
  | { status: "skipped"; provider: string; operation: EmailOperation; reason: string }
  | { status: "error"; provider: string; operation: EmailOperation; message: string };

/** The set of transactional emails this product may send. */
export type EmailOperation =
  | "previewInvitation"
  | "accessRequestConfirmation"
  | "purchaseConfirmation"
  | "registryAccessInstructions"
  | "tokenCreated"
  | "tokenRevoked"
  | "entitlementChanged"
  | "teamInvitation"
  | "supportAcknowledgement"
  | "updateNotification";

export interface EmailProvider {
  readonly name: string;
  previewInvitation(payload: PreviewInvitationPayload): Promise<EmailResult>;
  accessRequestConfirmation(payload: AccessRequestConfirmationPayload): Promise<EmailResult>;
  purchaseConfirmation(payload: PurchaseConfirmationPayload): Promise<EmailResult>;
  registryAccessInstructions(payload: RegistryAccessInstructionsPayload): Promise<EmailResult>;
  tokenCreated(payload: TokenCreatedPayload): Promise<EmailResult>;
  tokenRevoked(payload: TokenRevokedPayload): Promise<EmailResult>;
  entitlementChanged(payload: EntitlementChangedPayload): Promise<EmailResult>;
  teamInvitation(payload: TeamInvitationPayload): Promise<EmailResult>;
  supportAcknowledgement(payload: SupportAcknowledgementPayload): Promise<EmailResult>;
  updateNotification(payload: UpdateNotificationPayload): Promise<EmailResult>;
}

// ---------------------------------------------------------------------------
// Redaction helpers — used ONLY for the dev-logger summary. We never log the
// full recipient address, and never anything token-secret or free-text.
// ---------------------------------------------------------------------------

/** Mask an email for logs: "alice@example.com" -> "a***@example.com". */
function maskEmail(email: string): string {
  const value = typeof email === "string" ? email.trim() : "";
  const at = value.indexOf("@");
  if (at <= 0) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}

/** Guard: a value that looks like a full token must NEVER reach a log/email.
 *  We only ever accept a short prefix; anything longer is truncated defensively. */
function safePrefix(prefix: string | undefined): string | undefined {
  if (!prefix) return undefined;
  // A real prefix is ~16 chars ("mk_live_AbCd..."). Truncate hard as a backstop
  // so an accidentally-passed full token can't leak through the summary.
  return prefix.slice(0, 16);
}

// ---------------------------------------------------------------------------
// Development adapter — logs a redacted one-line summary. Sends nothing.
// ---------------------------------------------------------------------------

function devLog(operation: EmailOperation, summary: Record<string, unknown>): void {
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console
    console.debug(`[email:dev-logger] ${operation}`, summary);
  }
}

function sent(operation: EmailOperation): EmailResult {
  return { status: "sent", provider: "dev-logger", operation };
}

const devLoggerProvider: EmailProvider = {
  name: "dev-logger",
  async previewInvitation(p) {
    devLog("previewInvitation", {
      to: maskEmail(p.to),
      scope: p.scope,
      expiresAt: p.expiresAt,
      hasPortalLink: Boolean(p.portalUrl),
    });
    return sent("previewInvitation");
  },
  async accessRequestConfirmation(p) {
    devLog("accessRequestConfirmation", { to: maskEmail(p.to), interest: p.interest });
    return sent("accessRequestConfirmation");
  },
  async purchaseConfirmation(p) {
    devLog("purchaseConfirmation", {
      to: maskEmail(p.to),
      entitlementId: p.entitlementId,
      licenseType: p.licenseType,
      hasPortalLink: Boolean(p.portalUrl),
    });
    return sent("purchaseConfirmation");
  },
  async registryAccessInstructions(p) {
    // Deliberately logs only the token PREFIX and a portal-link flag. Never the token.
    devLog("registryAccessInstructions", {
      to: maskEmail(p.to),
      tokenPrefix: safePrefix(p.tokenPrefix),
      environment: p.environment,
      hasPortalLink: Boolean(p.portalUrl),
    });
    return sent("registryAccessInstructions");
  },
  async tokenCreated(p) {
    devLog("tokenCreated", {
      to: maskEmail(p.to),
      tokenPrefix: safePrefix(p.tokenPrefix),
      label: p.label,
      environment: p.environment,
    });
    return sent("tokenCreated");
  },
  async tokenRevoked(p) {
    devLog("tokenRevoked", { to: maskEmail(p.to), tokenPrefix: safePrefix(p.tokenPrefix), label: p.label });
    return sent("tokenRevoked");
  },
  async entitlementChanged(p) {
    devLog("entitlementChanged", { to: maskEmail(p.to), entitlementId: p.entitlementId, state: p.state });
    return sent("entitlementChanged");
  },
  async teamInvitation(p) {
    devLog("teamInvitation", {
      to: maskEmail(p.to),
      organizationName: p.organizationName,
      inviter: p.inviterEmail ? maskEmail(p.inviterEmail) : undefined,
      hasPortalLink: Boolean(p.portalUrl),
    });
    return sent("teamInvitation");
  },
  async supportAcknowledgement(p) {
    devLog("supportAcknowledgement", { to: maskEmail(p.to), ticketRef: p.ticketRef });
    return sent("supportAcknowledgement");
  },
  async updateNotification(p) {
    devLog("updateNotification", { to: maskEmail(p.to), version: p.version, summary: p.summary });
    return sent("updateNotification");
  },
};

// ---------------------------------------------------------------------------
// Selector — reads launch config. Only the dev-logger is implemented; a real
// provider (resend/postmark/ses/custom) is wired ONLY after approval (docs/45).
// The provider name is read from an OPTIONAL config field so no shared config
// type has to change before a provider is chosen; it defaults to dev-logger.
// ---------------------------------------------------------------------------

/** Configured email provider name (optional field; defaults to dev-logger). */
function configuredEmailProvider(): string {
  return (commerce as { emailProvider?: string }).emailProvider ?? "dev-logger";
}

export function emailProvider(): EmailProvider {
  const configured = configuredEmailProvider();
  switch (configured) {
    case "dev-logger":
      return devLoggerProvider;
    case "none":
      // Explicitly disabled — nothing is sent. Return the dev logger so nothing
      // silently disappears while previewing flows locally.
      return devLoggerProvider;
    default:
      // resend | postmark | ses | sendgrid | custom — none bundled yet.
      throw new Error(`Email provider "${configured}" is not configured (docs/45).`);
  }
}
