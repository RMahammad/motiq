import { PricingCard } from "@scope/react";
import { Preview } from "../../_components/preview";

export const metadata = { title: "PricingCard — @scope/ui" };

export default function Page() {
  return (
    <article className="docs-article">
      <h1>PricingCard</h1>
      <p>
        A themeable, accessible pricing plan card. Content is entirely prop-driven (no baked copy);
        visuals come from semantic design tokens, so it themes via <code>data-theme</code> without
        touching source. <code>role=&quot;group&quot;</code> labelled by its heading.
      </p>
      <Preview
        code={`<PricingCard
  planName="Pro"
  price="$29"
  period="/mo"
  features={["Unlimited projects", "Priority support"]}
  cta={{ label: "Start free trial", href: "#" }}
  featured
  badge="Most popular"
/>`}
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
      </Preview>
    </article>
  );
}
