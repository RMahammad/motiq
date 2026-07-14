import type { Metadata } from "next";

import { commerce, product } from "../../../lib/product";
import { DraftBody, type DraftSection } from "../_draft";

export const metadata: Metadata = {
  title: `Refund Policy — ${product.productName}`,
};

const salesContact = commerce.salesEmail || "to be provided";

// DRAFT — the entire refund policy is undecided. Only the technical effect of a
// refund on registry access (docs/43 revocation) is stated as fact.
const sections: DraftSection[] = [
  {
    heading: "Eligibility",
    clauses: [
      {
        text: "Which purchases are eligible for a refund (individual components, packs, complete catalog, team/agency licenses).",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "The time window during which a refund may be requested.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Whether a satisfaction-based or no-questions-asked guarantee is offered.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Conditions & exclusions",
    intro:
      "Because the product is editable source that a customer downloads, the conditions and any non-refundable situations need careful, honest definition.",
    clauses: [
      {
        text: "Conditions that must be met to qualify for a refund.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Non-refundable items or situations (for example, whether extensive prior installation of source affects eligibility).",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Honest limitation to reflect in the wording: source already installed into the customer's repository cannot be technically recalled on refund, so eligibility terms cannot rely on \"returning\" the source.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "How to request a refund",
    clauses: [
      {
        text: "The request process, required information, and identity/purchase verification.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[PROVIDER-SPECIFIC]"],
      },
      {
        text: `Refund requests: ${salesContact}.`,
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Processing & timing",
    clauses: [
      {
        text: "How refunds are issued and expected timing, which depend on the checkout/payment provider.",
        markers: ["[PROVIDER-SPECIFIC]", "[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Handling of partial refunds and of chargebacks initiated with the payment provider.",
        markers: ["[PROVIDER-SPECIFIC]", "[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Effect on access (implemented)",
    intro:
      "This is the one part with a concrete technical basis; it is described honestly and cross-references the License page.",
    clauses: [
      {
        text: "On refund or chargeback, the entitlement moves to a non-active state and the access token is revoked, so no further Pro source can be installed (docs/43: 403 \"revoked\").",
      },
      {
        text: "Whether and for how long already-installed source may continue to be used after a refund is a License question, not a technical control.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <DraftBody
      intro={
        <>
          This is a structured <strong className="text-[var(--color-fg)]">draft</strong> of
          the {product.productName} Refund Policy. The entire policy — eligibility, windows,
          conditions, and process — is to be finalized; unresolved items are tagged inline (
          <code className="text-[var(--color-fg)]">[REQUIRES LEGAL REVIEW]</code>,{" "}
          <code className="text-[var(--color-fg)]">[COMMERCIAL DECISION REQUIRED]</code>,{" "}
          <code className="text-[var(--color-fg)]">[PROVIDER-SPECIFIC]</code>). No refund
          commitment is made by anything below.
        </>
      }
      sections={sections}
    />
  );
}
