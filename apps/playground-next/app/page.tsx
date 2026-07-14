// SERVER COMPONENT importing client components from @scope/react. A successful build
// proves "use client" survived (RSC boundary; ADR-0006 / question B4).
import { AnimatedButton, AnimatedDialog, PricingCard, Reveal } from "@scope/react";

export default function Page() {
  return (
    <main style={{ padding: 32, display: "grid", gap: 24 }}>
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
    </main>
  );
}
