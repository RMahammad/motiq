import { SpotlightCard } from "@scope/react";
import { Preview } from "../../_components/preview";

export const metadata = { title: "SpotlightCard — @scope/ui" };

export default function Page() {
  return (
    <article className="docs-article">
      <h1>SpotlightCard</h1>
      <p>
        A card with a radial spotlight that follows the pointer on hover. The handler writes CSS
        variables only (no re-render); a decorative <code>::before</code> gradient does the visual.
        Hidden on touch (<code>hover: none</code>) devices; the fade is removed under reduced motion.
      </p>
      <Preview
        code={`<SpotlightCard radius={240}>
  <h3>Hover for a spotlight</h3>
  <p>Pointer-tracked highlight.</p>
</SpotlightCard>`}
      >
        <SpotlightCard radius={240} style={{ maxWidth: 360, width: "100%" }}>
          <h3 style={{ margin: 0 }}>Hover for a spotlight</h3>
          <p style={{ marginTop: 8 }}>Pointer-tracked highlight, hidden on touch.</p>
        </SpotlightCard>
      </Preview>
    </article>
  );
}
