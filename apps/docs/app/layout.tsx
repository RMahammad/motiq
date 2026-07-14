import type { ReactNode } from "react";
import Link from "next/link";
// Library CSS (non-Tailwind consumer path): tokens + primitives + components + sections.
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/react/styles.css";
import "@scope/sections/styles.css";
import "@scope/recipes/styles.css";
import "./docs.css";

export const metadata = {
  title: "@scope/ui — a semantic motion & choreography system for React",
  description:
    "Describe motion by intent, choreograph sections as scenes, ship accessible reduced-motion-safe React & Next.js interfaces.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="nav">
          <Link href="/" className="brand">
            <span className="brand__dot" aria-hidden="true" />
            @scope/ui
          </Link>
          <nav className="nav__links" aria-label="Primary">
            <a href="#lab">Motion system</a>
            <a href="#choreography">Choreography</a>
            <a href="#recipes">Recipes</a>
            <a href="#catalog">Components</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="nav__cta">
            <a href="https://github.com" className="btn btn--sm">
              GitHub
            </a>
            <Link href="/components/pricing-card" className="btn btn--sm btn--signal">
              Get started
            </Link>
          </div>
        </header>
        {children}
        <footer className="foot wrap">
          <span>@scope/ui — semantic motion for React &amp; Next.js · v0.1.0</span>
          <span>Accessible · reduced-motion-safe · RSC-safe</span>
        </footer>
      </body>
    </html>
  );
}
