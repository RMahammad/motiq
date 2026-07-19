import { registerRoot } from "remotion";
import { MotionGlobalConfig } from "motion/react";

import "./style.css";
import { Root } from "./Root";

// Deterministic rendering, part 1: the registry components gate every
// wall-clock loop (pulses, spinners, carets, tweens) behind
// `useReducedMotion()`. Forcing the reduced media query makes the library take
// its real reduced-motion path, so every frame is a pure function of props —
// which the promo adapters derive from the Remotion frame.
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const original = window.matchMedia.bind(window);
  window.matchMedia = (query: string): MediaQueryList => {
    if (!query.includes("prefers-reduced-motion")) return original(query);
    const matches = query.includes("reduce");
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
}

// Deterministic rendering, part 2: belt-and-braces — any motion/react animation
// that would still run resolves instantly to its final state.
MotionGlobalConfig.skipAnimations = true;

registerRoot(Root);
