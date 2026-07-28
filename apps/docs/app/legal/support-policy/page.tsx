import type { Metadata } from "next";
import Link from "next/link";

import { product } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import {
  issuesUrl,
  legalRoutes,
  repoUrl,
  securityPolicyUrl,
  sponsorUrl,
  supportEmail,
} from "../../../lib/legal";
import { LegalDoc, relatedExcept, type LegalSection } from "../_doc";

export const metadata: Metadata = pageMetadata({
  title: "Support Policy",
  description: `Where to get help with ${product.productName}, what support covers, and why response times are best-effort targets rather than a service-level agreement.`,
  path: legalRoutes.support,
});

const link = "text-[var(--color-fg)] underline underline-offset-2";

const sections: LegalSection[] = [
  {
    id: "who",
    heading: "Who gets support",
    blocks: [
      {
        kind: "p",
        body: `Everyone, on the same terms. ${product.productName} is free and open source, there are no tiers, and support is not something you buy. Whether you have sponsored the project or never given it a penny, you use the same channel and get the same treatment.`,
      },
      {
        kind: "p",
        body: (
          <>
            Sponsors at some tiers are described on the{" "}
            <Link href="/sponsor" className={link}>
              sponsor page
            </Link>{" "}
            as receiving priority issue triage. That means your issue is more likely to be
            looked at sooner. It is a best-effort ordering preference, not a response-time
            commitment, and it does not buy a guaranteed fix, a feature, or roadmap control.
          </>
        ),
      },
    ],
  },
  {
    id: "channel",
    heading: "Where to ask",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            The{" "}
            <a href={issuesUrl} target="_blank" rel="noreferrer" className={link}>
              public issue tracker
            </a>{" "}
            is the main support channel, and the one to use by default. It has templates for
            bug reports and feature requests. Asking in public is deliberate: the answer stays
            searchable for the next person with the same problem.
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            If your problem genuinely cannot be described in public — because it involves
            private data, a security concern, or something commercially sensitive — email{" "}
            <a href={`mailto:${supportEmail}`} className={link}>
              {supportEmail}
            </a>
            . For everything else the issue tracker is faster and more useful, because the
            answer stays visible. There is no chat, forum, or phone line.
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            Support is provided in English. There are no published support hours: this is
            not a staffed desk, and issues are handled around other work rather than on a
            schedule. Expect weekdays more often than weekends, and nothing at all during
            the occasional quiet stretch.
          </>
        ),
      },
    ],
  },
  {
    id: "covered",
    heading: "What support covers",
    blocks: [
      {
        kind: "ul",
        items: [
          "Installation problems — the install command failing, a registry item not resolving, or files landing somewhere unexpected.",
          "Documentation questions — where the docs are unclear, wrong, or out of date, including a documented prop or behavior that does not match the shipped source.",
          "Reproducible defects — a Component behaving incorrectly, with steps or a minimal reproduction we can run.",
          "Accessibility issues — a keyboard trap, a missing or wrong ARIA relationship, a contrast failure, focus that goes somewhere unhelpful, or reduced-motion handling that does not do what it should. These are treated as defects, not enhancements.",
          "Motion and animation problems in a Component as shipped, including animation that fails to pause or settle as documented.",
          "Regressions introduced by an update we published.",
        ],
      },
      {
        kind: "p",
        body: (
          <>
            Security problems should not be filed as ordinary issues. Report them privately
            through the{" "}
            <a href={securityPolicyUrl} target="_blank" rel="noreferrer" className={link}>
              security policy
            </a>
            .
          </>
        ),
      },
    ],
  },
  {
    id: "not-covered",
    heading: "What support does not cover",
    blocks: [
      {
        kind: "ul",
        items: [
          "Custom development — building a new component, a variant, or a feature for your specific need.",
          "Design customization — restyling a Component to match your brand, or adapting its layout.",
          "Debugging your application — problems in your own code, state management, data layer, or build configuration that happen to involve one of our Components.",
          "Framework migration — moving your project between React versions, routers, bundlers, or CSS frameworks.",
          "Third-party dependency problems — issues in Motion, Radix UI, React, Next.js, Tailwind CSS, shadcn/ui, or your hosting provider. Report those to their maintainers. We will point you in the right direction where we can.",
          "Heavily modified Source Code — once you have changed a Component substantially it is your code, and we may not be able to help beyond general advice.",
          "Deployment, hosting, and infrastructure questions unrelated to the Components themselves.",
        ],
      },
      {
        kind: "p",
        body: "None of that is offered as a paid service either — there is no consulting arm, no paid integration help, and no commercial support contract behind this project. If you need that level of help, you need a contractor, and we would rather say so than let you wait on us.",
      },
    ],
  },
  {
    id: "response",
    heading: "Response targets, not guarantees",
    blocks: [
      {
        kind: "p",
        body: `${product.productName} is maintained independently, alongside other work. We read every issue and aim to respond to clear, reproducible reports within a reasonable time.`,
      },
      {
        kind: "note",
        title: "There is no service-level agreement",
        body: "No response time or resolution time is guaranteed, for anyone, at any tier, including sponsors. Nothing on this page or elsewhere on the Website creates an SLA. Any timing figure we publish in future would be a target we aim at, not a contractual commitment — and a real SLA would require an explicit, separately agreed arrangement.",
      },
      {
        kind: "p",
        body: "We publish no numeric first-response target, because a number we miss is worse than an honest \"best effort\". If that changes, any figure we publish will be labelled as a target and will still not be an SLA unless a separate agreement says so.",
      },
      {
        kind: "p",
        body: "We may close issues that are inactive, out of scope, duplicated, or that we have decided not to pursue. Closing an issue is a decision about our roadmap, not a judgment about you.",
      },
    ],
  },
  {
    id: "good-report",
    heading: "How to get help faster",
    blocks: [
      {
        kind: "p",
        body: "A report we can reproduce gets fixed. A report we cannot reproduce usually does not. Please include:",
      },
      {
        kind: "ul",
        items: [
          "The Component name and the version you installed, plus the date if you are unsure of the version.",
          "What you expected to happen, and what actually happened.",
          "A minimal reproduction — a small repository or sandbox is ideal; exact steps are the next best thing.",
          "Your React, Next.js (or other framework), Tailwind CSS, and Motion versions, plus your browser and operating system.",
          "Whether you modified the Source Code, and how.",
          "The exact error text or console output, with any secrets or tokens removed. Please never paste an API key, token, or credential into a public issue.",
        ],
      },
      {
        kind: "p",
        body: "For accessibility reports, tell us which assistive technology or interaction you used and what the expected behavior was — that context is usually the difference between a fix and a guess.",
      },
    ],
  },
  {
    id: "quality-baseline",
    heading: "The quality baseline behind support",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            Independent of support, the project holds itself to a published internal standard:
            WCAG 2.2 AA is treated as a release blocker, Components are expected to be
            keyboard operable with visible focus, to respect{" "}
            <code>prefers-reduced-motion</code> by settling to their final state, and to come
            with documentation and a live preview. Automated accessibility checks run in the
            test suite alongside manual review.
          </>
        ),
      },
      {
        kind: "p",
        body: "That is a design goal and an engineering standard we work to — it is not a warranty of conformance with WCAG or with any accessibility law, and it does not relieve you of testing accessibility in your own product. Where a Component falls short of it, that is a defect and we want the report.",
      },
    ],
  },
  {
    id: "conduct",
    heading: "Conduct",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            The issue tracker is governed by the repository&apos;s{" "}
            <a
              href={`${repoUrl}/blob/main/CODE_OF_CONDUCT.md`}
              target="_blank"
              rel="noreferrer"
              className={link}
            >
              code of conduct
            </a>
            . Be civil. Abusive, harassing, or discriminatory behavior ends the conversation
            and may end your access to the tracker.
          </>
        ),
      },
      {
        kind: "p",
        body: "Demanding, entitled, or repeated-escalation behavior is not a fast track. Free and open source cuts both ways: you owe nothing, and neither do we.",
      },
      {
        kind: "p",
        body: (
          <>
            If you want to make the project more sustainable, contributing a fix or{" "}
            <a href={sponsorUrl} target="_blank" rel="noreferrer" className={link}>
              sponsoring it
            </a>{" "}
            both help — neither is required, and neither buys a different answer.
          </>
        ),
      },
    ],
  },
];

export default function SupportPolicyPage() {
  return (
    <LegalDoc
      intro={
        <>
          <p>
            Support for {product.productName} runs through one place: the public issue
            tracker. Everyone gets the same access to it, and everything below applies equally
            whether or not you have ever paid us anything — which, since nothing is for sale,
            most people have not.
          </p>
          <p>
            This page is specific about what we help with, what we do not, and why no
            response time here is a guarantee.
          </p>
        </>
      }
      sections={sections}
      related={relatedExcept(legalRoutes.support, {
        [legalRoutes.terms]: "the rules for using the Services, and the disclaimers that apply.",
        [legalRoutes.update]: "how releases and breaking changes are published.",
        [legalRoutes.license]: "what you may do with the Source Code you are asking about.",
        [legalRoutes.privacy]: "what a support submission collects, and how to report security issues.",
        [legalRoutes.refund]: "refunds — currently not applicable, since nothing is sold.",
      })}
      contact={
        <>
          Open an issue in the{" "}
          <a href={issuesUrl} target="_blank" rel="noreferrer" className={link}>
            issue tracker
          </a>{" "}
          — it is the fastest route. Use the email address below only when the problem cannot
          be described in public.
        </>
      }
    />
  );
}
