import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnimatedButton, Reveal } from "@scope/react";
import "@scope/tokens/styles.css";
import "@scope/motion/styles.css";

function App() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Playground — Vite (client render)</h1>
      <Reveal trigger="mount" direction="up">
        <p>Reveal + AnimatedButton consumed from the built library.</p>
      </Reveal>
      <AnimatedButton revealOnMount type="button">
        Animated button
      </AnimatedButton>
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
