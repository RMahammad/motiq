import type { Metadata } from "next";

import { commerce, product } from "../../../lib/product";
import { DraftBody, type DraftSection } from "../_draft";

export const metadata: Metadata = {
  title: `Terms of Service - ${product.productName}`,
};

const salesContact = commerce.salesEmail || "to be provided";

// DRAFT — not finalized. Every unresolved clause below is tagged inline with
// [REQUIRES LEGAL REVIEW], [COMMERCIAL DECISION REQUIRED], or [PROVIDER-SPECIFIC].
const sections: DraftSection[] = [
  {
    heading: "Scope of the agreement",
    intro:
      "Defines what this contract covers, who is bound by it, and how it relates to the other policies.",
    clauses: [
      {
        text: `These Terms govern access to and use of the ${product.productName} website, documentation, registry, and any purchased component source.`,
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Definitions of key terms (\"Product\", \"Source\", \"Entitlement\", \"Customer\", \"Organization\", \"Registry\") to be drafted and used consistently across all policies.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Order of precedence between these Terms and the License, Privacy, Refund, Update, and Support policies is to be stated explicitly.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Governing law, jurisdiction, and venue for disputes.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Accounts & eligibility",
    clauses: [
      {
        text: "Whether an account is required to purchase, and the customer's responsibility for the accuracy and security of account and access-token credentials.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[PROVIDER-SPECIFIC]"],
      },
      {
        text: "Minimum age and legal-capacity requirements to enter this agreement.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Authority to bind an organization when purchasing on its behalf, and how organizational entitlements are administered.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Acceptable use",
    intro: "What customers and visitors may and may not do with the site and product.",
    clauses: [
      {
        text: "Prohibited conduct is to be enumerated. The technical posture that these restrictions back up already exists and should inform the drafting:",
        markers: ["[REQUIRES LEGAL REVIEW]"],
        points: [
          "No scraping, bulk harvesting, or automated enumeration of the registry or catalog.",
          "No attempt to bypass entitlement checks, rate limits, or access controls on the private registry route.",
          "No sharing, resale, or redistribution of access tokens or of gated (Pro) source outside the license grant.",
          "No interference with, probing of, or overloading of the service.",
        ],
      },
      {
        text: "Consequences of misuse (suspension, token revocation, termination) are to be defined and cross-referenced with the License termination clause.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Intellectual property",
    clauses: [
      {
        text: `Ownership: ${product.productName}, its brand, site, documentation, and the original component source remain the property of the provider except for the rights expressly granted in the License.`,
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Rights a customer receives in purchased source are governed solely by the separate License page; these Terms do not themselves grant a source license.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Feedback, bug reports, and suggestions may be used by the provider without obligation; the exact assignment/license-back wording is to be drafted.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Trademark and brand-name terms remain provisional while the product name and namespace are preview placeholders.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Fees, billing & taxes",
    clauses: [
      {
        text: "Pricing, billing model (one-time vs. subscription vs. renewal), currency, and tax handling are undecided; no price is presented until finalized.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Payment processing, invoicing, and chargeback handling depend on the selected checkout provider.",
        markers: ["[PROVIDER-SPECIFIC]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Disclaimers",
    clauses: [
      {
        text: "The product is to be provided on an \"as is\" and \"as available\" basis, with warranty disclaimers to be finalized by counsel.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "No claim of uninterrupted availability, fitness for a particular purpose, or defect-free operation is made in this draft.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Limitation of liability",
    clauses: [
      {
        text: "The scope and monetary cap on liability are to be drafted with counsel.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Categories of excluded damages (indirect, incidental, consequential, loss of data or profit) to be specified.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Any indemnification obligations (either direction) to be defined.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Term, suspension & changes",
    clauses: [
      {
        text: "How and when these Terms may be updated, how changes are communicated, the effective date, and whether continued use constitutes acceptance.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Grounds for suspension or termination of access, and the effect of termination on any granted License (cross-referenced with the License and Refund pages).",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: `Contact for questions about these Terms: ${salesContact}.`,
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <DraftBody
      intro={
        <>
          This is a structured <strong className="text-[var(--color-fg)]">draft</strong> of
          the Terms of Service that will govern use of {product.productName}. The clauses
          below indicate what the finalized Terms are intended to cover; each unresolved
          item is tagged inline (
          <code className="text-[var(--color-fg)]">[REQUIRES LEGAL REVIEW]</code>,{" "}
          <code className="text-[var(--color-fg)]">[COMMERCIAL DECISION REQUIRED]</code>, or{" "}
          <code className="text-[var(--color-fg)]">[PROVIDER-SPECIFIC]</code>). Nothing here
          is a binding commitment. For questions, contact sales at{" "}
          <span className="text-[var(--color-fg)]">{salesContact}</span>.
        </>
      }
      sections={sections}
    />
  );
}
