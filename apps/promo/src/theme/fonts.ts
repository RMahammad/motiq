import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Same faces the existing Motiq marketing assets use; loading them explicitly
// keeps renders identical across machines (no system-font drift).
export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const jetbrainsMono = loadMono("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const sansFamily = `${inter.fontFamily}, ui-sans-serif, system-ui, sans-serif`;
export const monoFamily = `${jetbrainsMono.fontFamily}, ui-monospace, monospace`;
