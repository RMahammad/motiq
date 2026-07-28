import type { Metadata } from "next";
import Link from "next/link";

import { product } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import {
  legal,
  legalRoutes,
  privateRegistryLive,
  repoUrl,
  sellsPaidProducts,
} from "../../../lib/legal";
import { LegalDoc, relatedExcept, type LegalSection } from "../_doc";

export const metadata: Metadata = pageMetadata({
  title: "Source-Code License",
  description: `Every ${product.productName} Component is MIT-licensed: use it in commercial products, client work, and open-source projects, modify it freely, and keep it forever.`,
  path: legalRoutes.license,
});

const link = "text-[var(--color-fg)] underline underline-offset-2";
const licenseFileUrl = `${repoUrl}/blob/main/LICENSE`;

const sections: LegalSection[] = [
  {
    id: "grant",
    heading: "The license: MIT",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            Every Component in the {product.productName} catalog is Free Component Source Code
            released under the{" "}
            <a href={licenseFileUrl} target="_blank" rel="noreferrer" className={link}>
              MIT License
            </a>
            , copyright {legal.copyrightYear} {legal.copyrightHolder}. That license file in
            the repository is the operative legal text. This page explains it in plain English
            and describes how delivery works; where the two ever differ, the MIT license text
            controls.
          </>
        ),
      },
      {
        kind: "p",
        body: "MIT is a permissive license. It grants you the right to use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the Source Code, with one condition: the copyright notice and the permission notice must be included in all copies or substantial portions of the Source Code.",
      },
      {
        kind: "note",
        title: "There is no separate paid license",
        body: sellsPaidProducts
          ? "Paid products exist; their licensing terms are stated at the point of sale."
          : `${product.productName} currently sells nothing and offers no Paid Components. There is no second, more restrictive license operating alongside MIT. If paid products are introduced later, they will need their own license terms, and this page will say so explicitly.`,
      },
    ],
  },
  {
    id: "what-you-can-do",
    heading: "What you may do",
    blocks: [
      { kind: "h3", body: "Commercial and personal use" },
      {
        kind: "p",
        body: "You may use the Source Code in commercial products, in products you sell, in internal company tools, in side projects, and in anything you build for yourself. No attribution beyond the MIT notice is required, and no payment is required.",
      },
      { kind: "h3", body: "Client work and agencies" },
      {
        kind: "p",
        body: "You may use the Source Code in projects you build for clients, and you may hand the resulting project — including the Component Source Code inside it — to the client. Your client receives it on the same MIT terms. No agency tier, seat purchase, or per-client license is required.",
      },
      { kind: "h3", body: "Modification" },
      {
        kind: "p",
        body: "You may modify the Source Code however you like. That is the point of the delivery model: the Source Code is copied into your repository and becomes ordinary code in your project, which you own and control. Modified copies still carry the MIT notice obligation.",
      },
      { kind: "h3", body: "Teams and organizations" },
      {
        kind: "p",
        body: `There are no seats to count and no per-developer license. Anyone in your Organization may install and use ${product.productName} Components. We do not implement organization accounts, seat allocation, or shared entitlements, and under MIT there is nothing for them to gate.`,
      },
      { kind: "h3", body: "End products" },
      {
        kind: "p",
        body: "There is no limit on how many end products you ship, and no distinction between a compiled bundle and the Source Code for licensing purposes. Both are permitted.",
      },
      { kind: "h3", body: "Open-source projects" },
      {
        kind: "p",
        body: "You may include the Source Code in an open-source project, provided you keep the MIT copyright and permission notice with it. MIT is compatible with most open-source licenses; check compatibility with your own project's license if it is a copyleft license.",
      },
      { kind: "h3", body: "Redistribution, templates, and other component libraries" },
      {
        kind: "p",
        body: "MIT permits redistribution, sublicensing, and selling copies. That means you may, as a matter of license, publish the Source Code, include it in a template, boilerplate, theme, starter kit, UI kit, or no-code builder, or ship it inside your own component library — as long as the MIT copyright and permission notice travels with it.",
      },
      {
        kind: "note",
        title: "An honest note about repackaging",
        body: (
          <>
            We ask that you not simply rebrand the catalog and present it as your own work,
            and we would rather you contribute improvements back. That is a request, not a
            license restriction — the MIT grant as published does not prohibit it, and this
            page will not pretend otherwise. If we ever publish future releases under
            different terms, those terms would apply only to those releases: every version
            already released under MIT stays MIT, permanently.
          </>
        ),
      },
    ],
  },
  {
    id: "conditions",
    heading: "The one condition, and the disclaimer",
    blocks: [
      {
        kind: "p",
        body: "Keep the notice. When you copy or redistribute a substantial portion of the Source Code, the MIT copyright line and permission notice must come with it. In practice, most projects satisfy this by keeping a LICENSE file or a third-party notices file that credits the original.",
      },
      {
        kind: "p",
        body: "The MIT license also disclaims all warranties and all liability. The Source Code is provided \"as is\". We are not liable for any claim, damages, or other liability arising from it — including defects, accessibility gaps in your finished product, or breakage after you modify it.",
      },
    ],
  },
  {
    id: "delivery",
    heading: "How Source Code is delivered",
    blocks: [
      {
        kind: "p",
        body: "You install a Component by running the shadcn CLI against a public registry URL. The CLI fetches a JSON document describing the Component's files and writes those files into your project. There is no package to add as a dependency, no runtime license check, and no phone-home.",
      },
      {
        kind: "p",
        body: privateRegistryLive
          ? "Access-controlled delivery is enabled for items that require an Entitlement."
          : "No credential is required. The registry path serving the catalog is public and unauthenticated, and every published Component is served from it. The entitlement, Access Token, and audit machinery in the codebase is switched off and gates nothing today.",
      },
      {
        kind: "p",
        body: "Once the files are in your repository, they are yours. They do not expire, phone home, or stop working, and nothing we do on our side can reach into your project.",
      },
    ],
  },
  {
    id: "ownership",
    heading: "Ownership",
    blocks: [
      {
        kind: "ul",
        items: [
          <>
            <span className="text-[var(--color-fg)]">We own the original.</span> The
            copyright in the original {product.productName} Source Code, and in the{" "}
            {product.productName} name, brand, documentation, and site design, stays with the
            copyright holder. MIT grants you broad permission to use it; it does not transfer
            ownership.
          </>,
          <>
            <span className="text-[var(--color-fg)]">You own what you build.</span> The
            application you create, your modifications, your design work, and your business
            logic are yours. We claim no rights in them.
          </>,
        ],
      },
    ],
  },
  {
    id: "dependencies",
    heading: "Third-party dependencies",
    blocks: [
      {
        kind: "p",
        body: "Components rely on third-party packages that are not ours and are not covered by our license — most commonly the Motion animation library, several Radix UI primitives, and small utilities such as clsx and tailwind-merge. Each carries its own license, which applies to you directly.",
      },
      {
        kind: "p",
        body: "We do not, and cannot, grant you rights in those packages. Check their licenses if your project has license-compliance requirements.",
      },
    ],
  },
  {
    id: "duration",
    heading: "Duration and termination",
    blocks: [
      {
        kind: "p",
        body: "The MIT grant on a release you have received is perpetual and irrevocable as to that copy. It does not expire, and it is not tied to a subscription, an account, or continued access to the Website.",
      },
      {
        kind: "p",
        body: (
          <>
            Access to the Services is a separate matter and can be suspended for breach of the{" "}
            <Link href={legalRoutes.terms} className={link}>
              Terms of Service
            </Link>
            . Losing access to the Website would stop you downloading new Components; it would
            not terminate your license to Source Code you already have.
          </>
        ),
      },
      {
        kind: "p",
        body: (
          <>
            Continued access to <em>future</em> versions is governed by the{" "}
            <Link href={legalRoutes.update} className={link}>
              Update Policy
            </Link>
            . Nothing in that policy can remove a license you already hold under MIT.
          </>
        ),
      },
    ],
  },
  {
    id: "transfer",
    heading: "Transferability",
    blocks: [
      {
        kind: "p",
        body: "MIT rights travel with the copy. If you hand a project to a client, sell your company, or fork your repository, the recipient receives the same MIT rights in the Source Code inside it, subject to the same notice condition. There is no license to transfer to us, register with us, or re-purchase.",
      },
    ],
  },
  {
    id: "revocation-limits",
    heading: "What access control can and cannot do",
    blocks: [
      {
        kind: "p",
        body: "This section is here so nothing on this page can be read as a stronger technical claim than the software actually supports.",
      },
      {
        kind: "ul",
        items: [
          "Access controls — tokens, entitlement checks, rate limits, revocation — can only stop future downloads. They are ordinary access control, not digital rights management.",
          "Source Code that has already been downloaded into your repository cannot be recalled, disabled, or deleted by us. There is no kill switch, no license check at runtime, and no telemetry in the shipped Components.",
          "Any restriction on Source Code you already hold could only ever be a contractual promise, not something we could technically enforce. Under the MIT grant, no such restriction currently exists.",
        ],
      },
    ],
  },
  {
    id: "no-paid-tier",
    heading: "There is no paid tier",
    blocks: [
      {
        kind: "p",
        body: `Every Component in the ${product.productName} catalog is covered by the MIT grant described above. There are no Paid Components, no premium tier, no per-seat license, and no purchase that unlocks anything — because there is nothing locked.`,
      },
      {
        kind: "p",
        body: "If that ever changes, any paid offering would come with its own license terms, presented before you paid for it. It could not retroactively narrow this one: the MIT grant on every version already published is irrevocable.",
      },
    ],
  },
];

export default function LicensePage() {
  return (
    <LegalDoc
      intro={
        <>
          <p>
            Short version: every {product.productName} Component is MIT-licensed. Use it in
            commercial products, client work, and open-source projects. Modify it however you
            like. Keep the copyright notice. It is yours to keep, and nothing we do later can
            take it back.
          </p>
          <p>
            The rest of this page explains what that means in practice, how delivery works,
            and — honestly — the limits of what access control could ever do.
          </p>
        </>
      }
      sections={sections}
      related={relatedExcept(legalRoutes.license, {
        [legalRoutes.terms]: "the rules for using the Website and registry.",
        [legalRoutes.update]: "how future versions are published, and what you keep regardless.",
        [legalRoutes.refund]: "refunds — currently not applicable, since nothing is sold.",
        [legalRoutes.support]: "what help is available with the Source Code.",
        [legalRoutes.privacy]: "what data is processed when you install a Component.",
      })}
      contact={
        <>
          Licensing questions are best raised in the public issue tracker so that the answer
          helps the next person asking. The authoritative license text is the{" "}
          <a href={licenseFileUrl} target="_blank" rel="noreferrer" className={link}>
            LICENSE file
          </a>{" "}
          in the repository.
        </>
      }
    />
  );
}
