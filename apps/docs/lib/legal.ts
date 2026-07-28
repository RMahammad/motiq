// Shared configuration for the /legal/* policy pages.
//
// SINGLE SOURCE OF TRUTH for: the legal-review gate, effective/last-updated
// dates, contact channels, the cross-policy glossary, and the verified
// processor list. Legal pages must read from here instead of restating a
// contact address, date, or provider name inline — that is how the six pages
// stay consistent with each other and with product.config.json.
//
// RULES
//  1. Nothing in this file may be invented. Every value is either read from
//     product.config.json, verified in the repository, or explicitly marked as
//     an unresolved owner decision (see `ownerDecision()`).
//  2. NO SECRETS. This module is imported by client components; it must never
//     contain keys, tokens, or private endpoints.
//  3. Unresolved decisions are tracked in docs/legal-decisions.md. When an owner
//     resolves one, fill the value in here (or in product.config.json) — not in
//     the page files.
import { product, commerce } from "./product";

// ---------------------------------------------------------------------------
// Review gate
// ---------------------------------------------------------------------------

/**
 * These policies are published and in force (owner decision, 2026-07-28).
 *
 * They were rewritten to state only what is factually true of a free,
 * MIT-licensed project that sells nothing, opens no accounts, and collects no
 * personal data. The clauses that would have needed bespoke commercial drafting
 * — a paid-tier liability cap, an asserted governing law and venue — were
 * removed rather than approved, because none of them described anything Motiq
 * actually does.
 *
 * If Motiq ever charges, opens accounts, or processes personal data, this must
 * go back to a gated value (the paid-launch assertion in
 * lib/server/launch-assertions.ts and scripts/check-launch-config.mjs still read
 * MOTIQ_LEGAL_APPROVED) and the affected clauses need a lawyer.
 */
export const legalApproved: boolean = true;

// ---------------------------------------------------------------------------
// Decision tokens — the ONLY sanctioned way to render an unresolved item
// ---------------------------------------------------------------------------

/** Marks a business/commercial choice the owner has not made yet. */
export function ownerDecision(what: string): string {
  return `[OWNER DECISION REQUIRED: ${what}]`;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/**
 * Effective date — the day these policies were published as in force. A real
 * date, not a placeholder: it is the date of the approval decision above.
 */
export const effectiveDate: string | null = "2026-07-28";

/**
 * The date this policy text was last revised in the repository. This is a real,
 * verifiable fact (the date of the drafting pass), not a legal effective date.
 * Update it whenever policy wording changes.
 */
export const lastUpdated = "2026-07-28";

export function formatLegalDate(iso: string): string {
  // Fixed locale + UTC so the rendered string is build-deterministic.
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * What the pages print next to "Effective date". Complete in every state — never
 * a bracketed placeholder:
 *
 *   - an explicit `effectiveDate` is used verbatim;
 *   - otherwise, once an owner has approved publication, the text takes effect on
 *     the date it was last revised;
 *   - until approval, the pages say so plainly, matching the review notice.
 *
 * Setting `effectiveDate` is therefore optional, not a blocker.
 */
export const effectiveDateLabel: string = effectiveDate
  ? formatLegalDate(effectiveDate)
  : legalApproved
    ? formatLegalDate(lastUpdated)
    : "Not yet in force — pending legal review";

export const lastUpdatedLabel: string = formatLegalDate(lastUpdated);

// ---------------------------------------------------------------------------
// Provider identity
// ---------------------------------------------------------------------------

/**
 * The person or entity that publishes Motiq.
 *
 * OWNER DECISION (2026-07-28): Motiq is NOT an incorporated company. A trading
 * name is not a legal person and cannot contract, so the contracting party is
 * the individual, trading under the Motiq brand. This matches the copyright
 * holder named in the repository LICENSE file.
 *
 * Consequence to keep in view: without a company there is no liability
 * separation — the limitation-of-liability clause protects an individual. If
 * Motiq incorporates, change `entity` here and nowhere else.
 */
export const legal = {
  /** Copyright holder named in the repository LICENSE file (verified). */
  copyrightHolder: "Mahammad Rustamov",
  /** Copyright year asserted in the LICENSE file (verified). */
  copyrightYear: "2026",
  /** The contracting party. Owner-decided 2026-07-28; not an incorporated entity. */
  entity: "Mahammad Rustamov, trading as Motiq" as string | null,
  /** True while `entity` is an individual rather than a registered company. */
  isIncorporated: false,
  /**
   * Country of operation. Deliberately not published: nothing is sold, and the
   * owner decision (2026-07-28) is to assert no governing law and no exclusive
   * venue, so naming a country would imply a jurisdiction we do not claim. Set
   * this only if Motiq starts selling and must disclose where it operates.
   */
  country: null as string | null,
  /**
   * Registered or business address. Deliberately NOT published: Motiq is
   * unincorporated with no business premises, and publishing a personal address
   * is not an acceptable substitute. Revisit before any paid launch, when
   * consumer-disclosure rules may require a contactable address.
   */
  address: null as string | null,
  /** Governing law. Intentionally unasserted — see `country`. */
  governingLaw: null as string | null,
  /** Dispute venue. Intentionally unasserted — see `country`. */
  venue: null as string | null,
} as const;

export const entityLabel: string =
  legal.entity ?? ownerDecision("name the contracting legal entity or trading name");

export const countryLabel: string =
  legal.country ?? ownerDecision("set legal.country in apps/docs/lib/legal.ts");

/**
 * What the pages say where a business address would normally go. Reflects the
 * owner decision: country only (see `countryLabel`), no street address, contact
 * by email. Deliberately does NOT repeat the country — pages that show both
 * render `countryLabel` in its own row.
 */
export const addressLabel: string = legal.address
  ? legal.address
  : "None published — no business premises. Written notices go to the legal contact address.";

/**
 * True once a jurisdiction is known. Pages branch on this rather than rendering
 * half-written clauses: with a country set they state governing law and venue;
 * without one they state, completely and without a placeholder, that no
 * governing law is specified.
 *
 * SETTING `legal.country` IS THE ONLY EDIT NEEDED — governing law, venue, the
 * privacy-regime paragraph, and the Terms jurisdiction table all derive from it.
 */
export const jurisdictionResolved: boolean = Boolean(legal.country);

export const governingLawLabel: string =
  legal.governingLaw ??
  (legal.country
    ? `the laws of ${legal.country}`
    : ownerDecision("set legal.country in apps/docs/lib/legal.ts"));

export const venueLabel: string =
  legal.venue ??
  (legal.country
    ? `the courts of ${legal.country}`
    : ownerDecision("set legal.country in apps/docs/lib/legal.ts"));

// ---------------------------------------------------------------------------
// Contact channels
// ---------------------------------------------------------------------------

export interface LegalContact {
  /** What this channel is for. */
  purpose: string;
  /** Human label. */
  label: string;
  /** Link target, or null when the channel is an unresolved decision. */
  href: string | null;
  /** True when the channel is verified as real and currently monitored. */
  verified: boolean;
}

/**
 * The GitHub issue tracker is verified in configuration (`product.config.json`
 * → `supportUrl`) and referenced from the README and CONTRIBUTING.
 *
 * OWNER DECISION (2026-07-28): publish `legal@motiq.dev` and `support@motiq.dev`.
 * A separate `privacy@` alias was deliberately NOT created, so data-subject
 * requests route to the legal address — one monitored inbox rather than an
 * address that bounces. `salesEmail` stays empty: nothing is sold.
 *
 * Every address published here MUST be a real, monitored mailbox. A bouncing
 * legal or privacy contact is worse than none.
 */
export const issuesUrl = product.supportUrl;
export const repoUrl = product.githubUrl;

export const supportEmail: string | null = commerce.supportEmail || null;
export const salesEmail: string | null = commerce.salesEmail || null;
export const legalEmail: string | null = "legal@motiq.dev";
/** No dedicated privacy inbox; privacy requests go to the legal address. */
export const privacyEmail: string | null = legalEmail;

function emailContact(purpose: string, address: string | null, fallbackDecision: string): LegalContact {
  return address
    ? { purpose, label: address, href: `mailto:${address}`, verified: true }
    : { purpose, label: ownerDecision(fallbackDecision), href: null, verified: false };
}

export const contacts: Record<"general" | "privacy" | "legal" | "support", LegalContact> = {
  general: {
    purpose: "General and product questions",
    label: "GitHub issue tracker",
    href: issuesUrl,
    verified: true,
  },
  support: {
    purpose: "Support requests and defect reports",
    label: "GitHub issue tracker (preferred)",
    href: issuesUrl,
    verified: true,
  },
  privacy: emailContact(
    "Privacy questions and data-subject requests",
    privacyEmail,
    "provide a monitored privacy contact address",
  ),
  legal: emailContact("Legal notices", legalEmail, "provide a monitored legal contact address"),
};

/** Secondary support channel, shown alongside the issue tracker when set. */
export const supportEmailContact: LegalContact | null = supportEmail
  ? emailContact("Support by email", supportEmail, "")
  : null;

// ---------------------------------------------------------------------------
// Current commercial posture (read from config — never restated inline)
// ---------------------------------------------------------------------------

/**
 * Whether Motiq currently sells anything. Derived from the same flags the
 * storefront CTAs use (lib/commerce.ts), so the policy pages cannot drift from
 * what the site actually does.
 */
export const sellsPaidProducts: boolean =
  commerce.checkoutEnabled && commerce.checkoutProvider !== "none";

/** Whether a token-gated private registry is serving anything today. */
export const privateRegistryLive: boolean = commerce.privateRegistryEnabled;

/** Whether an access-request/waitlist intake is open. */
export const waitlistLive: boolean = commerce.waitlistEnabled;

/** Voluntary sponsorship destination (verified in product.config.json). */
export const sponsorUrl = product.sponsorUrl;

/**
 * Where the Website is actually served from, verified against live response
 * headers rather than assumed. Used by the Privacy Policy's transfers section.
 */
export const hosting = {
  provider: "Vercel Inc.",
  /** Vercel region code observed in `x-vercel-id`. */
  regionCode: "arn1",
  regionLabel: "Stockholm, Sweden",
  edgeProvider: "Cloudflare, Inc.",
} as const;

/** Security policy published in the repository (SECURITY.md). */
export const securityPolicyUrl = `${product.githubUrl}/blob/main/SECURITY.md`;
/** GitHub's private vulnerability reporting entry point. */
export const securityAdvisoryUrl = `${product.githubUrl}/security/advisories/new`;

/**
 * Retention periods we actually commit to. Anything not listed here is either
 * not persisted at all or is held by a third party under its own schedule.
 */
export const retention = {
  /** Support tickets submitted through any channel we operate. */
  supportMonths: 24,
  /** Deadline we commit to for answering a data-subject request. */
  dataRequestDays: 30,
} as const;

// ---------------------------------------------------------------------------
// Route map — every cross-link between policies goes through this
// ---------------------------------------------------------------------------

export const legalRoutes = {
  terms: commerce.termsUrl,
  privacy: commerce.privacyUrl,
  license: commerce.licenseUrl,
  refund: commerce.refundPolicyUrl,
  update: commerce.updatePolicyUrl,
  support: commerce.supportPolicyUrl,
} as const;

export const legalNav: { href: string; label: string; title: string }[] = [
  { href: legalRoutes.terms, label: "Terms of Service", title: "Terms of Service" },
  { href: legalRoutes.privacy, label: "Privacy", title: "Privacy Policy" },
  { href: legalRoutes.license, label: "License", title: "Source-Code License" },
  { href: legalRoutes.refund, label: "Refund Policy", title: "Refund Policy" },
  { href: legalRoutes.update, label: "Update Policy", title: "Update Policy" },
  { href: legalRoutes.support, label: "Support Policy", title: "Support Policy" },
];

// ---------------------------------------------------------------------------
// Shared glossary — ONE definition per term, used by all six pages
// ---------------------------------------------------------------------------

export interface Definition {
  term: string;
  meaning: string;
}

/**
 * The canonical definitions. The Terms page renders this list in full; the other
 * pages link back to it instead of redefining anything. Adding a term here is a
 * deliberate act — a term that appears in only one page belongs in that page.
 */
export const definitions: Definition[] = [
  {
    term: "Motiq",
    meaning:
      `The open-source component catalog published at ${product.documentationUrl.replace(/^https?:\/\//, "").replace(/\/docs$/, "")} and in the ${product.githubUrl.replace(/^https?:\/\//, "")} repository, together with the person or entity that publishes it. Also referred to below as "we", "us", and "our".`,
  },
  {
    term: "Website",
    meaning:
      "The Motiq documentation and catalog site, including component pages, live previews, search, the updates page, and the sponsorship pages.",
  },
  {
    term: "Services",
    meaning:
      "The Website, the public component registry that serves component definitions to the shadcn CLI, the documentation, and any support channel we operate. The Services do not include third-party platforms we link to.",
  },
  {
    term: "Components",
    meaning:
      "The individual animated React and shadcn-compatible user-interface elements, blocks, and packs listed in the Motiq catalog.",
  },
  {
    term: "Source Code",
    meaning:
      "The human-readable implementation of a Component that is copied into your own project when you install it — including its TypeScript/TSX files, styles, and any accompanying assets delivered with it.",
  },
  {
    term: "Free Components",
    meaning:
      "Components whose Source Code is published publicly and installable by anyone without payment, authentication, or an account. Today this is the entire Motiq catalog.",
  },
  {
    term: "Paid Components",
    meaning:
      "Components whose Source Code would be delivered only to a paying customer through an access-controlled registry. Motiq does not currently offer any Paid Components; the term is defined here so that the policies remain coherent if that changes.",
  },
  {
    term: "Customer",
    meaning:
      "A person or organization that enters into a paid transaction with us. Because Motiq currently sells no products, this term applies today only to voluntary sponsorship, which is transacted on a third-party platform.",
  },
  {
    term: "User",
    meaning:
      "Anyone who visits the Website, reads the documentation, or installs a Component — whether or not they pay us anything.",
  },
  {
    term: "Organization",
    meaning:
      "A company, agency, institution, or other legal entity on whose behalf a User acts. Motiq does not currently implement organization accounts, seats, or shared entitlements.",
  },
  {
    term: "Entitlement",
    meaning:
      "A server-side record stating which Components a particular Customer may install. Entitlement records are implemented in the codebase but are not in use, because no Component requires one today.",
  },
  {
    term: "Access Token",
    meaning:
      "A secret credential that would authenticate a Customer to an access-controlled registry. No Access Tokens are issued to the public today; installing any Motiq Component requires no credential.",
  },
  {
    term: "Purchase",
    meaning:
      "A paid transaction for a Motiq product. No purchase mechanism is currently offered. Voluntary sponsorship is not a Purchase and buys no additional rights.",
  },
  {
    term: "Update",
    meaning:
      "A later published version of a Component's Source Code — a defect fix, refinement, or breaking change — that you may choose to install into your project by re-running the install command.",
  },
];

// ---------------------------------------------------------------------------
// Processors — ONLY parties verified in the repository or configuration
// ---------------------------------------------------------------------------

export interface Processor {
  name: string;
  role: string;
  /** What reaches them. */
  data: string;
  /** Where this was verified. */
  evidence: string;
}

/**
 * Third parties that can receive personal data as a consequence of how Motiq is
 * built and distributed today. Anything not verifiable in the repository is
 * deliberately absent — an unnamed host is listed as an owner decision on the
 * Privacy page rather than guessed at here.
 */
export const processors: Processor[] = [
  {
    name: "Vercel Inc.",
    role: "Website and registry hosting",
    data:
      "Standard web-server request data for every visit and every component install: IP address, timestamp, requested URL, user agent, and referrer. Verified serving from Vercel's Stockholm (arn1) region.",
    evidence: "Live response headers from motiq.dev: x-vercel-id: arn1, x-vercel-cache",
  },
  {
    name: "Cloudflare, Inc.",
    role: "DNS, CDN, and reverse proxy in front of the site",
    data:
      "Every request to the Website passes through Cloudflare's edge network before reaching the host, so Cloudflare processes the same connection data (IP address, user agent, requested URL). Cloudflare sets no cookie on our responses.",
    evidence: "Live response headers from motiq.dev: server: cloudflare, cf-ray",
  },
  {
    name: "GitHub, Inc.",
    role: "Source-code hosting, issue tracker, and the support/feedback channel",
    data:
      "Your GitHub account identifier and anything you choose to write in an issue, discussion, or pull request. GitHub also processes its own visitor data under its own privacy statement.",
    evidence: "product.config.json → githubUrl / supportUrl; README; CONTRIBUTING.md",
  },
  {
    name: "Ko-fi",
    role: "Voluntary sponsorship payments",
    data:
      "If you choose to sponsor, Ko-fi collects your payment and contact details directly on its own platform. We do not operate the checkout and do not receive or store your card details.",
    evidence: "product.config.json → sponsorUrl; apps/docs/lib/funding.ts",
  },
  {
    name: "GitHub Sponsors",
    role: "Alternative sponsorship destination — not yet active",
    data:
      "Configured but held in a non-payment, informational state; no sponsorship is transacted through it today.",
    evidence: "apps/docs/lib/funding.ts → githubSponsorsStatus: \"pending\"",
  },
];
