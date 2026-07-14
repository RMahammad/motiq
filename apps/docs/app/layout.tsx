import type { Metadata } from "next";
import Link from "next/link";

import "@scope/tokens/styles.css";
import "./globals.css";

import { product, commerce } from "../lib/product";
import { categories } from "../lib/catalog";
import { ThemeToggle } from "./_components/theme";
import { SearchTrigger } from "./_components/search";

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
        <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_88%,transparent)] backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span
                aria-hidden
                className="inline-block h-5 w-5 rounded-md"
                style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))" }}
              />
              <span className="text-[15px]">{product.shortName}</span>
            </Link>

            <nav aria-label="Categories" className="ml-2 hidden items-center gap-1 md:flex">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/components?category=${c.id}`}
                  className="rounded-md px-2.5 py-1.5 text-[13.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
                >
                  {c.label}
                </Link>
              ))}
              <Link
                href="/packs"
                className="rounded-md px-2.5 py-1.5 text-[13.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
              >
                Packs
              </Link>
              <Link
                href="/components"
                className="rounded-md px-2.5 py-1.5 text-[13.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-fg)]"
              >
                Docs
              </Link>
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              <SearchTrigger />
              <ThemeToggle />
              {product.githubUrl ? (
                <a
                  href={product.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md px-2.5 py-1.5 text-[13.5px] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                >
                  GitHub
                </a>
              ) : null}
              <Link
                href="/components"
                className="rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-[13.5px] font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Browse components
              </Link>
            </div>
          </div>
        </header>

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
