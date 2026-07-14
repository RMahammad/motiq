import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedButton, PricingCard, Reveal } from "@scope/react";
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
