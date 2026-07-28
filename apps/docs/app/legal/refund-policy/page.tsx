import type { Metadata } from "next";
import Link from "next/link";

import { product } from "../../../lib/product";
import { pageMetadata } from "../../../lib/seo";
import { legalRoutes, sellsPaidProducts, sponsorUrl, supportEmail } from "../../../lib/legal";
import { LegalDoc, relatedExcept, type LegalSection } from "../_doc";

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description: `${product.productName} sells no products today, so there is nothing to refund. This page explains the current position and what a refund policy would have to settle before anything is sold.`,
  path: legalRoutes.refund,
});

const link = "text-[var(--color-fg)] underline underline-offset-2";

const sections: LegalSection[] = [
  {
    id: "current-position",
    heading: "The current position",
    blocks: [
      {
        kind: "p",
        body: sellsPaidProducts
          ? "Paid products are available; the terms below apply to them."
          : `${product.productName} does not sell anything. There is no checkout, no price is displayed, no payment method is collected by us, and the entire catalog is free to install. Because no Purchase can be made, there is nothing to refund and no refund window to miss.`,
      },
      {
        kind: "p",
        body: "This page exists anyway for two reasons: so the answer to \"what if I want my money back\" is written down rather than assumed, and so that the questions a real refund policy must answer are recorded before anything is ever sold.",
      },
    ],
  },
  {
    id: "sponsorship",
    heading: "Sponsorship contributions",
    blocks: [
      {
        kind: "p",
        body: (
          <>
            The one way money can currently change hands is voluntary sponsorship through{" "}
            <a href={sponsorUrl} target="_blank" rel="noreferrer" className={link}>
              Ko-fi
            </a>
            . Sponsorship is a contribution, not a Purchase: it buys no Components, no license
            rights, and no access you would not otherwise have. Everyone gets the full catalog
            either way.
          </>
        ),
      },
      {
        kind: "p",
        body: "Sponsorship payments are processed entirely on Ko-fi's platform. We do not operate that checkout, so refunds, cancellations, and payment disputes are handled under Ko-fi's terms and through Ko-fi's support — not here. You can cancel a recurring sponsorship at any time through your account on that platform.",
      },
      {
        kind: "p",
        body: (
          <>
            If you sponsored by mistake — a duplicate charge, the wrong tier, a subscription
            you meant to cancel — email{" "}
            <a href={`mailto:${supportEmail}`} className={link}>
              {supportEmail}
            </a>
            . We cannot process the refund ourselves, because the money never passes through
            us, but we will support your request with the platform rather than leave you to
            argue it alone. We would rather return a contribution than keep one somebody did
            not mean to make.
          </>
        ),
      },
      {
        kind: "p",
        body: "Sponsor recognition benefits, such as a name or logo listing, end when a recurring sponsorship ends. We will not backdate or claw back recognition for periods you already paid for.",
      },
    ],
  },
  {
    id: "not-returnable",
    heading: "Why source code is not \"returned\"",
    blocks: [
      {
        kind: "p",
        body: "This matters for any future refund policy, so it is worth stating plainly now.",
      },
      {
        kind: "p",
        body: "When you install a Component, its Source Code is copied into your repository. It becomes ordinary files in your project. There is no license key to deactivate, no runtime check to fail, and no mechanism by which we could remove those files, disable them, or verify that you deleted them.",
      },
      {
        kind: "p",
        body: "So no refund policy here will ever ask you to \"return\" Source Code, or claim that a refund revokes what is already on your machine. Access control can stop future downloads. It cannot reach backwards.",
      },
    ],
  },
  {
    id: "if-paid",
    heading: "If that ever changes",
    blocks: [
      {
        kind: "p",
        body: "Nothing here is a promise to stay free forever, and this policy will not pretend to be one. If a paid product is ever offered, it would come with its own refund terms, published before you could buy anything and written to the consumer-protection rules of the markets it is sold in.",
      },
      {
        kind: "p",
        body: "Two things would stay true regardless. A refund could stop future downloads through an access-controlled channel, and it could not reach Source Code already in your project. And your MIT rights in everything published up to that point would be unaffected — a later paid tier cannot retroactively put a price on what was already given away.",
      },
    ],
  },
  {
    id: "consistency",
    heading: "How this fits with the other policies",
    blocks: [
      {
        kind: "ul",
        items: [
          <>
            A refund could never revoke your{" "}
            <Link href={legalRoutes.license} className={link}>
              MIT license
            </Link>{" "}
            in Source Code you already hold, because that grant is irrevocable as to the copy
            you received.
          </>,
          <>
            A refund would end access to future{" "}
            <Link href={legalRoutes.update} className={link}>
              Updates
            </Link>{" "}
            delivered through an access-controlled channel — but the entire catalog is served
            publicly today, so there is no such channel to lose.
          </>,
          <>
            Termination for breach under the{" "}
            <Link href={legalRoutes.terms} className={link}>
              Terms of Service
            </Link>{" "}
            works the same way: it stops future access, and it does not reach Source Code you
            already have.
          </>,
        ],
      },
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalDoc
      intro={
        <>
          <p>
            Nothing is for sale, so there is nothing to refund. That is the whole policy
            today, and it will stay accurate for as long as the catalog is free.
          </p>
          <p>
            Below: how sponsorship contributions work, why source code is never
            &ldquo;returned&rdquo;, and the questions a real refund policy would have to
            answer first.
          </p>
        </>
      }
      sections={sections}
      related={relatedExcept(legalRoutes.refund, {
        [legalRoutes.terms]: "the rules for using the Website, and termination for breach.",
        [legalRoutes.license]: "why an irrevocable MIT grant cannot be clawed back.",
        [legalRoutes.update]: "what access to future versions means.",
        [legalRoutes.support]: "what to do when something is broken, before asking for money back.",
        [legalRoutes.privacy]: "what data a purchase would involve.",
      })}
      contact={
        <>
          Nothing to refund means nothing to claim — but if you believe you have been charged
          by or for {product.productName}, please raise it in the issue tracker straight away
          so we can look into it. For sponsorship payments, contact the platform that took the
          payment.
        </>
      }
    />
  );
}
