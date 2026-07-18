import type { Metadata } from "next";

import { commerce, product } from "../../../lib/product";
import { DraftBody, type DraftSection } from "../_draft";

export const metadata: Metadata = {
  title: `Privacy Policy - ${product.productName}`,
};

const contact = commerce.supportEmail || "to be provided";

// DRAFT — not finalized. The analytics *stance* is real and referenced from
// docs/44; the enforceable policy wording, retention, and consent model are TBD.
const sections: DraftSection[] = [
  {
    heading: "What data is collected",
    intro:
      "The current analytics posture is provider-neutral and backed by a dev-logger adapter - no third-party SDK is loaded and no data leaves the app (docs/44).",
    clauses: [
      {
        text: "Product analytics captures only a whitelisted set of product events (e.g. page views, catalog searches, preview opens) with small, non-sensitive props such as component slugs, categories, and coarse counts.",
      },
      {
        text: "Source code, secrets, tokens, keys, request/response bodies, HTTP headers, and query text are never recorded as analytics data.",
      },
      {
        text: "Account, purchase, and support-correspondence data categories are to be enumerated once the checkout and support channels are chosen.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[PROVIDER-SPECIFIC]"],
      },
      {
        text: "Whether any non-identifying session/visitor key is used for funnel metrics, and its exact scheme, is an open decision in docs/44.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "How data is used",
    clauses: [
      {
        text: "Whitelisted product-event data is used to understand catalog usage and improve the product; the precise permitted purposes are to be finalized.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Data is explicitly not used to profile individuals, is not sold, and is not combined across sources into personal profiles; the binding statement of these limits is to be drafted.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Cookies & similar technologies",
    clauses: [
      {
        text: "Whether cookies, local storage, or similar technologies are used, and for what purposes, depends on the analytics provider ultimately selected.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[PROVIDER-SPECIFIC]"],
      },
      {
        text: "Any consent or cookie-banner mechanism required by law or by the chosen provider is undecided; the current posture introduces no external script, cookie, or fingerprint.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[PROVIDER-SPECIFIC]"],
      },
    ],
  },
  {
    heading: "Sharing, processors & international transfer",
    clauses: [
      {
        text: "Third-party processors (checkout, analytics, email, hosting) are to be listed once selected, with their roles and locations.",
        markers: ["[PROVIDER-SPECIFIC]", "[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Legal basis for processing, disclosure conditions, and any cross-border transfer safeguards to be drafted with counsel.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Access logging & audit",
    intro:
      "The private registry route records every access decision to a durable audit log (docs/43); the privacy treatment of those records is to be finalized.",
    clauses: [
      {
        text: "The registry audit log records access decisions (granted/denied) tied to an entitlement/token identifier for security and abuse prevention.",
      },
      {
        text: "Whether IP addresses are stored in raw or hashed form, and the retention window for audit records, are to be decided.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Data retention & your rights",
    clauses: [
      {
        text: "Retention periods for each data category (analytics events, audit logs, account and billing records) are to be defined.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Data-subject rights (access, correction, deletion, portability, objection) and the process to exercise them are to be drafted per applicable law.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Contact",
    clauses: [
      {
        text: `Privacy questions and data-subject requests: ${contact}.`,
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "The controller/legal entity responsible for this data is to be named.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <DraftBody
      intro={
        <>
          This is a structured <strong className="text-[var(--color-fg)]">draft</strong> of
          the {product.productName} Privacy Policy. It reflects the product&apos;s real
          privacy stance - analytics captures only whitelisted product events and never
          source, secrets, or personal data beyond an approved policy (see docs/44) - but the
          enforceable policy text, retention windows, and consent model are not finalized.
          Unresolved items are tagged inline (
          <code className="text-[var(--color-fg)]">[REQUIRES LEGAL REVIEW]</code>,{" "}
          <code className="text-[var(--color-fg)]">[COMMERCIAL DECISION REQUIRED]</code>,{" "}
          <code className="text-[var(--color-fg)]">[PROVIDER-SPECIFIC]</code>).
        </>
      }
      sections={sections}
    />
  );
}
