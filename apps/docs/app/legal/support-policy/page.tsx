import type { Metadata } from "next";

import { commerce, product } from "../../../lib/product";
import { DraftBody, type DraftSection } from "../_draft";

export const metadata: Metadata = {
  title: `Support Policy - ${product.productName}`,
};

const supportContact = commerce.supportEmail || "to be provided";

// DRAFT — support scope and any SLA are undecided. This draft makes NO
// service-level guarantee.
const sections: DraftSection[] = [
  {
    heading: "Support scope",
    clauses: [
      {
        text: "What support covers (installation help, usage questions, defect reports for shipped components) is to be defined.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "What falls outside support (custom development, one-off design work, third-party framework or provider issues, unrelated debugging) is to be enumerated.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Channels & contact",
    clauses: [
      {
        text: "How to reach support and the supported channel(s) depend on the tooling ultimately chosen (email, portal, issue tracker).",
        markers: ["[PROVIDER-SPECIFIC]", "[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: `Support contact: ${supportContact}.`,
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Response targets",
    intro: "This draft makes no service-level guarantee.",
    clauses: [
      {
        text: "Any first-response or resolution targets, and whether they differ by tier, are undecided.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "No service-level agreement (SLA) or response-time guarantee is made by this draft.",
      },
    ],
  },
  {
    heading: "Eligibility & hours",
    clauses: [
      {
        text: "Who is eligible for support and under which entitlement (Free vs. Pro vs. team/agency).",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Support hours, availability, timezone coverage, and any language limitations.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Baseline commitments",
    intro:
      "One factual baseline that holds regardless of the paid-support decision, so the draft is not empty.",
    clauses: [
      {
        text: "Every shipped component meets the project's accessibility and reduced-motion baseline and includes documentation and a live preview, independent of any paid-support tier.",
      },
      {
        text: "The precise support obligations layered on top of that baseline remain to be finalized.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
];

export default function SupportPolicyPage() {
  return (
    <DraftBody
      intro={
        <>
          This is a structured <strong className="text-[var(--color-fg)]">draft</strong> of
          the {product.productName} Support Policy. Support scope and any SLA are to be
          finalized, and this draft makes{" "}
          <strong className="text-[var(--color-fg)]">no service-level guarantee</strong>.
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
