// This is a SERVER COMPONENT (no "use client"). It imports client components from
// @scope/react. If the library did NOT preserve "use client", Next would fail the
// build with "You're importing a component that needs useState/useEffect...".
// A successful build is the RSC-boundary proof (ADR-0006 / open question B4).
import { AnimatedButton, Reveal } from "@scope/react";

export default function Page() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Playground — Next App Router (Server Component)</h1>
      <Reveal trigger="mount" direction="up" distance="md">
        <p>Reveal primitive rendered across a Server → Client boundary.</p>
      </Reveal>
      <AnimatedButton revealOnMount type="button">
        Animated button
      </AnimatedButton>
    </main>
  );
}
