import Link from "next/link";
import { SpotlightCard } from "@scope/react";
import { ComponentStage } from "../../_components/component-stage";

export const metadata = { title: "SpotlightCard — @scope/ui" };

const code = `import { SpotlightCard } from "@scope/react";
import "@scope/react/styles.css";

<SpotlightCard radius={240}>
  <h3>Hover for a spotlight</h3>
  <p>Pointer-tracked highlight, hidden on touch.</p>
</SpotlightCard>`;

export default function Page() {
  return (
    <article className="wrap article">
      <div className="article__head">
        <p className="crumb">
          <Link href="/">@scope/ui</Link> / Signature / SpotlightCard
        </p>
        <h1>SpotlightCard</h1>
        <p>
          A card with a radial spotlight that follows the pointer on hover. The handler writes CSS
          variables only (no re‑render); the visual is a decorative <code>::before</code>. Hidden on
          touch (<code>hover: none</code>); the fade is removed under reduced motion.
        </p>
      </div>

      <ComponentStage
        code={code}
        facts={{
          package: "@scope/react",
          importPath: "@scope/react · @scope/react/spotlight-card",
          boundary: '"use client"',
          bundle: "~1 kB brotli",
          deps: "peer: react, react-dom · @scope/tokens",
          ssr: "renders content; spotlight activates on client pointer move",
          a11y: "decorative ::before; content unaffected; axe 0",
          reducedMotion: "spotlight fade removed; card fully usable",
          intents: "emphasize (hover affordance)",
          install: "pnpm add @scope/react",
          tests: "4 · pointer-var + SSR + axe",
          browser: "evergreen; hidden on hover:none (touch)",
          limitations: "hover-only affordance; pair with a focus style for keyboard emphasis",
        }}
      >
        <SpotlightCard radius={240} style={{ maxWidth: 360, width: "100%" }}>
          <h3 style={{ margin: 0 }}>Hover for a spotlight</h3>
          <p style={{ marginTop: 8 }}>Pointer-tracked highlight, hidden on touch.</p>
        </SpotlightCard>
      </ComponentStage>
    </article>
  );
}
