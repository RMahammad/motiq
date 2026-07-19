import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedButton, PricingCard, Popover, Reveal, Sheet, Tooltip } from "@scope/react";
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";
import "@scope/react/styles.css";

function App() {
  return (
    <main style={{ padding: 32, display: "grid", gap: 24 }}>
      <h1>Playground — Vite (client render)</h1>
      <Reveal trigger="mount" direction="up">
        <p>Reveal + AnimatedButton + PricingCard consumed from the built library.</p>
      </Reveal>
      <AnimatedButton revealOnMount type="button">
        Animated button
      </AnimatedButton>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Tooltip content="Saves your work">
          <button type="button" className="scope-btn">Hover me</button>
        </Tooltip>
        <Popover trigger={<button type="button" className="scope-btn">Popover</button>} closeLabel="Close">
          <p>Popover panel content.</p>
        </Popover>
        <Sheet
          trigger={<button type="button" className="scope-btn">Open sheet</button>}
          title="Filters"
          description="Refine the results."
          side="right"
        >
          <button type="button" className="scope-btn">Apply</button>
        </Sheet>
      </div>
      <PricingCard
        planName="Pro"
        price="$29"
        period="/mo"
        features={["Unlimited projects", "Priority support"]}
        cta={{ label: "Start free trial", onClick: () => alert("cta") }}
        featured
        badge="Most popular"
      />
    </main>
  );
}

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
