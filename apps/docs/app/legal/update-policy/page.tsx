import type { Metadata } from "next";

import { commerce, product } from "../../../lib/product";
import { DraftBody, type DraftSection } from "../_draft";

export const metadata: Metadata = {
  title: `Update Policy — ${product.productName}`,
};

const salesContact = commerce.salesEmail || "to be provided";

// DRAFT — the update duration model is undecided. This draft makes NO
// lifetime-updates promise.
const sections: DraftSection[] = [
  {
    heading: "What updates include",
    clauses: [
      {
        text: "Categories of updates (defect fixes, refinements, new components added to a purchased pack or the complete catalog) are to be defined.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: `Updates are delivered by re-installing the source through the ${product.productName} registry with the customer's existing access token; the customer chooses when to pull updated source into their project.`,
      },
      {
        text: "Whether newly added components in a category or pack are included in an existing entitlement, or sold separately, is undecided.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Update duration",
    intro:
      "This draft deliberately makes no lifetime-updates claim; the duration model is an open commercial decision.",
    clauses: [
      {
        text: "How long a purchase includes access to updates (e.g. a fixed term, a rolling window, or renewal-based) is undecided.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "No claim of lifetime or perpetual updates is made anywhere in this draft.",
      },
      {
        text: "Whether the right to use already-installed source outlives the update window is a License question, addressed on the License page.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Versioning & breaking changes",
    clauses: [
      {
        text: "How versions are numbered and what constitutes a major (breaking) change; the catalog follows semantic-versioning conventions internally, and the customer-facing statement is to be finalized.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Handling of breaking changes and the availability of migration guidance for updated components.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Renewal & continued access",
    clauses: [
      {
        text: "Whether continued access to updates requires renewal, and the renewal mechanics, depend on the billing model and checkout provider.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[PROVIDER-SPECIFIC]"],
      },
      {
        text: `Update questions: ${salesContact}.`,
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
];

export default function UpdatePolicyPage() {
  return (
    <DraftBody
      intro={
        <>
          This is a structured <strong className="text-[var(--color-fg)]">draft</strong> of
          the {product.productName} Update Policy. The update-duration model is not decided
          and this draft makes <strong className="text-[var(--color-fg)]">no lifetime-updates
          promise</strong>. Unresolved items are tagged inline (
          <code className="text-[var(--color-fg)]">[REQUIRES LEGAL REVIEW]</code>,{" "}
          <code className="text-[var(--color-fg)]">[COMMERCIAL DECISION REQUIRED]</code>,{" "}
          <code className="text-[var(--color-fg)]">[PROVIDER-SPECIFIC]</code>).
        </>
      }
      sections={sections}
    />
  );
}
