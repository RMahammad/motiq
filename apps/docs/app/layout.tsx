import type { Metadata } from "next";
import Link from "next/link";

import "@scope/tokens/styles.css";
import "./globals.css";

import { product, commerce } from "../lib/product";
import { SiteNav } from "./_components/site-nav";

export const metadata: Metadata = {
  title: `${product.productName} — ${product.tagline}`,
  description: product.description,
};

const noFlash = `(function(){try{var t=localStorage.getItem('theme')||'${product.defaultTheme}';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','${product.defaultTheme}');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <SiteNav
          productName={product.shortName}
          waitlistEnabled={commerce.waitlistEnabled}
          ctaHref="/components"
          ctaLabel="Browse components"
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
