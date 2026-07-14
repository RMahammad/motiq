import type { ReactNode } from "react";
import Link from "next/link";
// Library CSS (non-Tailwind consumer path): tokens + primitives + components + sections.
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/react/styles.css";
import "@scope/sections/styles.css";
import "./docs.css";

export const metadata = {
  title: "@scope/ui — Docs",
  description: "Premium, accessible animated React & Next.js components.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="docs-header">
          <Link href="/" className="docs-logo">
            @scope/ui
          </Link>
          <nav className="docs-nav">
            <Link href="/components/pricing-card">PricingCard</Link>
            <Link href="/components/dialog">Dialog</Link>
            <Link href="/components/spotlight-card">SpotlightCard</Link>
          </nav>
        </header>
        <main className="docs-main">{children}</main>
      </body>
    </html>
  );
}
