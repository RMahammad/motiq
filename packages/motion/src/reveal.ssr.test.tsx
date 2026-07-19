import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Reveal } from "./reveal";

// SSR safety: renderToString does not run effects, so the component must produce
// valid final-state markup without touching window / IntersectionObserver.
describe("Reveal SSR", () => {
  it("renders mount-trigger content in the shown final state without throwing", () => {
    const html = renderToString(
      <Reveal trigger="mount" direction="up">
        server-content
      </Reveal>,
    );
    expect(html).toContain("server-content");
    expect(html).toContain("scope-reveal");
    expect(html).toContain('data-motion="shown"');
  });

  it("renders in-view reveals as hidden final state (animates only after hydrate)", () => {
    const html = renderToString(<Reveal>deferred-content</Reveal>);
    expect(html).toContain("deferred-content");
    expect(html).toContain('data-motion="hidden"');
  });

  it("does not require IntersectionObserver to exist during server render", () => {
    const saved = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    // Simulate a server with no IntersectionObserver global.
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
    try {
      expect(() => renderToString(<Reveal>x</Reveal>)).not.toThrow();
    } finally {
      (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = saved;
    }
  });
});
