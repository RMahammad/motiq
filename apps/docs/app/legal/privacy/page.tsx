import type { Metadata } from "next";
import Link from "next/link";

import { product, commerce } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import {
  countryLabel,
  entityLabel,
  jurisdictionResolved,
  hosting,
  issuesUrl,
  legalRoutes,
  privacyEmail,
  processors,
  retention,
  securityPolicyUrl,
  sponsorUrl,
} from "../../../lib/legal";
import { LegalDoc, Review, relatedExcept, type LegalSection } from "../_doc";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `What data ${product.productName} actually processes: no accounts, no cookies, no third-party analytics SDK, and one browser storage key for your theme preference.`,
  path: legalRoutes.privacy,
});

const link = "text-[var(--color-fg)] underline underline-offset-2";

const sections: LegalSection[] = [
  {
    id: "summary",
    heading: "The short version",
    blocks: [
      {
        kind: "p",
        body: `${product.productName} is built to need as little of your data as possible, and this policy describes what the code actually does rather than what we intend to do later.`,
      },
      {
        kind: "ul",
        items: [
          "There are no user accounts. You cannot sign up, and we hold no account records.",
          "The Website sets no cookies and loads no third-party analytics, advertising, or tracking script.",
          "Product analytics is currently a development-only logger: events are written to your own browser console and a short in-memory list. Nothing is transmitted to us or to any analytics vendor.",
          "One key is written to your browser's local storage: your light/dark theme preference. It never leaves your device.",
          "Installing a Component requires no credential and creates no record on our side beyond the ordinary server logs kept by our hosting and CDN providers.",
        ],
      },
      {
        kind: "p",
        body: "That said, this is not a \"we process no personal data\" policy. Serving a website necessarily involves IP addresses reaching a hosting provider, and if you contact us through the public issue tracker, GitHub processes your data. Those flows are described below.",
      },
    ],
  },
  {
    id: "controller",
    heading: "Who is responsible for your data",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            The controller responsible for the processing described here is{" "}
            <span className="text-[var(--color-fg)]">{entityLabel}</span>
            {jurisdictionResolved ? `, operating from ${countryLabel}` : ""}.{" "}
            {product.productName} is a trading name rather than a registered company, so the
            controller is an individual, not a corporate entity. <Review />
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            {product.productName} is used worldwide, and this policy is written to the
            stricter standard rather than the minimum: it describes every category of data
            processed, names every processor, states retention periods, and offers access and
            deletion rights to everyone who asks — regardless of which regime formally applies
            to them. Exactly which of the GDPR, UK GDPR, or CCPA/CPRA binds us is a question
            for counsel, and it does not change what is written above. <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "what-we-collect",
    heading: "What data is processed, and where it goes",
    blocks: [
      {
        kind: "table",
        caption: "Data categories processed by Motiq, with their source and destination",
        head: ["Category", "What it is", "Where it goes"],
        rows: [
          [
            "Theme preference",
            "A single browser local-storage entry recording whether you chose the light or dark theme.",
            "Stays in your browser. Never sent to us.",
          ],
          [
            "Product analytics events",
            "A fixed allowlist of product events (page views, catalog searches, category filters, preview opens, install-command copies and similar) with small non-sensitive properties such as a component slug or a category name.",
            "Written to your browser console and an in-memory list in the current tab only. No analytics provider is configured, no SDK is bundled, and no network request is made.",
          ],
          [
            "Web server logs",
            "The ordinary request records any web host keeps: IP address, timestamp, requested URL, user agent, referrer.",
            `Held by ${hosting.provider} and ${hosting.edgeProvider} under their own retention rules.`,
          ],
          [
            "Support correspondence",
            "Whatever you choose to put in a support email: your email address and the content of your message, including any logs you paste.",
            `Held by us and deleted after ${retention.supportMonths} months at the latest, or sooner on request. Not forwarded to a third-party helpdesk.`,
          ],
          [
            "Issue tracker correspondence",
            "Whatever you write in a GitHub issue, discussion, or pull request, plus your GitHub account identity.",
            "GitHub, under GitHub's own privacy statement.",
          ],
          [
            "Sponsorship data",
            "If you sponsor the project, your payment and contact details.",
            "Collected by Ko-fi on its own platform. We never see or store your card details. We may see the sponsor name and tier you choose to make public.",
          ],
        ],
      },
      {
        kind: "note",
        title: "What is never captured",
        body: "The analytics allowlist is enforced in code: an event that is not on the list is dropped. Component source code, secrets, access tokens, API keys, request or response bodies, HTTP headers, and the text of your search queries are never recorded as analytics data. If you paste logs into a support email, please remove any credentials first — we cannot strip them before they reach the inbox.",
      },
    ],
  },
  {
    id: "registry-logging",
    heading: "Registry and installation logging",
    blocks: [
      {
        kind: "p",
        body: "When you install a Component, the shadcn CLI fetches a static JSON file from the public registry path. No credential is sent, no entitlement is checked, and we create no per-user record. The only trace is the hosting provider's ordinary access log entry for that file.",
      },
      {
        kind: "p",
        body: "The codebase also contains an entitlement-aware registry endpoint that would apply to access-controlled delivery. It is not the path the published install commands use, and no Component requires it today. If it is used, it writes an audit record containing the item name, a timestamp, the request's user agent, and — where a credential is present — a token identifier. It never records the token itself, the source code served, or a raw IP address; IP addresses are hashed in memory for rate limiting only and are not persisted.",
      },
      {
        kind: "p",
        body: (
          <>
            Because that endpoint is not the one the published install commands use, no such
            audit records are being created in normal operation. Any that do exist are deleted
            after {retention.supportMonths} months, on the same schedule as support tickets.
          </>
        ),
      },
    ],
  },
  {
    id: "cookies",
    heading: "Cookies and browser storage",
    blocks: [
      {
        kind: "p",
        body: "The Website sets no cookies. It loads no third-party fonts, tag managers, advertising pixels, session-replay tools, or fingerprinting scripts.",
      },
      {
        kind: "p",
        body: "The only browser storage the Website writes is a single local-storage entry named \"theme\", holding the value \"light\" or \"dark\". It exists so the site does not flash the wrong theme when you return, it contains no identifier, and you can clear it at any time through your browser settings.",
      },
      {
        kind: "p",
        body: "Because there is no tracking technology to consent to, the Website shows no cookie banner. If an analytics or advertising provider is ever added, a consent mechanism must be assessed and implemented before it goes live.",
      },
      {
        kind: "p",
        body: (
          <>
            We have no plan to adopt a third-party analytics vendor. If that changes, the
            change is material: this policy would be updated and any required consent
            mechanism put in place before the vendor went live, not afterwards.
          </>
        ),
      },
    ],
  },
  {
    id: "purposes",
    heading: "Why the data is processed",
    blocks: [
      {
        kind: "ul",
        items: [
          "To serve the Website and the registry, and to keep them available and secure — this is why a hosting provider logs requests.",
          "To understand which parts of the catalog are useful, in aggregate, so we know what to build and document next.",
          "To answer your support requests, reproduce reported defects, and fix them.",
          "To recognize sponsors who have chosen to be recognized publicly.",
        ],
      },
      {
        kind: "p",
        body: "Your data is not sold, not shared with advertisers, not used to build a profile of you, and not combined across sources to identify you.",
      },
      {
        kind: "p",
        body: (
          <>
            The lawful basis for each purpose (for example legitimate interests for security
            logging, or consent for optional analytics) must be stated once the applicable
            regime is settled. <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "processors",
    heading: "Service providers",
    blocks: [
      {
        kind: "p",
        body: "This table lists only parties verified in the repository or its configuration. Nothing has been added speculatively.",
      },
      {
        kind: "table",
        caption: "Third parties that may process personal data on Motiq's behalf or alongside it",
        head: ["Provider", "Role", "What reaches them"],
        rows: processors.map((p) => [p.name, p.role, p.data]),
      },
      {
        kind: "p",
        body: `The Website is served by ${hosting.provider} from its ${hosting.regionLabel} region, behind ${hosting.edgeProvider} as CDN and reverse proxy. Both keep their own request logs under their own retention schedules, which we do not control. Neither sets a cookie on our responses.`,
      },
      {
        kind: "p",
        body: (
          <>
            No email provider, analytics vendor, error-monitoring service, payment processor,
            or helpdesk is integrated today; each of those integration points falls back to a
            local development logger and sends nothing. If one is added, this table must be
            updated before it goes live.
          </>
        ),
      },
    ],
  },
  {
    id: "transfers",
    heading: "International transfers",
    blocks: [
      {
        kind: "p",
        body: "The providers above operate internationally, so data reaching them may be processed outside your country — including in the United States.",
      },
      {
        kind: "p",
        body: (
          <>
            In concrete terms: the Website is served from {hosting.regionLabel} inside the
            EU, but {hosting.edgeProvider} routes requests through whichever edge location is
            nearest you, and {hosting.provider}, GitHub, and Ko-fi are all US-headquartered
            companies that may process data in the United States. Which formal transfer
            safeguard applies depends on the governing-law question still open in the{" "}
            <Link href={legalRoutes.terms} className={link}>
              Terms of Service
            </Link>
            . <Review />
          </>
        ),
      },
    ],
  },
  {
    id: "retention",
    heading: "How long data is kept",
    blocks: [
      {
        kind: "ul",
        items: [
          "Theme preference: until you clear your browser storage. We have no copy.",
          "Analytics events: for the life of the current page session, in memory, capped at the most recent 200 events. They are not persisted anywhere.",
          "Feedback submissions: in server memory only, capped at the most recent 500 entries, and lost whenever the server restarts.",
          "Support tickets: written to a server-side file store with no automatic deletion today.",
          "Web server logs: retained by the hosting provider under its own schedule, which we do not currently control or publish.",
        ],
      },
      {
        kind: "p",
        body: (
          <>
            Where we control the data, we delete it after {retention.supportMonths} months
            at the latest, and sooner on request. Where a provider controls it — hosting and
            CDN logs, GitHub, Ko-fi — their schedule applies and you should ask them directly.
          </>
        ),
      },
    ],
  },
  {
    id: "security",
    heading: "Security",
    blocks: [
      {
        kind: "p",
        body: "We take reasonable measures for a project of this size: the amount of personal data collected is deliberately minimal, the support form redacts token-like strings before storage, the registry endpoint applies rate limits and fails closed on an unreadable store, and access decisions never return source code in a denied response.",
      },
      {
        kind: "p",
        body: (
          <>
            We do not claim the Services are completely secure. No system is. If you find a
            security problem, report it privately through the{" "}
            <a href={securityPolicyUrl} target="_blank" rel="noreferrer" className={link}>
              security policy
            </a>{" "}
            rather than in a public issue, and please give us a chance to publish a fix before
            disclosing it.
          </>
        ),
      },
    ],
  },
  {
    id: "your-rights",
    heading: "Your rights",
    blocks: [
      {
        kind: "p",
        body: "Depending on where you live, you may have rights to access, correct, delete, restrict, object to, or port the personal data an organization holds about you.",
      },
      {
        kind: "p",
        body: "In practice, we hold very little that is about you: there is no account to delete, no marketing list to leave, and no analytics profile to export. If you have submitted a support ticket, we can delete it on request. Data you have placed on GitHub or Ko-fi is held by those platforms, and their own tools and policies govern it.",
      },
      {
        kind: "p",
        body: (
          <>
            To make a request, email{" "}
            <a href={`mailto:${privacyEmail}`} className={link}>
              {privacyEmail}
            </a>
            . There is no separate privacy inbox — privacy requests and legal notices share one
            monitored address. Please describe what you are asking for and what data it
            concerns.
          </>
        ),
      },
      {
        kind: "p",
        body: `We will respond within ${retention.dataRequestDays} days. Because there are no accounts, we usually cannot verify who you are from our own records, so we may ask you to prove control of the address or account the data relates to — for example by replying from the email address you used, or from the GitHub account that filed the issue. We will not ask for identity documents.`,
      },
      {
        kind: "p",
        body: "If we cannot connect a request to any data we actually hold, we will tell you that rather than ask you for more information to search with.",
      },
    ],
  },
  {
    id: "children",
    heading: "Children's privacy",
    blocks: [
      {
        kind: "p",
        body: `${product.productName} is a developer tool and is not directed at children. We do not knowingly collect personal data from children.`,
      },
      {
        kind: "p",
        body: "If you believe a child has sent us personal data — most likely through a support email or an issue — tell us and we will delete it.",
      },
    ],
  },
  {
    id: "future-changes",
    heading: "If this changes",
    blocks: [
      {
        kind: "p",
        body: "The configuration in this repository records the current analytics provider as a development logger and the checkout provider as none. If either changes — if a real analytics vendor is wired up, or a payment processor is integrated — new categories of personal data will be processed, and this policy must be updated, with any required consent mechanism in place, before that goes live.",
      },
      {
        kind: "p",
        body: `Current configuration: analytics provider "${commerce.analyticsProvider}", checkout provider "${commerce.checkoutProvider}", private registry ${commerce.privateRegistryEnabled ? "enabled" : "disabled"}.`,
      },
      {
        kind: "p",
        body: "When this policy changes we will update the \"Last updated\" date at the top of this page.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      intro={
        <>
          <p>
            This policy explains what happens to data when you use {product.productName}. It
            is written from what the code does, not from a template: every claim below was
            checked against the repository, and where the answer is &ldquo;nobody has decided
            yet&rdquo;, it says so.
          </p>
          <p>
            The short answer is that {product.productName} collects remarkably little — but
            not nothing, and this policy is specific about the difference.
          </p>
        </>
      }
      sections={sections}
      related={relatedExcept(legalRoutes.privacy, {
        [legalRoutes.terms]: "the rules for using the Website and registry.",
        [legalRoutes.license]: "what you may do with Component Source Code.",
        [legalRoutes.support]: "what the support form collects and how requests are handled.",
        [legalRoutes.refund]: "refunds — currently not applicable, since nothing is sold.",
        [legalRoutes.update]: "how new Component versions are published.",
      })}
      contact={
        <>
          Send privacy questions and data-subject requests to the privacy address below, not to
          the public{" "}
          <a href={issuesUrl} target="_blank" rel="noreferrer" className={link}>
            issue tracker
          </a>{" "}
          — please never post personal data in a public issue. Sponsorship data is handled by{" "}
          <a href={sponsorUrl} target="_blank" rel="noreferrer" className={link}>
            Ko-fi
          </a>
          , and issue-tracker data by GitHub; contact them directly for data they hold. See
          also the{" "}
          <Link href={legalRoutes.terms} className={link}>
            Terms of Service
          </Link>
          .
        </>
      }
    />
  );
}
