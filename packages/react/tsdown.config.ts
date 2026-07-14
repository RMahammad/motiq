import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/animated-button.tsx", "src/pricing-card.tsx"],
  format: "esm",
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", /^@scope\//],
});
