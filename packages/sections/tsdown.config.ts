import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/hero-section.tsx"],
  format: "esm",
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", /^@scope\//],
});
