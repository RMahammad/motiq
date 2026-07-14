// SERVER COMPONENT importing client components from @scope/react. A successful build
// proves "use client" survived (RSC boundary; ADR-0006 / question B4).
import {
  AnimatedButton,
  AnimatedDialog,
  BentoGrid,
  BentoGridItem,
  PricingCard,
  Reveal,
  SpotlightCard,
} from "@scope/react";
import { HeroSection } from "@scope/sections";

export default function Page() {
  return (
    <main style={{ display: "grid", gap: 24 }}>
      {/* HeroSection is server-safe: rendered directly in this Server Component. */}
      <HeroSection
        eyebrow="Now in beta"
        title="Premium motion you can actually ship"
        subtitle="Accessible, reduced-motion-aware, Server-Component-safe components."
        actions={
          <>
            <a href="/start" className="scope-btn">Get started</a>
            <a href="/docs" className="scope-btn">Read the docs</a>
          </>
        }
      />
      <div style={{ padding: 32, display: "grid", gap: 24 }}>
      <h1>Playground — Next App Router (Server Component)</h1>
      <Reveal trigger="mount" direction="up" distance="md">
        <p>Reveal primitive rendered across a Server → Client boundary.</p>
      </Reveal>
      <AnimatedButton revealOnMount type="button">
        Animated button
      </AnimatedButton>
      <AnimatedDialog
        trigger={<button type="button" className="scope-btn">Open dialog</button>}
        title="Delete project"
        description="This action cannot be undone."
      >
        <button type="button" className="scope-btn">Confirm delete</button>
      </AnimatedDialog>
      <BentoGrid columns={3}>
        <BentoGridItem colSpan={2} rowSpan={2} title="Fast" description="Sub-second builds." revealOnView />
        <BentoGridItem title="Accessible" description="WCAG 2.2 AA." revealOnView />
        <BentoGridItem title="Typed" description="Strict TypeScript." revealOnView />
      </BentoGrid>
      <SpotlightCard radius={240}>
        <h3>Hover for a spotlight</h3>
        <p>Pointer-tracked highlight, hidden on touch.</p>
      </SpotlightCard>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <PricingCard
          planName="Starter"
          price="$0"
          period="/mo"
          description="For side projects"
          features={["1 project", "Community support"]}
          cta={{ label: "Get started", href: "/signup" }}
          revealOnView
        />
        <PricingCard
          planName="Pro"
          price="$29"
          period="/mo"
          description="For growing teams"
          features={["Unlimited projects", "Priority support", "Analytics"]}
          cta={{ label: "Start free trial", href: "/checkout" }}
          featured
          badge="Most popular"
          revealOnView
        />
      </div>
      </div>
    </main>
  );
}
