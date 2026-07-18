import type { Metadata } from "next";

import { commerce, product } from "../../../lib/product";
import { DraftBody, type DraftSection } from "../_draft";

export const metadata: Metadata = {
  title: `License - ${product.productName}`,
};

const salesContact = commerce.salesEmail || "to be provided";

// DRAFT — not finalized. The delivery mechanism (entitlement-aware registry,
// docs/43) is real; the granted rights, scope, and restrictions are all TBD.
const sections: DraftSection[] = [
  {
    heading: "Editable source access",
    intro:
      "How an entitlement translates into source access is implemented (docs/43); the legal rights attached to that access are not yet defined.",
    clauses: [
      {
        text: `An entitlement grants a customer the ability to install ${product.productName} component source via the standard shadcn CLI, authenticated by a per-customer access token, and to edit that source in their own project.`,
      },
      {
        text: "Free-tier source is publicly installable; Pro/block/pack source is delivered only to an entitled token through the private registry route - this is access control, not DRM.",
      },
      {
        text: "The precise bundle of rights attached to installed source (the license grant itself) is to be drafted.",
        markers: ["[REQUIRES LEGAL REVIEW]", "[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
  {
    heading: "Permitted use",
    clauses: [
      {
        text: "Which projects and products the installed source may be used in (commercial products, client work, internal tools, unlimited end-products vs. limited).",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Whether the source may be modified, and whether modifications are unrestricted.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Internal distribution within the licensee's organization or team, subject to the seat/scope model below.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Seats & scope",
    clauses: [
      {
        text: "The licensing unit - per-seat (per developer), per-project, per-organization, or a hybrid - is undecided.",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Team and agency scope, seat counts, and how seats map to tokens depend on the org-token model (a docs/43 open item).",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[PROVIDER-SPECIFIC]"],
      },
      {
        text: "The exact rights wording for each scope tier is to be drafted with counsel.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Redistribution",
    clauses: [
      {
        text: "Rules for shipping the installed source inside the licensee's own products (typically permitted as part of a compiled/end product) versus distributing the source itself.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Prohibition on redistributing the editable source as source, publishing it publicly, or including it in a template/boilerplate offered to others.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Resale & sublicensing",
    clauses: [
      {
        text: "Whether resale, sublicensing, or repackaging is permitted (expected default: prohibited); the binding anti-resale / anti-repackaging wording is to be drafted.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Prohibition on sharing access tokens or gated source with unlicensed parties, consistent with the Terms' acceptable-use clause.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Transfer",
    clauses: [
      {
        text: "Whether a license may be transferred to another individual or entity, and under what conditions.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Term & termination",
    clauses: [
      {
        text: "License duration and how it relates to the Update Policy (access to future updates is a separate question from the right to use already-installed source).",
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
      {
        text: "Conditions under which the license terminates (breach of acceptable use, resale, chargeback), and the effect of termination.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "On termination, the access token is revoked and further registry installs are denied; the durable revocation flow exists (docs/43).",
      },
    ],
  },
  {
    heading: "Refund effect on the license",
    intro:
      "How a refund interacts with the license grant is both a legal and a commercial question; the honest technical boundary is stated so it is not overclaimed.",
    clauses: [
      {
        text: "On refund or chargeback, the entitlement moves to a non-active state and the token is revoked, so no new Pro source can be installed thereafter (docs/43 error contract: 403 \"revoked\").",
      },
      {
        text: "Whether a refunded customer retains any right to continue using source already installed before the refund, and for how long, is undecided.",
        markers: ["[COMMERCIAL DECISION REQUIRED]", "[REQUIRES LEGAL REVIEW]"],
      },
      {
        text: "Honest limitation: source already downloaded into the customer's repository cannot be technically recalled. Any post-refund restriction is a contractual obligation, not a technical control.",
        markers: ["[REQUIRES LEGAL REVIEW]"],
      },
    ],
  },
  {
    heading: "Enforcement & contact",
    clauses: [
      {
        text: "Enforcement mechanisms are reasonable access control (token auth, entitlement checks, revocation, audit logging), explicitly not DRM.",
      },
      {
        text: `License questions: ${salesContact}.`,
        markers: ["[COMMERCIAL DECISION REQUIRED]"],
      },
    ],
  },
];

export default function LicensePage() {
  return (
    <DraftBody
      intro={
        <>
          This is a structured <strong className="text-[var(--color-fg)]">draft</strong> of
          the {product.productName} License. The delivery mechanism - an entitlement grants
          access to editable component source installed via the shadcn CLI (see docs/43) - is
          implemented, but the exact granted rights, scope, and restrictions are all to be
          finalized. Unresolved items are tagged inline (
          <code className="text-[var(--color-fg)]">[REQUIRES LEGAL REVIEW]</code>,{" "}
          <code className="text-[var(--color-fg)]">[COMMERCIAL DECISION REQUIRED]</code>,{" "}
          <code className="text-[var(--color-fg)]">[PROVIDER-SPECIFIC]</code>). Nothing below
          is a granted right or a binding license term yet.
        </>
      }
      sections={sections}
    />
  );
}
