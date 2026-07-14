import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/product-introduction.tsx"],
  format: "esm",
  dts: true,
  clean: true,
  external: ["react", "react-dom", "react/jsx-runtime", /^@scope\//],
});
