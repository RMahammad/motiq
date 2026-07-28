import type { Metadata } from "next";
import Link from "next/link";

import { product } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import {
  addressLabel,
  countryLabel,
  definitions,
  entityLabel,
  governingLawLabel,
  issuesUrl,
  legal,
  legalRoutes,
  jurisdictionResolved,
  privateRegistryLive,
  sellsPaidProducts,
  sponsorUrl,
  venueLabel,
} from "../../../lib/legal";
import { LegalDoc, Review, relatedExcept, type LegalSection } from "../_doc";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description: `The rules for using the ${product.productName} website, documentation, and public component registry. A pre-review draft that reflects how ${product.productName} operates today.`,
  path: legalRoutes.terms,
});

const link = "text-[var(--color-fg)] underline underline-offset-2";

const sections: LegalSection[] = [
  {
    id: "agreement",
    heading: "Agreement and acceptance",
    blocks: [
      {
        kind: "p",
        body: `These Terms of Service are an agreement between you and ${product.productName} covering your use of the Services. By visiting the Website, reading the documentation, or installing a Component, you agree to these Terms. If you do not agree, do not use the Services.`,
      },
      {
        kind: "p",
        body: (
          <>
            The contracting party publishing the Services is{" "}
            <span className="text-[var(--color-fg)]">{entityLabel}</span>. {product.productName}{" "}
            is a trading name, not a registered company — your agreement is with the individual
            named above{jurisdictionResolved ? `, operating from ${countryLabel}` : ""}. There
            is no separate corporate entity between you and that person. <Review />
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            There is no registered business address to publish and no premises open to
            visitors. Written notices should go to the legal contact address in the Contact
            section below, and we will treat a notice sent there as validly served. If{" "}
            {product.productName} incorporates or begins selling to consumers, a contactable
            postal address will be required, and it will be published here before that
            happens.
          </>
        ),
      },
      {
        kind: "note",
        title: "What these Terms do not cover",
        body: (
          <>
            These Terms govern your use of the Services. What you may do with Component
            Source Code once it is in your project is governed exclusively by the{" "}
            <Link href={legalRoutes.license} className={link}>
              Source-Code License
            </Link>
            . Nothing in these Terms grants, limits, or modifies that license.
          </>
        ),
      },
    ],
  },
  {
    id: "definitions",
    heading: "Definitions",
    blocks: [
      {
        kind: "p",
        body: "These definitions apply across all six Motiq policies. Where another policy uses a capitalised term, it means what it means here.",
      },
      { kind: "defs", items: definitions.map((d) => ({ term: d.term, meaning: d.meaning })) },
    ],
  },
  {
    id: "order-of-precedence",
    heading: "How these policies fit together",
    blocks: [
      {
        kind: "p",
        body: "Six documents make up the agreement. If they ever conflict, the more specific document controls its own subject matter:",
      },
      {
        kind: "ol",
        items: [
          <>
            The{" "}
            <Link href={legalRoutes.license} className={link}>
              Source-Code License
            </Link>{" "}
            controls what you may do with Component Source Code.
          </>,
          <>
            The{" "}
            <Link href={legalRoutes.privacy} className={link}>
              Privacy Policy
            </Link>{" "}
            controls how personal data is handled.
          </>,
          <>
            The{" "}
            <Link href={legalRoutes.refund} className={link}>
              Refund Policy
            </Link>
            ,{" "}
            <Link href={legalRoutes.update} className={link}>
              Update Policy
            </Link>
            , and{" "}
            <Link href={legalRoutes.support} className={link}>
              Support Policy
            </Link>{" "}
            control refunds, future versions, and support respectively.
          </>,
          <>These Terms control everything else about your use of the Services.</>,
        ],
      },
      {
        kind: "p",
        body: (
          <>
            Whether this order of precedence is stated correctly for enforceability purposes
            is a drafting question. <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "eligibility",
    heading: "Eligibility and authority",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            You must be old enough to enter a binding contract where you live. If you are
            not, you may still read the documentation and install Components — the license
            asks nothing of you — but you cannot agree to these Terms, and a parent or
            guardian should. We do not ask your age and have no way to check it. <Review />
          </>
        ),
      },
      {
        kind: "p",
        body: "If you use the Services on behalf of an Organization, you confirm that you are authorized to accept these Terms on its behalf, and \"you\" then means both you and that Organization.",
      },
      {
        kind: "p",
        body: "The Services are available to individuals and organizations anywhere, at no charge. Because nothing is sold, the consumer-protection rules that attach to a sale do not currently arise; if that changes, these Terms will be revised for the markets we sell into before anything goes on sale.",
      },
    ],
  },
  {
    id: "accounts",
    heading: "Accounts, credentials, and access tokens",
    blocks: [
      {
        kind: "p",
        body: `${product.productName} does not currently operate user accounts. You do not sign up, sign in, or create a password to use the Website, read the documentation, or install a Component. There is nothing to register for.`,
      },
      {
        kind: "p",
        body: privateRegistryLive
          ? "The private registry is enabled. Access Tokens are secret credentials: keep yours confidential, do not commit it to a public repository, and tell us promptly if you believe it has been exposed."
          : "No Access Tokens are issued to the public, because no Component requires one. The entitlement and token machinery exists in the codebase but is switched off.",
      },
      {
        kind: "p",
        body: (
          <>
            Should access-controlled delivery ever be introduced, its terms would be published
            before it applied to anyone. Nothing in these Terms reserves a right to start
            gating Components you have already installed — that is not possible, as the{" "}
            <Link href={legalRoutes.license} className={link}>
              Source-Code License
            </Link>{" "}
            explains.
          </>
        ),
      },
    ],
  },
  {
    id: "fees",
    heading: "Fees, purchases, and payment",
    blocks: [
      {
        kind: "p",
        body: sellsPaidProducts
          ? "Prices, currency, taxes, and billing terms are presented at checkout before you pay."
          : `${product.productName} sells nothing today. The entire catalog is free to install, there is no checkout, no price is displayed anywhere on the Website, and no payment method is collected by us.`,
      },
      {
        kind: "p",
        body: (
          <>
            You may choose to sponsor the project voluntarily through{" "}
            <a href={sponsorUrl} target="_blank" rel="noreferrer" className={link}>
              Ko-fi
            </a>
            . Sponsorship is a voluntary contribution, not a Purchase. It is transacted
            entirely on Ko-fi&apos;s platform under Ko-fi&apos;s terms — we do not operate that
            checkout and never receive your card details. Sponsorship buys recognition and
            the benefits described on the{" "}
            <Link href="/sponsor" className={link}>
              sponsor page
            </Link>
            ; it does not buy additional license rights, roadmap control, or any guaranteed
            outcome.
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            If paid products are ever introduced, the price, currency, tax treatment, and
            billing terms would be shown to you at checkout before you paid, and these Terms
            would be updated first. No such offering exists today, and nothing on this page
            should be read as advertising one. <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    blocks: [
      {
        kind: "p",
        body: "The catalog is public and we want you to use it. These limits exist to keep the Services available and affordable for everyone else:",
      },
      {
        kind: "ul",
        items: [
          "Do not scrape, bulk-harvest, or systematically enumerate the Website or the registry beyond what ordinary use of the documentation and the shadcn CLI requires.",
          "Do not attempt to bypass, disable, or probe access controls, rate limits, or any other technical protection on the Services.",
          "Do not interfere with, overload, or disrupt the Services or the infrastructure they run on.",
          "Do not misrepresent your relationship with us, or use our name or branding in a way that implies endorsement, affiliation, or authorship you do not have.",
          "Do not use the Services to build or distribute anything unlawful, or in violation of the rights of others.",
        ],
      },
      {
        kind: "p",
        body: "Automated access to the registry is fine when it is what a package manager or CI job normally does — installing the Components your project depends on. It is not fine when it is a crawler mirroring the whole catalog.",
      },
      {
        kind: "p",
        body: privateRegistryLive
          ? "Sharing an Access Token with anyone outside your license scope, or using someone else's token, is a breach of these Terms."
          : "If access-controlled delivery is switched on later, sharing an Access Token outside your license scope, or using someone else's, will be a breach of these Terms.",
      },
      {
        kind: "p",
        body: (
          <>
            The registry route enforces per-token and per-IP rate limits. Rate-limited
            responses never contain Component Source Code. Deliberately circumventing those
            limits — for example by rotating addresses or credentials — is a breach of these
            Terms.
          </>
        ),
      },
    ],
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    blocks: [
      {
        kind: "p",
        body: `${product.productName}, its name, logo, site design, documentation, and the original Component Source Code are owned by us or our licensors. The rights you receive in Component Source Code are the rights granted by the Source-Code License and nothing more.`,
      },
      {
        kind: "p",
        body: "Third-party dependencies that a Component relies on are covered by their own licenses, which we do not grant and cannot override.",
      },
      {
        kind: "p",
        body: `You may use the ${product.productName} name to refer to the project — to say that your product is built with it, to write about it, or to link to it. You may not use it as your own product name, or in a way that suggests we made, endorsed, or support your product.`,
      },
    ],
  },
  {
    id: "feedback",
    heading: "Feedback and contributions",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            If you send us feedback, a bug report, or a suggestion — through the{" "}
            <a href={issuesUrl} target="_blank" rel="noreferrer" className={link}>
              issue tracker
            </a>{" "}
            or any other channel — we may use it to improve the Services without owing you
            payment, credit, or confidentiality. Please do not send us anything you consider
            confidential.
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            Code contributions are governed by the repository&apos;s contribution guide and
            the open-source license in the repository, not by these Terms. The precise
            feedback-license wording still needs professional drafting. <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "third-parties",
    heading: "Third-party services",
    blocks: [
      {
        kind: "p",
        body: "The Services link to and depend on platforms we do not control — the source repository and issue tracker, the sponsorship platform, the package registries your installs pull dependencies from, and the hosting provider that serves this site. Your use of those platforms is governed by their own terms and privacy policies. We are not responsible for them.",
      },
    ],
  },
  {
    id: "suspension",
    heading: "Suspension, termination, and the effect of refunds",
    blocks: [
      {
        kind: "p",
        body: "We may restrict, suspend, or terminate your access to the Services if you breach these Terms, if your use threatens the availability or security of the Services, or if we are required to by law. Where it is reasonable to do so, we will try to tell you why.",
      },
      {
        kind: "p",
        body: (
          <>
            You may stop using the Services at any time. Because the catalog is public and
            installs require no credential, terminating access to the Services does not, and
            cannot, remove Source Code that is already in your project — see the{" "}
            <Link href={legalRoutes.license} className={link}>
              Source-Code License
            </Link>
            .
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            If paid products exist in future, a refund or a chargeback would move the
            associated Entitlement out of an active state and revoke the Access Token, so no
            further Paid Component could be installed with it. That is future-facing access
            control, not a recall of anything already downloaded. What a refunded customer
            may continue to do with Source Code they already have is a license question:{" "}
            <Link href={legalRoutes.refund} className={link}>
              Refund Policy
            </Link>{" "}
            and{" "}
            <Link href={legalRoutes.license} className={link}>
              Source-Code License
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    id: "changes-to-services",
    heading: "Changes to the Services",
    blocks: [
      {
        kind: "p",
        body: `${product.productName} is actively developed. We add, change, rename, deprecate, and occasionally remove Components, documentation, and features. We do not promise that any particular Component, API, or page will remain available or unchanged. Version history and breaking-change flags are published on the updates page.`,
      },
    ],
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    blocks: [
      {
        kind: "p",
        body: "The Services and the Components are provided \"as is\" and \"as available\". To the fullest extent the law allows, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.",
      },
      {
        kind: "p",
        body: "Specifically, and honestly:",
      },
      {
        kind: "ul",
        items: [
          "We do not promise the Website or registry will be uninterrupted, timely, or error-free.",
          "We do not promise the Components are free of defects.",
          "We do not promise compatibility with any particular version of React, Next.js, Tailwind CSS, shadcn/ui, a bundler, or a browser. Documented dependency expectations are a description of what we test against, not a guarantee.",
          "Accessibility and reduced-motion support are engineering standards we hold ourselves to and test for. They are a design goal and a documented internal baseline, not a warranty of conformance with WCAG or with any accessibility law. You remain responsible for testing accessibility in your own product.",
          "We do not promise that the Services are secure against every attack. We take reasonable measures; no system is perfectly secure.",
        ],
      },
      {
        kind: "p",
        body: (
          <>
            Some jurisdictions do not allow certain warranty exclusions, in which case parts
            of this section may not apply to you. The enforceable form of this section needs
            professional drafting. <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            To the fullest extent the law allows, we are not liable for indirect, incidental,
            special, consequential, or punitive damages, or for lost profits, lost revenue,
            or lost or corrupted data, arising out of your use of the Services or the
            Components.
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            Our total liability to you, across all claims, is capped at the greater of the
            amount you paid us in the twelve months before the claim, or USD 100. For almost
            everyone that first figure is zero, which is why the second exists: a cap of
            nothing at all would be a term worth nothing to you. <Review />
          </>
        ),
      },
      {
        kind: "p",
        body: "Nothing here excludes liability that cannot lawfully be excluded — for example for death or personal injury caused by negligence, or for fraud.",
      },
      {
        kind: "p",
        body: "We do not require an indemnity from you. You are responsible for what you build, and we are not asking you to underwrite our legal costs on top of that.",
      },
    ],
  },
  {
    id: "governing-law",
    heading: "Governing law and disputes",
    blocks: [
      {
        kind: "p",
        body: jurisdictionResolved ? (
          <>
            These Terms are governed by {governingLawLabel}, and disputes will be resolved in{" "}
            {venueLabel}. <Review />
          </>
        ) : (
          <>
            These Terms do not specify a governing law or an exclusive venue, and none is
            being asserted against you. Either party may bring a claim in any court of
            competent jurisdiction. <Review />
          </>
        ),
      },
      {
        kind: "p",
        body: "If you are a consumer, mandatory consumer-protection rules in your country of residence may give you rights and forums that no contract term can take away.",
      },
    ],
  },
  {
    id: "changes-to-terms",
    heading: "Changes to these Terms",
    blocks: [
      {
        kind: "p",
        body: "We may update these Terms as the product changes. When we do, we will change the \"Last updated\" date at the top of this page and, for changes that materially affect your rights, we will publish a note in the repository's release notes.",
      },
      {
        kind: "p",
        body: (
          <>
            Because we operate no accounts and hold no mailing list, we cannot notify you
            individually, and we are not going to start collecting addresses in order to.
            Material changes are announced in the repository release notes; the
            &ldquo;Last updated&rdquo; date here always reflects the current text. Whether
            continued use after a change counts as acceptance is a question for counsel.{" "}
            <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "entity-details",
    heading: "Who you are contracting with",
    blocks: [
      {
        kind: "table",
        caption: "Provider identity details and their current status",
        head: ["Detail", "Value"],
        rows: [
          ["Product", product.productName],
          ["Copyright holder named in the repository license file", legal.copyrightHolder],
          ["Contracting party", entityLabel],
          [
            "Legal form",
            legal.isIncorporated
              ? "Registered company"
              : "Not incorporated — an individual trading under the Motiq name",
          ],
          ["Country of operation", jurisdictionResolved ? countryLabel : "Not published"],
          ["Registered or business address", addressLabel],
          ["Governing law", jurisdictionResolved ? governingLawLabel : "None specified"],
          ["Dispute venue", jurisdictionResolved ? venueLabel : "Any court of competent jurisdiction"],
        ],
      },
      {
        kind: "p",
        body: `The copyright holder above is verified from the repository's license file, and is the same person as the contracting party. Because ${product.productName} is a trading name rather than a company, it cannot itself be a party to this agreement.`,
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      intro={
        <>
          <p>
            These Terms cover the {product.productName} website, its documentation, and the
            public component registry that serves Components to the shadcn CLI. They are
            written in plain English and describe how {product.productName} actually works
            today: the entire catalog is free and open source, there is no checkout, and you
            need no account or credential to install anything.
          </p>
          <p>
            What you may do with Component Source Code after you install it is a separate
            question, answered by the{" "}
            <Link href={legalRoutes.license} className={link}>
              Source-Code License
            </Link>
            .
          </p>
        </>
      }
      sections={sections}
      related={relatedExcept(legalRoutes.terms, {
        [legalRoutes.license]: "what you may do with Component Source Code you install.",
        [legalRoutes.privacy]: "what data the Services process, and why.",
        [legalRoutes.refund]: "refunds — currently not applicable, since nothing is sold.",
        [legalRoutes.update]: "how new versions of Components are published and installed.",
        [legalRoutes.support]: "what help is available, through which channel.",
      })}
      contact={
        <>
          Formal legal notices should go to the legal address below. General questions about
          these Terms are usually answered faster in the public issue tracker, where the answer
          also helps the next person asking.
        </>
      }
    />
  );
}
