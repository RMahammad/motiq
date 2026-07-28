import type { Metadata } from "next";
import Link from "next/link";

import { product } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import { legalRoutes, repoUrl, sellsPaidProducts } from "../../../lib/legal";
import { LegalDoc, relatedExcept, type LegalSection } from "../_doc";

export const metadata: Metadata = pageMetadata({
  title: "Update Policy",
  description: `How ${product.productName} publishes new Component versions, how installing an update interacts with your edits, and what is — and is not — promised about future releases.`,
  path: legalRoutes.update,
});

const link = "text-[var(--color-fg)] underline underline-offset-2";

const sections: LegalSection[] = [
  {
    id: "two-questions",
    heading: "Two different questions",
    blocks: [
      {
        kind: "p",
        body: "People usually mean one of two things by \"updates\", and the answers are different:",
      },
      {
        kind: "ol",
        items: [
          <>
            <span className="text-[var(--color-fg)]">
              Can I keep using the version I already have?
            </span>{" "}
            Yes, permanently. Source Code in your project is yours under an irrevocable{" "}
            <Link href={legalRoutes.license} className={link}>
              MIT grant
            </Link>
            . It does not expire and cannot be withdrawn.
          </>,
          <>
            <span className="text-[var(--color-fg)]">Will I get future versions?</span> You
            can install any version we publish, for as long as we publish it and the registry
            is available — there is no paywall, window, or renewal. What we do{" "}
            <em>not</em> promise is that we will keep publishing.
          </>,
        ],
      },
    ],
  },
  {
    id: "what-updates-are",
    heading: "What counts as an update",
    blocks: [
      {
        kind: "ul",
        items: [
          "Defect fixes — corrections to behavior, accessibility issues, or motion handling in an existing Component.",
          "Refinements — visual, API, or performance improvements that do not break existing usage.",
          "Breaking changes — API or markup changes that require you to adjust your code.",
          "New Components added to the catalog, including new items in an existing category or pack.",
          "Documentation and preview improvements, which change nothing in your project.",
        ],
      },
      {
        kind: "p",
        body: `Because the entire catalog is free, all of these are available to everyone on the same terms. There is no separate tier that receives fixes earlier, and no newly released Component is withheld from anyone.`,
      },
      {
        kind: "p",
        body: sellsPaidProducts
          ? "Whether a newly released item is included in an existing purchase is stated at the point of sale."
          : "If separately sold products are ever introduced, whether a new Component falls inside an existing purchase or is sold separately becomes a real question. It is not one today.",
      },
    ],
  },
  {
    id: "how-updates-work",
    heading: "How you install an update — and what happens to your edits",
    blocks: [
      {
        kind: "p",
        body: "Updates are pull, not push. Nothing in your project checks for a new version, and nothing is installed without you running a command. You update a Component by running the same install command again.",
      },
      {
        kind: "note",
        title: "Re-installing overwrites files",
        body: "The install command writes the Component's files to the same paths in your project. Where a file already exists, the CLI will ask whether to overwrite it — and if you say yes, the new version replaces that file completely. Any changes you made to it are gone. This is how source-first delivery works; there is no merge step, and we cannot preserve your edits for you.",
      },
      {
        kind: "p",
        body: "In practice this means: commit before you update, review the diff your version control shows you, and re-apply your changes deliberately. If you have heavily customized a Component, treating the update as a reference to read rather than a file to overwrite is often the better move.",
      },
    ],
  },
  {
    id: "versioning",
    heading: "Versioning and breaking changes",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            Releases are recorded in a version table published on the{" "}
            <Link href="/updates" className={link}>
              updates page
            </Link>
            , with a version number, a release date, a changelog, and an explicit
            breaking-change flag. Where a release is breaking, we aim to publish migration
            guidance alongside it.
          </>
        ),
      },
      {
        kind: "p",
        body: "Version numbers are semantic-versioning-shaped, and we use semantic versioning as our working convention. We do not, however, promise strict semantic-versioning guarantees: the catalog is pre-1.0, which under semantic versioning itself means breaking changes may land in any release. Read the breaking-change flag rather than inferring safety from the version number.",
      },
      {
        kind: "p",
        body: "We will commit to strict semantic versioning when the catalog reaches 1.0, and this page will say so plainly at that point. Until then, treat every release as potentially breaking and check the flag.",
      },
    ],
  },
  {
    id: "no-commitment",
    heading: "What is not promised",
    blocks: [
      {
        kind: "p",
        body: "Being free is not the same as being maintained forever, and this policy will not blur the two.",
      },
      {
        kind: "ul",
        items: [
          "We do not promise lifetime updates, perpetual maintenance, or that any particular Component will continue to receive fixes.",
          "We do not promise a release schedule, a support window for older versions, or a deprecation notice period.",
          "We do not promise that a Component will keep working with future versions of React, Next.js, Tailwind CSS, shadcn/ui, or any browser. Where documentation states a supported version range, it describes what we test against at that moment.",
          "We do not promise that the registry, the Website, or the catalog will remain available.",
          "Components may be renamed, restructured, deprecated, or removed from the catalog.",
        ],
      },
      {
        kind: "p",
        body: (
          <>
            None of that affects Source Code you have already installed, which keeps working
            in your project regardless of what happens to ours. It is also why keeping your
            own copy in version control matters more here than with a versioned package
            dependency.
          </>
        ),
      },
      {
        kind: "p",
        body: "We publish no deprecation notice period and no compatibility support window while the catalog is pre-1.0 — committing to one we could not keep would be worse than saying this. In practice we will flag a removal in the release notes rather than delete something silently, but that is how we intend to work, not a term you can hold us to.",
      },
    ],
  },
  {
    id: "notifications",
    heading: "How you find out about updates",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            There is no notification system: we operate no accounts and hold no mailing list,
            so we have no way to contact you. To follow releases, watch the{" "}
            <a href={repoUrl} target="_blank" rel="noreferrer" className={link}>
              repository
            </a>{" "}
            or check the{" "}
            <Link href="/updates" className={link}>
              updates page
            </Link>
            .
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            Whether to add a release feed, changelog subscription, or notification channel is
            repository releases are the notification channel. We do not run a mailing list
            and do not plan to: it would mean collecting email addresses this project
            otherwise has no reason to hold.
          </>
        ),
      },
    ],
  },
  {
    id: "your-responsibility",
    heading: "Your responsibility",
    blocks: [
      {
        kind: "p",
        body: "Deciding whether, when, and how to adopt an update is yours. That includes reading the changelog and breaking-change flag, testing the update in your own application, re-applying your customizations, and verifying accessibility and behavior in your finished product.",
      },
      {
        kind: "p",
        body: "We can tell you what changed. We cannot know what you built on top of it.",
      },
    ],
  },
  {
    id: "if-paid",
    heading: "If that ever changes",
    blocks: [
      {
        kind: "p",
        body: "Update duration only becomes a question when access can be gated, which it currently cannot — every version is public. If a paid product is ever offered, its update terms would be stated before you bought it.",
      },
      {
        kind: "p",
        body: "One commitment holds regardless, and it is the one that matters: losing access to future updates could never affect your right to keep using Source Code already in your project. That right comes from an irrevocable MIT grant, not from a subscription.",
      },
    ],
  },
];

export default function UpdatePolicyPage() {
  return (
    <LegalDoc
      intro={
        <>
          <p>
            {product.productName} Components are copied into your project as source. That
            makes updates unusually simple in one way — nothing can change under you — and
            unusually blunt in another: installing an update overwrites the file, including
            any edits you made to it.
          </p>
          <p>
            This page explains how versions are published, what installing an update actually
            does, and what we do and do not commit to.
          </p>
        </>
      }
      sections={sections}
      related={relatedExcept(legalRoutes.update, {
        [legalRoutes.license]: "why the version you already have is yours permanently.",
        [legalRoutes.terms]: "our right to change the Services, and the disclaimers that apply.",
        [legalRoutes.support]: "what help is available when an update breaks something.",
        [legalRoutes.refund]: "refunds — currently not applicable, since nothing is sold.",
        [legalRoutes.privacy]: "what data an install involves.",
      })}
      contact={
        <>
          Questions about a specific release, a breaking change, or a migration are best
          raised in the issue tracker, ideally with the version you are moving from and to.
        </>
      }
    />
  );
}
