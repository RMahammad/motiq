import Link from "next/link";
import { PricingCard } from "@scope/react";
import { ComponentStage } from "../../_components/component-stage";

export const metadata = { title: "PricingCard — @scope/ui" };

const code = `import { PricingCard } from "@scope/react";
import "@scope/react/styles.css";

<PricingCard
  planName="Pro"
  price="$29"
  period="/mo"
  features={["Unlimited projects", "Priority support"]}
  cta={{ label: "Start free trial", href: "#" }}
  featured
  badge="Most popular"
/>`;

export default function Page() {
  return (
    <article className="wrap article">
      <div className="article__head">
        <p className="crumb">
          <Link href="/">@scope/ui</Link> / Production / PricingCard
        </p>
        <h1>PricingCard</h1>
        <p>
          A themeable, accessible pricing plan card. Content is entirely prop‑driven (no baked copy);
          visuals come from semantic tokens, so it themes via <code>data-theme</code> without touching
          source. Toggle the controls to verify theme &amp; reduced‑motion behavior live.
        </p>
      </div>

      <ComponentStage
        code={code}
        facts={{
          package: "@scope/react",
          importPath: "@scope/react · @scope/react/pricing-card",
          boundary: '"use client"',
          bundle: "~1 kB brotli (excl. peers)",
          deps: "peer: react, react-dom · @scope/motion, @scope/tokens",
          ssr: "renders full content; final state (hidden only with revealOnView)",
          a11y: 'role="group" labelled by heading · real <ul> · button/link CTA · axe 0',
          reducedMotion: "entrance (revealOnView) → final state, no transform",
          intents: "introduce (via Reveal), emphasize (featured)",
          install: "pnpm add @scope/react",
          tests: "8 · unit + SSR + axe",
          browser: "evergreen; forced-colors supported",
          limitations: "not a full pricing section (use FeatureGrid/CTASection to compose)",
        }}
      >
        <div style={{ maxWidth: 340, width: "100%" }}>
          <PricingCard
            planName="Pro"
            price="$29"
            period="/mo"
            description="For growing teams"
            features={["Unlimited projects", "Priority support", "Analytics"]}
            cta={{ label: "Start free trial", href: "#" }}
            featured
            badge="Most popular"
          />
        </div>
      </ComponentStage>
    </article>
  );
}
