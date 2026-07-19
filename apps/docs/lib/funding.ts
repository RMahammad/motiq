// Single source of truth for sponsorship/funding across the docs site — the
// /sponsor page, homepage band, nav, footer, and docs-sidebar CTAs all read
// from here. Payment destinations live in env/config (never hardcoded in
// pages) so GitHub Sponsors can become the primary destination after approval
// without touching page code.
import { product } from "./product";

export type GithubSponsorsStatus = "pending" | "active";

export const fundingConfig = {
  /** Active payment destination today. Falls back to product.config.json. */
  koFiUrl: process.env.NEXT_PUBLIC_KOFI_URL ?? product.sponsorUrl,
  /** Used once githubSponsorsStatus flips to "active". */
  githubSponsorsUrl: process.env.NEXT_PUBLIC_GITHUB_SPONSORS_URL ?? "https://github.com/sponsors/RMahammad",
  /** "pending" renders GitHub Sponsors as an informational, non-payment state. */
  githubSponsorsStatus: (process.env.NEXT_PUBLIC_GITHUB_SPONSORS_STATUS ?? "pending") as GithubSponsorsStatus,
  /** Public sponsor ledger in the repository. */
  sponsorsFileUrl: `${product.githubUrl}/blob/main/SPONSORS.md`,
};

export interface SponsorTier {
  id: string;
  name: string;
  /** Monthly price in USD — mirrors the Ko-fi tiers (see README / SPONSORS.md).
   *  Display-only; payment happens on the configured platform. */
  priceUsd: number;
  blurb: string;
  benefits: string[];
  /** The visually emphasized tier in the tier row. */
  highlighted?: boolean;
}

/** Individual monthly tiers — mirror the Ko-fi ladder (Supporter/Backer/Sponsor).
 *  Benefits are recognition + communication, never roadmap control, guaranteed
 *  features, or fixed response times. Keep in sync with README / SPONSORS.md. */
export const individualTiers: SponsorTier[] = [
  {
    id: "supporter",
    name: "Supporter",
    priceUsd: 5,
    blurb: "Keep the lights on and follow along.",
    benefits: [
      "Your name in SPONSORS.md",
      "Supporter recognition on the sponsor wall",
      "Development updates",
    ],
  },
  {
    id: "backer",
    name: "Backer",
    priceUsd: 10,
    blurb: "For people who rely on Motiq and want a say.",
    benefits: [
      "Everything in Supporter",
      "Priority issue triage",
      "A vote on the roadmap",
      "Early previews of in-progress work",
    ],
    highlighted: true,
  },
  {
    id: "sponsor",
    name: "Sponsor",
    priceUsd: 25,
    blurb: "For teams and studios shipping with Motiq.",
    benefits: [
      "Everything in Backer",
      "Your logo on the sponsor page",
      "Your logo in the project README",
      "Roadmap feedback",
    ],
  },
];

/** Top tier — Gold Sponsor. Rendered as the horizontal company card on /sponsor. */
export const goldTier: SponsorTier = {
  id: "gold",
  name: "Gold Sponsor",
  priceUsd: 100,
  blurb: "Company sponsorship for teams that rely on Motiq in production.",
  benefits: [
    "Everything in Sponsor",
    "Prominent logo placement on the sponsor page",
    "Prominent placement on the motiq.dev homepage",
    "Website link",
    "Recognition in relevant release notes",
    "Priority issue triage",
  ],
};

export interface FundingGoal {
  amountUsd: number;
  title: string;
  detail: string;
}

/** Monthly goals. No fabricated progress: until a verified funding amount
 *  exists, goals render without a filled percentage. */
export const fundingGoals: FundingGoal[] = [
  {
    amountUsd: 100,
    title: "Core project costs",
    detail: "Domain, registry hosting, CI minutes, and the tooling that keeps the catalog shippable.",
  },
  {
    amountUsd: 500,
    title: "Consistent documentation & releases",
    detail: "Regular docs passes, changelogs, and a predictable release rhythm instead of best-effort weekends.",
  },
  {
    amountUsd: 1500,
    title: "Sustainable recurring development",
    detail: "Dedicated maintenance time every month — accessibility testing, bug triage, and long-term upkeep.",
  },
];

/** Verified monthly funding in USD, or null when no verified amount exists.
 *  Never estimate — a null here renders goals without progress bars. */
export const verifiedMonthlyFundingUsd: number | null = null;

export interface FundingArea {
  title: string;
  detail: string;
  /** 24×24 stroke path, matching the site's inline icon style. */
  icon: string;
}

export const fundingAreas: FundingArea[] = [
  {
    title: "New components",
    detail: "Design, build, and review new animated workflow components and blocks for the open catalog.",
    icon: "M4 4h7v7H4zM13 13h7v7h-7zM13 4h7v7h-7zM4 13h7v7H4z",
  },
  {
    title: "Better documentation",
    detail: "Live previews, honest API references, usage guides, and examples that match the shipped source.",
    icon: "M5 4h9l5 5v11a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM14 4v5h5M8 13h8M8 17h5",
  },
  {
    title: "Accessibility & testing",
    detail: "Keyboard, screen-reader, reduced-motion, and cross-browser testing on every release — the release-blocking kind.",
    icon: "M12 3a4 4 0 100 8 4 4 0 000-8zM5 21v-1a7 7 0 0114 0v1",
  },
  {
    title: "Long-term maintenance",
    detail: "Dependency upgrades, bug fixes, and keeping existing components working as React and browsers move.",
    icon: "M14.7 6.3a4.5 4.5 0 00-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 006-6l-2.8 2.8-2.3-2.3 2.1-2.5z",
  },
];

export interface FundingFaq {
  q: string;
  a: string;
}

export const fundingFaq: FundingFaq[] = [
  {
    q: "Will Motiq remain open source?",
    a: "Yes. The entire catalog is free and open source, and sponsorship exists to keep it that way. Sponsorship never gates components behind a paywall.",
  },
  {
    q: "Does sponsorship purchase commercial rights?",
    a: "No — and it doesn't need to. Motiq's license already lets you use every component in commercial projects, sponsor or not. Sponsorship is support and recognition, not a license.",
  },
  {
    q: "Can companies sponsor Motiq?",
    a: "Yes. The Sponsor and Gold Sponsor tiers are built for companies, with logo placement on the sponsor page and, at Gold, on the motiq.dev homepage. Invoicing details are agreed directly — open an issue or reach out via GitHub.",
  },
  {
    q: "Can sponsors request components?",
    a: "Sponsors can share feedback and vote on the roadmap, and Sponsor and Gold sponsors get roadmap feedback sessions. Requests genuinely inform priorities, but sponsorship does not purchase roadmap control or guarantee that a specific component ships.",
  },
  {
    q: "Can people make a one-time contribution?",
    a: "Yes. Ko-fi supports one-time contributions of any amount alongside monthly memberships — every contribution helps, recurring or not.",
  },
  {
    q: "What happens when GitHub Sponsors is approved?",
    a: "GitHub Sponsors becomes an equal (and eventually primary) payment destination, with the same tiers. Existing Ko-fi supporters keep their recognition — nothing resets and nobody pays twice.",
  },
];

export interface CompanySponsor {
  name: string;
  url: string;
  /** Root-relative or absolute logo URL, sized consistently by the sponsor wall. */
  logoSrc: string;
  tier: "gold" | "sponsor";
}

export interface IndividualSponsor {
  name: string;
  url?: string;
  tier: "supporter" | "backer" | "sponsor";
}

/** The sponsor wall renders honest empty states while these are empty.
 *  Never seed placeholder/invented sponsors here — real sponsors only,
 *  mirrored from SPONSORS.md. */
export const companySponsors: CompanySponsor[] = [];
export const individualSponsors: IndividualSponsor[] = [];

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
