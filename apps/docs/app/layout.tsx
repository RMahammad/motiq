import type { Metadata } from "next";
import Link from "next/link";

import "@scope/tokens/styles.css";
import "./globals.css";

import { product, commerce } from "../lib/product";
import { siteUrl, absoluteUrl } from "../lib/seo";
import { SiteNav } from "./_components/site-nav";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${product.productName} - ${product.tagline}`,
    template: `%s - ${product.productName}`,
  },
  description: product.description,
  applicationName: product.productName,
  keywords: [
    "React components",
    "shadcn components",
    "animated components",
    "Next.js components",
    "Framer Motion",
    "Motion for React",
    "UI library",
    "component registry",
    "editable source",
    "reduced motion",
    "accessible components",
    "Tailwind CSS",
    "RSC",
    "copy paste components",
  ],
  authors: [{ name: product.productName, url: siteUrl }],
  creator: product.productName,
  publisher: product.productName,
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: product.productName,
    title: `${product.productName} - ${product.tagline}`,
    description: product.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${product.productName} - ${product.tagline}`,
    description: product.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const noFlash = `(function(){try{var t=localStorage.getItem('theme')||'${product.defaultTheme}';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','${product.defaultTheme}');}})();`;

/* One themed, thin, rounded scrollbar for every overflow container across the
   product (light + dark via tokens). Raw <style> so the universal
   `*::-webkit-scrollbar` rules survive the Tailwind v4 (Lightning CSS) pipeline,
   which prunes them from the app stylesheet. Components that intentionally hide
   their scrollbar (`.hero-tabs`, etc.) override via higher specificity. */
const scrollbarCss = `
*{scrollbar-width:thin;scrollbar-color:color-mix(in oklab,var(--color-fg) 24%,transparent) transparent}
*::-webkit-scrollbar{width:10px;height:10px}
*::-webkit-scrollbar-track{background:transparent}
*::-webkit-scrollbar-thumb{background:color-mix(in oklab,var(--color-fg) 22%,transparent);border-radius:999px;border:2px solid transparent;background-clip:padding-box}
*::-webkit-scrollbar-thumb:hover{background:color-mix(in oklab,var(--color-fg) 38%,transparent);background-clip:padding-box}
*::-webkit-scrollbar-corner{background:transparent}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
        <style dangerouslySetInnerHTML={{ __html: scrollbarCss }} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${siteUrl}/#organization`,
                  name: product.productName,
                  url: siteUrl,
                  description: product.description,
                  sameAs: [product.githubUrl].filter(Boolean),
                },
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl}/#website`,
                  name: product.productName,
                  url: siteUrl,
                  description: product.description,
                  publisher: { "@id": `${siteUrl}/#organization` },
                  inLanguage: "en-US",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: absoluteUrl("/components?q={search_term_string}"),
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <SiteNav
          productName={product.shortName}
          waitlistEnabled={commerce.waitlistEnabled}
          ctaHref="/getting-started"
          ctaLabel="Get started"
        />

        <main>{children}</main>

        <footer className="mt-24 border-t border-[var(--color-border)]">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 text-[13px] text-[var(--color-muted)] sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            <div>
              <p className="font-medium text-[var(--color-fg)]">{product.productName}</p>
              <p className="mt-1">{product.tagline}</p>
              <p className="mt-2 text-[12px]">Accessible · reduced-motion-safe · editable source.</p>
            </div>
            <nav aria-label="Product" className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-fg)]">Product</span>
              <Link href="/components" className="hover:text-[var(--color-fg)]">Components</Link>
              <Link href="/packs" className="hover:text-[var(--color-fg)]">Workflow packs</Link>
              {commerce.waitlistEnabled ? <Link href="/access" className="hover:text-[var(--color-fg)]">Request access</Link> : null}
              <Link href="/updates" className="hover:text-[var(--color-fg)]">Updates</Link>
              <Link href="/portal" className="hover:text-[var(--color-fg)]">Account portal</Link>
              <a href={product.sponsorUrl} target="_blank" rel="noreferrer" className="hover:text-[var(--color-fg)]">Sponsor</a>
            </nav>
            <nav aria-label="Legal" className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-fg)]">Legal (draft)</span>
              <Link href="/legal/license" className="hover:text-[var(--color-fg)]">License</Link>
              <Link href="/legal/terms" className="hover:text-[var(--color-fg)]">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-[var(--color-fg)]">Privacy</Link>
              <Link href="/legal/refund-policy" className="hover:text-[var(--color-fg)]">Refunds</Link>
            </nav>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium uppercase tracking-wide text-[var(--color-fg)]">Status</span>
              <p>Policy pages are drafts pending legal review.</p>
              {product.namespaceIsPreview ? <p className="text-[12px]">Registry namespace is a preview value.</p> : null}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
