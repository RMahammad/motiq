import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/reveal.tsx",
    "src/in-view.tsx",
    "src/stagger.tsx",
    "src/blur-reveal.tsx",
    "src/gradient-text.tsx",
    "src/marquee.tsx",
    "src/text-reveal.tsx",
    "src/use-in-view.ts",
  ],
  format: "esm",
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", /^@scope\//],
});
