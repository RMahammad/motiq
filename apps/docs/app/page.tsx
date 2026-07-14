import Link from "next/link";
import { CTASection, FeatureGrid, HeroSection } from "@scope/sections";
import { BentoGrid, BentoGridItem } from "@scope/react";

const COMPONENTS = [
  { slug: "pricing-card", name: "PricingCard", desc: "Themeable, accessible pricing plan card." },
  { slug: "dialog", name: "AnimatedDialog", desc: "Modal on Radix with focus trap + restore." },
  { slug: "spotlight-card", name: "SpotlightCard", desc: "Pointer-tracked spotlight; mobile-safe." },
];

// The docs landing dogfoods the library: HeroSection (server-safe) + BentoGrid.
export default function Home() {
  return (
    <>
      <HeroSection
        eyebrow="Component library"
        title="Premium motion you can actually ship"
        subtitle="Accessible, reduced-motion-aware, Server-Component-safe React & Next.js components."
        actions={
          <>
            <Link href="/components/pricing-card" className="scope-btn">
              Browse components
            </Link>
            <a href="https://github.com" className="scope-btn">
              GitHub
            </a>
          </>
        }
      />
      <FeatureGrid
        eyebrow="Why this kit"
        title="Production motion, not demos"
        subtitle="Every component is accessible, reduced-motion-aware, and Server-Component-safe."
        features={[
          { title: "Accessible", description: "WCAG 2.2 AA; axe-tested; Radix overlays." },
          { title: "RSC-safe", description: "Preserved 'use client'; server-safe sections." },
          { title: "Tiny", description: "Tree-shakeable; per-component size budgets." },
        ]}
      />
      <section className="docs-section">
        <h2>Components</h2>
        <BentoGrid columns={3}>
          {COMPONENTS.map((c) => (
            <BentoGridItem key={c.slug} title={c.name} description={c.desc} revealOnView>
              <Link href={`/components/${c.slug}`} className="docs-card-link">
                View →
              </Link>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </section>
      <CTASection
        title="Ready to ship?"
        subtitle="Browse the catalog and drop a component into your app."
        actions={
          <Link href="/components/pricing-card" className="scope-btn">
            Get started
          </Link>
        }
      />
    </>
  );
}
